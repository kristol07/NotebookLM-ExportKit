import { browser } from 'wxt/browser';

const ANALYTICS_ENABLED_KEY = 'exportkitAnalyticsEnabled';
const ANALYTICS_CLIENT_ID_KEY = 'exportkitAnalyticsClientId';
const MEASUREMENT_ID = import.meta.env.VITE_GA_MEASUREMENT_ID ?? '';
const API_SECRET = import.meta.env.VITE_GA_API_SECRET ?? '';
const DEFAULT_ANALYTICS_ENABLED = true;
const SESSION_ID = Math.floor(Date.now() / 1000);
const APP_VERSION = browser?.runtime?.getManifest?.().version ?? 'unknown';

type AnalyticsParamValue = string | number | boolean;
type AnalyticsParams = Record<string, AnalyticsParamValue | null | undefined>;

const getStorageValue = async (key: string) => {
  const result = await browser.storage.local.get(key);
  return result?.[key];
};

const setStorageValue = async (key: string, value: string) => {
  await browser.storage.local.set({ [key]: value });
};

export const getAnalyticsEnabled = async () => {
  const stored = await getStorageValue(ANALYTICS_ENABLED_KEY);
  if (stored === undefined) {
    return DEFAULT_ANALYTICS_ENABLED;
  }
  return stored === 'true';
};

export const setAnalyticsEnabled = async (enabled: boolean) => {
  await setStorageValue(ANALYTICS_ENABLED_KEY, enabled ? 'true' : 'false');
};

const generateClientId = () => {
  if (globalThis.crypto?.randomUUID) {
    return globalThis.crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

const getClientId = async () => {
  let clientId = await getStorageValue(ANALYTICS_CLIENT_ID_KEY);
  if (!clientId) {
    clientId = generateClientId();
    await setStorageValue(ANALYTICS_CLIENT_ID_KEY, clientId);
  }
  return clientId;
};

const scrubParams = (params?: AnalyticsParams) => {
  const cleaned: Record<string, string | number> = {
    app_version: APP_VERSION,
    session_id: SESSION_ID,
    engagement_time_msec: 100,
  };
  if (!params) {
    return cleaned;
  }
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null) {
      continue;
    }
    cleaned[key] = typeof value === 'boolean' ? String(value) : value;
  }
  return cleaned;
};

const isConfigured = () => Boolean(MEASUREMENT_ID && API_SECRET);

export const trackEvent = async (name: string, params?: AnalyticsParams) => {
  if (!isConfigured()) {
    return;
  }
  const enabled = await getAnalyticsEnabled();
  if (!enabled) {
    return;
  }
  const clientId = await getClientId();
  const payload = {
    client_id: clientId,
    events: [
      {
        name,
        params: scrubParams(params),
      },
    ],
  };
  try {
    await fetch(
      `https://www.google-analytics.com/mp/collect?measurement_id=${MEASUREMENT_ID}&api_secret=${API_SECRET}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      }
    );
  } catch {
    // Ignore analytics failures.
  }
};
