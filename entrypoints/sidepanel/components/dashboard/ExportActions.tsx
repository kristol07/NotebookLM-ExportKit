import React from 'react';
import type { ContentType, ExportFormat } from '../../../utils/export-core';
import { PlusIcon, Spinner } from './Icons';

type ExportOption = {
  format: ExportFormat;
  label?: string;
  isPlus?: boolean;
  apps?: string[];
};

export type ExportSection = {
  title: string;
  contentType: ContentType;
  options: ExportOption[];
};

type ExportActionsProps = {
  sections: ExportSection[];
  loadingAction: string | null;
  onExport: (format: ExportFormat, contentType?: ContentType) => void;
};

export const ExportActions = ({ sections, loadingAction, onExport }: ExportActionsProps) => {
  return (
    <div className="actions">
      {sections.map((section) => (
        <div key={section.contentType} className="export-section">
          <div className="section-label">{section.title}</div>
          <div className="section-grid">
            {section.options.map((option) => (
              <button
                key={`${section.contentType}-${option.format}`}
                onClick={() => onExport(option.format, section.contentType)}
                disabled={!!loadingAction}
                className={`export-btn${option.apps?.length ? ' has-tooltip' : ''}`}
                aria-label={
                  option.apps?.length
                    ? `${option.label ?? option.format}. Supported by ${option.apps.join(', ')}`
                    : undefined
                }
              >
                <span className="button-content">
                  {option.label ?? option.format}
                  {option.apps?.length ? (
                    <span className="tooltip-content">Supported by {option.apps.join(', ')}</span>
                  ) : null}
                  {option.isPlus && <PlusIcon />}
                  {loadingAction === `${section.contentType}:${option.format}` && <Spinner />}
                </span>
              </button>
            ))}
          </div>
        </div>
      ))}

      <div className="coming-soon">
        <div className="section-label muted">Coming soon</div>
        <div className="coming-card">Video & Audio Overviews to Transcript/Slides</div>
      </div>
    </div>
  );
};
