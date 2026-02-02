import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { browser } from 'wxt/browser';
import {
  DEFAULT_LOCALE,
  formatMessage,
  isLocale,
  LOCALE_LABELS,
  type Locale,
  type MessageKey,
  type MessageParams
} from './messages';

const STORAGE_KEY = 'exportkitLocale';

const getSystemLocale = () => {
  try {
    const browserLocale = browser?.i18n?.getUILanguage?.();
    if (browserLocale) {
      return browserLocale;
    }
  } catch {
    // Ignore and fall back to navigator.
  }
  return navigator.language;
};

const normalizeLocale = (value?: string | null): Locale => {
  if (!value) {
    return DEFAULT_LOCALE;
  }
  const lower = value.toLowerCase();
  if (lower.startsWith('en')) {
    return 'en-US';
  }
  if (lower.startsWith('es')) {
    return 'es-ES';
  }
  if (lower.startsWith('de')) {
    return 'de-DE';
  }
  if (lower.startsWith('it')) {
    return 'it-IT';
  }
  if (lower.startsWith('pt')) {
    return 'pt-BR';
  }
  if (lower.startsWith('fr')) {
    return 'fr-FR';
  }
  return DEFAULT_LOCALE;
};

const readStoredLocale = () => {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
};

const persistLocale = (locale: Locale) => {
  try {
    localStorage.setItem(STORAGE_KEY, locale);
  } catch {
    // Ignore storage failures.
  }
};

type I18nContextValue = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: MessageKey, params?: Omit<MessageParams, 'locale'>) => string;
  formatDate: (value: Date | string, options?: Intl.DateTimeFormatOptions) => string | null;
  formatList: (items: string[]) => string;
  availableLocales: Array<{ value: Locale; label: string }>;
};

const I18nContext = createContext<I18nContextValue | null>(null);

export const I18nProvider = ({ children }: { children: React.ReactNode }) => {
  const [locale, setLocaleState] = useState<Locale>(() => {
    const stored = readStoredLocale();
    if (isLocale(stored)) {
      return stored;
    }
    return normalizeLocale(getSystemLocale());
  });

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  const setLocale = useCallback((nextLocale: Locale) => {
    setLocaleState(nextLocale);
    persistLocale(nextLocale);
  }, []);

  const t = useCallback(
    (key: MessageKey, params?: Omit<MessageParams, 'locale'>) =>
      formatMessage(locale, key, params as MessageParams),
    [locale]
  );

  const formatDate = useCallback(
    (value: Date | string, options?: Intl.DateTimeFormatOptions) => {
      const date = value instanceof Date ? value : new Date(value);
      if (Number.isNaN(date.getTime())) {
        return null;
      }
      return new Intl.DateTimeFormat(locale, options).format(date);
    },
    [locale]
  );

  const formatList = useCallback(
    (items: string[]) => {
      if (items.length <= 1) {
        return items.join('');
      }
      return new Intl.ListFormat(locale, { style: 'long', type: 'conjunction' }).format(items);
    },
    [locale]
  );

  const availableLocales = useMemo(
    () => (Object.keys(LOCALE_LABELS) as Locale[]).map((value) => ({
      value,
      label: LOCALE_LABELS[value]
    })),
    []
  );

  const value = useMemo(
    () => ({
      locale,
      setLocale,
      t,
      formatDate,
      formatList,
      availableLocales
    }),
    [locale, setLocale, t, formatDate, formatList, availableLocales]
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
};

export const useI18n = () => {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return context;
};
