import React, { useEffect, useRef, useState } from 'react';
import { supabase } from '../../../utils/supabase';
import { browser } from 'wxt/browser';
import { sanitizeFilename, getTimestamp } from '../../../utils/common';
import { ContentType, ExportFormat } from '../../../utils/export-core';
import { exportByType } from '../../../utils/export-dispatch';

import { extractByType } from '../../../utils/extractors';
import { extractNotebookLmPayload } from '../../../utils/extractors/common';
import { consumeTrial, createCheckoutSession, createCustomerPortalLink, getPlan } from '../../../utils/billing';

const EXPORT_SECTIONS: Array<{
    title: string;
    contentType: ContentType;
    options: Array<{
        format: ExportFormat;
        label?: string;
        isPlus?: boolean;
    }>;
}> = [
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
                { format: 'Markdown' },
                { format: 'SVG' },
                { format: 'JSONCanvas', label: 'Obsidian', isPlus: true },
                { format: 'OPML', isPlus: true },
                { format: 'FreeMind', label: 'FreeMind (.mm)', isPlus: true },
            ],
        },
        {
            title: 'Note Exports',
            contentType: 'note',
            options: [
                { format: 'Word', label: 'Word', isPlus: true },
                { format: 'Markdown', isPlus: true },
                { format: 'PDF' },
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
    ];

const PLUS_EXPORTS = new Set(
    EXPORT_SECTIONS.flatMap((section) =>
        section.options
            .filter((option) => option.isPlus)
            .map((option) => `${section.contentType}:${option.format}`)
    )
);

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
    const noticeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const upgradeInFlightRef = useRef(false);
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

    const handleSignOut = async () => {
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

    const handleExport = async (format: ExportFormat, contentType?: ContentType) => {
        const actionId = contentType ? `${contentType}:${format}` : 'notebooklm-payload';
        setLoadingAction(actionId);
        try {
            const plusExport = isPlusExport(format, contentType);
            if (plusExport) {
                if (!isSignedIn) {
                    showNotice('info', 'Sign in to unlock advanced exports.');
                    onRequestLogin?.();
                    return;
                }
                if (!isPlus) {
                    const trialResult = await consumeTrial(false);
                    if (!trialResult.allowed) {
                        showNotice('error', 'Your free trials are used up. Upgrade to continue.');
                        return;
                    }
                    if (typeof trialResult.remaining === 'number') {
                        setTrialRemaining(trialResult.remaining);
                    }
                }
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
                    let result;
                    switch (payload.type) {
                        case 'quiz':
                            result = exportByType('quiz', payload.items, format, tabTitle, timestamp);
                            break;
                        case 'flashcards':
                            result = exportByType('flashcards', payload.items, format, tabTitle, timestamp);
                            break;
                        case 'mindmap':
                            result = exportByType('mindmap', payload.items, format, tabTitle, timestamp, payload.meta);
                            break;
                        case 'note':
                            result = exportByType('note', payload.items, format, tabTitle, timestamp, payload.meta);
                            break;
                        default:
                            result = exportByType('datatable', payload.items, format, tabTitle, timestamp);
                            break;
                    }
                    if (result.success) {
                        const label = payload.type === 'quiz'
                            ? 'questions'
                            : payload.type === 'flashcards'
                                ? 'flashcards'
                                : payload.type === 'mindmap'
                                    ? 'nodes'
                                    : payload.type === 'note'
                                        ? 'blocks'
                                        : 'rows';
                        const formatName = format === 'CSV' ? 'Excel' : format;
                        showNotice('success', `Exported ${result.count} ${label} to ${formatName}.`);
                        if (plusExport && !isPlus) {
                            const trialResult = await consumeTrial(true);
                            if (typeof trialResult.remaining === 'number') {
                                const remainingText = trialResult.remaining === 1 ? '1 export' : `${trialResult.remaining} exports`;
                                showNotice('info', `Trial used. ${remainingText} left.`);
                                setTrialRemaining(trialResult.remaining);
                            }
                        }
                    } else {
                        showNotice('error', result.error || 'Export failed.');
                    }
                    return;
                }

                showNotice('error', `Failed to extract ${contentType} content. Ensure you are on a NotebookLM page and the content is visible.`);
                return;
            }

            const response = await extractNotebookLmPayload(tabs[0].id, format);
            if (response && response.success) {
                showNotice('info', 'Export initiated.');
            } else {
                showNotice('error', 'Failed to extract content. Ensure you are on a NotebookLM page and the content is visible.');
            }
        } catch (err) {
            console.error(err);
            showNotice('error', 'Error communicating with content script. Refresh the page and try again.');
        } finally {
            setLoadingAction(null);
        }
    };

    const PlusIcon = () => (
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );

    const Spinner = () => (
        <svg className="spinner" width="14" height="14" viewBox="0 0 50 50" style={{ animation: 'spin 1s linear infinite' }}>
            <circle cx="25" cy="25" r="20" fill="none" stroke="currentColor" strokeWidth="6" strokeLinecap="round" strokeDasharray="80" strokeDashoffset="0"></circle>
            <style>{`@keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
        </svg>
    );

    return (
        <div className="exportkit-shell">
            <div className="dashboard-container">
                {/* Header */}
                <div className="dashboard-header">
                    <h3 className="dashboard-title">Dashboard</h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        {isSignedIn ? (
                            <>
                                <div className="plan-label">
                                    <div className="plan-value">{isPlus ? 'Plus' : 'Free'}</div>
                                </div>
                                <button
                                    onClick={handleSignOut}
                                    title="Sign Out"
                                    className="export-btn small"
                                >
                                    Sign Out
                                </button>
                            </>
                        ) : (
                            <button
                                onClick={() => onRequestLogin?.()}
                                className="export-btn small"
                            >
                                Sign In
                            </button>
                        )}
                    </div>
                </div>

                {/* Manage Billing (Only for Subscribed users) */}
                {isPlus && (
                    <div className="billing-row">
                        {isCancelScheduled && (
                            <span className="billing-badge">
                                Ends {formattedPeriodEnd ?? 'soon'}
                            </span>
                        )}
                        <button
                            onClick={handleManageBilling}
                            disabled={!!loadingAction}
                            className="link-button"
                        >
                            Manage Subscription {loadingAction === 'billing' && <Spinner />}
                        </button>
                    </div>
                )}

                {/* Actions Grid */}
                <div className="actions">
                    {EXPORT_SECTIONS.map((section) => (
                        <div key={section.contentType} className="export-section">
                            <div className="section-label">{section.title}</div>
                            <div className="section-grid">
                                {section.options.map((option) => (
                                    <button
                                        key={`${section.contentType}-${option.format}`}
                                        onClick={() => handleExport(option.format, section.contentType)}
                                        disabled={!!loadingAction}
                                        className="export-btn"
                                    >
                                        <span className="button-content">
                                            {option.label ?? option.format}
                                            {option.isPlus && <PlusIcon />}
                                            {loadingAction === `${section.contentType}:${option.format}` && <Spinner />}
                                        </span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    ))}

                    {/* Upgrade Hook (if Free) */}
                    {isSignedIn && !isPlus && (
                        <div className="upgrade-card">
                            <div className="upgrade-note">
                                Free trial remaining:{' '}
                                {trialRemaining === null
                                    ? 'Checking...'
                                    : trialRemaining === 0
                                        ? 'No exports left'
                                        : `${trialRemaining} ${trialRemaining === 1 ? 'export' : 'exports'}`}
                            </div>
                            <button
                                onClick={handleUpgrade}
                                disabled={!!loadingAction}
                                className="export-btn upgrade-btn"
                            >
                                Upgrade to Unlock Advanced Features <PlusIcon /> {loadingAction === 'upgrade' && <Spinner />}
                            </button>
                        </div>
                    )}

                    {/* Coming Soon */}
                    <div className="coming-soon">
                        <div className="section-label muted">Coming soon</div>
                        <div className="coming-card">
                            Video & Audio Overviews to Transcript/Slides
                        </div>
                    </div>
                </div>

                {/* Toast Notification */}
                {notice && (
                    <div className={`toast ${notice.type}`}>
                        {notice.message}
                    </div>
                )}
            </div>
        </div>
    );
}
