import React from 'react';
type UpgradeBannerProps = {
  trialRemaining: number | null;
  onUpgrade: () => void;
  appPassActive: boolean;
  onActivateAppPass: () => void;
  onManageAppPass: () => void;
  appPassLoading: boolean;
};

export const UpgradeBanner = ({
  trialRemaining,
  onUpgrade,
  appPassActive,
  onActivateAppPass,
  onManageAppPass,
  appPassLoading,
}: UpgradeBannerProps) => {
  return (
    <div className="upgrade-banner">
      <div className="upgrade-banner-block plus-block">
        <div>
          <div className="section-label">Plus plan</div>
          <p className="upgrade-note">Unlock advanced formats and Google Drive delivery.</p>
          {trialRemaining !== null && (
            <div className="drive-status">
              <span className="status-pill warning">Free trial</span>
              <span className="status-pill">
                {trialRemaining === 0
                  ? 'No exports left'
                  : `${trialRemaining} ${trialRemaining === 1 ? 'export' : 'exports'} left`}
              </span>
            </div>
          )}
        </div>
        <div className="upgrade-actions">
          <button onClick={onUpgrade} className="export-btn small primary">
            Upgrade
          </button>
        </div>
      </div>
      <div className="upgrade-banner-block app-pass-block">
        <div>
          <div className="app-pass-header">
            <span className="section-label">App Pass</span>
            {appPassActive && <span className="status-pill success">Active</span>}
          </div>
          <p className="app-pass-note">Use your App Pass bundle to unlock Plus features.</p>
        </div>
        <div className="upgrade-actions">
          {appPassActive ? (
            <button onClick={onManageAppPass} className="export-btn small primary" disabled={appPassLoading}>
              Manage App Pass
            </button>
          ) : (
            <button onClick={onActivateAppPass} className="export-btn small primary" disabled={appPassLoading}>
              Activate
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
