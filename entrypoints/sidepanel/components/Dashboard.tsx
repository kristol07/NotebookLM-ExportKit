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
import {
    clearNotionAuth,
    connectNotion,
    getNotionAccessToken,
    getNotionDatabaseId,
    getNotionWorkspaceName,
} from '../../../utils/notion-auth';
import {
    configureNotionDestination,
    fetchNotionWorkspace,
    getNotebookIdFromUrl,
    listNotionPages,
    NOTION_SUPPORTED_FORMATS_BY_TYPE,
    type NotionPageChoice,
} from '../../../utils/notion';

import { extractByType } from '../../../utils/extractors';
import { extractNotebookLmPayload } from '../../../utils/extractors/common';
import { consumeTrial, createCheckoutSession, createCustomerPortalLink, getPlan } from '../../../utils/billing';
import { AccountPanel } from './dashboard/AccountPanel';
import { DashboardHeader } from './dashboard/DashboardHeader';
import { DriveSetupCard } from './dashboard/DriveSetupCard';
import { NotionSetupCard } from './dashboard/NotionSetupCard';
import { ExportActions, ExportDelivery, ExportSection } from './dashboard/ExportActions';
import { ExportDestinationCard } from './dashboard/ExportDestinationCard';
import { ToastNotice } from './dashboard/ToastNotice';
import { UpgradeBanner } from './dashboard/UpgradeBanner';
import { UpgradeModal } from './dashboard/UpgradeModal';

const BASE_EXPORT_SECTIONS: ExportSection[] = [
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
        title: 'Report Exports',
        contentType: 'report',
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
            { format: 'PDF' },
            { format: 'Word', label: 'Word', isPlus: true },
            { format: 'Markdown', label: 'Markdown', isPlus: true },
        ],
    },
];

const EXPORT_SECTIONS: ExportSection[] = BASE_EXPORT_SECTIONS;
const CLIPBOARD_CONTENT_TYPES = new Set<ContentType>([
    'mindmap',
    'note',
    'report',
    'chat',
    'datatable',
    'source',
]);

const NOTION_EXPORT_FORMAT_BY_TYPE: Record<ContentType, ExportFormat> = {
    quiz: 'JSON',
    flashcards: 'JSON',
    mindmap: 'Markdown',
    datatable: 'CSV',
    note: 'Markdown',
    report: 'Markdown',
    chat: 'Markdown',
    source: 'Markdown',
};

const filterSectionsForNotion = (sections: ExportSection[]) =>
    sections
        .map((section) => {
            const supportedFormats = NOTION_SUPPORTED_FORMATS_BY_TYPE[section.contentType as ContentType] ?? [];
            return {
                ...section,
                options: section.options.filter((option) => supportedFormats.includes(option.format)),
            };
        })
        .filter((section) => section.options.length > 0);

const withClipboardOptions = (sections: ExportSection[]) =>
    sections.map((section) => {
        if (!CLIPBOARD_CONTENT_TYPES.has(section.contentType)) {
            return section;
        }
        if (section.options.some((option) => option.delivery === 'clipboard')) {
            return section;
        }
        const markdownIndex = section.options.findIndex((option) => option.format === 'Markdown');
        if (markdownIndex === -1) {
            return section;
        }
        const markdownOption = section.options[markdownIndex];
        const copyOption = {
            format: 'Markdown' as const,
            label: 'Clipboard',
            isPlus: markdownOption.isPlus,
            delivery: 'clipboard' as ExportDelivery,
        };
        const options = [...section.options];
        options.splice(markdownIndex + 1, 0, copyOption);
        return {
            ...section,
            options,
        };
    });

const PLUS_EXPORTS = new Set(
    EXPORT_SECTIONS.flatMap((section) =>
        section.options
            .filter((option) => option.isPlus)
            .map((option) => `${section.contentType}:${option.format}`)
    )
);
const EXPORT_TARGET_STORAGE_KEY = 'exportkitExportTarget';
const PDF_QUALITY_STORAGE_KEY = 'exportkitPdfQuality';
const DRIVE_EXPORT_REQUIRES_PLUS = true;
const NOTION_EXPORT_REQUIRES_PLUS = true;
const EXTRACTION_ERROR_MESSAGE =
    'Failed to extract content. Ensure you are on a NotebookLM page and the content is visible.';
