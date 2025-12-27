import React, { useEffect, useRef, useState } from 'react';
import { supabase } from '../../../utils/supabase';
import { browser } from 'wxt/browser';
import { sanitizeFilename, getTimestamp } from '../../../utils/common';
import { exportQuiz, extractFromFrames, ExportFormat } from '../../../utils/quiz-export';
import { exportFlashcards } from '../../../utils/flashcard-export';

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

    const handleExport = async (format: ExportFormat) => {
        setLoading(true);
        try {
            const tabs = await browser.tabs.query({ active: true, currentWindow: true });
            if (tabs.length === 0 || !tabs[0].id) {
                showNotice('error', 'No active tab found.');
                return;
            }

            const tabTitle = sanitizeFilename(tabs[0].title || 'notebooklm');
            const timestamp = getTimestamp();
            const response = await extractFromFrames(tabs[0].id, format);

            if (response && response.success) {
                if ((format === 'CSV' || format === 'JSON' || format === 'HTML')) {
                    if (response.data?.quiz) {
                        const result = exportQuiz(response.data.quiz, format, tabTitle, timestamp);
                        if (result.success) {
                            showNotice('success', `Exported ${result.count} questions to ${format === 'CSV' ? 'Excel' : format}.`);
                        } else {
                            showNotice('error', result.error || 'Export failed.');
                        }
                    } else if (response.data?.flashcards) {
                        const result = exportFlashcards(response.data.flashcards, format, tabTitle, timestamp);
                        if (result.success) {
                            showNotice('success', `Exported ${result.count} flashcards to ${format === 'CSV' ? 'Excel' : format}.`);
                        } else {
                            showNotice('error', result.error || 'Export failed.');
                        }
                    } else {
                        showNotice('info', `Export initiated. Data preview: ${JSON.stringify(response.data).substring(0, 100)}...`);
                    }
                } else {
                    showNotice('info', `Export initiated. Data preview: ${JSON.stringify(response.data).substring(0, 100)}...`);
                }
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
                <div style={{ display: 'flex', gap: '10px' }}>
                    <button
                        onClick={() => handleExport('CSV')}
                        disabled={loading}
                        className="export-btn"
                        style={{ padding: '10px', cursor: 'pointer', flex: 1, fontSize: '13px' }}
                    >
                        Cards/Quiz to Excel
                    </button>
                    <button
                        onClick={() => handleExport('JSON')}
                        disabled={loading}
                        className="export-btn"
                        style={{ padding: '10px', cursor: 'pointer', flex: 1, fontSize: '13px' }}
                    >
                        Cards/Quiz to JSON
                    </button>
                    <button
                        onClick={() => handleExport('HTML')}
                        disabled={loading}
                        className="export-btn"
                        style={{ padding: '10px', cursor: 'pointer', flex: 1, fontSize: '13px' }}
                    >
                        Cards/Quiz to HTML
                    </button>
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
