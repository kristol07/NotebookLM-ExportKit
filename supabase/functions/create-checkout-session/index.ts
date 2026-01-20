/*
 * Copyright (C) 2026 kristol07
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */
import { corsHeaders } from '../_shared/cors.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

Deno.serve(async (req) => {
  try {
    if (req.method === 'OPTIONS') {
      return new Response('ok', { headers: corsHeaders });
    }

    if (req.method !== 'POST') {
      return new Response('Method not allowed', { status: 405, headers: corsHeaders });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const creemApiKey = Deno.env.get('CREEM_API_KEY');
    const creemProductId = Deno.env.get('CREEM_PRODUCT_ID_PLUS');
    const creemSuccessUrl = Deno.env.get('CREEM_SUCCESS_URL');

    if (!supabaseUrl || !supabaseServiceRoleKey || !creemApiKey || !creemProductId || !creemSuccessUrl) {
      return new Response('Missing server configuration', { status: 500, headers: corsHeaders });
    }

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response('Missing authorization header', { status: 401, headers: corsHeaders });
    }

    const accessToken = authHeader.replace('Bearer ', '').trim();
    if (!accessToken) {
      return new Response('Missing access token', { status: 401, headers: corsHeaders });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);
    const { data: { user }, error: userError } = await supabase.auth.getUser(accessToken);
    if (userError || !user) {
      return new Response('Unauthorized', { status: 401, headers: corsHeaders });
    }

    const { data: activeSubscriptions, error: activeError } = await supabase
      .from('subscriptions')
      .select('id')
      .eq('user_id', user.id)
      .eq('product_id', creemProductId)
      .in('status', ['active', 'trialing'])
      .order('created_at', { ascending: false })
      .limit(1);

    if (activeError) {
      return new Response('Failed to check subscription status', { status: 500, headers: corsHeaders });
    }

    if (activeSubscriptions && activeSubscriptions.length > 0) {
      return new Response('Subscription already active', { status: 409, headers: corsHeaders });
    }

    const nowIso = new Date().toISOString();
    const lockExpiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();

    const { data: existingLock, error: lockLookupError } = await supabase
      .from('checkout_locks')
      .select('checkout_url, expires_at')
      .eq('user_id', user.id)
      .eq('product_id', creemProductId)
      .eq('status', 'pending')
      .gt('expires_at', nowIso)
      .maybeSingle();

    if (lockLookupError) {
      return new Response('Failed to check checkout status', { status: 500, headers: corsHeaders });
    }

    if (existingLock?.checkout_url) {
      return new Response(JSON.stringify({ checkout_url: existingLock.checkout_url }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (existingLock && !existingLock.checkout_url) {
      return new Response('Checkout already in progress', { status: 409, headers: corsHeaders });
    }

    const { error: lockInsertError } = await supabase
      .from('checkout_locks')
      .insert({
        user_id: user.id,
        product_id: creemProductId,
        status: 'pending',
        expires_at: lockExpiresAt,
        updated_at: nowIso,
      });

    if (lockInsertError) {
      const { data: existingAfterInsert } = await supabase
        .from('checkout_locks')
        .select('checkout_url, expires_at')
        .eq('user_id', user.id)
        .eq('product_id', creemProductId)
        .eq('status', 'pending')
        .gt('expires_at', nowIso)
        .maybeSingle();

      if (existingAfterInsert?.checkout_url) {
        return new Response(JSON.stringify({ checkout_url: existingAfterInsert.checkout_url }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      return new Response('Checkout already in progress', { status: 409, headers: corsHeaders });
    }

    const requestId = crypto.randomUUID();
    const checkoutResponse = await fetch('https://api.creem.io/v1/checkouts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': creemApiKey,
      },
      body: JSON.stringify({
        request_id: requestId,
        product_id: creemProductId,
        success_url: creemSuccessUrl,
        metadata: {
          user_id: user.id,
        },
      }),
    });

    if (!checkoutResponse.ok) {
      const errorText = await checkoutResponse.text();
      return new Response(errorText || 'Checkout failed', { status: 400, headers: corsHeaders });
    }

    const data = await checkoutResponse.json();
    await supabase
      .from('checkout_locks')
      .update({
        checkout_url: data.checkout_url,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', user.id)
      .eq('product_id', creemProductId)
      .eq('status', 'pending');

    return new Response(JSON.stringify({ checkout_url: data.checkout_url }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (_error) {
    return new Response('Internal server error', { status: 500, headers: corsHeaders });
  }
});

