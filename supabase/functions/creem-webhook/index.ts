import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const encoder = new TextEncoder();

const toHex = (buffer: ArrayBuffer) =>
  Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');

const timingSafeEqual = (left: Uint8Array, right: Uint8Array) => {
  if (left.length !== right.length) {
    return false;
  }
  let result = 0;
  for (let i = 0; i < left.length; i += 1) {
    result |= left[i] ^ right[i];
  }
  return result === 0;
};

const verifySignature = async (payload: string, signature: string, secret: string) => {
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const signatureBuffer = await crypto.subtle.sign('HMAC', key, encoder.encode(payload));
  const expected = toHex(signatureBuffer);
  return timingSafeEqual(encoder.encode(expected), encoder.encode(signature));
};

const toId = (value: string | { id?: string } | null | undefined) =>
  typeof value === 'string' ? value : value?.id;

const shouldSetCancelAtPeriodEnd = (
  eventType: string,
  status?: string,
  canceledAt?: string | null,
) => {
  if (eventType === 'subscription.scheduled_cancel') {
    return true;
  }
  if (status === 'scheduled_cancel') {
    return true;
  }
  return Boolean(canceledAt && status && status !== 'canceled');
};

const isWithinPeriod = (currentPeriodEnd?: string | null) => {
  if (!currentPeriodEnd) {
    return false;
  }
  const end = new Date(currentPeriodEnd);
  if (Number.isNaN(end.getTime())) {
    return false;
  }
  return end.getTime() > Date.now();
};

const resolvePlusAccess = (
  status?: string,
  cancelAtPeriodEnd?: boolean,
  currentPeriodEnd?: string | null,
) => {
  if (status === 'active' || status === 'trialing') {
    return true;
  }
  if (status === 'scheduled_cancel') {
    return isWithinPeriod(currentPeriodEnd);
  }
  return Boolean(cancelAtPeriodEnd && isWithinPeriod(currentPeriodEnd));
};

const resolveUserId = async (
  supabase: ReturnType<typeof createClient>,
  metadataUserId: string | undefined,
  customerId: string | undefined,
) => {
  if (metadataUserId) {
    return metadataUserId;
  }
  if (!customerId) {
    return undefined;
  }
  const { data } = await supabase
    .from('customers')
    .select('user_id')
    .eq('creem_customer_id', customerId)
    .maybeSingle();
  return data?.user_id;
};

Deno.serve(async (req) => {
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  const creemWebhookSecret = Deno.env.get('CREEM_WEBHOOK_SECRET');

  if (!supabaseUrl || !supabaseServiceRoleKey || !creemWebhookSecret) {
    return new Response('Missing server configuration', { status: 500 });
  }

  const signature = req.headers.get('creem-signature');
  if (!signature) {
    return new Response('Missing signature', { status: 400 });
  }

  const payload = await req.text();
  const valid = await verifySignature(payload, signature, creemWebhookSecret);
  if (!valid) {
    return new Response('Invalid signature', { status: 400 });
  }

  const event = JSON.parse(payload);
  const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

  if (event.eventType === 'checkout.completed') {
    const checkout = event.object;
    const subscription = checkout?.subscription;
    const customer = checkout?.customer;
    const product = checkout?.product;
    const customerId = toId(customer);
    const productId = toId(product);

    const metadataUserId =
      subscription?.metadata?.user_id ||
      subscription?.metadata?.userId ||
      checkout?.metadata?.user_id ||
      checkout?.metadata?.userId;

    if (!metadataUserId || !subscription?.id || !customerId || !productId) {
      return new Response('Missing subscription metadata', { status: 400 });
    }

    const cancelAtPeriodEnd =
      subscription?.cancel_at_period_end ??
      shouldSetCancelAtPeriodEnd(
        event.eventType,
        subscription.status,
        subscription.canceled_at,
      );

    await supabase.from('customers').upsert({
      user_id: metadataUserId,
      creem_customer_id: customerId,
    }, { onConflict: 'user_id' });

    await supabase.from('subscriptions').upsert({
      user_id: metadataUserId,
      creem_subscription_id: subscription.id,
      product_id: productId,
      status: subscription.status,
      current_period_end: subscription.current_period_end_date ?? null,
      cancel_at_period_end: cancelAtPeriodEnd,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'creem_subscription_id' });

    await supabase
      .from('checkout_locks')
      .update({
        status: 'completed',
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', metadataUserId)
      .eq('product_id', productId)
      .eq('status', 'pending');

    return new Response(JSON.stringify({ received: true }), {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    });
  }

  if (
    event.eventType === 'subscription.active' ||
    event.eventType === 'subscription.trialing' ||
    event.eventType === 'subscription.paid' ||
    event.eventType === 'subscription.canceled' ||
    event.eventType === 'subscription.scheduled_cancel' ||
    event.eventType === 'subscription.expired' ||
    event.eventType === 'subscription.unpaid' ||
    event.eventType === 'subscription.past_due' ||
    event.eventType === 'subscription.paused' ||
    event.eventType === 'subscription.update' ||
    event.eventType === 'subscription.updated'
  ) {
    const subscription = event.object;
    const customer = subscription?.customer;
    const product = subscription?.product;
    const customerId = toId(customer);
    const productId = toId(product);

    const metadataUserId =
      subscription?.metadata?.user_id ||
      subscription?.metadata?.userId;

    const userId = await resolveUserId(supabase, metadataUserId, customerId);

    if (!userId || !subscription?.id || !customerId || !productId) {
      return new Response('Missing subscription metadata', { status: 400 });
    }

    const cancelAtPeriodEnd =
      subscription?.cancel_at_period_end ??
      shouldSetCancelAtPeriodEnd(
        event.eventType,
        subscription.status,
        subscription.canceled_at,
      );

    await supabase.from('customers').upsert({
      user_id: userId,
      creem_customer_id: customerId,
    }, { onConflict: 'user_id' });

    await supabase.from('subscriptions').upsert({
      user_id: userId,
      creem_subscription_id: subscription.id,
      product_id: productId,
      status: subscription.status,
      current_period_end: subscription.current_period_end_date ?? null,
      cancel_at_period_end: cancelAtPeriodEnd,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'creem_subscription_id' });

    await supabase
      .from('checkout_locks')
      .update({
        status: 'completed',
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId)
      .eq('product_id', productId)
      .eq('status', 'pending');

    const plan = resolvePlusAccess(
      subscription.status,
      cancelAtPeriodEnd,
      subscription.current_period_end_date ?? null,
    )
      ? 'plus'
      : 'free';
    const appMetadata = {
      plan,
      subscription_status: subscription.status,
      subscription_cancel_at_period_end: cancelAtPeriodEnd,
      subscription_current_period_end: subscription.current_period_end_date ?? null,
    };
    await supabase.auth.admin.updateUserById(userId, {
      app_metadata: appMetadata,
    });

    return new Response(JSON.stringify({ received: true }), {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    });
  }

  return new Response(JSON.stringify({ received: true }), {
    headers: { 'Content-Type': 'application/json' },
    status: 200,
  });
});
