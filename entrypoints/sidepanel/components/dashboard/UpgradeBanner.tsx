import React from 'react';
import { PlusIcon } from './Icons';

type UpgradeBannerProps = {
  trialRemaining: number | null;
  onUpgrade: () => void;
};

export const UpgradeBanner = ({ trialRemaining, onUpgrade }: UpgradeBannerProps) => {
  return (
    <div className="upgrade-banner">
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
      <button onClick={onUpgrade} className="export-btn small primary">
        Upgrade
      </button>
    </div>
  );
};
