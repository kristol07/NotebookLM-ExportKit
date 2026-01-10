# Google OAuth Setup (Supabase + Drive)

This project uses Supabase Auth with Google OAuth to obtain a Google Drive access token (`provider_token`). That token is used to upload exports to Drive.

## 1) Create a Google OAuth Client
1. Go to Google Cloud Console → APIs & Services → Credentials.
2. Create an OAuth client (type: Web application).
   - Supabase uses a web OAuth redirect flow (`/auth/v1/callback`), so the OAuth client must be Web, not the Chrome extension type.
3. Add an Authorized redirect URI for Supabase:
   - `https://<YOUR_SUPABASE_PROJECT>.supabase.co/auth/v1/callback`
4. Copy the Client ID and Client Secret.

## 2) Enable Google Provider in Supabase
1. In Supabase → Authentication → Providers → Google:
   - Enable Google provider.
   - Paste the Client ID + Client Secret.
2. Save.

## 3) Add Extension Redirect URL in Supabase
Supabase must allow the extension return URL so OAuth can complete.

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
The app requests the Drive scope:
- `https://www.googleapis.com/auth/drive.file`

This scope is set in the client during sign-in:
- `utils/supabase-oauth.ts`
- `entrypoints/sidepanel/components/Login.tsx`
- `entrypoints/sidepanel/components/Dashboard.tsx`

How to verify:
- Google Cloud Console → APIs & Services → OAuth consent screen.
- Make sure the consent screen is configured and the Drive scope is listed (add it if needed).
- During sign-in, the Google consent screen should show Drive access (for files created/opened by the app).

Note:
- `drive.file` is a Sensitive scope and may require Google verification for public distribution.

## 6) Verify in the Extension
1. Sign in with Google from the sidepanel login.
2. Set “Export to: Google Drive”.
3. Click “Connect Google Drive” if prompted.
4. Export any format and confirm the file appears in:
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

When the flow finishes, the sidepanel parses the returned URL and completes the Supabase
session (PKCE or implicit). The Google access token you need for Drive uploads is stored
on the session as `provider_token`.
