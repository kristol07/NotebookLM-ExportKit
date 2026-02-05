# Analytics Integration Plan (GA4)

## Goals
- Track which export features are used most (content type, format, destination).
- Understand conversion funnel for revenue (trial usage, upgrade flow, checkout start).
- Keep data anonymous and low-risk (no content, no PII).

## Approach
Use Google Analytics 4 Measurement Protocol from the extension UI. Events are posted via HTTPS to the GA4 Measurement Protocol endpoint using a Measurement ID and API Secret.

Why Measurement Protocol:
- Works without loading remote scripts (MV3 disallows remotely hosted code).
- Lightweight and extension-friendly.

## Configuration
Add two env vars:
- `VITE_GA_MEASUREMENT_ID`
- `VITE_GA_API_SECRET`

If either is missing, analytics are disabled.

## GA4 Setup Guide (Extension)
1. Create or open a GA4 property in Google Analytics.
2. Add a Web data stream for the extension (use a placeholder domain like `https://extension.invalid`).
3. Copy the Measurement ID (looks like `G-XXXXXXX`).
4. In Google Analytics Admin → Data Streams → your stream → Measurement Protocol API secrets:
   - Create a new API secret and copy it.
5. Put values in your `.env`:
   - `VITE_GA_MEASUREMENT_ID=G-XXXXXXX`
   - `VITE_GA_API_SECRET=your-secret`
6. In GA4 Admin → Custom definitions, add event-scoped dimensions for the params listed below.
7. Build/reload the extension and check GA4 Realtime to validate events.

## Event Model
All events include:
- `app_version` (extension version)
- `session_id` (generated per UI session)
- `engagement_time_msec` (fixed minimum value)

### Core usage events (feature usage)
1. `export_requested`
   - `content_type` (quiz, flashcards, mindmap, note, report, chat, datatable, source, notebooklm_payload)
   - `export_format` (PDF, CSV, Markdown, etc.)
   - `export_target` (download, drive, notion)
   - `delivery` (download, clipboard)
   - `is_plus` (true/false)
   - `signed_in` (true/false)

2. `export_completed`
   - Same params as `export_requested`
   - `success` (true)
   - `duration_ms`

3. `export_failed`
   - Same params as `export_requested`
   - `success` (false)
   - `failure_reason` (ex: extraction_failed, delivery_failed, blocked_not_signed_in)

4. `export_blocked`
   - Same params as `export_requested`
   - `failure_reason` (ex: not_signed_in, trial_exhausted, drive_not_connected, notion_no_destination)

5. `panel_opened`
   - `signed_in`
   - `plan_tier`
   - `export_target`

### Revenue / growth events
6. `upgrade_modal_opened`
   - `context` (drive, notion, format, general)
   - `signed_in`
   - `plan_tier`

7. `checkout_started`
   - `context`
   - `plan_tier`

8. `checkout_failed`
   - `context`
   - `plan_tier`

9. `billing_portal_opened`
   - `plan_tier`

10. `upgrade_blocked`
   - `reason` (ex: not_signed_in)
   - `plan_tier`

11. `drive_connect_started` / `drive_connected` / `drive_connect_failed`
12. `notion_connect_started` / `notion_connected` / `notion_connect_failed`

### Settings / privacy
13. `analytics_opt_in`
14. `analytics_opt_out`
15. `pdf_quality_changed`
   - `pdf_quality` (size, clarity)

## Dimensions & Metrics (GA4)
Create custom dimensions (event-scoped):
- `content_type`
- `export_format`
- `export_target`
- `delivery`
- `failure_reason`
- `plan_tier`
- `context`
- `pdf_quality`
- `reason`

Use built-in metrics:
- Event count (per event name)
- Users (by client_id)
- Conversion rates (checkout_started / upgrade_modal_opened / export_completed)

## Privacy & Compliance
- No NotebookLM content, files, or PII are sent.
- Use a random `client_id` stored locally in extension storage.
- Provide a toggle to disable analytics in the Account panel.
- Update privacy policy to reflect analytics collection and opt-out.

## Implementation Steps
1. Add `utils/analytics.ts` to manage config, client_id, and event posting.
2. Add GA host permissions in `wxt.config.ts`.
3. Wire events in `Dashboard.tsx` (exports + revenue flow).
4. Add analytics toggle UI in `AccountPanel.tsx` + styles.
5. Update `.env.example` and privacy policy.

## Manual Verification
- Build with `VITE_GA_MEASUREMENT_ID` and `VITE_GA_API_SECRET` set.
- Trigger exports and upgrade flow; confirm events in GA4 Realtime.
- Toggle analytics off and confirm no further events are sent.
