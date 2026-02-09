# Subscription Entitlement Hardening (TODO)

This document tracks follow-up work to reduce stale entitlement risk when billing webhooks are delayed or missed.

## Problem
Current access control relies on `auth.users.app_metadata.plan` being updated by webhook events.
If period-end events are missed, a canceled subscription may retain `plan=plus` longer than intended.

## Proposed Mitigations
1. Scheduled reconciliation job
- Add an Edge Function (for example, `reconcile-entitlements`) and run it hourly/daily via `pg_cron`.
- Recompute effective access from `subscriptions.status`, `subscriptions.cancel_at_period_end`, and `subscriptions.current_period_end`.
- Sync corrected values back to `auth.users.app_metadata`:
  - `plan`
  - `subscription_status`
  - `subscription_cancel_at_period_end`
  - `subscription_current_period_end`

2. Runtime safeguard in `consume-trial`
- Do not trust metadata alone for privileged access.
- If `app_metadata.plan=plus` but the subscription window is already expired, treat the user as `free`.
- Prefer using DB subscription state as final source-of-truth for trial gating.

3. Webhook observability
- Persist webhook event IDs + processing result for auditability.
- Alert on non-200 responses or repeated delivery failures.

4. Optional provider reconciliation
- Periodically query Creem for at-risk statuses (`scheduled_cancel`, `past_due`, `unpaid`, etc.).
- Reconcile mismatches between provider state and local DB/auth metadata.

## Suggested Rollout Order
1. Runtime safeguard in `consume-trial` (quickest risk reduction).
2. Scheduled reconciliation function + cron.
3. Webhook logging/alerts.
4. Provider-side reconciliation (optional, if mismatch incidents continue).
