import React, { useEffect, useRef, useState } from 'react';
import { Spinner } from './Icons';

type DriveSetupCardProps = {
  isSignedIn: boolean;
  hasDriveAccess: boolean;
  driveAccountEmail: string | null;
  loadingAction: string | null;
  hasPremiumAccess: boolean;
  appPassActive: boolean;
  onRequestLogin: () => void;
  onConnectDrive: () => void;
  onUpgrade: () => void;
  onActivateAppPass: () => void;
};

export const DriveSetupCard = ({
  isSignedIn,
  hasDriveAccess,
  driveAccountEmail,
  loadingAction,
  hasPremiumAccess,
  appPassActive,
  onRequestLogin,
  onConnectDrive,
  onUpgrade,
  onActivateAppPass,
}: DriveSetupCardProps) => {
  const [isExpanded, setIsExpanded] = useState(!hasDriveAccess);
  const [showUnlockOptions, setShowUnlockOptions] = useState(false);
  const unlockOptionsRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!hasDriveAccess) {
      setIsExpanded(true);
    }
  }, [hasDriveAccess]);

  useEffect(() => {
    if (hasPremiumAccess) {
      setShowUnlockOptions(false);
    }
  }, [hasPremiumAccess]);

  useEffect(() => {
    if (!showUnlockOptions) {
      return;
    }
    const handleOutsideClick = (event: MouseEvent) => {
      const target = event.target;
      if (!(target instanceof Node)) {
        return;
      }
      if (unlockOptionsRef.current && !unlockOptionsRef.current.contains(target)) {
        setShowUnlockOptions(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [showUnlockOptions]);

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

  const handleUpgradeClick = () => {
    setShowUnlockOptions(false);
    onUpgrade();
  };

  const handleActivateAppPass = () => {
    setShowUnlockOptions(false);
    onActivateAppPass();
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
              <div className="setup-title">3. Unlock Plus features</div>
              {hasPremiumAccess ? (
                <span className="status-pill success">Unlocked</span>
              ) : (
                <div className="setup-actions">
                  <div className="setup-action-popover" ref={unlockOptionsRef}>
                    <button
                      onClick={() => setShowUnlockOptions((prev) => !prev)}
                      className="export-btn small primary"
                      disabled={!!loadingAction}
                      type="button"
                    >
                      Unlock
                    </button>
                    {showUnlockOptions && (
                      <div className="unlock-options-popover">
                        <button
                          onClick={handleUpgradeClick}
                          className="export-btn small primary"
                          disabled={!!loadingAction}
                          type="button"
                        >
                          Upgrade to Plus {loadingAction === 'upgrade' && <Spinner />}
                        </button>
                        <button
                          onClick={handleActivateAppPass}
                          className="export-btn small"
                          disabled={!!loadingAction}
                          type="button"
                        >
                          Activate App Pass {loadingAction === 'app-pass-activate' && <Spinner />}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
            <p className="setup-note">
              {appPassActive
                ? 'Drive delivery is unlocked with App Pass.'
                : 'Drive delivery is available on Plus or with App Pass.'}
            </p>
          </div>
        </>
      )}
    </div>
  );
};
