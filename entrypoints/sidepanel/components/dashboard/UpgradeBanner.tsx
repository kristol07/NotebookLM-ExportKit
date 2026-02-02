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

type UpgradeBannerProps = {
  trialRemaining: number | null;
  onUpgrade: () => void;
};

export const UpgradeBanner = ({ trialRemaining, onUpgrade }: UpgradeBannerProps) => {
  const { t } = useI18n();
  return (
    <div className="upgrade-banner">
      <div>
        <div className="section-label">{t('upgrade.banner.title')}</div>
        <p className="upgrade-note">{t('upgrade.banner.note')}</p>
        {trialRemaining !== null && (
          <div className="drive-status">
            <span className="status-pill warning">{t('trial.free')}</span>
            <span className="status-pill">
              {t('trial.exportsLeft', { count: trialRemaining })}
            </span>
          </div>
        )}
      </div>
      <button onClick={onUpgrade} className="export-btn small primary">
        {t('common.upgrade')}
      </button>
    </div>
  );
};

