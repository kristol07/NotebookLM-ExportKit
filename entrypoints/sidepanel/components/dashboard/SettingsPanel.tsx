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
import { LanguageSelect } from './LanguageSelect';

type SettingsPanelProps = {
  onClose: () => void;
};

export const SettingsPanel = ({ onClose }: SettingsPanelProps) => {
  const { t } = useI18n();
  return (
    <div className="panel-overlay" role="dialog" aria-modal="true" onClick={onClose}>
      <div className="panel-card" onClick={(event) => event.stopPropagation()}>
        <div className="panel-header">
          <div className="panel-title">{t('common.settings')}</div>
          <div className="panel-header-meta">
            <button onClick={onClose} className="export-btn small">
              {t('common.close')}
            </button>
          </div>
        </div>
        <div className="panel-section">
          <LanguageSelect />
        </div>
      </div>
    </div>
  );
};
