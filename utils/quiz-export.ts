
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

