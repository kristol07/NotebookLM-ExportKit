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

type DashboardHeaderProps = {
  isSignedIn: boolean;
  onAccountClick: () => void;
  onSignOut: () => void;
  onSignIn: () => void;
};

export const DashboardHeader = ({ isSignedIn, onAccountClick, onSignOut, onSignIn }: DashboardHeaderProps) => {
  return (
    <div className="dashboard-header">
      {/* <div className="brand-line compact">
        <span className="brand-dot" aria-hidden="true"></span>
        NotebookLM ExportKit
      </div> */}
      <div className="account-actions">
        {isSignedIn ? (
          <>
            <button onClick={onAccountClick} className="export-btn small">
              Account
            </button>
            <button onClick={onSignOut} title="Sign Out" className="export-btn small">
              Sign Out
            </button>
          </>
        ) : (
          <button onClick={onSignIn} className="export-btn small">
            Sign In
          </button>
        )}
      </div>
    </div>
  );
};

