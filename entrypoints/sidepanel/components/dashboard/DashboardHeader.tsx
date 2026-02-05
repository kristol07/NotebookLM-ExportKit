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
import { useI18n } from '../../i18n/i18n';

type DashboardHeaderProps = {
  isSignedIn: boolean;
  onAccountClick: () => void;
  onSignOut: () => void;
  onSignIn: () => void;
  leftSlot?: React.ReactNode;
};

export const DashboardHeader = ({ isSignedIn, onAccountClick, onSignOut, onSignIn, leftSlot }: DashboardHeaderProps) => {
  const { t } = useI18n();
  return (
    <div className="dashboard-header">
      <div className="dashboard-header-left">
        {leftSlot}
        {/* <div className="brand-line compact">
          <span className="brand-dot" aria-hidden="true"></span>
          NotebookLM ExportKit
        </div> */}
      </div>
      <div className="account-actions">
        {isSignedIn ? (
          <>
            <button onClick={onAccountClick} className="export-btn small">
              {t('common.account')}
            </button>
            <button onClick={onSignOut} title={t('header.signOutTitle')} className="export-btn small">
              {t('common.signOut')}
            </button>
          </>
        ) : (
          <button onClick={onSignIn} className="export-btn small">
            {t('common.signIn')}
          </button>
        )}
      </div>
    </div>
  );
};

