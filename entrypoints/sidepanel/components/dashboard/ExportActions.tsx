import React, { useEffect, useRef, useState } from 'react';
import type { ContentType, ExportFormat, PdfQualityPreference } from '../../../utils/export-core';
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
  onExport: (
    format: ExportFormat,
    contentType?: ContentType,
    options?: { pdfQualityOverride?: PdfQualityPreference }
  ) => void;
  pdfQuality: PdfQualityPreference;
  onPdfQualityChange: (value: PdfQualityPreference) => void;
};

export const ExportActions = ({
  sections,
  loadingAction,
  onExport,
  pdfQuality,
  onPdfQualityChange
}: ExportActionsProps) => {
  const [activePdfQualityKey, setActivePdfQualityKey] = useState<string | null>(null);
  const pdfQualityRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!activePdfQualityKey) {
      return;
    }
    const handleOutsideClick = (event: MouseEvent) => {
      const target = event.target;
      if (!(target instanceof Node)) {
        return;
      }
      if (pdfQualityRef.current && !pdfQualityRef.current.contains(target)) {
        setActivePdfQualityKey(null);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [activePdfQualityKey]);
  const handlePdfChoice = (value: PdfQualityPreference, contentType: ContentType) => {
    onPdfQualityChange(value);
    onExport('PDF', contentType, { pdfQualityOverride: value });
    setActivePdfQualityKey(null);
  };
  const handleExportClick = (format: ExportFormat, contentType: ContentType) => {
    setActivePdfQualityKey(null);
    onExport(format, contentType);
  };
  return (
    <div className="actions">
      {sections.map((section) => (
        <div key={section.contentType} className="export-section">
          <div className="section-label">{section.title}</div>
          <div className="section-grid">
            {section.options.map((option) => (
              (section.contentType === 'note' || section.contentType === 'chat') && option.format === 'PDF' ? (
                <div
                  key={`${section.contentType}-${option.format}`}
                  className="export-option"
                  ref={
                    activePdfQualityKey === `${section.contentType}-${option.format}`
                      ? pdfQualityRef
                      : null
                  }
                >
                  <button
                    type="button"
                    onClick={() => {
                      const key = `${section.contentType}-${option.format}`;
                      if (activePdfQualityKey === key) {
                        handleExportClick(option.format, section.contentType);
                      } else {
                        setActivePdfQualityKey(key);
                      }
                    }}
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
                  {activePdfQualityKey === `${section.contentType}-${option.format}` && (
                    <div className="pdf-quality-popover">
                      <div className="pdf-quality-title">PDF quality</div>
                      <div className="pdf-quality-actions">
                        <button
                          type="button"
                          className={`pdf-quality-btn ${pdfQuality === 'size' ? 'active' : ''}`}
                          onClick={() => handlePdfChoice('size', section.contentType)}
                        >
                          Size first
                        </button>
                        <button
                          type="button"
                          className={`pdf-quality-btn ${pdfQuality === 'clarity' ? 'active' : ''}`}
                          onClick={() => handlePdfChoice('clarity', section.contentType)}
                        >
                          Clarity first
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <button
                  key={`${section.contentType}-${option.format}`}
                  onClick={() => handleExportClick(option.format, section.contentType)}
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
              )
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
