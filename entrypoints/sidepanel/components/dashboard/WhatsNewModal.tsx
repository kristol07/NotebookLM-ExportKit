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
import React, { useEffect, useRef } from 'react';
import { useI18n } from '../../i18n/i18n';
import type { MessageKey } from '../../i18n/messages';

type WhatsNewModalProps = {
  onClose: () => void;
  featureKeys: MessageKey[];
  version: string;
  isFirstInstall: boolean;
};

const CloseIcon = () => (
  <svg aria-hidden="true" width="14" height="14" viewBox="0 0 14 14" fill="none">
    <path d="M3 3L11 11M11 3L3 11" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
  </svg>
);

const FeatureCheckIcon = () => (
  <svg aria-hidden="true" width="13" height="13" viewBox="0 0 14 14" fill="none">
    <path d="M3 7.25L5.55 9.75L11 4.25" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const WhatsNewModal = ({
  onClose,
  featureKeys,
  version,
  isFirstInstall,
}: WhatsNewModalProps) => {
  const { t } = useI18n();
  const actionRef = useRef<HTMLButtonElement>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    actionRef.current?.focus();
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onCloseRef.current();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div
      className="panel-overlay modal-overlay whats-new-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="whats-new-title"
      aria-describedby="whats-new-subtitle"
      onClick={onClose}
    >
      <div className="modal-card whats-new-card" onClick={(event) => event.stopPropagation()}>
        <header className="whats-new-hero">
          <div className="whats-new-meta">
            <span className="brand-dot" aria-hidden="true" />
            <span className="status-pill success">{t('whatsNew.badge')}</span>
            <span className="whats-new-version">v{version}</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="whats-new-close"
            aria-label={t('common.close')}
          >
            <CloseIcon />
          </button>
          <h2 id="whats-new-title" className="whats-new-title">
            {t(isFirstInstall ? 'whatsNew.welcomeTitle' : 'whatsNew.title')}
          </h2>
          <p id="whats-new-subtitle" className="whats-new-subtitle">
            {t(isFirstInstall ? 'whatsNew.welcomeSubtitle' : 'whatsNew.subtitle')}
          </p>
        </header>
        <section className="whats-new-body">
          <div className="whats-new-feature-list">
            {featureKeys.map((featureKey) => (
              <div className="whats-new-feature-item" key={featureKey}>
                <span className="whats-new-feature-icon">
                  <FeatureCheckIcon />
                </span>
                <span className="whats-new-feature-copy">{t(featureKey)}</span>
              </div>
            ))}
          </div>
        </section>
        <footer className="whats-new-actions">
          <button
            ref={actionRef}
            type="button"
            onClick={onClose}
            className="export-btn primary whats-new-action"
          >
            {t(isFirstInstall ? 'whatsNew.action.startExporting' : 'whatsNew.action.gotIt')}
          </button>
        </footer>
      </div>
    </div>
  );
};
