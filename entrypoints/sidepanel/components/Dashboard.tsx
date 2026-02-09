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
import { SettingsPanel } from './dashboard/SettingsPanel';
import { ToastNotice } from './dashboard/ToastNotice';
import { UpgradeBanner } from './dashboard/UpgradeBanner';
import { UpgradeModal } from './dashboard/UpgradeModal';
import { WhatsNewModal } from './dashboard/WhatsNewModal';
import { useI18n } from '../i18n/i18n';
import type { MessageKey } from '../i18n/messages';

const buildExportSections = (t: (key: any, params?: any) => string): ExportSection[] => [
    {
        title: t('export.section.quiz'),
        contentType: 'quiz',
        options: [
            { format: 'CSV', label: 'Excel' },
            { format: 'JSON' },
            { format: 'HTML' },
            { format: 'Anki', isPlus: true },
        ],
    },
    {
        title: t('export.section.flashcards'),
        contentType: 'flashcards',
        options: [
            { format: 'CSV', label: 'Excel' },
            { format: 'JSON' },
            { format: 'HTML' },
            { format: 'Anki', isPlus: true },
        ],
    },
    {
        title: t('export.section.mindmap'),
        contentType: 'mindmap',
        options: [
            { format: 'SVG' },
            { format: 'HTML', label: 'HTML' },
            { format: 'FreeMind', label: 'FreeMind' },
            { format: 'JSONCanvas', label: 'JSONCanvas', isPlus: true, apps: ['Obsidian'] },
            { format: 'OPML', label: 'OPML', isPlus: true, apps: ['XMind', 'MindMeister'] },
            { format: 'Markdown', label: 'Markdown', isPlus: true, apps: ['Whimsical', 'Obsidian'] },
        ],
    },
    {
        title: t('export.section.datatable'),
        contentType: 'datatable',
        options: [
            { format: 'CSV', label: 'Excel' },
            { format: 'Markdown' },
        ],
    },
    {
        title: t('export.section.report'),
        contentType: 'report',
        options: [
            { format: 'PDF' },
            { format: 'Word', label: 'Word', isPlus: true },
            { format: 'Markdown', isPlus: true },
            { format: 'HTML', isPlus: true },
        ],
    },
    {
        title: t('export.section.slidedeck'),
        contentType: 'slidedeck',
        options: [
            { format: 'PDF' },
            { format: 'PPTX', label: 'PowerPoint' },
            { format: 'HTML' },
            { format: 'ZIP', label: 'Markdown' },
        ],
    },
    {
        title: t('export.section.infographic'),
        contentType: 'infographic',
        options: [
            { format: 'PNG' },
            { format: 'PDF' },
            { format: 'HTML' },
        ],
    },
    {
        title: t('export.section.videoOverview'),
        contentType: 'videooverview',
        options: [
            { format: 'MP4', label: 'MP4' },
            { format: 'WAV', label: 'Audio (WAV)' },
            { format: 'PDF', label: 'PDF' },
            { format: 'Markdown', label: 'Markdown', isPlus: true },
            { format: 'ZIP', label: 'Frames ZIP', isPlus: true },
            { format: 'PPTX', label: 'PowerPoint', isPlus: true },
            { format: 'HTML', label: 'HTML', isPlus: true },
        ],
    },
    {
        title: t('export.section.note'),
        contentType: 'note',
        options: [
            { format: 'PDF' },
            { format: 'Word', label: 'Word', isPlus: true },
            { format: 'Markdown', isPlus: true },
        ],
    },
    {
        title: t('export.section.chat'),
        contentType: 'chat',
        options: [
            { format: 'PDF' },
            { format: 'JSON' },
            { format: 'Word', label: 'Word', isPlus: true },
            { format: 'Markdown', isPlus: true },
            { format: 'HTML', isPlus: true },
        ],
    },
    {
        title: t('export.section.source'),
        contentType: 'source',
        options: [
            { format: 'PDF' },
            { format: 'Word', label: 'Word', isPlus: true },
            { format: 'Markdown', label: 'Markdown', isPlus: true },
        ],
    },
];
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
    slidedeck: 'HTML',
    infographic: 'HTML',
    videooverview: 'MP4',
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

