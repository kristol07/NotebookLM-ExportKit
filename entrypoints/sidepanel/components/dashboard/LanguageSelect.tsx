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
import React from 'react';
import { useI18n } from '../../i18n/i18n';

export const LanguageSelect = () => {
  const { t, locale, setLocale, availableLocales } = useI18n();
  return (
    <div className="panel-info-card">
      <div className="panel-info-text">
        <div className="panel-info-label">{t('common.uiLanguage')}</div>
      </div>
      <select
        value={locale}
        onChange={(event) => setLocale(event.target.value as typeof locale)}
        className="setup-input panel-language-select"
      >
        {availableLocales.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
};
