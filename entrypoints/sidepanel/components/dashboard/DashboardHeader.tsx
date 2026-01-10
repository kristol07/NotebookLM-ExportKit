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
