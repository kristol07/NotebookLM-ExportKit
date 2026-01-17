import React from 'react';
import { Spinner } from './Icons';

type UpgradeModalProps = {
  upgradeContext: 'drive' | 'notion' | 'format' | 'general' | null;
  trialRemaining: number | null;
  loadingAction: string | null;
  isPlus: boolean;
  onClose: () => void;
  onUpgrade: () => void;
  onManageBilling: () => void;
};

export const UpgradeModal = ({
  upgradeContext,
  trialRemaining,
  loadingAction,
  isPlus,
  onClose,
  onUpgrade,
  onManageBilling,
}: UpgradeModalProps) => {
  return (
    <div className="panel-overlay modal-overlay" role="dialog" aria-modal="true" onClick={onClose}>
      <div className="modal-card" onClick={(event) => event.stopPropagation()}>
        <div className="modal-header">
          <div>
            <div className="modal-title">Upgrade to Plus</div>
            <div className="modal-subtitle">
              {upgradeContext === 'drive'
                ? 'Enable Google Drive delivery and advanced formats.'
                : upgradeContext === 'notion'
                  ? 'Enable Notion delivery and advanced formats.'
                : upgradeContext === 'format'
                  ? 'Unlock advanced export formats instantly.'
                  : 'Unlock advanced formats plus Drive and Notion delivery.'}
            </div>
          </div>
          <button onClick={onClose} className="export-btn small">
            Close
          </button>
        </div>
        <div className="modal-body">
          <div className="modal-benefits">
            <div className="modal-benefit">
              <span className="status-pill success">Plus</span>
              Advanced export formats for study workflows.
            </div>
            <div className="modal-benefit">
              <span className="status-pill success">Drive</span>
              Deliver exports directly to Google Drive.
            </div>
            <div className="modal-benefit">
              <span className="status-pill success">Notion</span>
              Send exports into Notion pages.
            </div>
          </div>
          {trialRemaining !== null && (
            <div className="modal-trial">
              {trialRemaining === 0
                ? 'Your free trial exports are used up.'
                : `Free trial: ${trialRemaining} ${trialRemaining === 1 ? 'export' : 'exports'} left.`}
            </div>
          )}
        </div>
        <div className="modal-actions">
          <button onClick={onUpgrade} disabled={!!loadingAction} className="export-btn primary">
            Continue to checkout {loadingAction === 'upgrade' && <Spinner />}
          </button>
          {isPlus ? (
            <button onClick={onManageBilling} disabled={!!loadingAction} className="link-button">
              Manage subscription {loadingAction === 'billing' && <Spinner />}
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
};
