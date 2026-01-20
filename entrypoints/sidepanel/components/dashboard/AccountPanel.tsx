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
  return (
    <div className="panel-overlay" role="dialog" aria-modal="true" onClick={onClose}>
      <div className="panel-card" onClick={(event) => event.stopPropagation()}>
        <div className="panel-header">
          <div className="panel-title">Account</div>
          <div className="panel-header-meta">
            <div className="panel-subtitle">{email ?? 'Signed in'}</div>
            <button onClick={onClose} className="export-btn small">
              Close
            </button>
          </div>
        </div>
        <div className="panel-summary-card">
          <div className="panel-summary-row">
            <span className={`status-pill ${isPlus ? 'success' : 'warning'}`}>
              {isPlus ? 'Plus plan' : 'Free plan'}
            </span>
            {isCancelScheduled && <span className="status-pill">Ends {formattedPeriodEnd ?? 'soon'}</span>}
            {!isPlus && (
              <>
                <span className="status-pill warning">Free trial</span>
                <span className="status-pill">
                  {trialRemaining === null
                    ? 'Checking exports...'
                    : trialRemaining === 0
                      ? 'No exports left'
                      : `${trialRemaining} ${trialRemaining === 1 ? 'export' : 'exports'} left`}
                </span>
              </>
            )}
          </div>
          <p className="panel-summary-note">
            {isPlus
              ? 'Your subscription unlocks advanced export formats plus Drive and Notion delivery.'
              : 'Upgrade to unlock advanced export formats plus Drive and Notion delivery.'}
          </p>
          <div className="panel-summary-actions">
            {isPlus ? (
              <button onClick={onManageBilling} disabled={!!loadingAction} className="export-btn small">
                Manage Subscription {loadingAction === 'billing' && <Spinner />}
              </button>
            ) : (
              <button onClick={onUpgrade} disabled={!!loadingAction} className="export-btn small primary">
                Upgrade to Plus <PlusIcon /> {loadingAction === 'upgrade' && <Spinner />}
              </button>
            )}
          </div>
        </div>
        <div className="panel-destinations">
          <div className="panel-actions-title">Destinations</div>
          <div className="panel-destination-list">
            {hasDriveAccess ? (
              <div className="panel-destination-row connected">
              <div className="panel-destination-info connected">
                <div className="panel-destination-title">Google Drive</div>
                <div className="panel-destination-email">{driveAccountEmail ?? 'Connected'}</div>
              </div>
                <div className="panel-destination-buttons">
                  <button
                    onClick={onConnectDrive}
                    disabled={loadingAction === 'drive-connect'}
                    className="export-btn small"
                  >
                    Change account {loadingAction === 'drive-connect' && <Spinner />}
                  </button>
                  <button onClick={onDisconnectDrive} className="export-btn small">
                    Disconnect
                  </button>
                </div>
              </div>
            ) : (
              <div className="panel-destination-row not-connected">
                <div className="panel-destination-title">Google Drive</div>
                <span className="status-pill warning">Not connected</span>
                <button
                  onClick={onConnectDrive}
                  disabled={loadingAction === 'drive-connect'}
                  className="export-btn small"
                >
                  Connect {loadingAction === 'drive-connect' && <Spinner />}
                </button>
              </div>
            )}
            {hasNotionAccess ? (
              <div className="panel-destination-row connected">
                <div className="panel-destination-info connected">
                  <div className="panel-destination-title">Notion</div>
                  <div className="panel-destination-email">{notionWorkspaceName ?? 'Connected'}</div>
                </div>
                <div className="panel-destination-buttons">
                  <button
                    onClick={onConnectNotion}
                    disabled={loadingAction === 'notion-connect'}
                    className="export-btn small"
                  >
                    Change workspace {loadingAction === 'notion-connect' && <Spinner />}
                  </button>
                  <button onClick={onDisconnectNotion} className="export-btn small">
                    Disconnect
                  </button>
                </div>
              </div>
            ) : (
              <div className="panel-destination-row not-connected">
                <div className="panel-destination-title">Notion</div>
                <span className="status-pill warning">Not connected</span>
                <button
                  onClick={onConnectNotion}
                  disabled={loadingAction === 'notion-connect'}
                  className="export-btn small"
                >
                  Connect {loadingAction === 'notion-connect' && <Spinner />}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

