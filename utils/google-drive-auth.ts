import { browser } from 'wxt/browser';

const DRIVE_ACCESS_TOKEN_KEY = 'exportkitDriveAccessToken';
const DRIVE_ACCESS_EXPIRY_KEY = 'exportkitDriveAccessTokenExpiry';
const DRIVE_ACCOUNT_EMAIL_KEY = 'exportkitDriveAccountEmail';
const DRIVE_CONNECTED_STORAGE_KEY = 'exportkitDriveConnected';

const getStoredAccessToken = () => localStorage.getItem(DRIVE_ACCESS_TOKEN_KEY);
const getStoredExpiry = () => {
  const value = localStorage.getItem(DRIVE_ACCESS_EXPIRY_KEY);
  return value ? Number(value) : null;
};

const setStoredAccessToken = (token: string, expiresInSeconds?: number) => {
  localStorage.setItem(DRIVE_ACCESS_TOKEN_KEY, token);
  if (typeof expiresInSeconds === 'number') {
    const expiresAt = Date.now() + Math.max(0, expiresInSeconds - 60) * 1000;
    localStorage.setItem(DRIVE_ACCESS_EXPIRY_KEY, String(expiresAt));
  } else {
    localStorage.removeItem(DRIVE_ACCESS_EXPIRY_KEY);
  }
  localStorage.setItem(DRIVE_CONNECTED_STORAGE_KEY, 'true');
};

const setStoredDriveEmail = (email?: string | null) => {
  if (email) {
    localStorage.setItem(DRIVE_ACCOUNT_EMAIL_KEY, email);
  } else {
    localStorage.removeItem(DRIVE_ACCOUNT_EMAIL_KEY);
  }
};

const getDriveClientId = () => {
  const envClientId = import.meta.env.VITE_GOOGLE_DRIVE_CLIENT_ID as string | undefined;
  if (envClientId) {
    return envClientId;
  }
  const manifest = browser.runtime.getManifest() as { oauth2?: { client_id?: string } };
  return manifest.oauth2?.client_id || '';
};

const parseAuthResponse = (url: string) => {
  const hashParams = new URLSearchParams(url.split('#')[1] || '');
  const accessToken = hashParams.get('access_token');
  const expiresIn = hashParams.get('expires_in');
  const error = hashParams.get('error');
  if (error) {
    throw new Error(error);
  }
  if (!accessToken) {
    throw new Error('No access token returned from Google OAuth.');
  }
  return {
    accessToken,
    expiresIn: expiresIn ? Number(expiresIn) : undefined,
  };
};

export const getDriveAccessToken = () => {
  const token = getStoredAccessToken();
  if (!token) {
    return null;
  }
  const expiresAt = getStoredExpiry();
  if (expiresAt && Date.now() > expiresAt) {
    clearDriveAuth();
    return null;
  }
  return token;
};

export const getDriveAccountEmail = () => localStorage.getItem(DRIVE_ACCOUNT_EMAIL_KEY);

export const clearDriveAuth = () => {
  localStorage.removeItem(DRIVE_ACCESS_TOKEN_KEY);
  localStorage.removeItem(DRIVE_ACCESS_EXPIRY_KEY);
  localStorage.removeItem(DRIVE_ACCOUNT_EMAIL_KEY);
  localStorage.removeItem(DRIVE_CONNECTED_STORAGE_KEY);
};

export const connectGoogleDrive = async (scopes: string) => {
  const clientId = getDriveClientId();
  if (!clientId || clientId === 'omit as it is not used') {
    throw new Error('Missing Google Drive OAuth client ID.');
  }
  const redirectUri = browser.identity.getRedirectURL('google-drive-oauth');
  const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  authUrl.searchParams.set('client_id', clientId);
  authUrl.searchParams.set('redirect_uri', redirectUri);
  authUrl.searchParams.set('response_type', 'token');
  authUrl.searchParams.set('scope', scopes);
  authUrl.searchParams.set('include_granted_scopes', 'true');
  authUrl.searchParams.set('prompt', 'select_account consent');

  const resultUrl = await browser.identity.launchWebAuthFlow({
    url: authUrl.toString(),
    interactive: true,
  });

  if (!resultUrl) {
    throw new Error('OAuth flow did not return a redirect URL.');
  }

  const { accessToken, expiresIn } = parseAuthResponse(resultUrl);

  let email: string | null = null;
  try {
    const response = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (response.ok) {
      const data = await response.json();
      email = data?.email || null;
    }
  } catch (err) {
    console.warn('Failed to fetch Google account email:', err);
  }

  setStoredAccessToken(accessToken, expiresIn);
  setStoredDriveEmail(email);

  return { accessToken, email };
};
