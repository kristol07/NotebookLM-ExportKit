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