const getContentLabel = (type: ContentType) => {
    switch (type) {
        case 'quiz':
            return 'Quiz';
        case 'flashcards':
            return 'Flashcards';
        case 'mindmap':
            return 'Mindmap';
        case 'note':
            return 'Note';
        case 'report':
            return 'Report';
        case 'chat':
            return 'Chat';
        case 'source':
            return 'Sources';
        default:
            return 'Data table';
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
    const [notionConnected, setNotionConnected] = useState(false);
    const [notionWorkspaceName, setNotionWorkspaceName] = useState<string | null>(null);
    const [notionDatabaseId, setNotionDatabaseId] = useState<string | null>(null);
    const [notionPages, setNotionPages] = useState<NotionPageChoice[]>([]);
    const [uploadProgress, setUploadProgress] = useState<{ percent: number } | null>(null);
    const [showAccountPanel, setShowAccountPanel] = useState(false);
    const [showUpgradeModal, setShowUpgradeModal] = useState(false);
    const [upgradeContext, setUpgradeContext] = useState<'drive' | 'notion' | 'format' | 'general' | null>(null);
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

    const refreshDriveState = async () => {
        const token = await getDriveAccessToken();
        setDriveConnected(Boolean(token));
        setDriveAccountEmail(await getDriveAccountEmail());
    };
    const refreshNotionState = async () => {
        const token = await getNotionAccessToken();
        setNotionConnected(Boolean(token));
        setNotionWorkspaceName(await getNotionWorkspaceName());
        setNotionDatabaseId(await getNotionDatabaseId());
    };

    const hasDriveAccess = driveConnected;
    const hasNotionAccess = notionConnected;

    useEffect(() => {
        const stored = localStorage.getItem(EXPORT_TARGET_STORAGE_KEY);
        if (stored === 'download' || stored === 'drive' || stored === 'notion') {
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
        void refreshDriveState();
    }, []);

    useEffect(() => {
        void refreshNotionState();
    }, []);

    const loadNotionPages = async () => {
        const token = await getNotionAccessToken();
        if (!token) {
            return;
        }
        setLoadingAction('notion-page-list');
        try {
            const results = await listNotionPages(token);
            setNotionPages(results);
        } catch (err) {
            console.error(err);
            showNotice('error', 'Could not load Notion pages. Try refreshing.');
        } finally {
            setLoadingAction(null);
        }
    };

    useEffect(() => {
        if (exportTarget === 'notion' && hasNotionAccess && notionPages.length === 0) {
            void loadNotionPages();
        }
    }, [exportTarget, hasNotionAccess, notionPages.length]);

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

    const copyTextToClipboard = async (text: string) => {
        if (navigator.clipboard?.writeText) {
            await navigator.clipboard.writeText(text);
            return;
        }
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.setAttribute('readonly', 'true');
        textarea.style.position = 'absolute';
        textarea.style.left = '-9999px';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
    };

    const isPlusExport = (format: ExportFormat, contentType?: ContentType) => {
        if (!contentType) {
            return false;
        }
        return PLUS_EXPORTS.has(`${contentType}:${format}`);
    };

    const isNotionFormatSupported = (format: ExportFormat, contentType?: ContentType) => {
        if (!contentType) {
            return false;
        }
        const supported = NOTION_SUPPORTED_FORMATS_BY_TYPE[contentType as ContentType] ?? [];
        return supported.includes(format);
    };

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
        } catch (err) {
            console.error(err);
            showNotice('error', 'Could not connect Google Drive. Please try again.');
        } finally {
            setLoadingAction(null);
        }
    };

    const handleConnectNotion = async () => {
        if (!isSignedIn) {
            showNotice('info', 'Sign in to connect Notion.');
            onRequestLogin?.();
            return;
        }
        setLoadingAction('notion-connect');
        try {
            const result = await connectNotion();
            setNotionConnected(true);
            const workspace = await fetchNotionWorkspace(result.accessToken);
            setNotionWorkspaceName(workspace ?? await getNotionWorkspaceName());
            void loadNotionPages();
        } catch (err: any) {
            console.error(err);
            showNotice('error', err?.message || 'Could not connect Notion. Please try again.');
        } finally {
            setLoadingAction(null);
        }
    };

    const disconnectDrive = async (options?: { silent?: boolean }) => {
        await resetDriveConnection();
        setDriveConnected(false);
        setDriveAccountEmail(null);
        if (!options?.silent) {
            showNotice('info', 'Google Drive disconnected.');
        }
    };

    const handleDisconnectDrive = () => {
        void disconnectDrive();
    };

    const disconnectNotion = async (options?: { silent?: boolean }) => {
        await clearNotionAuth();
        setNotionConnected(false);
        setNotionWorkspaceName(null);
        setNotionDatabaseId(null);
        setNotionPages([]);
        if (!options?.silent) {
            showNotice('info', 'Notion disconnected.');
        }
    };

    const handleDisconnectNotion = () => {
        void disconnectNotion();
    };

    const handleConfigureNotionDestination = async (value: string) => {
        const token = await getNotionAccessToken();
        if (!token) {
            showNotice('info', 'Connect Notion before setting a destination page.');
            return;
        }
        setLoadingAction('notion-destination');
        try {
            const database = await configureNotionDestination(token, value);
            setNotionDatabaseId(database.id);
            showNotice(
                'success',
                database.title
                    ? `Notion destination set: ${database.title}.`
                    : 'Notion destination is ready.'
            );
        } catch (err: any) {
            console.error(err);
            showNotice('error', err?.message || 'Could not set the Notion destination. Please try again.');
        } finally {
            setLoadingAction(null);
        }
    };

    const handleSignOut = async () => {
        await disconnectDrive({ silent: true });
        await disconnectNotion({ silent: true });
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

    const openUpgradeModal = (context: 'drive' | 'notion' | 'format' | 'general' = 'general') => {
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
        options?: { pdfQualityOverride?: PdfQualityPreference; deliveryOverride?: ExportDelivery }
    ) => {
        const actionId = contentType
            ? `${contentType}:${format}${options?.deliveryOverride ? `:${options.deliveryOverride}` : ''}`
            : 'notebooklm-payload';
        setLoadingAction(actionId);
        try {
            const plusExport = isPlusExport(format, contentType);
            const requiresPlus = plusExport
                || (exportTarget === 'drive' && DRIVE_EXPORT_REQUIRES_PLUS)
                || (exportTarget === 'notion' && NOTION_EXPORT_REQUIRES_PLUS);
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
                        openUpgradeModal(
                            exportTarget === 'drive'
                                ? 'drive'
                                : exportTarget === 'notion'
                                    ? 'notion'
                                    : 'format'
                        );
                        return;
                    }
                    if (typeof trialResult.remaining === 'number') {
                        setTrialRemaining(trialResult.remaining);
                    }
                }
            }

            if (exportTarget === 'notion' && contentType) {
                const supportedFormats = NOTION_SUPPORTED_FORMATS_BY_TYPE[contentType as ContentType] ?? [];
                if (!isNotionFormatSupported(format, contentType)) {
                    showNotice(
                        'error',
                        `Notion exports for ${getContentLabel(contentType)} support ${supportedFormats.join(', ')}.`
                    );
                    return;
                }
            }

            if (exportTarget === 'drive' && !hasDriveAccess) {
                showNotice('info', 'Connect Google Drive to continue.');
                void refreshDriveState();
                return;
            }

            if (exportTarget === 'notion') {
                if (!hasNotionAccess) {
                    showNotice('info', 'Connect Notion to continue.');
                    refreshNotionState();
                    return;
                }
                if (!notionDatabaseId) {
                    showNotice('info', 'Set a Notion destination page to continue.');
                    return;
                }
            }

            const tabs = await browser.tabs.query({ active: true, currentWindow: true });
            if (tabs.length === 0 || !tabs[0].id) {
                showNotice('error', 'No active tab found.');
                return;
            }

            const rawTabTitle = tabs[0].title || 'notebooklm';
            const tabTitle = sanitizeFilename(rawTabTitle);
            const timestamp = getTimestamp();
            if (contentType) {
                const response = await extractByType(contentType, tabs[0].id, format);
                if (response && response.success && response.payload) {
                    const payload = response.payload;
                    const contentLabel = getContentLabel(payload.type);
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
                        case 'report':
                            result = await exportByType(
                                'report',
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
                            result = await exportByType(
                                'source',
                                payload.items,
                                format,
                                tabTitle,
                                timestamp,
                                undefined,
                                { pdfQuality: options?.pdfQualityOverride ?? pdfQuality }
                            );
                            break;
                        default:
                            result = await exportByType('datatable', payload.items, format, tabTitle, timestamp);
                            break;
                    }
                    const getTrialMessage = async () => {
                        if (requiresPlus && !isPlus) {
                            const trialResult = await consumeTrial(true);
                            if (typeof trialResult.remaining === 'number') {
                                const remainingText = trialResult.remaining === 1 ? '1 export' : `${trialResult.remaining} exports`;
                                setTrialRemaining(trialResult.remaining);
                                return ` Trial used. ${remainingText} left.`;
                            }
                        }
                        return '';
                    };

                    if (exportTarget === 'download' && options?.deliveryOverride === 'clipboard') {
                        try {
                            const markdownText = await result.blob.text();
                            await copyTextToClipboard(markdownText);
                            const trialMessage = await getTrialMessage();
                            showNotice('success', `Copied ${contentLabel} Markdown to Clipboard.${trialMessage}`);
                        } catch (err) {
                            console.error(err);
                            showNotice('error', 'Copy failed. Please try again.');
                        }
                        return;
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
                            : undefined,
                        exportTarget === 'notion'
                            ? {
                                contentType: payload.type,
                                format,
                                sourceTitle: rawTabTitle,
                                sourceUrl: tabs[0].url,
                                notebookId: getNotebookIdFromUrl(tabs[0].url),
                                notebookTitle: rawTabTitle,
                                items: payload.items,
                                meta: payload.meta,
                            }
                            : undefined
                    );
                    if (delivered.success) {
                        const formatName = format === 'CSV' ? 'Excel' : format;
                        const destinationLabel = exportTarget === 'drive'
                            ? 'Google Drive'
                            : exportTarget === 'notion'
                                ? 'Notion'
                                : 'Downloads';
                        const trialMessage = await getTrialMessage();
                        showNotice('success', `Exported ${contentLabel} to ${destinationLabel} as ${formatName}.${trialMessage}`);
                    } else {
                        const failureMessage = delivered.error
                            || (exportTarget === 'drive'
                                ? 'Export failed. Check your Drive connection and try again.'
                                : exportTarget === 'notion'
                                    ? 'Export failed. Check your Notion connection and destination.'
                                    : 'Export failed.');
                        showNotice('error', failureMessage);
                    }
                    setUploadProgress(null);
                    return;
                }

                showNotice('error', EXTRACTION_ERROR_MESSAGE);
                return;
            }

            if (exportTarget === 'notion') {
                showNotice('error', 'Choose a specific export format for Notion delivery.');
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
    const visibleSections = exportTarget === 'notion'
        ? filterSectionsForNotion(EXPORT_SECTIONS)
        : exportTarget === 'download'
            ? withClipboardOptions(EXPORT_SECTIONS)
            : EXPORT_SECTIONS;

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

                {exportTarget === 'notion' && (
                    <NotionSetupCard
                        isSignedIn={isSignedIn}
                        hasNotionAccess={hasNotionAccess}
                        notionWorkspaceName={notionWorkspaceName}
                        notionDatabaseId={notionDatabaseId}
                        notionPages={notionPages}
                        loadingAction={loadingAction}
                        isPlus={isPlus}
                        onRequestLogin={handleRequestLogin}
                        onConnectNotion={handleConnectNotion}
                        onConfigureDestination={handleConfigureNotionDestination}
                        onRefreshPages={loadNotionPages}
                        onUpgrade={() => openUpgradeModal('notion')}
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
                    sections={visibleSections}
                    exportTarget={exportTarget}
                    loadingAction={loadingAction}
                    onExport={handleExport}
                    pdfQuality={pdfQuality}
                    onPdfQualityChange={handlePdfQualityChange}
                    notionExportFormatByType={NOTION_EXPORT_FORMAT_BY_TYPE}
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
                    isPlus={isPlus}
                    hasDriveAccess={hasDriveAccess}
                    driveAccountEmail={driveAccountEmail}
                    hasNotionAccess={hasNotionAccess}
                    notionWorkspaceName={notionWorkspaceName}
                    notionDatabaseId={notionDatabaseId}
                    isCancelScheduled={isCancelScheduled}
                    formattedPeriodEnd={formattedPeriodEnd}
                    trialRemaining={trialRemaining}
                    loadingAction={loadingAction}
                    onClose={() => setShowAccountPanel(false)}
                    onConnectDrive={handleConnectDrive}
                    onDisconnectDrive={handleDisconnectDrive}
                    onConnectNotion={handleConnectNotion}
                    onDisconnectNotion={handleDisconnectNotion}
                    onManageBilling={handleManageBilling}
                    onUpgrade={() => openUpgradeModal('general')}
                />
            )}
        </div>
    );
}

