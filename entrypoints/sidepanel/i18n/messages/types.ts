export type Locale = 'en-US' | 'es-ES' | 'de-DE' | 'it-IT' | 'pt-BR' | 'fr-FR';

export const DEFAULT_LOCALE: Locale = 'en-US';

export const LOCALE_LABELS: Record<Locale, string> = {
  'en-US': 'English (US)',
  'es-ES': 'Español (España)',
  'de-DE': 'Deutsch (Deutschland)',
  'it-IT': 'Italiano (Italia)',
  'pt-BR': 'Português (Brasil)',
  'fr-FR': 'Français (France)',
};

export type MessageParams = Record<string, string | number | undefined> & {
  locale: Locale;
};

export type MessageValue = string | ((params: MessageParams) => string);
