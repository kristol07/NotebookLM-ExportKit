import React, { useEffect, useRef, useState } from 'react';
import { supabase } from '../../../utils/supabase';
import { browser } from 'wxt/browser';
import { getGoogleDriveOAuthScopes } from '../../../utils/supabase-oauth';
import { sanitizeFilename, getTimestamp } from '../../../utils/common';
import { ContentType, ExportFormat, ExportTarget, PdfQualityPreference } from '../../../utils/export-core';
import { exportByType } from '../../../utils/export-dispatch';
import { deliverExport } from '../../../utils/export-delivery';
import { connectGoogleDrive, getDriveAccountEmail, getDriveAccessToken } from '../../../utils/google-drive-auth';
import { resetDriveConnection } from '../../../utils/google-drive';

import { extractByType } from '../../../utils/extractors';
import { extractNotebookLmPayload } from '../../../utils/extractors/common';
import { consumeTrial, createCheckoutSession, createCustomerPortalLink, getPlan } from '../../../utils/billing';
import { AccountPanel } from './dashboard/AccountPanel';
import { DashboardHeader } from './dashboard/DashboardHeader';
import { DriveSetupCard } from './dashboard/DriveSetupCard';
import { ExportActions, ExportSection } from './dashboard/ExportActions';
import { ExportDestinationCard } from './dashboard/ExportDestinationCard';
import { ToastNotice } from './dashboard/ToastNotice';
import { UpgradeBanner } from './dashboard/UpgradeBanner';
import { UpgradeModal } from './dashboard/UpgradeModal';

const EXPORT_SECTIONS: ExportSection[] = [
    {
        title: 'Quiz Exports',
        contentType: 'quiz',
        options: [
            { format: 'CSV', label: 'Excel' },
            { format: 'JSON' },
            { format: 'HTML' },
            { format: 'Anki', isPlus: true },
        ],
    },
    {
        title: 'Flashcard Exports',
        contentType: 'flashcards',
        options: [
            { format: 'CSV', label: 'Excel' },
            { format: 'JSON' },
            { format: 'HTML' },
            { format: 'Anki', isPlus: true },
        ],
    },
    {
        title: 'Mindmap Exports',
        contentType: 'mindmap',
        options: [
            { format: 'SVG' },
            { format: 'HTML', label: 'HTML' },
            { format: 'FreeMind', label: 'FreeMind' },
            { format: 'Markdown', label: 'Markdown', isPlus: true, apps: ['Whimsical', 'Obsidian'] },
            { format: 'JSONCanvas', label: 'JSONCanvas', isPlus: true, apps: ['Obsidian'] },
            { format: 'OPML', label: 'OPML', isPlus: true, apps: ['XMind', 'MindMeister'] },
        ],
    },
    {
        title: 'Note Exports',
        contentType: 'note',
        options: [
            { format: 'PDF' },
            { format: 'Word', label: 'Word', isPlus: true },
            { format: 'Markdown', isPlus: true },
        ],
    },
    {
        title: 'Chat Exports',
        contentType: 'chat',
        options: [
            { format: 'PDF' },
            { format: 'JSON' },
            { format: 'Word', label: 'Word', isPlus: true },
            { format: 'Markdown', isPlus: true },
        ],
    },
    {
        title: 'Data Table Exports',
        contentType: 'datatable',
        options: [
            { format: 'CSV', label: 'Excel' },
            { format: 'Markdown' },
        ],
    },
    {
        title: 'Source Exports',
        contentType: 'source',
        options: [
            { format: 'Markdown', label: 'Markdown' },
        ],
    },
];

const PLUS_EXPORTS = new Set(
    EXPORT_SECTIONS.flatMap((section) =>
        section.options
            .filter((option) => option.isPlus)
            .map((option) => `${section.contentType}:${option.format}`)
    )
);
const EXPORT_TARGET_STORAGE_KEY = 'exportkitExportTarget';
const DRIVE_CONNECTED_STORAGE_KEY = 'exportkitDriveConnected';
const PDF_QUALITY_STORAGE_KEY = 'exportkitPdfQuality';
const DRIVE_EXPORT_REQUIRES_PLUS = true;
const EXTRACTION_ERROR_MESSAGE =
    'Failed to extract content. Ensure you are on a NotebookLM page and the content is visible.';

