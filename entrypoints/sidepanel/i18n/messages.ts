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

import {
  DEFAULT_LOCALE,
  LOCALE_LABELS,
  type Locale,
  type MessageParams,
  type MessageValue
} from './messages/types';
import { EN_MESSAGES } from './messages/en-US';
import { ES_MESSAGES } from './messages/es-ES';
import { DE_MESSAGES } from './messages/de-DE';
import { IT_MESSAGES } from './messages/it-IT';
import { PT_MESSAGES } from './messages/pt-BR';
import { FR_MESSAGES } from './messages/fr-FR';
import { JA_MESSAGES } from './messages/ja-JP';

export { DEFAULT_LOCALE, LOCALE_LABELS, type Locale, type MessageParams, type MessageValue };

export const MESSAGES: Record<Locale, Record<string, MessageValue>> = {
  'en-US': EN_MESSAGES,
  'es-ES': ES_MESSAGES,
  'de-DE': DE_MESSAGES,
  'it-IT': IT_MESSAGES,
  'pt-BR': PT_MESSAGES,
  'fr-FR': FR_MESSAGES,
  'ja-JP': JA_MESSAGES,
};

export const isLocale = (value?: string | null): value is Locale =>
  value === 'en-US' ||
  value === 'es-ES' ||
  value === 'de-DE' ||
  value === 'it-IT' ||
  value === 'pt-BR' ||
  value === 'fr-FR' ||
  value === 'ja-JP';

export type MessageKey = keyof typeof EN_MESSAGES;

export type MessageDescriptor = {
  key: MessageKey;
  params?: MessageParams;
};

export const formatMessageValue = (message: MessageValue, params: MessageParams) => {
  if (typeof message === 'function') {
    return message(params);
  }
  if (!params) {
    return message;
  }
  return message.replace(/\{\{(\w+)\}\}/g, (_, key: string) => {
    const value = params[key];
    return value === undefined ? '' : String(value);
  });
};

export const formatMessage = (locale: Locale, key: MessageKey, params?: MessageParams) => {
  const message = MESSAGES[locale]?.[key] ?? MESSAGES[DEFAULT_LOCALE][key];
  if (!message) {
    return key;
  }
  return formatMessageValue(message, { locale, ...params });
};
