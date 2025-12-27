import React, { useEffect, useRef, useState } from 'react';
import { supabase } from '../../../utils/supabase';
import { browser } from 'wxt/browser';
import { sanitizeFilename, getTimestamp } from '../../../utils/common';
import { ContentType, ExportFormat } from '../../../utils/export-core';
import { exportByType } from '../../../utils/export-dispatch';
import { extractByType } from '../../../utils/extractors';
import { extractNotebookLmPayload } from '../../../utils/extractors/common';

export default function Dashboard({ session }: { session: any }) {
    const [loading, setLoading] = useState(false);
    const [notice, setNotice] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);
    const noticeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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

    const handleSignOut = async () => {
        await supabase.auth.signOut();
    };

    const handleExport = async (format: ExportFormat, contentType?: ContentType) => {
        setLoading(true);
        try {
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
                                : exportByType('mindmap', payload.items, format, tabTitle, timestamp);
                    if (result.success) {
                        const label = payload.type === 'quiz' ? 'questions' : payload.type === 'flashcards' ? 'flashcards' : 'nodes';
                        const formatName = format === 'CSV' ? 'Excel' : format;
                        showNotice('success', `Exported ${result.count} ${label} to ${formatName}.`);
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
                <button onClick={handleSignOut} style={{ fontSize: '12px', padding: '4px 8px' }}>Sign Out</button>
            </div>

            <div className="user-info" style={{ marginBottom: '15px', fontSize: '14px' }}>
                Status: <strong>{session?.user?.email ? 'Pro Member' : 'Free User'}</strong>
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
                <button
                    onClick={() => handleExport('PDF')}
                    disabled={loading}
                    className="export-btn"
                    style={{ padding: '10px', cursor: 'pointer' }}
                >
                    Export Notes to PDF
                </button>
                <div style={{ display: 'grid', gap: '10px' }}>
                    <div style={{ fontSize: '12px', fontWeight: 600, color: '#444' }}>Quiz exports</div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                        <button
                            onClick={() => handleExport('CSV', 'quiz')}
                            disabled={loading}
                            className="export-btn"
                            style={{ padding: '10px', cursor: 'pointer', fontSize: '13px' }}
                        >
                            Quiz to Excel
                        </button>
                        <button
                            onClick={() => handleExport('JSON', 'quiz')}
                            disabled={loading}
                            className="export-btn"
                            style={{ padding: '10px', cursor: 'pointer', fontSize: '13px' }}
                        >
                            Quiz to JSON
                        </button>
                        <button
                            onClick={() => handleExport('HTML', 'quiz')}
                            disabled={loading}
                            className="export-btn"
                            style={{ padding: '10px', cursor: 'pointer', fontSize: '13px' }}
                        >
                            Quiz to HTML
                        </button>
                        <button
                            onClick={() => handleExport('Anki', 'quiz')}
                            disabled={loading}
                            className="export-btn"
                            style={{ padding: '10px', cursor: 'pointer', fontSize: '13px' }}
                        >
                            Quiz to Anki
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
                            Flashcards to Excel
                        </button>
                        <button
                            onClick={() => handleExport('JSON', 'flashcards')}
                            disabled={loading}
                            className="export-btn"
                            style={{ padding: '10px', cursor: 'pointer', fontSize: '13px' }}
                        >
                            Flashcards to JSON
                        </button>
                        <button
                            onClick={() => handleExport('HTML', 'flashcards')}
                            disabled={loading}
                            className="export-btn"
                            style={{ padding: '10px', cursor: 'pointer', fontSize: '13px' }}
                        >
                            Flashcards to HTML
                        </button>
                        <button
                            onClick={() => handleExport('Anki', 'flashcards')}
                            disabled={loading}
                            className="export-btn"
                            style={{ padding: '10px', cursor: 'pointer', fontSize: '13px' }}
                        >
                            Flashcards to Anki
                        </button>
                    </div>
                    <div style={{ fontSize: '12px', fontWeight: 600, color: '#444' }}>Mindmap exports</div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                        <button
                            onClick={() => handleExport('OPML', 'mindmap')}
                            disabled={loading}
                            className="export-btn"
                            style={{ padding: '10px', cursor: 'pointer', fontSize: '13px' }}
                        >
                            Mindmap to OPML
                        </button>
                        <button
                            onClick={() => handleExport('JSONCanvas', 'mindmap')}
                            disabled={loading}
                            className="export-btn"
                            style={{ padding: '10px', cursor: 'pointer', fontSize: '13px' }}
                        >
                            Mindmap to JSONCanvas
                        </button>
                    </div>
                </div>
                <button
                    onClick={() => handleExport('PPTX')}
                    disabled={loading}
                    className="export-btn"
                    style={{ padding: '10px', cursor: 'pointer' }}
                >
                    Export Slides to PPT
                </button>
            </div>

            <p style={{ fontSize: '12px', color: '#666', marginTop: '20px', textAlign: 'center' }}>
                Open a NotebookLM page to enable exports.
            </p>
        </div>
    );
}
