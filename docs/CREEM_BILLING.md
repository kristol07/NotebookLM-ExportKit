# Creem + Supabase Billing Setup

This project uses Creem for checkout and Supabase Edge Functions for secure entitlement updates.
Client code never writes plan fields directly.
For future reliability hardening tasks, see `docs/todo/SUBSCRIPTION_ENTITLEMENT_HARDENING.md`.

## Supabase SQL

Run the schema in `supabase/schema.sql` to create billing tables.
RLS is enabled; only Edge Functions with `service_role` access can write.

## Supabase Edge Functions

Deploy these functions:
- `create-checkout-session`
- `create-customer-portal-link`
- `consume-trial`
- `creem-webhook`
- `cleanup-checkout-locks`

Schedule `cleanup-checkout-locks` via the Supabase `pg_cron` extension (e.g., hourly) to call the Edge Function.

Set environment variables in Supabase:
- `CREEM_API_KEY`
- `CREEM_WEBHOOK_SECRET`
- `CREEM_PRODUCT_ID_PLUS`
- `CREEM_SUCCESS_URL`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

## Creem Product

Create a recurring product in Creem for Plus and copy the `product_id`.

## Webhook

Configure a webhook endpoint in Creem:
- URL: `https://<project-ref>.functions.supabase.co/creem-webhook`
- Events: `checkout.completed`
- Events: `subscription.update`
- Events: `subscription.canceled`

## Success Page

Upload `docs/CREEM_SUCCESS_PAGE.html` to a public Supabase Storage bucket
and use its public URL as `CREEM_SUCCESS_URL`.
Ensure the object's `Content-Type` metadata is `text/html; charset=utf-8`
so browsers render it as a page instead of showing raw HTML.
