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
import React, { useEffect, useState } from 'react';
import { Spinner } from './Icons';
import { useI18n } from '../../i18n/i18n';

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
  const { t } = useI18n();
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
        <div className="section-label">{t('drive.setup')}</div>
        <div className="setup-header-actions">
          <span className={`status-pill ${hasDriveAccess ? 'success' : 'warning'}`}>
            {hasDriveAccess ? t('common.ready') : t('common.needsSetup')}
          </span>
          {hasDriveAccess && <span className={`setup-toggle${isExpanded ? ' is-expanded' : ''}`} />}
        </div>
      </div>
      {isExpanded && (
        <>
          <div className="setup-step">
            <div className="setup-step-main">
              <div className="setup-title">{t('drive.step.signIn')}</div>
              {!isSignedIn ? (
                <button onClick={onRequestLogin} className="export-btn small">
                  {t('common.signIn')}
                </button>
              ) : (
                <span className="status-pill success">{t('common.done')}</span>
              )}
            </div>
            <p className="setup-note">{t('drive.note.subscription')}</p>
          </div>
          <div className="setup-step">
            <div className="setup-step-main">
              <div className="setup-title">{t('drive.step.upgrade')}</div>
              {isPlus ? (
                <span className="status-pill success">{t('common.unlocked')}</span>
              ) : (
                <button onClick={onUpgrade} className="export-btn small">
                  {t('common.upgrade')}
                </button>
              )}
            </div>
            <p className="setup-note">{t('drive.note.plus')}</p>
          </div>
          <div className="setup-step">
            <div className="setup-step-main">
              <div className="setup-title">{t('drive.step.connect')}</div>
              <button
                onClick={onConnectDrive}
                disabled={!!loadingAction || !isSignedIn}
                className={`export-btn small ${hasDriveAccess ? '' : 'primary'}`}
              >
                {hasDriveAccess ? t('common.changeAccount') : t('common.connect')}{' '}
                {loadingAction === 'drive-connect' && <Spinner />}
              </button>
            </div>
            <p className="setup-note">
              {driveAccountEmail
                ? t('drive.note.connectedAs', { email: driveAccountEmail })
                : t('drive.note.chooseAccount')}
            </p>
          </div>
        </>
      )}
    </div>
  );
};