const withClipboardOptions = (sections: ExportSection[], clipboardLabel: string) =>
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
            label: clipboardLabel,
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

const EXPORT_TARGET_STORAGE_KEY = 'exportkitExportTarget';
const PDF_QUALITY_STORAGE_KEY = 'exportkitPdfQuality';
const NOTION_VIDEO_MODE_STORAGE_KEY = 'exportkitNotionVideoMode';
const WHATS_NEW_STORAGE_KEY = 'exportkitWhatsNewSeenVersion';
const WHATS_NEW_VERSION = browser.runtime.getManifest().version;
const WHATS_NEW_FEATURES_BY_VERSION: Record<string, MessageKey[]> = {
    '1.3.9': [
        'whatsNew.feature.sideDeckExport',
        'whatsNew.feature.dataTableSources',
    ],
    '1.3.10': [
        'whatsNew.feature.reportHtmlExport',
        'whatsNew.feature.chatHtmlExport',
    ],
    '1.4.0': [
        'whatsNew.feature.infographicExport',
    ],
    '1.4.2': [
        'whatsNew.feature.videoOverviewExport',
    ],
};

const compareSemver = (a: string, b: string) => {
    const aParts = a.split('.').map((part) => Number.parseInt(part, 10) || 0);
    const bParts = b.split('.').map((part) => Number.parseInt(part, 10) || 0);
    const maxLen = Math.max(aParts.length, bParts.length);
    for (let index = 0; index < maxLen; index += 1) {
        const aPart = aParts[index] ?? 0;
        const bPart = bParts[index] ?? 0;
        if (aPart > bPart) return 1;
        if (aPart < bPart) return -1;
    }
    return 0;
};

