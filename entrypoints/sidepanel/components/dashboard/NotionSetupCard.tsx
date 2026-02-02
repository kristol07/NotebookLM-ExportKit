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
import React, { useEffect, useState } from 'react';
import { Spinner } from './Icons';
import { useI18n } from '../../i18n/i18n';

type NotionSetupCardProps = {
  isSignedIn: boolean;
  hasNotionAccess: boolean;
  notionWorkspaceName: string | null;
  notionDatabaseId: string | null;
  notionPages: Array<{ id: string; title: string }>;
  loadingAction: string | null;
  isPlus: boolean;
  onRequestLogin: () => void;
  onConnectNotion: () => void;
  onConfigureDestination: (value: string) => void;
  onRefreshPages: () => void;
  onUpgrade: () => void;
};

export const NotionSetupCard = ({
  isSignedIn,
  hasNotionAccess,
  notionWorkspaceName,
  notionDatabaseId,
  notionPages,
  loadingAction,
  isPlus,
  onRequestLogin,
  onConnectNotion,
  onConfigureDestination,
  onRefreshPages,
  onUpgrade,
}: NotionSetupCardProps) => {
  const { t } = useI18n();
  const [isExpanded, setIsExpanded] = useState(!hasNotionAccess || !notionDatabaseId);
  const [selectedPageId, setSelectedPageId] = useState('');
  const [pendingPageId, setPendingPageId] = useState('');

  useEffect(() => {
    if (!hasNotionAccess || !notionDatabaseId) {
      setIsExpanded(true);
    }
  }, [hasNotionAccess, notionDatabaseId]);

  useEffect(() => {
    if (loadingAction !== 'notion-destination') {
      setPendingPageId('');
    }
  }, [loadingAction]);

  const handleToggle = () => {
    if (hasNotionAccess && notionDatabaseId) {
      setIsExpanded((prev) => !prev);
    }
  };

  const handleHeaderKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (!hasNotionAccess || !notionDatabaseId) {
      return;
    }

    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      setIsExpanded((prev) => !prev);
    }
  };

  const formatDatabaseId = (value: string | null) => {
    if (!value) {
      return null;
    }
    const trimmed = value.replace(/-/g, '');
    if (trimmed.length <= 10) {
      return trimmed;
    }
    return `${trimmed.slice(0, 6)}...${trimmed.slice(-4)}`;
  };

  const handleSelectPage = (value: string) => {
    setSelectedPageId(value);
    if (!value) {
      return;
    }
    setPendingPageId(value);
    onConfigureDestination(value);
  };

  const databasePreview = formatDatabaseId(notionDatabaseId);
  const isReady = hasNotionAccess && Boolean(notionDatabaseId);
  const isListing = loadingAction === 'notion-page-list';
  const isSaving = loadingAction === 'notion-destination' || Boolean(pendingPageId);

  return (
    <div className="setup-card">
      <div
        className={`setup-header${isReady ? ' is-toggleable' : ''}`}
        onClick={handleToggle}
        onKeyDown={handleHeaderKeyDown}
        role={isReady ? 'button' : undefined}
        tabIndex={isReady ? 0 : -1}
        aria-expanded={isReady ? isExpanded : undefined}
      >
        <div className="section-label">{t('notion.setup')}</div>
        <div className="setup-header-actions">
          <span className={`status-pill ${isReady ? 'success' : 'warning'}`}>
            {isReady ? t('common.ready') : t('common.needsSetup')}
          </span>
          {isReady && <span className={`setup-toggle${isExpanded ? ' is-expanded' : ''}`} />}
        </div>
      </div>
      {isExpanded && (
        <>
          <div className="setup-step">
            <div className="setup-step-main">
              <div className="setup-title">{t('notion.step.signIn')}</div>
              {!isSignedIn ? (
                <button onClick={onRequestLogin} className="export-btn small">
                  {t('common.signIn')}
                </button>
              ) : (
                <span className="status-pill success">{t('common.done')}</span>
              )}
            </div>
            <p className="setup-note">{t('notion.note.subscription')}</p>
          </div>
          <div className="setup-step">
            <div className="setup-step-main">
              <div className="setup-title">{t('notion.step.upgrade')}</div>
              {isPlus ? (
                <span className="status-pill success">{t('common.unlocked')}</span>
              ) : (
                <button onClick={onUpgrade} className="export-btn small">
                  {t('common.upgrade')}
                </button>
              )}
            </div>
            <p className="setup-note">{t('notion.note.plus')}</p>
          </div>
          <div className="setup-step">
            <div className="setup-step-main">
              <div className="setup-title">{t('notion.step.connect')}</div>
              <button
                onClick={onConnectNotion}
                disabled={!!loadingAction || !isSignedIn}
                className={`export-btn small ${hasNotionAccess ? '' : 'primary'}`}
              >
                {hasNotionAccess ? t('common.changeWorkspace') : t('common.connect')}{' '}
                {loadingAction === 'notion-connect' && <Spinner />}
              </button>
            </div>
            <p className="setup-note">
              {notionWorkspaceName
                ? t('notion.note.connectedTo', { workspace: notionWorkspaceName })
                : t('notion.note.authorizeWorkspace')}
            </p>
          </div>
          <div className="setup-step">
            <div className="setup-step-main">
              <div className="setup-title">{t('notion.step.destination')}</div>
              <button
                onClick={onRefreshPages}
                disabled={!hasNotionAccess || !!loadingAction}
                className="export-btn small"
              >
                {t('common.refreshList')} {isListing && <Spinner />}
              </button>
            </div>
            <div className="setup-input-row">
              <select
                value={selectedPageId}
                onChange={(event) => handleSelectPage(event.target.value)}
                className="setup-input"
                disabled={!hasNotionAccess || isListing || isSaving}
              >
                <option value="">
                  {notionPages.length > 0 ? t('notion.pages.choose') : t('notion.pages.none')}
                </option>
                {notionPages.map((page) => (
                  <option key={page.id} value={page.id}>
                    {page.title}
                  </option>
                ))}
              </select>
            </div>
            <p className="setup-note">
              {isSaving
                ? (
                  <>
                    {t('notion.saving')} <Spinner />
                  </>
                )
                : databasePreview
                  ? t('notion.note.destinationSet', { preview: databasePreview })
                  : t('notion.note.destinationPick')}
            </p>
          </div>
        </>
      )}
    </div>
  );
};

