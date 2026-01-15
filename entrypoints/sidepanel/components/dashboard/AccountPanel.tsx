import React from 'react';
import { PlusIcon, Spinner } from './Icons';

type AccountPanelProps = {
  email: string | null;
  isPlus: boolean;
  hasDriveAccess: boolean;
  driveAccountEmail: string | null;
  isCancelScheduled: boolean;
  formattedPeriodEnd: string | null;
  trialRemaining: number | null;
  loadingAction: string | null;
  appPassActive: boolean;
  appPassMessage: string | null;
  onClose: () => void;
  onConnectDrive: () => void;
  onDisconnectDrive: () => void;
  onManageBilling: () => void;
  onManageAppPass: () => void;
  onActivateAppPass: () => void;
  onUpgrade: () => void;
};

export const AccountPanel = ({
  email,
  isPlus,
  hasDriveAccess,
  driveAccountEmail,
  isCancelScheduled,
  formattedPeriodEnd,
  trialRemaining,
  loadingAction,
  appPassActive,
  appPassMessage,
  onClose,
  onConnectDrive,
  onDisconnectDrive,
  onManageBilling,
  onManageAppPass,
  onActivateAppPass,
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
              ? 'Your subscription unlocks advanced export formats and Google Drive delivery.'
              : appPassActive
                ? 'You are on the free plan. App Pass access is managed below.'
                : 'Upgrade to unlock advanced export formats and Google Drive delivery.'}
          </p>
          <div className="panel-summary-actions">
            {isPlus ? (
              <button onClick={onManageBilling} disabled={!!loadingAction} className="export-btn small">
                Manage Subscription {loadingAction === 'billing' && <Spinner />}
              </button>
            ) : (
              <button onClick={onUpgrade} disabled={!!loadingAction} className="export-btn small primary">
                Upgrade to Plus {loadingAction === 'upgrade' && <Spinner />}
              </button>
            )}
          </div>
        </div>
        <div className="panel-info-card app-pass-card">
          <div className="app-pass-header">
            <span className="panel-summary-label">App Pass</span>
            {appPassActive && <span className="status-pill success">Active</span>}
          </div>
          <p className="app-pass-note">Use your App Pass bundle to unlock Plus features.</p>
          <button
            onClick={appPassActive ? onManageAppPass : onActivateAppPass}
            disabled={!!loadingAction}
            className="export-btn small primary"
          >
            {appPassActive ? 'Manage App Pass' : 'Activate App Pass'}{' '}
            {loadingAction === 'app-pass-manage' && <Spinner />}
            {loadingAction === 'app-pass-activate' && <Spinner />}
          </button>
          {appPassMessage && !appPassActive && <span className="panel-info-label">{appPassMessage}</span>}
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
                    Change {loadingAction === 'drive-connect' && <Spinner />}
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
          </div>
        </div>
      </div>
    </div>
  );
};
