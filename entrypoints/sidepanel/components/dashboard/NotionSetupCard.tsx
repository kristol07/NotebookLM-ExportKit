import React, { useEffect, useState } from 'react';
import { Spinner } from './Icons';

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
        <div className="section-label">Notion setup</div>
        <div className="setup-header-actions">
          <span className={`status-pill ${isReady ? 'success' : 'warning'}`}>
            {isReady ? 'Ready' : 'Needs setup'}
          </span>
          {isReady && <span className={`setup-toggle${isExpanded ? ' is-expanded' : ''}`} />}
        </div>
      </div>
      {isExpanded && (
        <>
          <div className="setup-step">
            <div className="setup-step-main">
              <div className="setup-title">1. Sign in to your account</div>
              {!isSignedIn ? (
                <button onClick={onRequestLogin} className="export-btn small">
                  Sign in
                </button>
              ) : (
                <span className="status-pill success">Done</span>
              )}
            </div>
            <p className="setup-note">Your subscription stays with this account.</p>
          </div>
          <div className="setup-step">
            <div className="setup-step-main">
              <div className="setup-title">2. Upgrade to Plus</div>
              {isPlus ? (
                <span className="status-pill success">Unlocked</span>
              ) : (
                <button onClick={onUpgrade} className="export-btn small">
                  Upgrade
                </button>
              )}
            </div>
            <p className="setup-note">Notion delivery is available on Plus.</p>
          </div>
          <div className="setup-step">
            <div className="setup-step-main">
              <div className="setup-title">3. Connect Notion</div>
              <button
                onClick={onConnectNotion}
                disabled={!!loadingAction || !isSignedIn}
                className={`export-btn small ${hasNotionAccess ? '' : 'primary'}`}
              >
                {hasNotionAccess ? 'Change workspace' : 'Connect'}{' '}
                {loadingAction === 'notion-connect' && <Spinner />}
              </button>
            </div>
            <p className="setup-note">
              {notionWorkspaceName
                ? `Connected to ${notionWorkspaceName}.`
                : 'Authorize the workspace where exports should land.'}
            </p>
          </div>
          <div className="setup-step">
            <div className="setup-step-main">
              <div className="setup-title">4. Pick a destination page</div>
              <button
                onClick={onRefreshPages}
                disabled={!hasNotionAccess || !!loadingAction}
                className="export-btn small"
              >
                Refresh list {isListing && <Spinner />}
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
                  {notionPages.length > 0 ? 'Choose a Notion page' : 'No pages found'}
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
                    Saving destination... <Spinner />
                  </>
                )
                : databasePreview
                  ? `Destination set (${databasePreview}).`
                  : 'Pick a page to host the NotebookLM ExportKit database.'}
            </p>
          </div>
        </>
      )}
    </div>
  );
};
