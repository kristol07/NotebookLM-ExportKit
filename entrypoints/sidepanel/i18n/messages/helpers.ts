import type { Locale } from './types';

export const pluralize = (locale: Locale, count: number, forms: { one: string; other: string }) => {
  const rule = new Intl.PluralRules(locale).select(count);
  return rule === 'one' ? forms.one : forms.other;
};
