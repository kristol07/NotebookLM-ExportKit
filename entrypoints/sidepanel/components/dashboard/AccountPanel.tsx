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
import { PlusIcon, Spinner } from './Icons';
import { useI18n } from '../../i18n/i18n';
import { LanguageSelect } from './LanguageSelect';

type AccountPanelProps = {
  email: string | null;
  isPlus: boolean;
  hasDriveAccess: boolean;
  driveAccountEmail: string | null;
  hasNotionAccess: boolean;
  notionWorkspaceName: string | null;
  notionDatabaseId: string | null;
  isCancelScheduled: boolean;
  formattedPeriodEnd: string | null;
  trialRemaining: number | null;
  loadingAction: string | null;
  onClose: () => void;
  onConnectDrive: () => void;
  onDisconnectDrive: () => void;
  onConnectNotion: () => void;
  onDisconnectNotion: () => void;
  onManageBilling: () => void;
  onUpgrade: () => void;
};

export const AccountPanel = ({
  email,
  isPlus,
  hasDriveAccess,
  driveAccountEmail,
  hasNotionAccess,
  notionWorkspaceName,
  notionDatabaseId,
  isCancelScheduled,
  formattedPeriodEnd,
  trialRemaining,
  loadingAction,
  onClose,
  onConnectDrive,
  onDisconnectDrive,
  onConnectNotion,
  onDisconnectNotion,
  onManageBilling,
  onUpgrade,
}: AccountPanelProps) => {
  const { t } = useI18n();
  return (
    <div className="panel-overlay" role="dialog" aria-modal="true" onClick={onClose}>
      <div className="panel-card" onClick={(event) => event.stopPropagation()}>
        <div className="panel-header">
          <div className="panel-title">{t('account.title')}</div>
          <div className="panel-header-meta">
            <div className="panel-subtitle">{email ?? t('common.signedIn')}</div>
            <button onClick={onClose} className="export-btn small">
              {t('common.close')}
            </button>
          </div>
        </div>
        <div className="panel-summary-card">
          <div className="panel-summary-row">
            <span className={`status-pill ${isPlus ? 'success' : 'warning'}`}>
              {isPlus ? t('account.plan.plus') : t('account.plan.free')}
            </span>
            {isCancelScheduled && (
              <span className="status-pill">
                {formattedPeriodEnd
                  ? t('account.endsOn', { date: formattedPeriodEnd })
                  : t('account.endsSoon')}
              </span>
            )}
            {!isPlus && (
              <>
                <span className="status-pill warning">{t('trial.free')}</span>
                <span className="status-pill">
                  {trialRemaining === null
                    ? t('trial.statusChecking')
                    : t('trial.exportsLeft', { count: trialRemaining })}
                </span>
              </>
            )}
          </div>
          <p className="panel-summary-note">
            {isPlus
              ? t('account.summary.plus')
              : t('account.summary.free')}
          </p>
          <div className="panel-summary-actions">
            {isPlus ? (
              <button onClick={onManageBilling} disabled={!!loadingAction} className="export-btn small">
                {t('account.manageSubscription')} {loadingAction === 'billing' && <Spinner />}
              </button>
            ) : (
              <button onClick={onUpgrade} disabled={!!loadingAction} className="export-btn small primary">
                {t('account.upgradeToPlus')} <PlusIcon /> {loadingAction === 'upgrade' && <Spinner />}
              </button>
            )}
          </div>
        </div>
        <div className="panel-destinations">
          <div className="panel-actions-title">{t('account.destinations')}</div>
          <div className="panel-destination-list">
            {hasDriveAccess ? (
              <div className="panel-destination-row connected">
              <div className="panel-destination-info connected">
                <div className="panel-destination-title">{t('common.googleDrive')}</div>
                <div className="panel-destination-email">{driveAccountEmail ?? t('account.connected')}</div>
              </div>
                <div className="panel-destination-buttons">
                  <button
                    onClick={onConnectDrive}
                    disabled={loadingAction === 'drive-connect'}
                    className="export-btn small"
                  >
                    {t('common.changeAccount')} {loadingAction === 'drive-connect' && <Spinner />}
                  </button>
                  <button onClick={onDisconnectDrive} className="export-btn small">
                    {t('common.disconnect')}
                  </button>
                </div>
              </div>
            ) : (
              <div className="panel-destination-row not-connected">
                <div className="panel-destination-title">{t('common.googleDrive')}</div>
                <span className="status-pill warning">{t('account.notConnected')}</span>
                <button
                  onClick={onConnectDrive}
                  disabled={loadingAction === 'drive-connect'}
                  className="export-btn small"
                >
                  {t('common.connect')} {loadingAction === 'drive-connect' && <Spinner />}
                </button>
              </div>
            )}
            {hasNotionAccess ? (
              <div className="panel-destination-row connected">
                <div className="panel-destination-info connected">
                  <div className="panel-destination-title">{t('common.notion')}</div>
                  <div className="panel-destination-email">{notionWorkspaceName ?? t('account.connected')}</div>
                </div>
                <div className="panel-destination-buttons">
                  <button
                    onClick={onConnectNotion}
                    disabled={loadingAction === 'notion-connect'}
                    className="export-btn small"
                  >
                    {t('common.changeWorkspace')} {loadingAction === 'notion-connect' && <Spinner />}
                  </button>
                  <button onClick={onDisconnectNotion} className="export-btn small">
                    {t('common.disconnect')}
                  </button>
                </div>
              </div>
            ) : (
              <div className="panel-destination-row not-connected">
                <div className="panel-destination-title">{t('common.notion')}</div>
                <span className="status-pill warning">{t('account.notConnected')}</span>
                <button
                  onClick={onConnectNotion}
                  disabled={loadingAction === 'notion-connect'}
                  className="export-btn small"
                >
                  {t('common.connect')} {loadingAction === 'notion-connect' && <Spinner />}
                </button>
              </div>
            )}
          </div>
        </div>
        <div className="panel-section">
          <div className="panel-actions-title">{t('common.settings')}</div>
          <LanguageSelect />
        </div>
      </div>
    </div>
  );
};