const getUnseenWhatsNewFeatureKeys = (seenVersion: string | null): MessageKey[] => {
    const unseenVersions = Object.keys(WHATS_NEW_FEATURES_BY_VERSION)
        .filter((version) => compareSemver(version, WHATS_NEW_VERSION) <= 0)
        .filter((version) => !seenVersion || compareSemver(version, seenVersion) > 0)
        .sort(compareSemver);

    const dedupedKeys: MessageKey[] = [];
    const seenKeys = new Set<MessageKey>();
    unseenVersions.forEach((version) => {
        const keys = WHATS_NEW_FEATURES_BY_VERSION[version] ?? [];
        keys.forEach((key) => {
            if (seenKeys.has(key)) {
                return;
            }
            seenKeys.add(key);
            dedupedKeys.push(key);
        });
    });
    return dedupedKeys;
};
const DRIVE_EXPORT_REQUIRES_PLUS = true;
const NOTION_EXPORT_REQUIRES_PLUS = true;
export default function Dashboard({
    session,
    onRequestLogin,
}: {
    session: any;
    onRequestLogin?: () => void;
}) {
    const { t, formatDate, formatList } = useI18n();
    const exportSections = useMemo(() => buildExportSections(t), [t]);
    const plusExports = useMemo(() => new Set(
        exportSections.flatMap((section) =>
            section.options
                .filter((option) => option.isPlus)
                .map((option) => `${section.contentType}:${option.format}`)
        )
    ), [exportSections]);
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
    const [showSettingsPanel, setShowSettingsPanel] = useState(false);
    const [showWhatsNewModal, setShowWhatsNewModal] = useState(false);
    const [upgradeContext, setUpgradeContext] = useState<'drive' | 'notion' | 'format' | 'general' | null>(null);
    const noticeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const upgradeInFlightRef = useRef(false);
    const [exportTarget, setExportTarget] = useState<ExportTarget>('download');
    const [pdfQuality, setPdfQuality] = useState<PdfQualityPreference>('size');
    const [notionVideoMode, setNotionVideoMode] = useState<'external' | 'upload'>('external');
    const [whatsNewFeatureKeys, setWhatsNewFeatureKeys] = useState<MessageKey[]>([]);
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
        return formatDate(value, {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    };
    const formattedPeriodEnd = formatPeriodEnd(subscriptionCurrentPeriodEnd);

    const formatName = (format: ExportFormat) => (format === 'CSV' ? 'Excel' : format);

    const getContentLabel = (type: ContentType) => {
        switch (type) {
            case 'quiz':
                return t('content.quiz');
            case 'flashcards':
                return t('content.flashcards');
            case 'mindmap':
                return t('content.mindmap');
            case 'note':
                return t('content.note');
            case 'report':
                return t('content.report');
            case 'chat':
                return t('content.chat');
            case 'source':
                return t('content.source');
            case 'slidedeck':
                return t('content.slidedeck');
            case 'infographic':
                return t('content.infographic');
            case 'videooverview':
                return t('content.videoOverview');
            default:
                return t('content.datatable');
        }
    };

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
        const stored = localStorage.getItem(NOTION_VIDEO_MODE_STORAGE_KEY);
        if (stored === 'external' || stored === 'upload') {
            setNotionVideoMode(stored);
        }
    }, []);

    useEffect(() => {
        const seenVersion = localStorage.getItem(WHATS_NEW_STORAGE_KEY);
        const unseenKeys = getUnseenWhatsNewFeatureKeys(seenVersion);
        setWhatsNewFeatureKeys(unseenKeys);
        if (unseenKeys.length > 0 && seenVersion !== WHATS_NEW_VERSION) {
            setShowWhatsNewModal(true);
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
            showNotice('error', t('notice.notionPagesError'));
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
        return plusExports.has(`${contentType}:${format}`);
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

    const handleNotionVideoModeChange = (value: 'external' | 'upload') => {
        setNotionVideoMode(value);
        localStorage.setItem(NOTION_VIDEO_MODE_STORAGE_KEY, value);
    };

    const handleConnectDrive = async () => {
        if (!isSignedIn) {
            showNotice('info', t('notice.signInToConnectDrive'));
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
            showNotice('error', t('notice.driveConnectError'));
        } finally {
            setLoadingAction(null);
        }
    };

    const handleConnectNotion = async () => {
        if (!isSignedIn) {
            showNotice('info', t('notice.signInToConnectNotion'));
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
            showNotice('error', err?.message || t('notice.notionConnectError'));
        } finally {
            setLoadingAction(null);
        }
    };

    const disconnectDrive = async (options?: { silent?: boolean }) => {
        await resetDriveConnection();
        setDriveConnected(false);
        setDriveAccountEmail(null);
        if (!options?.silent) {
            showNotice('info', t('notice.driveDisconnected'));
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
            showNotice('info', t('notice.notionDisconnected'));
        }
    };

    const handleDisconnectNotion = () => {
        void disconnectNotion();
    };

    const handleConfigureNotionDestination = async (value: string) => {
        const token = await getNotionAccessToken();
        if (!token) {
            showNotice('info', t('notice.notionDestinationMissingToken'));
            return;
        }
        setLoadingAction('notion-destination');
        try {
            const database = await configureNotionDestination(token, value);
            if (!database) {
                showNotice('error', t('notice.notionDestinationError'));
                return;
            }
            setNotionDatabaseId(database.id);
            showNotice(
                'success',
                database.title
                    ? t('notice.notionDestinationSet', { title: database.title })
                    : t('notice.notionDestinationReady')
            );
        } catch (err: any) {
            console.error(err);
            showNotice('error', err?.message || t('notice.notionDestinationError'));
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
            showNotice('info', t('notice.signInToUpgrade'));
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
            showNotice('error', t('notice.checkoutError'));
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
            showNotice('error', t('notice.billingPortalError'));
        } finally {
            setLoadingAction(null);
        }
    };

    const handleExport = async (
        format: ExportFormat,
        contentType?: ContentType,
        options?: {
            pdfQualityOverride?: PdfQualityPreference;
            deliveryOverride?: ExportDelivery;
            notionVideoModeOverride?: 'external' | 'upload';
        }
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
                    showNotice('info', t('notice.signInToUnlock'));
                    onRequestLogin?.();
                    return;
                }
                if (!isPlus) {
                    const trialResult = await consumeTrial(false);
                    if (!trialResult.allowed) {
                        showNotice('error', t('notice.trialsUsedUp'));
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
                        t('notice.notionUnsupportedFormat', {
                            contentLabel: getContentLabel(contentType),
                            formats: formatList(supportedFormats.map(formatName)),
                        })
                    );
                    return;
                }
            }

            if (exportTarget === 'drive' && !hasDriveAccess) {
                showNotice('info', t('notice.connectDriveToContinue'));
                void refreshDriveState();
                return;
            }

            if (exportTarget === 'notion') {
                if (!hasNotionAccess) {
                    showNotice('info', t('notice.connectNotionToContinue'));
                    refreshNotionState();
                    return;
                }
                if (!notionDatabaseId) {
                    showNotice('info', t('notice.setNotionDestination'));
                    return;
                }
            }

            const tabs = await browser.tabs.query({ active: true, currentWindow: true });
            if (tabs.length === 0 || !tabs[0].id) {
                showNotice('error', t('notice.noActiveTab'));
                return;
            }

            const rawTabTitle = tabs[0].title || 'notebooklm';
            const tabTitle = sanitizeFilename(rawTabTitle);
            const timestamp = getTimestamp();
            if (contentType) {
                const extractStart = performance.now();
                const response = await extractByType(contentType, tabs[0].id, format);
                if (contentType === 'videooverview') {
                    console.info('[VIDEO_OVERVIEW_EXPORT] extract_complete', {
                        format,
                        elapsedMs: Math.round(performance.now() - extractStart),
                        success: Boolean(response?.success)
                    });
                }
                if (response && response.success && response.payload) {
                    const payload = response.payload;
                    const contentLabel = getContentLabel(payload.type);
                    if (payload.type === 'videooverview' && format === 'MP4' && exportTarget === 'download') {
                        const videoItem = payload.items[0] as { videoUrl?: string } | undefined;
                        const videoUrl = videoItem?.videoUrl;
                        if (!videoUrl) {
                            showNotice('error', t('notice.exportFailed'));
                            return;
                        }
                        const filename = `notebooklm_video_overview_${tabTitle}_${timestamp}.mp4`;
                        const downloadStart = performance.now();
                        const bgDownload = await browser.runtime.sendMessage({
                            type: 'download-video-file',
                            url: videoUrl,
                            filename
                        });
                        console.info('[VIDEO_OVERVIEW_EXPORT] bg_download_complete', {
                            elapsedMs: Math.round(performance.now() - downloadStart),
                            mode: bgDownload?.mode,
                            bytes: bgDownload?.bytes,
                            success: Boolean(bgDownload?.success)
                        });
                        if (!bgDownload?.success) {
                            showNotice('error', t('notice.exportFailed'));
                            return;
                        }
                        if (requiresPlus && !isPlus) {
                            const trialResult = await consumeTrial(true);
                            if (typeof trialResult.remaining === 'number') {
                                setTrialRemaining(trialResult.remaining);
                            }
                        }
                        showNotice('success', t('notice.exportSuccess', {
                            contentLabel,
                            destination: t('common.downloads'),
                            format: formatName(format),
                            trialMessage: '',
                        }));
                        return;
                    }
                    let result;
                    const effectiveNotionVideoMode = options?.notionVideoModeOverride ?? notionVideoMode;
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
                        case 'slidedeck':
                            result = await exportByType(
                                'slidedeck',
                                payload.items,
                                format,
                                tabTitle,
                                timestamp,
                                payload.meta
                            );
                            break;
                        case 'infographic':
                            result = await exportByType(
                                'infographic',
                                payload.items,
                                format,
                                tabTitle,
                                timestamp,
                                payload.meta
                            );
                            break;
                        case 'videooverview':
                            if (exportTarget === 'notion' && effectiveNotionVideoMode === 'external') {
                                result = {
                                    success: true as const,
                                    count: payload.items.length,
                                    filename: `notebooklm_video_overview_${tabTitle}_${timestamp}.mp4`,
                                    mimeType: 'video/mp4',
                                    blob: new Blob([], { type: 'video/mp4' }),
                                };
                            } else {
                                result = await exportByType(
                                    'videooverview',
                                    payload.items,
                                    format,
                                    tabTitle,
                                    timestamp,
                                    payload.meta
                                );
                            }
                            break;
                        default:
                            result = await exportByType('datatable', payload.items, format, tabTitle, timestamp, payload.meta);
                            break;
                    }
                    if (!result.success) {
                        showNotice('error', result.error || t('notice.exportFailed'));
                        return;
                    }
                    const getTrialMessage = async () => {
                        if (requiresPlus && !isPlus) {
                            const trialResult = await consumeTrial(true);
                            if (typeof trialResult.remaining === 'number') {
                                setTrialRemaining(trialResult.remaining);
                                return ` ${t('trial.used', { count: trialResult.remaining })}`;
                            }
                        }
                        return '';
                    };

                    if (exportTarget === 'download' && options?.deliveryOverride === 'clipboard') {
                        try {
                            const markdownText = await result.blob.text();
                            await copyTextToClipboard(markdownText);
                            const trialMessage = await getTrialMessage();
                            showNotice('success', t('notice.copySuccess', {
                                contentLabel,
                                trialMessage,
                            }));
                        } catch (err) {
                            console.error(err);
                            showNotice('error', t('notice.copyFailed'));
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
                                notebookId: getNotebookIdFromUrl(tabs[0].url) ?? undefined,
                                notebookTitle: rawTabTitle,
                                items: payload.items,
                                meta: payload.meta,
                                notionVideoMode: options?.notionVideoModeOverride ?? notionVideoMode,
                            }
                            : undefined
                    );
                    if (delivered.success) {
                        const destinationLabel = exportTarget === 'drive'
                            ? t('common.googleDrive')
                            : exportTarget === 'notion'
                                ? t('common.notion')
                                : t('common.downloads');
                        const trialMessage = await getTrialMessage();
                        showNotice('success', t('notice.exportSuccess', {
                            contentLabel,
                            destination: destinationLabel,
                            format: formatName(format),
                            trialMessage,
                        }));
                    } else {
                        const failureMessage = delivered.error
                            || (exportTarget === 'drive'
                                ? t('notice.exportFailedDrive')
                                : exportTarget === 'notion'
                                    ? t('notice.exportFailedNotion')
                                    : t('notice.exportFailed'));
                        showNotice('error', failureMessage);
                    }
                    setUploadProgress(null);
                    return;
                }

                showNotice('error', t('notice.extractionFailed'));
                return;
            }

            if (exportTarget === 'notion') {
                showNotice('error', t('notice.notionSpecificFormat'));
                return;
            }

            const response = await extractNotebookLmPayload(tabs[0].id, format);
            if (response && response.success) {
                showNotice('info', t('notice.exportStarted'));
            } else {
                showNotice('error', t('notice.extractionFailed'));
            }
        } catch (err) {
            console.error(err);
            showNotice('error', t('notice.contentScriptError'));
        } finally {
            setLoadingAction(null);
        }
    };

    const handleRequestLogin = () => {
        onRequestLogin?.();
    };
    const handleCloseWhatsNewModal = () => {
        localStorage.setItem(WHATS_NEW_STORAGE_KEY, WHATS_NEW_VERSION);
        setShowWhatsNewModal(false);
    };
    const visibleSections = exportTarget === 'notion'
        ? filterSectionsForNotion(exportSections)
        : exportTarget === 'download'
            ? withClipboardOptions(exportSections, t('export.option.clipboard'))
            : exportSections;

    return (
        <div className="exportkit-shell">
            <div className="dashboard-container">
                {/* Header */}
                <DashboardHeader
                    isSignedIn={isSignedIn}
                    onAccountClick={() => setShowAccountPanel(true)}
                    onSignOut={handleSignOut}
                    onSignIn={handleRequestLogin}
                    leftSlot={!isSignedIn ? (
                        <button
                            type="button"
                            className="export-btn small"
                            onClick={() => setShowSettingsPanel(true)}
                        >
                            {t('common.settings')}
                        </button>
                    ) : null}
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
                            <span>{t('common.uploadingToDrive')}</span>
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
                    notionVideoMode={notionVideoMode}
                    onNotionVideoModeChange={handleNotionVideoModeChange}
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
            {!isSignedIn && showSettingsPanel && (
                <SettingsPanel onClose={() => setShowSettingsPanel(false)} />
            )}
            {showWhatsNewModal && (
                <WhatsNewModal onClose={handleCloseWhatsNewModal} featureKeys={whatsNewFeatureKeys} />
            )}
        </div>
    );
}

