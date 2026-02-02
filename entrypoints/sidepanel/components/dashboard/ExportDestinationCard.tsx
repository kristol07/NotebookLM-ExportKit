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
import type { ExportTarget } from '../../../utils/export-core';
import { useI18n } from '../../i18n/i18n';

type ExportDestinationCardProps = {
  exportTarget: ExportTarget;
  onChange: (value: ExportTarget) => void;
};

export const ExportDestinationCard = ({ exportTarget, onChange }: ExportDestinationCardProps) => {
  const { t } = useI18n();
  return (
    <div className="destination-card">
      <div className="section-label">{t('common.exportDestination')}</div>
      <div className="destination-toggle" role="group" aria-label={t('common.exportDestination')}>
        <button
          type="button"
          className={`toggle-btn ${exportTarget === 'download' ? 'active' : ''}`}
          onClick={() => onChange('download')}
        >
          {t('common.thisDevice')}
        </button>
        <button
          type="button"
          className={`toggle-btn ${exportTarget === 'drive' ? 'active' : ''}`}
          onClick={() => onChange('drive')}
        >
          {t('common.googleDrive')}
        </button>
        <button
          type="button"
          className={`toggle-btn ${exportTarget === 'notion' ? 'active' : ''}`}
          onClick={() => onChange('notion')}
        >
          {t('common.notion')}
        </button>
      </div>
      <p className="destination-hint">
        {exportTarget === 'drive'
          ? t('export.destinationHint.drive')
          : exportTarget === 'notion'
            ? t('export.destinationHint.notion')
            : t('export.destinationHint.download')}
      </p>
    </div>
  );
};

