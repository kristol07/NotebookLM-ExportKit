
import React, { useEffect, useRef, useState } from 'react';
import { supabase } from '../../../utils/supabase';
import { browser } from 'wxt/browser';
import * as XLSX from 'xlsx';

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

    const sanitizeFilename = (value: string) =>
        value
            .replace(/[\\/:*?"<>|]+/g, '-')
            .replace(/\s+/g, ' ')
            .trim()
            .slice(0, 80);

    const getTimestamp = () => {
        const now = new Date();
        const pad = (num: number) => num.toString().padStart(2, '0');
        return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}_${pad(now.getHours())}-${pad(now.getMinutes())}-${pad(now.getSeconds())}`;
    };

    const extractFromFrames = async (tabId: number, format: 'PDF' | 'CSV' | 'PPTX' | 'JSON') => {
        try {
            const results = await browser.scripting.executeScript({
                target: { tabId, allFrames: true },
                args: [format],
                func: (formatArg: 'PDF' | 'CSV' | 'PPTX' | 'JSON') => {
                    try {
                        const decodeDataAttribute = (raw: string) => {
                            const txt = document.createElement('textarea');
                            txt.innerHTML = raw;
                            return txt.value;
                        };

                        const tryExtractFromDocument = (doc: Document, depth: number): any => {
                            if (!doc || depth > 4) return null;

                            if (formatArg === 'CSV' || formatArg === 'JSON') {
                                const dataElement = doc.querySelector('[data-app-data]');
                                if (dataElement) {
                                    const rawData = dataElement.getAttribute('data-app-data');
                                    if (!rawData) {
                                        return { success: false, error: 'empty_data', frameUrl: doc.URL };
                                    }

                                    const jsonString = decodeDataAttribute(rawData);
                                    try {
                                        const jsonData = JSON.parse(jsonString);
                                        if (jsonData.quiz || jsonData.notes || jsonData.sources) {
                                            return { success: true, data: jsonData, frameUrl: doc.URL };
                                        }
                                        return { success: false, error: 'invalid_payload', frameUrl: doc.URL };
                                    } catch (parseErr) {
                                        return { success: false, error: 'parse_error', frameUrl: doc.URL };
                                    }
                                }
                            }

                            const iframes = Array.from(doc.querySelectorAll('iframe'));
                            for (const frame of iframes) {
                                try {
                                    const frameDoc = frame.contentDocument || frame.contentWindow?.document;
                                    if (!frameDoc) continue;
                                    const nestedResult = tryExtractFromDocument(frameDoc, depth + 1);
                                    if (nestedResult?.success) return nestedResult;
                                } catch (innerErr) {
                                    // Cross-origin or inaccessible frame; ignore.
                                }
                            }

                            return null;
                        };

                        if (formatArg === 'CSV' || formatArg === 'JSON') {
                            const result = tryExtractFromDocument(document, 0);
                            if (result) return result;
                            return { success: false, error: 'not_found', frameUrl: window.location.href };
                        }

                        const content = document.body.innerText;
                        if (content.length > 500) {
                            return { success: true, data: content.substring(0, 100) + '...', frameUrl: window.location.href };
                        }

                        return { success: false, error: 'not_found', frameUrl: window.location.href };
                    } catch (error) {
                        return { success: false, error: 'script_error', frameUrl: window.location.href };
                    }
                }
            });

            const success = results.find((result) => result.result?.success);
            if (success?.result?.success) {
                return success.result;
            }

            return results.find((result) => result.result)?.result ?? null;
        } catch (error) {
            return null;
        }
    };

    const handleSignOut = async () => {
        await supabase.auth.signOut();
    };

    const handleExport = async (format: 'PDF' | 'CSV' | 'PPTX' | 'JSON') => {
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
                if (format === 'CSV' && response.data?.quiz) {
                    // Process Quiz Data
                    const quizData = response.data.quiz.map((q: any, index: number) => ({
                        ID: index + 1,
                        Question: q.question,
                        "Option A": q.answerOptions[0]?.text || "",
                        "Option B": q.answerOptions[1]?.text || "",
                        "Option C": q.answerOptions[2]?.text || "",
                        "Option D": q.answerOptions[3]?.text || "",
                        "Correct Answer": q.answerOptions.find((o: any) => o.isCorrect)?.text || "",
                        Rationale: q.answerOptions.find((o: any) => o.rationale)?.rationale || "",
                        Hint: q.hint || ""
                    }));

                    const ws = XLSX.utils.json_to_sheet(quizData);
                    const wb = XLSX.utils.book_new();
                    XLSX.utils.book_append_sheet(wb, ws, "Quiz");
                    const excelName = `notebooklm_quiz_${tabTitle}_${timestamp}.xlsx`;
                    XLSX.writeFile(wb, excelName);

                    showNotice('success', `Exported ${quizData.length} questions to Excel.`);
                } else if (format === 'JSON' && response.data?.quiz) {
                    // Process Quiz Data for JSON
                    const blob = new Blob([JSON.stringify(response.data.quiz, null, 2)], { type: 'application/json' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `notebooklm_quiz_${tabTitle}_${timestamp}.json`;
                    a.click();
                    URL.revokeObjectURL(url);
                    showNotice('success', `Exported ${response.data.quiz.length} questions to JSON.`);
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
                        Quiz to Excel
                    </button>
                    <button
                        onClick={() => handleExport('JSON')}
                        disabled={loading}
                        className="export-btn"
                        style={{ padding: '10px', cursor: 'pointer', flex: 1, fontSize: '13px' }}
                    >
                        Quiz to JSON
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
