import React, { useEffect, useRef, useState } from 'react';
import { supabase } from '../../../utils/supabase';
import { browser } from 'wxt/browser';
import { sanitizeFilename, getTimestamp } from '../../../utils/common';
import { ContentType, ExportFormat } from '../../../utils/export-core';
import { exportByType } from '../../../utils/export-dispatch';
import { extractByType } from '../../../utils/extractors';
import { extractNotebookLmPayload } from '../../../utils/extractors/common';
import { consumeTrial, createCheckoutSession, createCustomerPortalLink, getPlan } from '../../../utils/billing';

const PLUS_EXPORTS = new Set(['mindmap:OPML', 'mindmap:JSONCanvas', 'mindmap:SVG']);

export default function Dashboard({
    session,
    onRequestLogin,
}: {
    session: any;
    onRequestLogin?: () => void;
}) {
    const [loading, setLoading] = useState(false);
    const [notice, setNotice] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);
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
        setLoading(true);
        try {
            const checkoutUrl = await createCheckoutSession();
            await browser.tabs.create({ url: checkoutUrl });
        } catch (err) {
            console.error(err);
            showNotice('error', 'Could not start checkout. Please try again.');
        } finally {
            setLoading(false);
            upgradeInFlightRef.current = false;
        }
    };

    const handleManageBilling = async () => {
        setLoading(true);
        try {
            const portalUrl = await createCustomerPortalLink();
            await browser.tabs.create({ url: portalUrl });
        } catch (err) {
            console.error(err);
            showNotice('error', 'Could not open billing portal. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleExport = async (format: ExportFormat, contentType?: ContentType) => {
        setLoading(true);
        try {
            const plusExport = isPlusExport(format, contentType);
            if (plusExport) {
                if (!isSignedIn) {
                    showNotice('info', 'Sign in to use Plus exports.');
                    onRequestLogin?.();
                    return;
                }
                if (!isPlus) {
                    const trialResult = await consumeTrial(false);
                    if (!trialResult.allowed) {
                        showNotice('error', 'Your free Plus trials are used up. Upgrade to continue.');
                        return;
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
                                showNotice('info', `Plus trial used. ${remainingText} left.`);
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
            setLoading(false);
        }
    };

    return (
        <div className="dashboard-container" style={{ padding: '20px', width: '300px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h3>Dashboard</h3>
                {session ? (
                    <button onClick={handleSignOut} style={{ fontSize: '12px', padding: '4px 8px' }}>Sign Out</button>
                ) : (
                    <button onClick={() => onRequestLogin?.()} style={{ fontSize: '12px', padding: '4px 8px' }}>Sign In</button>
                )}
            </div>

            <div className="user-info" style={{ marginBottom: '15px', fontSize: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                    <div>
                        Status: <strong>
                            {isPlus
                                ? 'Plus Member'
                                : isSignedIn
                                    ? 'Free'
                                    : 'Free User'}
                        </strong>
                    </div>
                    {isPlus && (
                        <button
                            onClick={handleManageBilling}
                            disabled={loading}
                            style={{ padding: '6px 10px', cursor: 'pointer', fontSize: '12px' }}
                        >
                            Manage billing
                        </button>
                    )}
                </div>
                {isPlus && isCancelScheduled && (
                    <div style={{ marginTop: '6px', fontSize: '12px', color: '#7a4b00' }}>
                        Ends {formattedPeriodEnd ?? 'at period end'}. You can subscribe again after it ends.
                    </div>
                )}
            </div>

            {notice && (
                <div
                    style={{
                        marginBottom: '12px',
                        padding: '10px',
                        borderRadius: '8px',
                        fontSize: '12px',
                        textAlign: 'left',
                        backgroundColor:
                            notice.type === 'success' ? '#e6f6ed' : notice.type === 'error' ? '#fdecea' : '#eef5ff',
                        color: notice.type === 'success' ? '#0b6b3a' : notice.type === 'error' ? '#b42318' : '#1b4ea3',
                        border: `1px solid ${notice.type === 'success' ? '#b7e4c7' : notice.type === 'error' ? '#f5c2c7' : '#c7ddff'}`,
                    }}
                >
                    {notice.message}
                </div>
            )}

            <div className="actions" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ display: 'grid', gap: '10px' }}>
                    <div style={{ fontSize: '12px', fontWeight: 600, color: '#444' }}>Quiz exports</div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                        <button
                            onClick={() => handleExport('CSV', 'quiz')}
                            disabled={loading}
                            className="export-btn"
                            style={{ padding: '10px', cursor: 'pointer', fontSize: '13px' }}
                        >
                            Excel
                        </button>
                        <button
                            onClick={() => handleExport('JSON', 'quiz')}
                            disabled={loading}
                            className="export-btn"
                            style={{ padding: '10px', cursor: 'pointer', fontSize: '13px' }}
                        >
                            JSON
                        </button>
                        <button
                            onClick={() => handleExport('HTML', 'quiz')}
                            disabled={loading}
                            className="export-btn"
                            style={{ padding: '10px', cursor: 'pointer', fontSize: '13px' }}
                        >
                            HTML
                        </button>
                        <button
                            onClick={() => handleExport('Anki', 'quiz')}
                            disabled={loading}
                            className="export-btn"
                            style={{ padding: '10px', cursor: 'pointer', fontSize: '13px' }}
                        >
                            Anki
                        </button>
                    </div>
                    <div style={{ fontSize: '12px', fontWeight: 600, color: '#444' }}>Flashcard exports</div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                        <button
                            onClick={() => handleExport('CSV', 'flashcards')}
                            disabled={loading}
                            className="export-btn"
                            style={{ padding: '10px', cursor: 'pointer', fontSize: '13px' }}
                        >
                            Excel
                        </button>
                        <button
                            onClick={() => handleExport('JSON', 'flashcards')}
                            disabled={loading}
                            className="export-btn"
                            style={{ padding: '10px', cursor: 'pointer', fontSize: '13px' }}
                        >
                            JSON
                        </button>
                        <button
                            onClick={() => handleExport('HTML', 'flashcards')}
                            disabled={loading}
                            className="export-btn"
                            style={{ padding: '10px', cursor: 'pointer', fontSize: '13px' }}
                        >
                            HTML
                        </button>
                        <button
                            onClick={() => handleExport('Anki', 'flashcards')}
                            disabled={loading}
                            className="export-btn"
                            style={{ padding: '10px', cursor: 'pointer', fontSize: '13px' }}
                        >
                            Anki
                        </button>
                    </div>
                    <div style={{ fontSize: '12px', fontWeight: 600, color: '#444' }}>Mindmap exports</div>
                    {!isPlus && (
                        <>
                            <div style={{ fontSize: '11px', color: '#666' }}>
                                Plus unlocks Obsidian, OPML, and SVG exports for mindmaps.
                            </div>
                            <div
                                style={{
                                    border: '1px solid #d7d7d7',
                                    borderRadius: '10px',
                                    padding: '10px',
                                    background: '#f9fafb',
                                    fontSize: '12px',
                                    color: '#333',
                                }}
                            >
                                Unlock full mindmap exports and keep structure intact. Sign in for 3 free Plus trials.
                            </div>
                        </>
                    )}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                        <button
                            onClick={() => handleExport('OPML', 'mindmap')}
                            disabled={loading}
                            className="export-btn"
                            style={{ padding: '10px', cursor: 'pointer', fontSize: '13px' }}
                        >
                            OPML (Plus)
                        </button>
                        <button
                            onClick={() => handleExport('JSONCanvas', 'mindmap')}
                            disabled={loading}
                            className="export-btn"
                            style={{ padding: '10px', cursor: 'pointer', fontSize: '13px' }}
                        >
                            JSONCanvas (Obsidian) (Plus)
                        </button>
                        <button
                            onClick={() => handleExport('Markdown', 'mindmap')}
                            disabled={loading}
                            className="export-btn"
                            style={{ padding: '10px', cursor: 'pointer', fontSize: '13px' }}
                        >
                            Markdown
                        </button>
                        <button
                            onClick={() => handleExport('SVG', 'mindmap')}
                            disabled={loading}
                            className="export-btn"
                            style={{ padding: '10px', cursor: 'pointer', fontSize: '13px' }}
                        >
                            SVG (Plus)
                        </button>
                    </div>
                    {isSignedIn && !isPlus && (
                        <button
                            onClick={handleUpgrade}
                            disabled={loading}
                            style={{ marginTop: '10px', padding: '10px', cursor: 'pointer', fontSize: '13px' }}
                        >
                            Upgrade to Plus
                        </button>
                    )}
                    <div style={{ fontSize: '12px', fontWeight: 600, color: '#444' }}>Coming soon</div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                        <button
                            disabled
                            className="export-btn"
                            style={{ padding: '10px', cursor: 'not-allowed', fontSize: '13px', opacity: 0.7, border: '1px dashed #ccc' }}
                        >
                            Video overview to slide + transcipts
                        </button>
                        <button
                            disabled
                            className="export-btn"
                            style={{ padding: '10px', cursor: 'not-allowed', fontSize: '13px', opacity: 0.7, border: '1px dashed #ccc' }}
                        >
                            Audio overview to transcipts
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