const getAuthProviderLabel = (session: any) => {
    const providerFromApp = session?.user?.app_metadata?.provider;
    const providerFromIdentity = session?.user?.identities?.[0]?.provider;
    const providersList = session?.user?.app_metadata?.providers;
    const provider =
        providerFromApp ||
        providerFromIdentity ||
        (Array.isArray(providersList) ? providersList[0] : null);
    if (!provider) {
        return null;
    }
    switch (provider) {
        case 'google':
            return 'Google';
        case 'github':
            return 'GitHub';
        case 'email':
            return 'Email';
        default:
            return `${provider.slice(0, 1).toUpperCase()}${provider.slice(1)}`;
    }
};
export default function Dashboard({
    session,
    onRequestLogin,
}: {
    session: any;
    onRequestLogin?: () => void;
}) {
    const [loadingAction, setLoadingAction] = useState<string | null>(null);
    const [notice, setNotice] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);
    const [trialRemaining, setTrialRemaining] = useState<number | null>(null);
    const [driveConnected, setDriveConnected] = useState(false);
    const [driveAccountEmail, setDriveAccountEmail] = useState<string | null>(null);
    const [uploadProgress, setUploadProgress] = useState<{ percent: number } | null>(null);
    const [showAccountPanel, setShowAccountPanel] = useState(false);
    const [showUpgradeModal, setShowUpgradeModal] = useState(false);
    const [upgradeContext, setUpgradeContext] = useState<'drive' | 'format' | 'general' | null>(null);
    const noticeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const upgradeInFlightRef = useRef(false);
    const [exportTarget, setExportTarget] = useState<ExportTarget>('download');
    const [pdfQuality, setPdfQuality] = useState<PdfQualityPreference>('size');
    const plan = getPlan(session);
    const isPlus = plan === 'plus' || plan === 'pro';
    const isSignedIn = Boolean(session?.user?.id);
    const subscriptionStatus = session?.user?.app_metadata?.subscription_status;
    const subscriptionCancelAtPeriodEnd = session?.user?.app_metadata?.subscription_cancel_at_period_end;
    const subscriptionCurrentPeriodEnd = session?.user?.app_metadata?.subscription_current_period_end;
    const isCancelScheduled = Boolean(
        subscriptionCancelAtPeriodEnd || subscriptionStatus === 'scheduled_cancel'
    );
    const authProviderLabel = getAuthProviderLabel(session);

    const formatPeriodEnd = (value?: string | null) => {
        if (!value) {
            return null;
        }
        const date = new Date(value);
        if (Number.isNaN(date.getTime())) {
            return null;
        }
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    };
    const formattedPeriodEnd = formatPeriodEnd(subscriptionCurrentPeriodEnd);

    useEffect(() => {
        return () => {
            if (noticeTimerRef.current) {
                clearTimeout(noticeTimerRef.current);
            }
        };
    }, []);

    const refreshDriveState = () => {
        const token = getDriveAccessToken();
        setDriveConnected(Boolean(token));
        setDriveAccountEmail(getDriveAccountEmail());
        localStorage.setItem(DRIVE_CONNECTED_STORAGE_KEY, token ? 'true' : 'false');
    };

    useEffect(() => {
        const stored = localStorage.getItem(EXPORT_TARGET_STORAGE_KEY);
        if (stored === 'download' || stored === 'drive') {
            setExportTarget(stored);
        }
    }, []);

    useEffect(() => {
        const stored = localStorage.getItem(PDF_QUALITY_STORAGE_KEY);
        if (stored === 'size' || stored === 'clarity') {
            setPdfQuality(stored);
        }
    }, []);

    useEffect(() => {
        refreshDriveState();
    }, []);

    useEffect(() => {
        let isActive = true;
        if (isSignedIn && !isPlus) {
            consumeTrial(false)
                .then((trialResult) => {
                    if (!isActive) {
                        return;
                    }
                    if (typeof trialResult.remaining === 'number') {
                        setTrialRemaining(trialResult.remaining);
                    }
                })
                .catch((err) => {
                    console.error(err);
                });
        } else {
            setTrialRemaining(null);
        }
        return () => {
            isActive = false;
        };
    }, [isSignedIn, isPlus]);

    const showNotice = (type: 'success' | 'error' | 'info', message: string) => {
        setNotice({ type, message });
        if (noticeTimerRef.current) {
            clearTimeout(noticeTimerRef.current);
        }
        noticeTimerRef.current = setTimeout(() => setNotice(null), 3500);
    };

    const isPlusExport = (format: ExportFormat, contentType?: ContentType) => {
        if (!contentType) {
            return false;
        }
        return PLUS_EXPORTS.has(`${contentType}:${format}`);
    };

    const hasDriveAccess = Boolean(getDriveAccessToken()) && driveConnected;

    const handleExportTargetChange = (value: ExportTarget) => {
        setExportTarget(value);
        localStorage.setItem(EXPORT_TARGET_STORAGE_KEY, value);
    };

    const handlePdfQualityChange = (value: PdfQualityPreference) => {
        setPdfQuality(value);
        localStorage.setItem(PDF_QUALITY_STORAGE_KEY, value);
    };

    const handleConnectDrive = async () => {
        if (!isSignedIn) {
            showNotice('info', 'Sign in to connect Google Drive.');
            onRequestLogin?.();
            return;
        }
        setLoadingAction('drive-connect');
        try {
            const driveResult = await connectGoogleDrive(getGoogleDriveOAuthScopes());
            setDriveConnected(true);
            setDriveAccountEmail(driveResult.email ?? null);
            localStorage.setItem(DRIVE_CONNECTED_STORAGE_KEY, 'true');
        } catch (err) {
            console.error(err);
            showNotice('error', 'Could not connect Google Drive. Please try again.');
        } finally {
            setLoadingAction(null);
        }
    };

    const disconnectDrive = (options?: { silent?: boolean }) => {
        resetDriveConnection();
        setDriveConnected(false);
        setDriveAccountEmail(null);
        localStorage.removeItem(DRIVE_CONNECTED_STORAGE_KEY);
        if (!options?.silent) {
            showNotice('info', 'Google Drive disconnected.');
        }
    };

    const handleDisconnectDrive = () => {
        disconnectDrive();
    };

    const handleSignOut = async () => {
        disconnectDrive({ silent: true });
        await supabase.auth.signOut();
    };

    const handleUpgrade = async () => {
        if (!isSignedIn) {
            showNotice('info', 'Sign in to upgrade.');
            onRequestLogin?.();
            return;
        }
        if (upgradeInFlightRef.current) {
            return;
        }
        upgradeInFlightRef.current = true;
        setLoadingAction('upgrade');
        try {
            const checkoutUrl = await createCheckoutSession();
            await browser.tabs.create({ url: checkoutUrl });
        } catch (err) {
            console.error(err);
            showNotice('error', 'Could not start checkout. Please try again.');
        } finally {
            setLoadingAction(null);
            upgradeInFlightRef.current = false;
        }
    };

    const openUpgradeModal = (context: 'drive' | 'format' | 'general' = 'general') => {
        setShowAccountPanel(false);
        setUpgradeContext(context);
        setShowUpgradeModal(true);
    };

    const handleManageBilling = async () => {
        setLoadingAction('billing');
        try {
            const portalUrl = await createCustomerPortalLink();
            await browser.tabs.create({ url: portalUrl });
        } catch (err) {
            console.error(err);
            showNotice('error', 'Could not open billing portal. Please try again.');
        } finally {
            setLoadingAction(null);
        }
    };

    const handleExport = async (
        format: ExportFormat,
        contentType?: ContentType,
        options?: { pdfQualityOverride?: PdfQualityPreference }
    ) => {
        const actionId = contentType ? `${contentType}:${format}` : 'notebooklm-payload';
        setLoadingAction(actionId);
        try {
            const plusExport = isPlusExport(format, contentType);
            const requiresPlus = plusExport || (exportTarget === 'drive' && DRIVE_EXPORT_REQUIRES_PLUS);
                if (requiresPlus) {
                    if (!isSignedIn) {
                        showNotice('info', 'Sign in to unlock advanced exports.');
                        onRequestLogin?.();
                        return;
                    }
                if (!isPlus) {
                    const trialResult = await consumeTrial(false);
                    if (!trialResult.allowed) {
                        showNotice('error', 'Your free trials are used up. Upgrade to continue.');
                        openUpgradeModal(exportTarget === 'drive' ? 'drive' : 'format');
                        return;
                    }
                    if (typeof trialResult.remaining === 'number') {
                        setTrialRemaining(trialResult.remaining);
                    }
                }
            }

            if (exportTarget === 'drive' && !hasDriveAccess) {
                showNotice('info', 'Connect Google Drive to continue.');
                refreshDriveState();
                return;
            }

            const tabs = await browser.tabs.query({ active: true, currentWindow: true });
            if (tabs.length === 0 || !tabs[0].id) {
                showNotice('error', 'No active tab found.');
                return;
            }

            const tabTitle = sanitizeFilename(tabs[0].title || 'notebooklm');
            const timestamp = getTimestamp();
            if (contentType) {
                const response = await extractByType(contentType, tabs[0].id, format);
                if (response && response.success && response.payload) {
                    const payload = response.payload;
                    const contentLabel = payload.type === 'quiz'
                        ? 'Quiz'
                        : payload.type === 'flashcards'
                            ? 'Flashcards'
                            : payload.type === 'mindmap'
                                ? 'Mindmap'
                                : payload.type === 'note'
                                    ? 'Note'
                                    : payload.type === 'chat'
                                        ? 'Chat'
                                        : payload.type === 'source'
                                            ? 'Sources'
                                            : 'Data table';
                    let result;
                    switch (payload.type) {
                        case 'quiz':
                            result = await exportByType('quiz', payload.items, format, tabTitle, timestamp);
                            break;
                        case 'flashcards':
                            result = await exportByType('flashcards', payload.items, format, tabTitle, timestamp);
                            break;
                        case 'mindmap':
                            result = await exportByType('mindmap', payload.items, format, tabTitle, timestamp, payload.meta);
                            break;
                        case 'note':
                            result = await exportByType(
                                'note',
                                payload.items,
                                format,
                                tabTitle,
                                timestamp,
                                payload.meta,
                                { pdfQuality: options?.pdfQualityOverride ?? pdfQuality }
                            );
                            break;
                        case 'chat':
                            result = await exportByType(
                                'chat',
                                payload.items,
                                format,
                                tabTitle,
                                timestamp,
                                undefined,
                                { pdfQuality: options?.pdfQualityOverride ?? pdfQuality }
                            );
                            break;
                        case 'source':
                            result = await exportByType('source', payload.items, format, tabTitle, timestamp);
                            break;
                        default:
                            result = await exportByType('datatable', payload.items, format, tabTitle, timestamp);
                            break;
                    }
                    if (exportTarget === 'drive') {
                        setUploadProgress({ percent: 0 });
                    }
                    const delivered = await deliverExport(
                        exportTarget,
                        result,
                        session,
                        exportTarget === 'drive'
                            ? (progress) => setUploadProgress({ percent: progress.percent })
                            : undefined
                    );
                    if (delivered.success) {
                        const formatName = format === 'CSV' ? 'Excel' : format;
                        const destinationLabel = exportTarget === 'drive' ? 'Google Drive' : 'Downloads';
                        let trialMessage = '';
                        if (requiresPlus && !isPlus) {
                            const trialResult = await consumeTrial(true);
                            if (typeof trialResult.remaining === 'number') {
                                const remainingText = trialResult.remaining === 1 ? '1 export' : `${trialResult.remaining} exports`;
                                setTrialRemaining(trialResult.remaining);
                                trialMessage = ` Trial used. ${remainingText} left.`;
                            }
                        }
                        showNotice('success', `Exported ${contentLabel} to ${destinationLabel} as ${formatName}.${trialMessage}`);
                    } else {
                        const failureMessage = delivered.error
                            || (exportTarget === 'drive'
                                ? 'Export failed. Check your Drive connection and try again.'
                                : 'Export failed.');
                        showNotice('error', failureMessage);
                    }
                    setUploadProgress(null);
                    return;
                }

                showNotice('error', EXTRACTION_ERROR_MESSAGE);
                return;
            }

            const response = await extractNotebookLmPayload(tabs[0].id, format);
            if (response && response.success) {
                showNotice('info', 'Export started. You will be prompted when it is ready.');
            } else {
                showNotice('error', EXTRACTION_ERROR_MESSAGE);
            }
        } catch (err) {
            console.error(err);
            showNotice('error', 'Error communicating with content script. Refresh the page and try again.');
        } finally {
            setLoadingAction(null);
        }
    };

    const handleRequestLogin = () => {
        onRequestLogin?.();
    };

    return (
        <div className="exportkit-shell">
            <div className="dashboard-container">
                {/* Header */}
                <DashboardHeader
                    isSignedIn={isSignedIn}
                    onAccountClick={() => setShowAccountPanel(true)}
                    onSignOut={handleSignOut}
                    onSignIn={handleRequestLogin}
                />

                <ExportDestinationCard exportTarget={exportTarget} onChange={handleExportTargetChange} />

                {!isPlus && (
                    <UpgradeBanner trialRemaining={trialRemaining} onUpgrade={() => openUpgradeModal('general')} />
                )}

                {exportTarget === 'drive' && (
                    <DriveSetupCard
                        isSignedIn={isSignedIn}
                        hasDriveAccess={hasDriveAccess}
                        driveAccountEmail={driveAccountEmail}
                        loadingAction={loadingAction}
                        isPlus={isPlus}
                        onRequestLogin={handleRequestLogin}
                        onConnectDrive={handleConnectDrive}
                        onUpgrade={() => openUpgradeModal('drive')}
                    />
                )}

                {uploadProgress && (
                    <div className="upload-progress">
                        <div className="upload-progress-meta">
                            <span>Uploading to Drive</span>
                            <span>{uploadProgress.percent}%</span>
                        </div>
                        <div className="upload-progress-bar">
                            <div className="upload-progress-fill" style={{ width: `${uploadProgress.percent}%` }} />
                        </div>
                    </div>
                )}

                <ExportActions
                    sections={EXPORT_SECTIONS}
                    loadingAction={loadingAction}
                    onExport={handleExport}
                    pdfQuality={pdfQuality}
                    onPdfQualityChange={handlePdfQualityChange}
                />

                {notice && <ToastNotice notice={notice} />}
            </div>
            {showUpgradeModal && (
                <UpgradeModal
                    upgradeContext={upgradeContext}
                    trialRemaining={trialRemaining}
                    loadingAction={loadingAction}
                    isPlus={isPlus}
                    onClose={() => setShowUpgradeModal(false)}
                    onUpgrade={handleUpgrade}
                    onManageBilling={handleManageBilling}
                />
            )}
            {showAccountPanel && (
                <AccountPanel
                    email={session?.user?.email ?? null}
                    authProviderLabel={authProviderLabel}
                    isPlus={isPlus}
                    hasDriveAccess={hasDriveAccess}
                    driveAccountEmail={driveAccountEmail}
                    isCancelScheduled={isCancelScheduled}
                    formattedPeriodEnd={formattedPeriodEnd}
                    trialRemaining={trialRemaining}
                    loadingAction={loadingAction}
                    onClose={() => setShowAccountPanel(false)}
                    onConnectDrive={handleConnectDrive}
                    onDisconnectDrive={handleDisconnectDrive}
                    onManageBilling={handleManageBilling}
                    onUpgrade={() => openUpgradeModal('general')}
                />
            )}
        </div>
    );
}
