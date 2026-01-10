# Google OAuth Setup (Supabase + Drive)

This project uses Supabase Auth for app login and a separate Google OAuth flow for Drive delivery.
Drive access tokens are stored locally in the extension and are not tied to the Supabase session.

## 1) Create a Google OAuth Client (Drive)
1. Go to Google Cloud Console → APIs & Services → Credentials.
2. Click “Create Credentials” → “OAuth client ID”.
3. Choose application type:
   - Recommended: Web application
4. Set an authorized redirect URI for the extension:
   - `https://<EXTENSION_ID>.chromiumapp.org/google-drive-oauth`
5. Copy the Client ID.

## 2) Enable Google Provider in Supabase (login)
1. In Supabase → Authentication → Providers → Google:
   - Enable Google provider.
   - Paste the Client ID + Client Secret from the Supabase login OAuth client.
2. Save.

## Client ID Quick Reference
| Purpose | OAuth Client | Redirect URI | Where to configure |
| --- | --- | --- | --- |
| App login (Supabase) | Web application | `https://<YOUR_SUPABASE_PROJECT>.supabase.co/auth/v1/callback` | Supabase → Auth → Providers → Google |
| Drive delivery (extension) | Web application | `https://<EXTENSION_ID>.chromiumapp.org/google-drive-oauth` | `VITE_GOOGLE_DRIVE_CLIENT_ID` or `wxt.config.ts` |

## 3) Add Extension Redirect URL in Supabase
Supabase must allow the extension return URL so OAuth login can complete.

1. In Supabase → Authentication → URL Configuration:
   - Add the extension callback URL to “Additional Redirect URLs”.
   - Use the Chrome Identity redirect URL:
     - `https://<EXTENSION_ID>.chromiumapp.org/supabase-oauth`
2. Save.

Notes:
- The extension ID changes between dev/build/store. Add all IDs you use.
- The redirect URL is logged in dev builds when starting Google sign-in.
- For local dev, install the extension and copy the ID from `chrome://extensions`.
- If you want your local build to match the published extension ID, set `manifest.key` in `wxt.config.ts` to the public key from the store listing.

## 4) Enable Drive API (Google Cloud)
1. In Google Cloud Console → APIs & Services → Library:
   - Enable “Google Drive API”.

## 5) Ensure OAuth Scope is Allowed
The extension requests the Drive scope only when the user connects Google Drive:
- `https://www.googleapis.com/auth/drive.file`

This scope is set during the Drive connect flow:
- `utils/google-drive-auth.ts`
- `entrypoints/sidepanel/components/Dashboard.tsx`

App login does not request Drive access. Drive access is requested only when the
user connects Drive (or selects Drive as the export destination).

How to verify:
- Google Cloud Console → APIs & Services → OAuth consent screen.
- Make sure the consent screen is configured and the Drive scope is listed (add it if needed).
- During Drive connect, the Google consent screen should show Drive access (for files created/opened by the app).

Note:
- `drive.file` is a Sensitive scope and may require Google verification for public distribution.

## 6) Configure the Client ID
Set `VITE_GOOGLE_DRIVE_CLIENT_ID` (or update `manifest.oauth2.client_id` in `wxt.config.ts`)
with the Drive OAuth client ID.

## 7) Verify in the Extension
1. Set “Export to: Google Drive”.
2. Click “Connect Google Drive” (this will prompt Google sign-in with Drive scope if needed).
3. Export any format and confirm the file appears in:
   - `Google Drive / NotebookLM ExportKit / <filename>`

## Why the Sidepanel Flow Uses chrome.identity
The sidepanel cannot reliably complete OAuth by opening a new tab and redirecting back to
`chrome-extension://...`:

- Chrome can block external redirects into extension URLs for security reasons.
- Even if it opens, the redirect lands in a new tab, not the existing sidepanel, so the
  session state may not update.

The fix is to use `chrome.identity.launchWebAuthFlow` so the OAuth flow runs in a popup
and the redirect URL is returned directly to the sidepanel code. The required redirect
URL format is:

- `https://<EXTENSION_ID>.chromiumapp.org/supabase-oauth`

This URL must be allow-listed in Supabase. The `identity` permission is required in the
manifest.

When the flow finishes, the sidepanel parses the returned URL and stores the Drive access
token locally for uploads.
