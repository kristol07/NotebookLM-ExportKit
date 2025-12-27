
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

    const extractFromFrames = async (tabId: number, format: 'PDF' | 'CSV' | 'PPTX' | 'JSON' | 'HTML') => {
        try {
            const results = await browser.scripting.executeScript({
                target: { tabId, allFrames: true },
                args: [format],
                func: (formatArg: 'PDF' | 'CSV' | 'PPTX' | 'JSON' | 'HTML') => {
                    try {
                        const decodeDataAttribute = (raw: string) => {
                            const txt = document.createElement('textarea');
                            txt.innerHTML = raw;
                            return txt.value;
                        };

                        const tryExtractFromDocument = (doc: Document, depth: number): any => {
                            if (!doc || depth > 4) return null;

                            if (formatArg === 'CSV' || formatArg === 'JSON' || formatArg === 'HTML') {
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

                        if (formatArg === 'CSV' || formatArg === 'JSON' || formatArg === 'HTML') {
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

    const generateQuizHtml = (quizData: any[], title: string) => {
        const jsonData = JSON.stringify(quizData);
        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title} - Quiz Export</title>
    <style>
        :root {
            --bg-color: #1a1c1e;
            --container-bg: #212429;
            --text-primary: #e2e2e6;
            --text-secondary: #c4c6cf;
            --option-bg: #2d3036;
            --option-hover: #383b42;
            --correct-bg: rgba(76, 175, 80, 0.15);
            --correct-border: #4caf50;
            --incorrect-bg: rgba(244, 67, 54, 0.15);
            --incorrect-border: #f44336;
            --accent-blue: #4d7fff;
            --accent-blue-hover: #6a96ff;
        }

        body {
            font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            background-color: var(--bg-color);
            color: var(--text-primary);
            margin: 0;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
        }

        .quiz-container {
            width: 100%;
            max-width: 800px;
            padding: 40px 20px;
            box-sizing: border-box;
        }

        .progress-container {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 24px;
        }

        .progress-text {
            color: var(--text-secondary);
            font-size: 0.9em;
        }

        .status-bar {
            display: flex;
            gap: 16px;
            font-size: 0.9em;
            font-weight: 500;
        }

        .status-item {
            display: flex;
            align-items: center;
            gap: 6px;
        }

        .status-correct { color: #4caf50; }
        .status-wrong { color: #f44336; }

        .question-text {
            font-size: 1.5em;
            font-weight: 500;
            margin-bottom: 32px;
            line-height: 1.4;
        }

        .options-list {
            list-style: none;
            padding: 0;
            display: flex;
            flex-direction: column;
            gap: 12px;
        }

        .option-item {
            background-color: var(--option-bg);
            border: 1px solid transparent;
            padding: 16px 20px;
            border-radius: 12px;
            cursor: pointer;
            transition: all 0.2s ease;
            display: flex;
            flex-direction: column;
            gap: 8px;
        }

        .option-item:hover:not(.selected) {
            background-color: var(--option-hover);
        }

        .option-item.selected.correct {
            background-color: var(--correct-bg);
            border-color: var(--correct-border);
        }

        .option-item.selected.incorrect {
            background-color: var(--incorrect-bg);
            border-color: var(--incorrect-border);
        }

        .option-label {
            font-weight: 500;
            display: flex;
            align-items: center;
            gap: 12px;
        }

        .feedback-state {
            font-weight: bold;
            font-size: 0.9em;
            display: none;
        }

        .selected .feedback-state {
            display: block;
        }

        .correct .feedback-state { color: #4caf50; }
        .incorrect .feedback-state { color: #f44336; }

        .rationale {
            font-size: 0.95em;
            color: var(--text-secondary);
            margin-top: 4px;
            line-height: 1.5;
            display: none;
        }

        .selected .rationale {
            display: block;
        }

        .hint-section {
            margin-top: 32px;
        }

        .hint-toggle {
            background: none;
            border: none;
            color: var(--text-secondary);
            cursor: pointer;
            padding: 8px 16px;
            border-radius: 12px;
            background-color: var(--option-bg);
            display: flex;
            align-items: center;
            gap: 8px;
            font-size: 0.9em;
            transition: background-color 0.2s;
        }

        .hint-toggle:hover {
            background-color: var(--option-hover);
        }

        .hint-content {
            margin-top: 32px;
            padding: 20px;
            background-color: var(--container-bg);
            border: 1px solid rgba(255, 255, 255, 0.05);
            border-radius: 16px;
            font-size: 0.95em;
            color: var(--text-secondary);
            display: none;
            align-items: flex-start;
            gap: 16px;
        }

        .hint-content.active {
            display: flex;
        }

        .hint-icon-box {
            color: var(--text-secondary);
            font-size: 1.2em;
            margin-top: -2px;
        }

        .navigation {
            margin-top: 32px;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }

        .nav-buttons {
            display: flex;
            gap: 12px;
        }

        .btn {
            border-radius: 20px;
            padding: 10px 24px;
            font-size: 0.95em;
            font-weight: 500;
            cursor: pointer;
            border: none;
            transition: background-color 0.2s;
        }

        .btn-prev {
            background-color: rgba(255,255,255,0.05);
            color: var(--text-primary);
        }

        .btn-prev:hover:not(:disabled) {
            background-color: rgba(255,255,255,0.1);
        }

        .btn-next {
            background-color: var(--accent-blue);
            color: white;
        }

        .btn-next:hover:not(:disabled) {
            background-color: var(--accent-blue-hover);
        }

        .btn:disabled {
            opacity: 0.3;
            cursor: not-allowed;
        }

        .hidden { display: none; }
    </style>
</head>
<body>
    <div class="quiz-container">
        <div id="quiz-content">
            <!-- Dynamic Content -->
        </div>

        <div id="hint-box" class="hint-content">
            <div class="hint-icon-box">💡</div>
            <div id="hint-text"></div>
        </div>

        <div class="navigation">
            <button id="hint-toggle" class="hint-toggle">
                <span>Hint</span>
                <span id="hint-icon-arrow">▼</span>
            </button>
            <div class="nav-buttons">
                <button id="prev-btn" class="btn btn-prev">Previous</button>
                <button id="next-btn" class="btn btn-next">Next</button>
            </div>
        </div>
    </div>

    <script>
        const quizData = ${jsonData};
        let currentIndex = 0;
        const state = quizData.map(() => ({ selectedIndex: null, hintVisible: false }));

        function renderQuestion() {
            const q = quizData[currentIndex];
            const s = state[currentIndex];
            const content = document.getElementById('quiz-content');
            
            let optionsHtml = '';
            q.answerOptions.forEach((opt, idx) => {
                const isSelected = s.selectedIndex === idx;
                const statusClass = isSelected ? (opt.isCorrect ? 'correct' : 'incorrect') : '';
                const selectedClass = isSelected ? 'selected' : '';
                
                optionsHtml += \`
                    <li class="option-item \${selectedClass} \${statusClass}" onclick="selectOption(\${idx})">
                        <div class="option-label">
                            <span>\${String.fromCharCode(65 + idx)}. \${opt.text}</span>
                        </div>
                        <div class="feedback-state">
                            \${opt.isCorrect ? '✓ Right answer' : '✕ Not quite'}
                        </div>
                        \${opt.rationale ? \`<div class="rationale">\${opt.rationale}</div>\` : ''}
                    </li>
                \`;
            });

            const correctCount = state.filter((s, i) => s.selectedIndex !== null && quizData[i].answerOptions[s.selectedIndex].isCorrect).length;
            const wrongCount = state.filter((s, i) => s.selectedIndex !== null && !quizData[i].answerOptions[s.selectedIndex].isCorrect).length;

            content.innerHTML = \`
                <div class="progress-container">
                    <div class="progress-text">\${currentIndex + 1} / \${quizData.length}</div>
                    <div class="status-bar">
                        <div class="status-item status-correct">
                            <span>✓</span>
                            <span>\${correctCount}</span>
                        </div>
                        <div class="status-item status-wrong">
                            <span>✕</span>
                            <span>\${wrongCount}</span>
                        </div>
                    </div>
                </div>
                <div class="question-text">\${q.question}</div>
                <ul class="options-list">
                    \${optionsHtml}
                </ul>
            \`;

            // Update Hint Box
            const hintBox = document.getElementById('hint-box');
            const hintText = document.getElementById('hint-text');
            hintText.innerText = q.hint || 'No hint available for this question.';
            if (s.hintVisible) {
                hintBox.classList.add('active');
            } else {
                hintBox.classList.remove('active');
            }

            document.getElementById('prev-btn').disabled = currentIndex === 0;
            document.getElementById('next-btn').disabled = currentIndex === quizData.length - 1;
            document.getElementById('hint-icon-arrow').innerText = s.hintVisible ? '▲' : '▼';
        }

        function selectOption(idx) {
            if (state[currentIndex].selectedIndex !== null) return; // Prevent re-selection
            state[currentIndex].selectedIndex = idx;
            renderQuestion();
        }

        function toggleHint() {
            state[currentIndex].hintVisible = !state[currentIndex].hintVisible;
            renderQuestion();
        }

        document.getElementById('prev-btn').onclick = () => {
            if (currentIndex > 0) {
                currentIndex--;
                renderQuestion();
            }
        };

        document.getElementById('next-btn').onclick = () => {
            if (currentIndex < quizData.length - 1) {
                currentIndex++;
                renderQuestion();
            }
        };

        document.getElementById('hint-toggle').onclick = toggleHint;

        renderQuestion();
    </script>
</body>
</html>`;
    };

    const handleExport = async (format: 'PDF' | 'CSV' | 'PPTX' | 'JSON' | 'HTML') => {
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
                } else if (format === 'HTML' && response.data?.quiz) {
                    // Process Quiz Data for HTML
                    const quizHtml = generateQuizHtml(response.data.quiz, tabTitle);
                    const blob = new Blob([quizHtml], { type: 'text/html' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `notebooklm_quiz_${tabTitle}_${timestamp}.html`;
                    a.click();
                    URL.revokeObjectURL(url);
                    showNotice('success', `Exported ${response.data.quiz.length} questions to HTML.`);
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
                    <button
                        onClick={() => handleExport('HTML')}
                        disabled={loading}
                        className="export-btn"
                        style={{ padding: '10px', cursor: 'pointer', flex: 1, fontSize: '13px' }}
                    >
                        Quiz to HTML
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
