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
import React, { useEffect, useMemo, useRef, useState } from 'react';
import type { ContentType, ExportFormat, ExportTarget, PdfQualityPreference } from '../../../../utils/export-core';
import { PlusIcon, Spinner } from './Icons';
import { useI18n } from '../../i18n/i18n';

type ExportOption = {
  format: ExportFormat;
  label?: string;
  isPlus?: boolean;
  apps?: string[];
  delivery?: ExportDelivery;
};

export type ExportDelivery = 'download' | 'clipboard';

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
    options?: { pdfQualityOverride?: PdfQualityPreference; deliveryOverride?: ExportDelivery }
  ) => void;
  pdfQuality: PdfQualityPreference;
  onPdfQualityChange: (value: PdfQualityPreference) => void;
  notionExportFormatByType: Record<ContentType, ExportFormat>;
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
  const { t, formatList } = useI18n();
  const [activePdfQualityKey, setActivePdfQualityKey] = useState<string | null>(null);
  const pdfQualityRef = useRef<HTMLDivElement | null>(null);
  const isNotionTarget = exportTarget === 'notion';
  const isFileTarget = exportTarget === 'download' || exportTarget === 'drive';
  const notionLayoutByType = useMemo<Record<ContentType, string>>(() => ({
    quiz: t('export.notionLayout.quiz'),
    flashcards: t('export.notionLayout.flashcards'),
    mindmap: t('export.notionLayout.mindmap'),
    datatable: t('export.notionLayout.datatable'),
    note: t('export.notionLayout.note'),
    report: t('export.notionLayout.report'),
    chat: t('export.notionLayout.chat'),
    source: t('export.notionLayout.source'),
    slidedeck: t('export.notionLayout.slidedeck'),
    infographic: t('export.notionLayout.infographic'),
  }), [t]);

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
  const handleExportClick = (option: ExportOption, contentType: ContentType) => {
    setActivePdfQualityKey(null);
    onExport(option.format, contentType, {
      deliveryOverride: option.delivery
    });
  };

  const renderFileOption = (section: ExportSection, option: ExportOption) => {
    const actionId = `${section.contentType}:${option.format}${option.delivery ? `:${option.delivery}` : ''}`;
    const key = `${section.contentType}-${option.format}${option.delivery ? `-${option.delivery}` : ''}`;
    const hasTooltip = isFileTarget && !!option.apps?.length;
    const appsLabel = option.apps?.length ? formatList(option.apps) : '';
    const supportedByLabel = hasTooltip ? t('export.supportedBy', { apps: appsLabel }) : '';
    if ((section.contentType === 'note' || section.contentType === 'report' || section.contentType === 'chat' || section.contentType === 'source') && option.format === 'PDF') {
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
                handleExportClick(option, section.contentType);
              } else {
                setActivePdfQualityKey(key);
              }
            }}
            disabled={!!loadingAction}
            className={`export-btn${hasTooltip ? ' has-tooltip' : ''}`}
            aria-label={
              hasTooltip
                ? `${option.label ?? option.format}. ${supportedByLabel}`
                : undefined
            }
          >
            <span className="button-content">
              {option.label ?? option.format}
              {hasTooltip ? (
                <span className="tooltip-content">{supportedByLabel}</span>
              ) : null}
              {option.isPlus && <PlusIcon />}
              {loadingAction === actionId && <Spinner />}
            </span>
          </button>
          {activePdfQualityKey === key && (
            <div className="pdf-quality-popover">
              <div className="pdf-quality-title">{t('export.pdfQualityTitle')}</div>
              <div className="pdf-quality-actions">
                <button
                  type="button"
                  className={`pdf-quality-btn ${pdfQuality === 'size' ? 'active' : ''}`}
                  onClick={() => handlePdfChoice('size', section.contentType)}
                >
                  {t('export.pdfQualitySize')}
                </button>
                <button
                  type="button"
                  className={`pdf-quality-btn ${pdfQuality === 'clarity' ? 'active' : ''}`}
                  onClick={() => handlePdfChoice('clarity', section.contentType)}
                >
                  {t('export.pdfQualityClarity')}
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
        onClick={() => handleExportClick(option, section.contentType)}
        disabled={!!loadingAction}
        className={`export-btn${hasTooltip ? ' has-tooltip' : ''}`}
        aria-label={
          hasTooltip
            ? `${option.label ?? option.format}. ${supportedByLabel}`
            : undefined
        }
      >
        <span className="button-content">
          {option.label ?? option.format}
          {hasTooltip ? (
            <span className="tooltip-content">{supportedByLabel}</span>
          ) : null}
          {option.isPlus && <PlusIcon />}
          {loadingAction === actionId && <Spinner />}
        </span>
      </button>
    );
  };

  const renderNotionSection = (section: ExportSection) => (
    <div key={section.contentType} className="export-section">
      <div className="section-label">{section.title}</div>
      <div className="section-grid notion-grid">
        <button
          onClick={() => onExport(notionExportFormatByType[section.contentType], section.contentType)}
          disabled={!!loadingAction}
          className="export-btn notion-export-btn"
        >
          <span className="button-content">
            {t('common.exportToNotion')}
            {loadingAction === `${section.contentType}:${notionExportFormatByType[section.contentType]}` && (
              <Spinner />
            )}
          </span>
        </button>
        <div className="notion-layout-detail">
          {notionLayoutByType[section.contentType]}
        </div>
      </div>
    </div>
  );

  const renderFileSection = (section: ExportSection) => (
    <div key={section.contentType} className="export-section">
      <div className="section-label">{section.title}</div>
      <div className="section-grid">
        {section.options
          .filter((option) => exportTarget === 'download' || option.delivery !== 'clipboard')
          .map((option) => renderFileOption(section, option))}
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
          {t('export.hint.notion')}
        </div>
      )}
      {renderSections()}

      <div className="coming-soon">
        <div className="section-label muted">{t('export.comingSoon')}</div>
        <div className="coming-card">{t('export.comingSoonDetail')}</div>
      </div>
    </div>
  );
};

