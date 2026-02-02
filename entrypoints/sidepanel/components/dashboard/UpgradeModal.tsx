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
import { Spinner } from './Icons';
import { useI18n } from '../../i18n/i18n';
import type { MessageKey } from '../../i18n/messages';

type UpgradeModalProps = {
  upgradeContext: 'drive' | 'notion' | 'format' | 'general' | null;
  trialRemaining: number | null;
  loadingAction: string | null;
  isPlus: boolean;
  onClose: () => void;
  onUpgrade: () => void;
  onManageBilling: () => void;
};

export const UpgradeModal = ({
  upgradeContext,
  trialRemaining,
  loadingAction,
  isPlus,
  onClose,
  onUpgrade,
  onManageBilling,
}: UpgradeModalProps) => {
  const { t } = useI18n();
  const subtitleKey: MessageKey = upgradeContext === 'drive'
    ? 'upgrade.modal.subtitle.drive'
    : upgradeContext === 'notion'
      ? 'upgrade.modal.subtitle.notion'
      : upgradeContext === 'format'
        ? 'upgrade.modal.subtitle.format'
        : 'upgrade.modal.subtitle.general';
  return (
    <div className="panel-overlay modal-overlay" role="dialog" aria-modal="true" onClick={onClose}>
      <div className="modal-card" onClick={(event) => event.stopPropagation()}>
        <div className="modal-header">
          <div>
            <div className="modal-title">{t('upgrade.modal.title')}</div>
            <div className="modal-subtitle">
              {t(subtitleKey)}
            </div>
          </div>
          <button onClick={onClose} className="export-btn small">
            {t('common.close')}
          </button>
        </div>
        <div className="modal-body">
          <div className="modal-benefits">
            <div className="modal-benefit">
              <span className="status-pill success">Plus</span>
              {t('upgrade.modal.benefit.formats')}
            </div>
            <div className="modal-benefit">
              <span className="status-pill success">Drive</span>
              {t('upgrade.modal.benefit.drive')}
            </div>
            <div className="modal-benefit">
              <span className="status-pill success">Notion</span>
              {t('upgrade.modal.benefit.notion')}
            </div>
          </div>
          <div className="modal-trial">
            {t('upgrade.modal.trialNote')}
          </div>
          {trialRemaining !== null && (
            <div className="modal-trial">
              {trialRemaining === 0
                ? t('trial.usedUp')
                : t('trial.freeLeft', { count: trialRemaining })}
            </div>
          )}
        </div>
        <div className="modal-actions">
          <button onClick={onUpgrade} disabled={!!loadingAction} className="export-btn primary">
            {t('upgrade.modal.checkout')} {loadingAction === 'upgrade' && <Spinner />}
          </button>
          {isPlus ? (
            <button onClick={onManageBilling} disabled={!!loadingAction} className="link-button">
              {t('upgrade.modal.manage')} {loadingAction === 'billing' && <Spinner />}
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
};

