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

type ExportDestinationCardProps = {
  exportTarget: ExportTarget;
  onChange: (value: ExportTarget) => void;
};

export const ExportDestinationCard = ({ exportTarget, onChange }: ExportDestinationCardProps) => {
  return (
    <div className="destination-card">
      <div className="section-label">Export destination</div>
      <div className="destination-toggle" role="group" aria-label="Export destination">
        <button
          type="button"
          className={`toggle-btn ${exportTarget === 'download' ? 'active' : ''}`}
          onClick={() => onChange('download')}
        >
          This device
        </button>
        <button
          type="button"
          className={`toggle-btn ${exportTarget === 'drive' ? 'active' : ''}`}
          onClick={() => onChange('drive')}
        >
          Google Drive
        </button>
        <button
          type="button"
          className={`toggle-btn ${exportTarget === 'notion' ? 'active' : ''}`}
          onClick={() => onChange('notion')}
        >
          Notion
        </button>
      </div>
      <p className="destination-hint">
        {exportTarget === 'drive'
          ? 'Drive exports require a Google Drive connection and a Plus subscription.'
          : exportTarget === 'notion'
            ? 'Notion exports require a Notion connection and a Plus subscription.'
            : 'Local exports are instant. Advanced formats unlock with Plus.'}
      </p>
    </div>
  );
};

