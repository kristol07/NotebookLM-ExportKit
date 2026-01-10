import React, { useEffect, useState } from 'react';
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
  const [isExpanded, setIsExpanded] = useState(!hasDriveAccess);

  useEffect(() => {
    if (!hasDriveAccess) {
      setIsExpanded(true);
    }
  }, [hasDriveAccess]);

  const handleToggle = () => {
    if (hasDriveAccess) {
      setIsExpanded((prev) => !prev);
    }
  };

  const handleHeaderKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (!hasDriveAccess) {
      return;
    }

    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      setIsExpanded((prev) => !prev);
    }
  };

  return (
    <div className="setup-card">
      <div
        className={`setup-header${hasDriveAccess ? ' is-toggleable' : ''}`}
        onClick={handleToggle}
        onKeyDown={handleHeaderKeyDown}
        role={hasDriveAccess ? 'button' : undefined}
        tabIndex={hasDriveAccess ? 0 : -1}
        aria-expanded={hasDriveAccess ? isExpanded : undefined}
      >
        <div className="section-label">Drive setup</div>
        <div className="setup-header-actions">
          <span className={`status-pill ${hasDriveAccess ? 'success' : 'warning'}`}>
            {hasDriveAccess ? 'Ready' : 'Needs setup'}
          </span>
          {hasDriveAccess && <span className={`setup-toggle${isExpanded ? ' is-expanded' : ''}`} />}
        </div>
      </div>
      {isExpanded && (
        <>
          <div className="setup-step">
            <div className="setup-step-main">
              <div className="setup-title">1. Sign in to your account</div>
              {!isSignedIn ? (
                <button onClick={onRequestLogin} className="export-btn small">
                  Sign in
                </button>
              ) : (
                <span className="status-pill success">Done</span>
              )}
            </div>
            <p className="setup-note">Your subscription stays with this account.</p>
          </div>
          <div className="setup-step">
            <div className="setup-step-main">
              <div className="setup-title">2. Connect Google Drive</div>
              <div className="setup-actions">
                <button
                  onClick={onConnectDrive}
                  disabled={!!loadingAction || !isSignedIn}
                  className={`export-btn small ${hasDriveAccess ? '' : 'primary'}`}
                >
                  {hasDriveAccess ? 'Change' : 'Connect'}{' '}
                  {loadingAction === 'drive-connect' && <Spinner />}
                </button>
              </div>
            </div>
            <p className="setup-note">
              {driveAccountEmail
                ? `Connected as ${driveAccountEmail}`
                : 'Choose any Google account for Drive delivery.'}
            </p>
          </div>
          <div className="setup-step">
            <div className="setup-step-main">
              <div className="setup-title">3. Upgrade to Plus</div>
              {isPlus ? (
                <span className="status-pill success">Unlocked</span>
              ) : (
                <button onClick={onUpgrade} className="export-btn small">
                  Upgrade
                </button>
              )}
            </div>
            <p className="setup-note">Drive delivery is available on Plus.</p>
          </div>
        </>
      )}
    </div>
  );
};
