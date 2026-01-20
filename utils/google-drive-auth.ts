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
import { browser } from 'wxt/browser';

const DRIVE_ACCESS_TOKEN_KEY = 'exportkitDriveAccessToken';
const DRIVE_ACCESS_EXPIRY_KEY = 'exportkitDriveAccessTokenExpiry';
const DRIVE_ACCOUNT_EMAIL_KEY = 'exportkitDriveAccountEmail';
const DRIVE_CONNECTED_STORAGE_KEY = 'exportkitDriveConnected';

const getStorageValue = async (key: string) => {
  const result = await browser.storage.local.get(key);
  const value = result[key];
  return typeof value === 'string' ? value : null;
};

const setStorageValue = async (key: string, value: string) => {
  await browser.storage.local.set({ [key]: value });
};

const removeStorageValue = async (key: string) => {
  await browser.storage.local.remove(key);
};

const getStoredAccessToken = () => getStorageValue(DRIVE_ACCESS_TOKEN_KEY);
const getStoredExpiry = async () => {
  const value = await getStorageValue(DRIVE_ACCESS_EXPIRY_KEY);
  return value ? Number(value) : null;
};

const setStoredAccessToken = async (token: string, expiresInSeconds?: number) => {
  await setStorageValue(DRIVE_ACCESS_TOKEN_KEY, token);
  if (typeof expiresInSeconds === 'number') {
    const expiresAt = Date.now() + Math.max(0, expiresInSeconds - 60) * 1000;
    await setStorageValue(DRIVE_ACCESS_EXPIRY_KEY, String(expiresAt));
  } else {
    await removeStorageValue(DRIVE_ACCESS_EXPIRY_KEY);
  }
  await setStorageValue(DRIVE_CONNECTED_STORAGE_KEY, 'true');
};

const setStoredDriveEmail = async (email?: string | null) => {
  if (email) {
    await setStorageValue(DRIVE_ACCOUNT_EMAIL_KEY, email);
  } else {
    await removeStorageValue(DRIVE_ACCOUNT_EMAIL_KEY);
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

export const getDriveAccessToken = async () => {
  const token = await getStoredAccessToken();
  if (!token) {
    return null;
  }
  const expiresAt = await getStoredExpiry();
  if (expiresAt && Date.now() > expiresAt) {
    await clearDriveAuth();
    return null;
  }
  return token;
};

export const getDriveAccountEmail = () => getStorageValue(DRIVE_ACCOUNT_EMAIL_KEY);

export const clearDriveAuth = async () => {
  await Promise.all([
    removeStorageValue(DRIVE_ACCESS_TOKEN_KEY),
    removeStorageValue(DRIVE_ACCESS_EXPIRY_KEY),
    removeStorageValue(DRIVE_ACCOUNT_EMAIL_KEY),
    removeStorageValue(DRIVE_CONNECTED_STORAGE_KEY),
  ]);
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

  await setStoredAccessToken(accessToken, expiresIn);
  await setStoredDriveEmail(email);

  return { accessToken, email };
};

