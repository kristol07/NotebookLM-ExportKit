import React, { useEffect, useRef, useState } from 'react';
import type { ContentType, ExportFormat, ExportTarget, PdfQualityPreference } from '../../../utils/export-core';
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
  exportTarget: ExportTarget;
  loadingAction: string | null;
  onExport: (
    format: ExportFormat,
    contentType?: ContentType,
    options?: { pdfQualityOverride?: PdfQualityPreference }
  ) => void;
  pdfQuality: PdfQualityPreference;
  onPdfQualityChange: (value: PdfQualityPreference) => void;
  notionExportFormatByType: Record<ContentType, ExportFormat>;
};

const NOTION_LAYOUT_BY_TYPE: Record<ContentType, string> = {
  quiz: 'Callout questions, option bullets, hint/answer toggles, rationale sections',
  flashcards: 'Toggle cards with blue back notes',
  mindmap: 'Section headings with nested bullet outline + toggles',
  datatable: 'Data table with row cells',
  note: 'Rich doc with paragraphs, tables, and code blocks',
  report: 'Rich report with headings, paragraphs, tables, and code blocks',
  chat: 'Role headings with paragraphs, tables, and code blocks',
  source: 'Sources list with linked URLs when available',
};

export const ExportActions = ({
  sections,
  exportTarget,
  loadingAction,
  onExport,
  pdfQuality,
  onPdfQualityChange,
  notionExportFormatByType
}: ExportActionsProps) => {
  const [activePdfQualityKey, setActivePdfQualityKey] = useState<string | null>(null);
  const pdfQualityRef = useRef<HTMLDivElement | null>(null);
  const isNotionTarget = exportTarget === 'notion';
  const isFileTarget = exportTarget === 'download' || exportTarget === 'drive';

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

  const renderFileOption = (section: ExportSection, option: ExportOption) => {
    const key = `${section.contentType}-${option.format}`;
    const hasTooltip = isFileTarget && !!option.apps?.length;
    if ((section.contentType === 'note' || section.contentType === 'report' || section.contentType === 'chat') && option.format === 'PDF') {
      return (
        <div
          key={key}
          className="export-option"
          ref={activePdfQualityKey === key ? pdfQualityRef : null}
        >
          <button
            type="button"
            onClick={() => {
              if (activePdfQualityKey === key) {
                handleExportClick(option.format, section.contentType);
              } else {
                setActivePdfQualityKey(key);
              }
            }}
            disabled={!!loadingAction}
            className={`export-btn${hasTooltip ? ' has-tooltip' : ''}`}
            aria-label={
              hasTooltip
                ? `${option.label ?? option.format}. Supported by ${option.apps?.join(', ')}`
                : undefined
            }
          >
            <span className="button-content">
              {option.label ?? option.format}
              {hasTooltip ? (
                <span className="tooltip-content">Supported by {option.apps?.join(', ')}</span>
              ) : null}
              {option.isPlus && <PlusIcon />}
              {loadingAction === `${section.contentType}:${option.format}` && <Spinner />}
            </span>
          </button>
          {activePdfQualityKey === key && (
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
      );
    }

    return (
      <button
        key={key}
        onClick={() => handleExportClick(option.format, section.contentType)}
        disabled={!!loadingAction}
        className={`export-btn${hasTooltip ? ' has-tooltip' : ''}`}
        aria-label={
          hasTooltip
            ? `${option.label ?? option.format}. Supported by ${option.apps?.join(', ')}`
            : undefined
        }
      >
        <span className="button-content">
          {option.label ?? option.format}
          {hasTooltip ? (
            <span className="tooltip-content">Supported by {option.apps?.join(', ')}</span>
          ) : null}
          {option.isPlus && <PlusIcon />}
          {loadingAction === `${section.contentType}:${option.format}` && <Spinner />}
        </span>
      </button>
    );
  };

  const renderNotionSection = (section: ExportSection) => (
    <div key={section.contentType} className="export-section">
      <div className="section-label">{section.title}</div>
      <div className="section-grid notion-grid">
        <button
          onClick={() => handleExportClick(notionExportFormatByType[section.contentType], section.contentType)}
          disabled={!!loadingAction}
          className="export-btn notion-export-btn"
        >
          <span className="button-content">
            Export to Notion
            {loadingAction === `${section.contentType}:${notionExportFormatByType[section.contentType]}` && (
              <Spinner />
            )}
          </span>
        </button>
        <div className="notion-layout-detail">
          {NOTION_LAYOUT_BY_TYPE[section.contentType]}
        </div>
      </div>
    </div>
  );

  const renderFileSection = (section: ExportSection) => (
    <div key={section.contentType} className="export-section">
      <div className="section-label">{section.title}</div>
      <div className="section-grid">
        {section.options.map((option) => renderFileOption(section, option))}
      </div>
    </div>
  );

  const renderSections = () => {
    if (isNotionTarget) {
      return sections.map(renderNotionSection);
    }
    if (isFileTarget) {
      return sections.map(renderFileSection);
    }
    return null;
  };
  return (
    <div className="actions">
      {isNotionTarget && (
        <div className="notion-hint">
          Notion exports use native layouts.
        </div>
      )}
      {renderSections()}

      <div className="coming-soon">
        <div className="section-label muted">Coming soon</div>
        <div className="coming-card">Video & Audio Overviews to Transcript/Slides</div>
      </div>
    </div>
  );
};
