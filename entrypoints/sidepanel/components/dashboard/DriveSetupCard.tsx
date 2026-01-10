import React from 'react';
import { Spinner } from './Icons';

type DriveSetupCardProps = {
  isSignedIn: boolean;
  hasDriveAccess: boolean;
  driveAccountEmail: string | null;
  loadingAction: string | null;
  isPlus: boolean;
  onRequestLogin: () => void;
  onConnectDrive: () => void;
  onUpgrade: () => void;
};

export const DriveSetupCard = ({
  isSignedIn,
  hasDriveAccess,
  driveAccountEmail,
  loadingAction,
  isPlus,
  onRequestLogin,
  onConnectDrive,
  onUpgrade,
}: DriveSetupCardProps) => {
  return (
    <div className="setup-card">
      <div className="setup-header">
        <div className="section-label">Drive setup</div>
        <span className={`status-pill ${hasDriveAccess ? 'success' : 'warning'}`}>
          {hasDriveAccess ? 'Ready' : 'Needs setup'}
        </span>
      </div>
      <div className="setup-step">
        <div>
          <div className="setup-title">1. Sign in to your account</div>
          <p className="setup-note">Your subscription stays with this account.</p>
        </div>
        {!isSignedIn ? (
          <button onClick={onRequestLogin} className="export-btn small">
            Sign in
          </button>
        ) : (
          <span className="status-pill success">Done</span>
        )}
      </div>
      <div className="setup-step">
        <div>
          <div className="setup-title">2. Connect Google Drive</div>
          <p className="setup-note">
            {driveAccountEmail
              ? `Connected as ${driveAccountEmail}`
              : 'Choose any Google account for Drive delivery.'}
          </p>
        </div>
        <div className="setup-actions">
          <button
            onClick={onConnectDrive}
            disabled={!!loadingAction || !isSignedIn}
            className={`export-btn small ${hasDriveAccess ? '' : 'primary'}`}
          >
            {hasDriveAccess ? 'Change' : 'Connect'} {loadingAction === 'drive-connect' && <Spinner />}
          </button>
        </div>
      </div>
      <div className="setup-step">
        <div>
          <div className="setup-title">3. Upgrade to Plus</div>
          <p className="setup-note">Drive delivery is available on Plus.</p>
        </div>
        {isPlus ? (
          <span className="status-pill success">Unlocked</span>
        ) : (
          <button onClick={onUpgrade} className="export-btn small">
            Upgrade
          </button>
        )}
      </div>
    </div>
  );
};
