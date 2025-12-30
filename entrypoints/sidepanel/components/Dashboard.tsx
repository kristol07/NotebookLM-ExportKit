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
                    const result =
                        payload.type === 'quiz'
                            ? exportByType('quiz', payload.items, format, tabTitle, timestamp)
                            : payload.type === 'flashcards'
                                ? exportByType('flashcards', payload.items, format, tabTitle, timestamp)
                                : exportByType('mindmap', payload.items, format, tabTitle, timestamp, payload.meta);
                    if (result.success) {
                        const label = payload.type === 'quiz' ? 'questions' : payload.type === 'flashcards' ? 'flashcards' : 'nodes';
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
        <div className="dashboard-container" style={{ padding: '20px', width: '300px', paddingBottom: '60px', position: 'relative', minHeight: '400px' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <h3 style={{ margin: 0 }}>Dashboard</h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    {isSignedIn ? (
                        <>
                            <div style={{ fontSize: '12px', textAlign: 'right' }}>
                                <div style={{ fontWeight: 'bold' }}>{isPlus ? 'Plus' : 'Free'}</div>
                            </div>
                            <button
                                onClick={handleSignOut}
                                title="Sign Out"
                                className="export-btn"
                                style={{
                                    padding: '4px 8px',
                                    cursor: 'pointer',
                                    fontSize: '11px',
                                }}
                            >
                                Sign Out
                            </button>
                        </>
                    ) : (
                        <button
                            onClick={() => onRequestLogin?.()}
                            className="export-btn"
                            style={{
                                padding: '6px 12px',
                                cursor: 'pointer',
                                fontSize: '12px',
                                fontWeight: 500
                            }}
                        >
                            Sign In
                        </button>
                    )}
                </div>
            </div>

            {/* Manage Billing (Only for Subscribed users) */}
            {isPlus && (
                <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '8px' }}>
                    {isCancelScheduled && (
                        <span style={{ fontSize: '11px', color: '#B45309' }}>
                            Ends {formattedPeriodEnd ?? 'soon'}
                        </span>
                    )}
                    <button
                        onClick={handleManageBilling}
                        disabled={!!loadingAction}
                        style={{
                            background: 'none',
                            border: 'none',
                            textDecoration: 'underline',
                            color: '#555',
                            cursor: 'pointer',
                            fontSize: '11px',
                            padding: 0
                        }}
                    >
                        Manage Subscription {loadingAction === 'billing' && <Spinner />}
                    </button>
                </div>
            )}

            {/* Actions Grid */}
            <div className="actions" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {EXPORT_SECTIONS.map((section) => (
                    <div key={section.contentType}>
                        <div style={{ fontSize: '12px', fontWeight: 600, color: '#444', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                            {section.title}
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                            {section.options.map((option) => (
                                <button
                                    key={`${section.contentType}-${option.format}`}
                                    onClick={() => handleExport(option.format, section.contentType)}
                                    disabled={!!loadingAction}
                                    className="export-btn"
                                    style={{ padding: '8px', cursor: 'pointer', fontSize: '13px' }}
                                >
                                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', justifyContent: 'center' }}>
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
                    <div style={{ marginTop: '5px', textAlign: 'center' }}>
                        <div style={{ fontSize: '12px', color: '#555', marginBottom: '8px' }}>
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
                            style={{
                                background: 'linear-gradient(90deg, #4285f4, #34a853)',
                                color: 'white',
                                border: 'none',
                                borderRadius: '6px',
                                padding: '10px 20px',
                                cursor: 'pointer',
                                fontSize: '13px',
                                fontWeight: 'bold',
                                width: '100%',
                            }}
                        >
                            Upgrade to Unlock Advanced Features <PlusIcon /> {loadingAction === 'upgrade' && <Spinner />}
                        </button>
                    </div>
                )}

                {/* Coming Soon */}
                <div>
                    <div style={{ fontSize: '12px', fontWeight: 600, color: '#888', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Coming soon</div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '8px' }}>
                        <div style={{ padding: '8px', fontSize: '12px', fontStyle: 'italic', color: '#999', border: '1px dashed #ddd', borderRadius: '4px', textAlign: 'center' }}>
                            Video & Audio Overviews to Transcript/Slides
                        </div>
                    </div>
                </div>
            </div>

            {/* Toast Notification */}
            {notice && (
                <div
                    style={{
                        position: 'fixed',
                        bottom: '20px',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        width: '85%',
                        padding: '12px 16px',
                        borderRadius: '8px',
                        fontSize: '13px',
                        textAlign: 'center',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                        zIndex: 1000,
                        backgroundColor:
                            notice.type === 'success' ? '#2e7d32' : notice.type === 'error' ? '#d32f2f' : '#333',
                        color: '#fff',
                        animation: 'fadeIn 0.3s ease-in-out'
                    }}
                >
                    {notice.message}
                </div>
            )}
            <style>{`
                @keyframes fadeIn {
                    from { opacity: 0; transform: translate(-50%, 10px); }
                    to { opacity: 1; transform: translate(-50%, 0); }
                }
            `}</style>
        </div>
    );
}
