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

