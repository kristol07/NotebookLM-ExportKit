
import * as XLSX from 'xlsx';
import { downloadBlob, ExportFormat, ExportResult, QuizItem } from './export-core';


export const generateQuizHtml = (quizData: QuizItem[], title: string) => {
    const jsonData = JSON.stringify(quizData);
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title} - Quiz Export</title>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@600;700&family=IBM+Plex+Sans:wght@400;500;600&display=swap');

        :root {
            --bg: #f6f1e7;
            --bg-deep: #efe4d6;
            --ink: #171717;
            --muted: #5b5b5b;
            --accent: #d3542c;
            --accent-light: #ff8f5a;
            --accent-dark: #b14320;
            --teal: #1f6f78;
            --card: #fff7ef;
            --stroke: #e3d6c5;
            --shadow: 0 18px 40px rgba(23, 23, 23, 0.12);
            --radius-sm: 10px;
            --radius-md: 12px;
            --radius-lg: 14px;
            --radius-xl: 18px;
            --radius-2xl: 22px;
            --space-1: 6px;
            --space-2: 8px;
            --space-3: 10px;
            --space-4: 12px;
            --space-5: 14px;
            --space-6: 16px;
            --space-7: 18px;
            --space-8: 20px;
            --space-9: 24px;
            --space-10: 32px;
            --font-display: 'Space Grotesk', sans-serif;
            --font-body: 'IBM Plex Sans', sans-serif;
            --error: #b54832;
        }

        body {
            font-family: var(--font-body);
            background:
                radial-gradient(240px 140px at 10% -10%, #ffd2b9 0%, transparent 70%),
                radial-gradient(220px 160px at 90% 0%, #cfe7e6 0%, transparent 65%),
                linear-gradient(180deg, var(--bg) 0%, var(--bg-deep) 100%);
            color: var(--ink);
            margin: 0;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
        }

        .quiz-container {
            width: 100%;
            max-width: 800px;
            padding: var(--space-10) var(--space-8);
            box-sizing: border-box;
            background: var(--card);
            border-radius: var(--radius-2xl);
            border: 1px solid var(--stroke);
            box-shadow: var(--shadow);
        }

        .progress-container {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 24px;
        }

        .progress-text {
            color: var(--muted);
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

        .status-correct { color: var(--teal); }
        .status-wrong { color: var(--error); }

        .question-text {
            font-family: var(--font-display);
            font-size: 1.5em;
            font-weight: 600;
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
            background-color: #fff;
            border: 1px solid var(--stroke);
            padding: var(--space-4) var(--space-6);
            border-radius: var(--radius-lg);
            cursor: pointer;
            transition: transform 0.2s ease, box-shadow 0.2s ease, background-color 0.2s ease;
            display: flex;
            flex-direction: column;
            gap: 8px;
        }

        .option-item:hover:not(.selected) {
            background-color: var(--card);
            transform: translateY(-1px);
            box-shadow: 0 10px 18px rgba(23, 23, 23, 0.12);
        }

        .option-item.selected.correct {
            background-color: rgba(31, 111, 120, 0.12);
            border-color: var(--teal);
        }

        .option-item.selected.incorrect {
            background-color: rgba(181, 72, 50, 0.12);
            border-color: var(--error);
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

        .correct .feedback-state { color: var(--teal); }
        .incorrect .feedback-state { color: var(--error); }

        .rationale {
            font-size: 0.95em;
            color: var(--muted);
            margin-top: 4px;
            line-height: 1.5;
            display: none;
        }

        .selected .rationale {
            display: block;
        }

        .hint-toggle {
            border: 1px solid var(--stroke);
            color: var(--muted);
            cursor: pointer;
            padding: var(--space-2) var(--space-6);
            border-radius: var(--radius-md);
            background-color: #fff;
            display: flex;
            align-items: center;
            gap: 8px;
            font-size: 0.9em;
            transition: transform 0.2s ease, box-shadow 0.2s ease;
        }

        .hint-toggle:hover {
            transform: translateY(-1px);
            box-shadow: 0 10px 18px rgba(23, 23, 23, 0.12);
        }

        .hint-content {
            margin-top: 32px;
            padding: var(--space-6);
            background-color: #fff;
            border: 1px solid var(--stroke);
            border-radius: var(--radius-lg);
            font-size: 0.95em;
            color: var(--muted);
            display: none;
            align-items: flex-start;
            gap: 16px;
        }

        .hint-content.active {
            display: flex;
        }

        .hint-icon-box {
            color: var(--accent-dark);
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
            border-radius: var(--radius-md);
            padding: var(--space-2) var(--space-7);
            font-size: 0.95em;
            font-weight: 500;
            cursor: pointer;
            border: 1px solid transparent;
            transition: transform 0.2s ease, box-shadow 0.2s ease;
        }

        .btn-prev {
            background-color: #fff;
            color: var(--ink);
            border-color: var(--stroke);
        }

        .btn-prev:hover:not(:disabled) {
            transform: translateY(-1px);
            box-shadow: 0 10px 18px rgba(23, 23, 23, 0.12);
        }

        .btn-next {
            background: linear-gradient(90deg, var(--accent), var(--accent-light));
            color: #fff;
        }

        .btn-next:hover:not(:disabled) {
            transform: translateY(-1px);
            box-shadow: 0 10px 18px rgba(23, 23, 23, 0.12);
        }

        .btn:disabled {
            opacity: 0.3;
            cursor: not-allowed;
        }

        .hidden { display: none; }

        @media (max-width: 900px) {
            .quiz-container {
                margin: var(--space-8);
                max-width: 100%;
            }
        }

        @media (max-width: 720px) {
            .quiz-container {
                padding: var(--space-8) var(--space-6);
            }

            .question-text {
                font-size: 1.3em;
            }

            .option-item {
                padding: var(--space-4);
            }
        }

        @media (max-width: 520px) {
            body {
                align-items: flex-start;
            }

            .quiz-container {
                margin: var(--space-6);
                padding: var(--space-7) var(--space-5);
            }

            .progress-container {
                flex-direction: column;
                align-items: flex-start;
                gap: var(--space-3);
            }

            .navigation {
                flex-direction: column;
                align-items: stretch;
                gap: var(--space-4);
            }

            .nav-buttons {
                width: 100%;
            }

            .btn {
                width: 100%;
            }

            .hint-toggle {
                justify-content: space-between;
            }
        }
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
                        \${opt.rationale ? '<div class="rationale">' + opt.rationale + '</div>' : ''}
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

export const exportQuiz = (
    quizData: QuizItem[],
    format: ExportFormat,
    tabTitle: string,
    timestamp: string
): ExportResult => {
    if (format === 'CSV') {
        const rows = quizData.map((q, index: number) => ({
            ID: index + 1,
            Question: q.question,
            "Option A": q.answerOptions[0]?.text || "",
            "Rationale A": q.answerOptions[0]?.rationale || "",
            "Option B": q.answerOptions[1]?.text || "",
            "Rationale B": q.answerOptions[1]?.rationale || "",
            "Option C": q.answerOptions[2]?.text || "",
            "Rationale C": q.answerOptions[2]?.rationale || "",
            "Option D": q.answerOptions[3]?.text || "",
            "Rationale D": q.answerOptions[3]?.rationale || "",
            "Correct Answer": q.answerOptions.find((o) => o.isCorrect)?.text || "",
            Hint: q.hint || ""
        }));

        const ws = XLSX.utils.json_to_sheet(rows);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Quiz");
        const filename = `notebooklm_quiz_${tabTitle}_${timestamp}.xlsx`;
        XLSX.writeFile(wb, filename);
        return { success: true, count: quizData.length };
    }

    if (format === 'JSON') {
        const filename = `notebooklm_quiz_${tabTitle}_${timestamp}.json`;
        downloadBlob(JSON.stringify(quizData, null, 2), filename, 'application/json');
        return { success: true, count: quizData.length };
    }

    if (format === 'HTML') {
        const html = generateQuizHtml(quizData, tabTitle);
        const filename = `notebooklm_quiz_${tabTitle}_${timestamp}.html`;
        downloadBlob(html, filename, 'text/html');
        return { success: true, count: quizData.length };
    }

    if (format === 'Anki') {
        const rows = quizData.map((q) => {
            // Front: Question + Options
            const options = q.answerOptions.map((o, i: number) => {
                const label = String.fromCharCode(65 + i);
                return `${label}. ${o.text}`;
            }).join('<br>');
            const front = `${q.question}<br><br>${options}`.replace(/\n/g, '<br>').replace(/\t/g, '    ');

            // Back: Correct Answer + Rationale
            const correctIndex = q.answerOptions.findIndex((o) => o.isCorrect);
            const correctOption = q.answerOptions[correctIndex];
            const correctLabel = correctIndex !== -1 ? String.fromCharCode(65 + correctIndex) : '?';
            const back = `<b>Correct Answer: ${correctLabel}</b><br>${correctOption?.text || ''}<br><br><i>${correctOption?.rationale || ''}</i>`.replace(/\n/g, '<br>').replace(/\t/g, '    ');

            return `${front}\t${back}`;
        });

        const content = rows.join('\n');
        const filename = `notebooklm_quiz_${tabTitle}_${timestamp}.txt`;
        downloadBlob(content, filename, 'text/plain');
        return { success: true, count: quizData.length };
    }

    return { success: false, error: 'Unsupported format' };
};

