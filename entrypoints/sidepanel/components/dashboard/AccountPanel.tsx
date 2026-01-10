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
  onClose: () => void;
  onDisconnectDrive: () => void;
  onManageBilling: () => void;
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
  onClose,
  onDisconnectDrive,
  onManageBilling,
  onUpgrade,
}: AccountPanelProps) => {
  return (
    <div className="panel-overlay" role="dialog" aria-modal="true" onClick={onClose}>
      <div className="panel-card" onClick={(event) => event.stopPropagation()}>
        <div className="panel-header">
          <div>
            <div className="panel-title">Account</div>
            <div className="panel-subtitle">{email ?? 'Signed in'}</div>
          </div>
          <button onClick={onClose} className="export-btn small">
            Close
          </button>
        </div>
        <div className="panel-section">
          <div className="drive-status">
            <span className={`status-pill ${isPlus ? 'success' : 'warning'}`}>
              {isPlus ? 'Plus plan' : 'Free plan'}
            </span>
            <span className={`status-pill ${hasDriveAccess ? 'success' : 'warning'}`}>
              {hasDriveAccess ? 'Drive connected' : 'Drive not connected'}
            </span>
            {isCancelScheduled && <span className="status-pill">Ends {formattedPeriodEnd ?? 'soon'}</span>}
          </div>
          <p className="drive-hint">
            {isPlus
              ? 'Your subscription unlocks advanced export formats and Google Drive delivery.'
              : 'Upgrade to unlock advanced export formats and Google Drive delivery.'}
          </p>
          {hasDriveAccess && (
            <div className="panel-info-card">
              <div className="panel-info-text">
                <div className="panel-info-label">Drive account</div>
                <div className="panel-info-value">{driveAccountEmail ?? 'Connected'}</div>
              </div>
              <button onClick={onDisconnectDrive} className="export-btn small">
                Disconnect
              </button>
            </div>
          )}
        </div>
        {isPlus ? (
          <div className="panel-actions panel-actions-right">
            <button onClick={onManageBilling} disabled={!!loadingAction} className="export-btn small">
              Manage Subscription {loadingAction === 'billing' && <Spinner />}
            </button>
          </div>
        ) : (
          <div className="panel-section">
            <div className="drive-status">
              <span className="status-pill warning">Free trial</span>
              <span className="status-pill">
                {trialRemaining === null
                  ? 'Checking exports...'
                  : trialRemaining === 0
                    ? 'No exports left'
                    : `${trialRemaining} ${trialRemaining === 1 ? 'export' : 'exports'} left`}
              </span>
            </div>
            <div className="panel-actions">
              <button onClick={onUpgrade} disabled={!!loadingAction} className="export-btn small primary">
                Upgrade to Plus <PlusIcon /> {loadingAction === 'upgrade' && <Spinner />}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
