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
        <p className="upgrade-note">Unlock advanced formats plus Drive and Notion delivery.</p>
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

