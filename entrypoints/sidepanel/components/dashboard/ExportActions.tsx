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
export type NotionVideoMode = 'external' | 'upload';

export type ExportSection = {
  title: string;
  contentType: ContentType;
  options: ExportOption[];
};

type RecentExportAction = {
  contentType: ContentType;
  format: ExportFormat;
  target: ExportTarget;
  delivery?: ExportDelivery;
};

const RECENT_EXPORTS_STORAGE_KEY = 'exportkitRecentExports';
const MAX_RECENT_EXPORTS_PER_TARGET = 4;

type ExportActionsProps = {
  sections: ExportSection[];
  exportTarget: ExportTarget;
  loadingAction: string | null;
  onExport: (
    format: ExportFormat,
    contentType?: ContentType,
    options?: {
      pdfQualityOverride?: PdfQualityPreference;
      deliveryOverride?: ExportDelivery;
      notionVideoModeOverride?: NotionVideoMode;
    }
  ) => void;
  pdfQuality: PdfQualityPreference;
  onPdfQualityChange: (value: PdfQualityPreference) => void;
  notionVideoMode: NotionVideoMode;
  onNotionVideoModeChange: (value: NotionVideoMode) => void;
  notionExportFormatByType: Record<ContentType, ExportFormat>;
};

export const ExportActions = ({
  sections,
  exportTarget,
  loadingAction,
  onExport,
  pdfQuality,
  onPdfQualityChange,
  notionVideoMode,
  onNotionVideoModeChange,
  notionExportFormatByType
}: ExportActionsProps) => {
  const { t, formatList } = useI18n();
  const [activePdfQualityKey, setActivePdfQualityKey] = useState<string | null>(null);
  const [activeNotionVideoModeKey, setActiveNotionVideoModeKey] = useState<string | null>(null);
  const [selectedContentType, setSelectedContentType] = useState<ContentType | null>(sections[0]?.contentType ?? null);
  const [recentExports, setRecentExports] = useState<RecentExportAction[]>([]);
  const pdfQualityRef = useRef<HTMLDivElement | null>(null);
  const notionVideoModeRef = useRef<HTMLDivElement | null>(null);
  const isNotionTarget = exportTarget === 'notion';
  const isFileTarget = exportTarget === 'download' || exportTarget === 'drive';
  const contentTypeLabelByType = useMemo<Record<ContentType, string>>(() => ({
    quiz: t('content.quiz'),
    flashcards: t('content.flashcards'),
    mindmap: t('content.mindmap'),
    datatable: t('content.datatable'),
    note: t('content.note'),
    report: t('content.report'),
    chat: t('content.chat'),
    source: t('content.source'),
    slidedeck: t('content.slidedeck'),
    infographic: t('content.infographic'),
    videooverview: t('content.videoOverview'),
  }), [t]);
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
    videooverview: t('export.notionLayout.videoOverview'),
  }), [t]);

  const capRecentByTarget = (items: RecentExportAction[]) => {
    const counts: Record<ExportTarget, number> = {
      download: 0,
      drive: 0,
      notion: 0,
    };
    const next: RecentExportAction[] = [];
    items.forEach((item) => {
      if (counts[item.target] >= MAX_RECENT_EXPORTS_PER_TARGET) {
        return;
      }
      counts[item.target] += 1;
      next.push(item);
    });
    return next;
  };

  useEffect(() => {
    try {
      const stored = localStorage.getItem(RECENT_EXPORTS_STORAGE_KEY);
      if (!stored) {
        setRecentExports([]);
        return;
      }
      const parsed = JSON.parse(stored) as RecentExportAction[];
      if (!Array.isArray(parsed)) {
        setRecentExports([]);
        return;
      }
      setRecentExports(
        capRecentByTarget(parsed.filter((item) =>
          !!item
          && !!item.contentType
          && !!item.format
          && !!item.target
        ))
      );
    } catch {
      setRecentExports([]);
    }
  }, []);

  useEffect(() => {
    if (!activePdfQualityKey && !activeNotionVideoModeKey) {
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
      if (notionVideoModeRef.current && !notionVideoModeRef.current.contains(target)) {
        setActiveNotionVideoModeKey(null);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [activePdfQualityKey, activeNotionVideoModeKey]);

  const persistRecentExport = (action: RecentExportAction) => {
    setRecentExports((current) => {
      const deduped = [action, ...current.filter((item) =>
        !(item.contentType === action.contentType
          && item.format === action.format
          && item.target === action.target
          && item.delivery === action.delivery)
      )];
      const next = capRecentByTarget(deduped);
      localStorage.setItem(RECENT_EXPORTS_STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  };

  const triggerExport = (
    format: ExportFormat,
    contentType: ContentType,
    options?: {
      pdfQualityOverride?: PdfQualityPreference;
      deliveryOverride?: ExportDelivery;
      notionVideoModeOverride?: NotionVideoMode;
    }
  ) => {
    onExport(format, contentType, options);
    persistRecentExport({
      target: exportTarget,
      contentType,
      format,
      delivery: options?.deliveryOverride
    });
  };

  const handlePdfChoice = (value: PdfQualityPreference, contentType: ContentType) => {
    onPdfQualityChange(value);
    triggerExport('PDF', contentType, { pdfQualityOverride: value });
    setActivePdfQualityKey(null);
  };
  const handleNotionVideoModeChoice = (value: NotionVideoMode, contentType: ContentType) => {
    onNotionVideoModeChange(value);
    triggerExport(notionExportFormatByType[contentType], contentType, { notionVideoModeOverride: value });
    setActiveNotionVideoModeKey(null);
  };
  const handleExportClick = (option: ExportOption, contentType: ContentType) => {
    setActivePdfQualityKey(null);
    setActiveNotionVideoModeKey(null);
    triggerExport(option.format, contentType, {
      deliveryOverride: option.delivery
    });
  };
  useEffect(() => {
    if (sections.length === 0) {
      setSelectedContentType(null);
      return;
    }
    if (!selectedContentType || !sections.some((section) => section.contentType === selectedContentType)) {
      setSelectedContentType(sections[0].contentType);
    }
  }, [sections, selectedContentType]);

  const selectedSection = useMemo(
    () => sections.find((section) => section.contentType === selectedContentType) ?? null,
    [sections, selectedContentType]
  );

  const recentExportsForTarget = useMemo(
    () => recentExports.filter((item) => item.target === exportTarget),
    [exportTarget, recentExports]
  );

  const getRecentActionLabel = (action: RecentExportAction) => {
    if (action.target === 'notion') {
      return t('common.notion');
    }
    const section = sections.find((entry) => entry.contentType === action.contentType);
    const matchedOption = section?.options.find((option) =>
      option.format === action.format && option.delivery === action.delivery
    );
    if (matchedOption) {
      return matchedOption.label ?? matchedOption.format;
    }
    if (action.delivery === 'clipboard') {
      return t('export.option.clipboard');
    }
    return action.format;
  };

  const handleRecentClick = (action: RecentExportAction) => {
    if (action.target === 'notion') {
      const notionFormat = notionExportFormatByType[action.contentType];
      if (action.contentType === 'videooverview') {
        triggerExport(notionFormat, action.contentType, { notionVideoModeOverride: notionVideoMode });
        return;
      }
      triggerExport(notionFormat, action.contentType);
      return;
    }
    triggerExport(action.format, action.contentType, {
      deliveryOverride: action.delivery
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

  const renderNotionSection = (section: ExportSection) => {
    const actionId = `${section.contentType}:${notionExportFormatByType[section.contentType]}`;
    const key = `${section.contentType}-notion`;
    const isVideoOverview = section.contentType === 'videooverview';
    return (
      <div key={section.contentType} className="export-section">
        <div className="section-label">{section.title}</div>
        <div className="section-grid notion-grid">
          {isVideoOverview ? (
            <div
              className="export-option"
              ref={activeNotionVideoModeKey === key ? notionVideoModeRef : null}
            >
              <button
                onClick={() => {
                  if (activeNotionVideoModeKey === key) {
                    triggerExport(notionExportFormatByType[section.contentType], section.contentType, {
                      notionVideoModeOverride: notionVideoMode,
                    });
                  } else {
                    setActiveNotionVideoModeKey(key);
                  }
                }}
                disabled={!!loadingAction}
                className="export-btn notion-export-btn"
              >
                <span className="button-content">
                  {t('common.exportToNotion')}
                  {loadingAction === actionId && <Spinner />}
                </span>
              </button>
              {activeNotionVideoModeKey === key && (
                <div className="pdf-quality-popover">
                  <div className="pdf-quality-title">{t('export.notionVideoTitle')}</div>
                  <div className="pdf-quality-actions">
                    <button
                      type="button"
                      className={`pdf-quality-btn ${notionVideoMode === 'external' ? 'active' : ''}`}
                      onClick={() => handleNotionVideoModeChoice('external', section.contentType)}
                    >
                      {t('export.notionVideoExternal')}
                    </button>
                    <button
                      type="button"
                      className={`pdf-quality-btn ${notionVideoMode === 'upload' ? 'active' : ''}`}
                      onClick={() => handleNotionVideoModeChoice('upload', section.contentType)}
                    >
                      {t('export.notionVideoUpload')}
                    </button>
                  </div>
                  <div className="notion-video-hint">{t('export.notionVideoHint')}</div>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={() => triggerExport(notionExportFormatByType[section.contentType], section.contentType)}
              disabled={!!loadingAction}
              className="export-btn notion-export-btn"
            >
              <span className="button-content">
                {t('common.exportToNotion')}
                {loadingAction === actionId && <Spinner />}
              </span>
            </button>
          )}
          <div className="notion-layout-detail">
            {notionLayoutByType[section.contentType]}
          </div>
        </div>
      </div>
    );
  };

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
  return (
    <div className="actions">
      {recentExportsForTarget.length > 0 && (
        <div className="recent-exports">
          <div className="section-label muted">{t('export.recent')}</div>
          <div className="recent-grid">
            {recentExportsForTarget.map((action) => {
              const actionId = `${action.contentType}:${action.format}${action.delivery ? `:${action.delivery}` : ''}`;
              const key = `${action.target}-${action.contentType}-${action.format}${action.delivery ? `-${action.delivery}` : ''}`;
              return (
                <button
                  key={key}
                  type="button"
                  className="export-btn recent-export-btn"
                  onClick={() => handleRecentClick(action)}
                  disabled={!!loadingAction}
                >
                  <span className="recent-export-route">
                    <span className="recent-chip recent-chip-type">{contentTypeLabelByType[action.contentType]}</span>
                    <span className="recent-route-arrow" aria-hidden="true">↓</span>
                    <span className="recent-chip recent-chip-format">{getRecentActionLabel(action)}</span>
                    {loadingAction === actionId && <Spinner />}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {sections.length > 0 && (
        <div className="content-type-tabs" role="tablist" aria-label={t('export.contentTypes')}>
          {sections.map((section) => (
            <button
              key={section.contentType}
              type="button"
              role="tab"
              aria-selected={selectedSection?.contentType === section.contentType}
              className={`content-type-tab${selectedSection?.contentType === section.contentType ? ' active' : ''}`}
              onClick={() => setSelectedContentType(section.contentType)}
              disabled={!!loadingAction}
            >
              {contentTypeLabelByType[section.contentType]}
            </button>
          ))}
        </div>
      )}

      {isNotionTarget && (
        <div className="notion-hint">
          {t('export.hint.notion')}
        </div>
      )}
      {selectedSection && isNotionTarget && renderNotionSection(selectedSection)}
      {selectedSection && isFileTarget && renderFileSection(selectedSection)}

      <div className="coming-soon">
        <div className="section-label muted">{t('export.comingSoon')}</div>
        <div className="coming-card">{t('export.comingSoonDetail')}</div>
      </div>
    </div>
  );
};

