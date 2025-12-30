# Billing + Creem + Supabase TODO (Step-by-Step)

This checklist walks you through everything needed to go live.

## 0) What you need ready
- Supabase project URL + publishable default key
- Creem account + API key + webhook secret
- One recurring Creem product for Plus

## 1) Create database tables (Supabase SQL)
1. Open Supabase Dashboard → SQL Editor.
2. Paste and run `supabase/schema.sql`.
3. Confirm tables exist:
   - `customers`
   - `subscriptions`
   - `trial_usage`
   - `checkout_locks`

## 2) Deploy Edge Functions
You can deploy via Supabase CLI or the Dashboard.

### Option A: Supabase CLI (recommended)
1. Install CLI: `npm i -g supabase`
2. Log in: `supabase login`
3. Link project (run in repo root):
   - `supabase link --project-ref <your-project-ref>`
4. Deploy functions:
   - `supabase functions deploy create-checkout-session`
   - `supabase functions deploy create-customer-portal-link`
   - `supabase functions deploy consume-trial`
   - `supabase functions deploy creem-webhook`
   - `supabase functions deploy cleanup-checkout-locks`

### Option B: Supabase Dashboard
If you don't want CLI:
1. Go to Supabase Dashboard → Functions.
2. Create four functions with these names:
   - `create-checkout-session`
   - `create-customer-portal-link`
   - `consume-trial`
   - `creem-webhook`
   - `cleanup-checkout-locks`
3. Paste code from:
   - `supabase/functions/create-checkout-session/index.ts`
   - `supabase/functions/create-customer-portal-link/index.ts`
   - `supabase/functions/consume-trial/index.ts`
   - `supabase/functions/creem-webhook/index.ts`
   - `supabase/functions/cleanup-checkout-locks/index.ts`
4. Save and deploy each.

## 3) Set environment variables for functions
Supabase Dashboard → Project Settings → Functions → Environment Variables

Add these keys:
- `CREEM_API_KEY`
- `CREEM_WEBHOOK_SECRET`
- `CREEM_PRODUCT_ID_PLUS`
- `CREEM_SUCCESS_URL`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

Notes:
- `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are found in Supabase Project Settings → API.
- `CREEM_PRODUCT_ID_PLUS` is from your Creem Plus product.
- `CREEM_SUCCESS_URL` is the public URL to your success page (see step 4).

## 4) Create the success page in Supabase Storage
1. In Supabase Dashboard → Storage.
2. Create a bucket, name it `public-pages` (any name OK).
3. Set it to **Public**.
4. Upload `docs/CREEM_SUCCESS_PAGE.html`.
5. Set the uploaded object's metadata `Content-Type` to `text/html; charset=utf-8`.
6. Copy the public URL of that file.
7. Paste the URL into `CREEM_SUCCESS_URL` (step 3).

Expected URL format:
`https://<project-ref>.supabase.co/storage/v1/object/public/public-pages/CREEM_SUCCESS_PAGE.html`

## 5) Configure Creem
1. Create a recurring product in Creem (Plus plan).
2. Copy the product ID → set `CREEM_PRODUCT_ID_PLUS`.
3. Add a webhook endpoint:
   - URL: `https://<project-ref>.functions.supabase.co/creem-webhook`
   - Events: `checkout.completed`
   - Events: `subscription.update`
   - Events: `subscription.canceled`
4. Save the webhook secret → set `CREEM_WEBHOOK_SECRET`.

## 6) Extension env vars
In `.env` (or your build environment):
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY`

## 7) Smoke test
1. Open extension → click a Plus export.
2. Sign in → use trials.
3. When trials exhausted → click Upgrade → should open Creem checkout.
4. Complete payment → success page opens.
5. Reopen extension → should show “Plus Member”.

## 8) Optional: Billing portal
Creem can generate a billing portal link for customers.
The extension uses `create-customer-portal-link` for this.

## 9) Schedule checkout lock cleanup
Run the `cleanup-checkout-locks` function on a schedule (hourly is fine) to remove expired locks.
Use the `pg_cron` extension to call the Edge Function:
```sql
select
  cron.schedule(
    'cleanup-checkout-locks-hourly',
    '0 * * * *',
    $$
    select
      net.http_post(
        url := 'https://<project-ref>.functions.supabase.co/cleanup-checkout-locks',
        headers := '{"Authorization":"Bearer <service-role-key>","Content-Type":"application/json"}'::jsonb
      );
    $$
  );
```
