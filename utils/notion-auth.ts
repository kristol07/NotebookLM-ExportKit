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
import { createClient } from '@supabase/supabase-js';
import { browser } from 'wxt/browser';

const DEFAULT_REDIRECT_PATH = 'supabase-oauth';
const NOTION_ACCESS_TOKEN_KEY = 'exportkitNotionAccessToken';
const NOTION_WORKSPACE_NAME_KEY = 'exportkitNotionWorkspaceName';
const NOTION_DATABASE_ID_KEY = 'exportkitNotionDatabaseId';
const NOTION_NOTEBOOK_MAP_KEY = 'exportkitNotionNotebookMap';
const NOTION_PAGE_DATABASE_MAP_KEY = 'exportkitNotionPageDatabaseMap';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_PUBLISHABLE_DEFAULT_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY;

const inMemoryStorage = (() => {
  const store = new Map<string, string>();
  return {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => {
      store.set(key, value);
    },
    removeItem: (key: string) => {
      store.delete(key);
    },
  };
})();

const notionAuthClient = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_DEFAULT_KEY, {
  auth: {
    storage: inMemoryStorage,
    storageKey: 'sb-notion-oauth-token',
    autoRefreshToken: false,
    persistSession: false,
    detectSessionInUrl: false,
    flowType: 'pkce',
  },
});

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

export const getNotionAccessToken = () => getStorageValue(NOTION_ACCESS_TOKEN_KEY);

export const setNotionAccessToken = async (token: string) => {
  await setStorageValue(NOTION_ACCESS_TOKEN_KEY, token);
};

export const getNotionWorkspaceName = () => getStorageValue(NOTION_WORKSPACE_NAME_KEY);

export const setNotionWorkspaceName = async (workspaceName?: string | null) => {
  if (workspaceName) {
    await setStorageValue(NOTION_WORKSPACE_NAME_KEY, workspaceName);
  } else {
    await removeStorageValue(NOTION_WORKSPACE_NAME_KEY);
  }
};

export const getNotionDatabaseId = () => getStorageValue(NOTION_DATABASE_ID_KEY);

export const setNotionDatabaseId = async (databaseId?: string | null) => {
  if (databaseId) {
    await setStorageValue(NOTION_DATABASE_ID_KEY, databaseId);
  } else {
    await removeStorageValue(NOTION_DATABASE_ID_KEY);
  }
};

export type NotionNotebookMap = Record<string, { dataSourceId: string; name: string }>;
export type NotionPageDatabaseMap = Record<string, string>;

export const getNotionNotebookMap = async (): Promise<NotionNotebookMap> => {
  const stored = await getStorageValue(NOTION_NOTEBOOK_MAP_KEY);
  if (!stored) {
    return {};
  }
  try {
    const parsed = JSON.parse(stored) as NotionNotebookMap;
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return {};
    }
    return parsed;
  } catch {
    return {};
  }
};

export const setNotionNotebookMap = async (map: NotionNotebookMap) => {
  await setStorageValue(NOTION_NOTEBOOK_MAP_KEY, JSON.stringify(map));
};

export const clearNotionNotebookMap = async () => {
  await removeStorageValue(NOTION_NOTEBOOK_MAP_KEY);
};

export const getNotionPageDatabaseMap = async (): Promise<NotionPageDatabaseMap> => {
  const stored = await getStorageValue(NOTION_PAGE_DATABASE_MAP_KEY);
  if (!stored) {
    return {};
  }
  try {
    const parsed = JSON.parse(stored) as NotionPageDatabaseMap;
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return {};
    }
    return parsed;
  } catch {
    return {};
  }
};

export const setNotionPageDatabaseMap = async (map: NotionPageDatabaseMap) => {
  await setStorageValue(NOTION_PAGE_DATABASE_MAP_KEY, JSON.stringify(map));
};

export const clearNotionPageDatabaseMap = async () => {
  await removeStorageValue(NOTION_PAGE_DATABASE_MAP_KEY);
};

export const clearNotionAuth = async () => {
  await Promise.all([
    removeStorageValue(NOTION_ACCESS_TOKEN_KEY),
    removeStorageValue(NOTION_WORKSPACE_NAME_KEY),
    removeStorageValue(NOTION_DATABASE_ID_KEY),
    removeStorageValue(NOTION_NOTEBOOK_MAP_KEY),
    removeStorageValue(NOTION_PAGE_DATABASE_MAP_KEY),
  ]);
};

const parseOAuthRedirect = (resultUrl: string) => {
  const url = new URL(resultUrl);
  const errorDescription = url.searchParams.get('error_description') || url.searchParams.get('error');
  if (errorDescription) {
    throw new Error(errorDescription);
  }

  const code = url.searchParams.get('code');
  const hashParams = new URLSearchParams(url.hash.replace(/^#/, ''));
  const accessToken = hashParams.get('access_token');
  const refreshToken = hashParams.get('refresh_token');

  return { code, accessToken, refreshToken };
};

export const connectNotion = async () => {
  if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_DEFAULT_KEY) {
    throw new Error('Missing Supabase configuration for Notion OAuth.');
  }
  const redirectTo = browser.identity.getRedirectURL(DEFAULT_REDIRECT_PATH);
  if (import.meta.env.DEV) {
    console.info('[auth] Notion OAuth redirectTo:', redirectTo);
  }

  const { data, error } = await notionAuthClient.auth.signInWithOAuth({
    provider: 'notion',
    options: {
      redirectTo,
      skipBrowserRedirect: true,
    },
  });

  if (error) {
    throw error;
  }
  if (!data?.url) {
    throw new Error('Supabase did not return a Notion OAuth URL.');
  }

  const resultUrl = await browser.identity.launchWebAuthFlow({
    url: data.url,
    interactive: true,
  });

  if (!resultUrl) {
    throw new Error('OAuth flow did not return a redirect URL.');
  }

  const { code, accessToken, refreshToken } = parseOAuthRedirect(resultUrl);

  if (code) {
    const { data: exchangeData, error: exchangeError } = await notionAuthClient.auth.exchangeCodeForSession(code);
    if (exchangeError) {
      throw exchangeError;
    }
    const session = exchangeData.session ?? null;
    const providerToken = session?.provider_token;
    if (!providerToken) {
      throw new Error('Notion OAuth did not return an access token.');
    }
    await setNotionAccessToken(providerToken);
    return { accessToken: providerToken, session };
  }

  if (accessToken && refreshToken) {
    const { data: sessionData, error: sessionError } = await notionAuthClient.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    });
    if (sessionError) {
      throw sessionError;
    }
    const session = sessionData.session ?? null;
    const providerToken = session?.provider_token;
    if (!providerToken) {
      throw new Error('Notion OAuth did not return an access token.');
    }
    await setNotionAccessToken(providerToken);
    return { accessToken: providerToken, session };
  }

  throw new Error('No auth code or tokens returned from OAuth flow.');
};

