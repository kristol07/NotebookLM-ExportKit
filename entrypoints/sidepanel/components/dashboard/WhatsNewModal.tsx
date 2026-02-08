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
import type { MessageKey } from '../../i18n/messages';

type WhatsNewModalProps = {
  onClose: () => void;
  featureKeys: MessageKey[];
};

export const WhatsNewModal = ({ onClose, featureKeys }: WhatsNewModalProps) => {
  const { t } = useI18n();

  return (
    <div className="panel-overlay modal-overlay whats-new-overlay" role="dialog" aria-modal="true" onClick={onClose}>
      <div className="modal-card whats-new-card" onClick={(event) => event.stopPropagation()}>
        <div className="modal-header">
          <div>
            <div className="modal-title">{t('whatsNew.title')}</div>
            <div className="modal-subtitle">{t('whatsNew.subtitle')}</div>
          </div>
          <button onClick={onClose} className="export-btn small">
            {t('common.close')}
          </button>
        </div>
        <div className="modal-body">
          <div className="whats-new-feature-list">
            {featureKeys.map((featureKey) => (
              <div className="whats-new-feature-item" key={featureKey}>
                <span className="status-pill success">{t('whatsNew.badge')}</span>
                <span>{t(featureKey)}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="modal-actions">
          <button onClick={onClose} className="export-btn primary">
            {t('whatsNew.action.gotIt')}
          </button>
        </div>
      </div>
    </div>
  );
};
