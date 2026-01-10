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
   - Use the runtime URL WXT generates:
     - `chrome-extension://<EXTENSION_ID>/sidepanel/index.html`
2. Save.

Notes:
- Edge uses a different scheme: `edge-extension://<EXTENSION_ID>/sidepanel/index.html`.
- Firefox uses `moz-extension://<EXTENSION_ID>/sidepanel/index.html`.
- The extension ID changes between dev and prod. Add both if needed.
- For local dev, install the extension and copy the ID from `chrome://extensions`.

## 4) Enable Drive API (Google Cloud)
1. In Google Cloud Console → APIs & Services → Library:
   - Enable “Google Drive API”.

## 5) Ensure OAuth Scope is Allowed
The app requests the Drive scope:
- `https://www.googleapis.com/auth/drive.file`

This scope is set in the client during sign-in:
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
