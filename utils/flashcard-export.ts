import * as XLSX from 'xlsx';
import { ExportFormat, ExportResult, FlashcardItem, downloadBlob } from './export-core';


export const generateFlashcardsHtml = (flashcardsData: FlashcardItem[], title: string) => {
    const jsonData = JSON.stringify(flashcardsData);
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title} - Flashcards Export</title>
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
            flex-direction: column;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            overflow: hidden;
        }

        .container {
            width: 100%;
            max-width: 640px;
            padding: var(--space-8);
            display: flex;
            flex-direction: column;
            align-items: center;
            height: 100vh;
            justify-content: center;
        }

        .card-container {
            perspective: 1000px;
            width: 100%;
            height: 400px;
            position: relative;
            cursor: pointer;
        }

        .card {
            width: 100%;
            height: 100%;
            position: relative;
            transform-style: preserve-3d;
            transition: transform 0.6s cubic-bezier(0.4, 0.0, 0.2, 1);
            border-radius: var(--radius-2xl);
            box-shadow: var(--shadow);
        }

        .card.flipped {
            transform: rotateY(180deg);
        }

        .card-face {
            position: absolute;
            width: 100%;
            height: 100%;
            backface-visibility: hidden;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            padding: var(--space-10);
            box-sizing: border-box;
            background-color: var(--card);
            border: 1px solid var(--stroke);
            border-radius: var(--radius-2xl);
            text-align: center;
            font-size: 1.35em;
            line-height: 1.5;
        }

        .card-back {
            transform: rotateY(180deg);
            background-color: var(--card);
        }

        .card-content {
            flex: 1;
            display: flex;
            align-items: center;
            justify-content: center;
            overflow-y: auto;
            width: 100%;
        }

        .action-hint {
            margin-top: var(--space-6);
            font-size: 0.8rem;
            color: var(--teal);
            text-transform: uppercase;
            letter-spacing: 0.08em;
            pointer-events: none;
        }
        
        .controls {
            display: flex;
            justify-content: space-between;
            align-items: center;
            width: 100%;
            max-width: 760px;
            margin-top: var(--space-9);
            padding: 0 var(--space-6);
            gap: var(--space-8);
        }

        .nav-btn {
            background: #fff;
            border: 1px solid var(--stroke);
            color: var(--ink);
            width: 56px;
            height: 56px;
            border-radius: var(--radius-xl);
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 1.5em;
            transition: transform 0.2s ease, box-shadow 0.2s ease;
            flex-shrink: 0;
        }

        .nav-btn:hover:not(:disabled) {
            transform: translateY(-1px);
            box-shadow: 0 10px 18px rgba(23, 23, 23, 0.12);
        }

        .nav-btn:disabled {
            opacity: 0.3;
            cursor: default;
        }

        .progress-bar {
            flex: 1;
            height: 6px;
            background: var(--stroke);
            border-radius: 3px;
            position: relative;
            overflow: hidden;
        }

        .progress-fill {
            height: 100%;
            background: linear-gradient(90deg, var(--accent), var(--accent-light));
            border-radius: 2px;
            width: 0%;
            transition: width 0.3s ease;
        }

        .progress-text {
            font-size: 1em;
            color: var(--muted);
            min-width: 60px;
            text-align: center;
            font-variant-numeric: tabular-nums;
        }

        .top-hint {
            position: absolute;
            top: var(--space-6);
            color: var(--muted);
            font-size: 0.85em;
        }

        @media (max-width: 720px) {
            .container {
                padding: var(--space-7);
            }

            .card-container {
                height: 360px;
            }

            .card-face {
                padding: var(--space-8);
                font-size: 1.2em;
            }

            .controls {
                gap: var(--space-6);
                padding: 0 var(--space-4);
            }

            .nav-btn {
                width: 48px;
                height: 48px;
                font-size: 1.3em;
            }
        }

        @media (max-width: 520px) {
            body {
                overflow: auto;
            }

            .container {
                height: auto;
                min-height: 100vh;
            }

            .card-container {
                height: 320px;
            }

            .card-face {
                padding: var(--space-6);
                font-size: 1.1em;
            }

            .controls {
                flex-wrap: wrap;
                justify-content: center;
                gap: var(--space-4);
            }

            .progress-bar {
                order: 3;
                min-width: 100%;
            }

            .progress-text {
                order: 2;
            }

            .top-hint {
                position: static;
                margin-bottom: var(--space-4);
            }
        }
    </style>
</head>
<body>
    <div class="top-hint">Press "Space" to flip, "← / →" to navigate</div>
    <div class="container">
        <div class="card-container" onclick="flipCard()">
            <div class="card" id="card">
                <div class="card-face card-front">
                    <div class="card-content" id="front-text"></div>
                    <div class="action-hint">See answer</div>
                </div>
                <div class="card-face card-back">
                    <div class="card-content" id="back-text"></div>
                </div>
            </div>
        </div>

        <div class="controls">
            <button class="nav-btn" id="prev-btn" onclick="prevCard(event)">←</button>
            <div class="progress-bar">
                <div class="progress-fill" id="progress-fill"></div>
            </div>
            <div class="progress-text" id="progress-text"></div>
            <button class="nav-btn" id="next-btn" onclick="nextCard(event)">→</button>
        </div>
    </div>

    <script>
        const flashcards = ${jsonData};
        let currentIndex = 0;
        let isFlipped = false;

        const cardElement = document.getElementById('card');
        const frontText = document.getElementById('front-text');
        const backText = document.getElementById('back-text');
        const progressFill = document.getElementById('progress-fill');
        const progressText = document.getElementById('progress-text');
        const prevBtn = document.getElementById('prev-btn');
        const nextBtn = document.getElementById('next-btn');

        function renderCard() {
            if (isFlipped) {
                cardElement.classList.remove('flipped');
                isFlipped = false;
                setTimeout(updateContent, 200); 
            } else {
                updateContent();
            }
        }

        function updateContent() {
             const card = flashcards[currentIndex];
            frontText.textContent = card.f;
            backText.textContent = card.b;
            
            const progress = ((currentIndex + 1) / flashcards.length) * 100;
            progressFill.style.width = progress + '%';
            progressText.textContent = \`\${currentIndex + 1} / \${flashcards.length}\`;

            prevBtn.disabled = currentIndex === 0;
            nextBtn.disabled = currentIndex === flashcards.length - 1;
        }

        function flipCard() {
            isFlipped = !isFlipped;
            cardElement.classList.toggle('flipped');
        }

        function prevCard(e) {
            e.stopPropagation();
            if (currentIndex > 0) {
                currentIndex--;
                renderCard();
            }
        }

        function nextCard(e) {
            e.stopPropagation();
            if (currentIndex < flashcards.length - 1) {
                currentIndex++;
                renderCard();
            }
        }

        document.addEventListener('keydown', (e) => {
            if (e.code === 'Space') {
                e.preventDefault();
                flipCard();
            } else if (e.code === 'ArrowLeft') {
                if (currentIndex > 0) {
                    currentIndex--;
                    renderCard();
                }
            } else if (e.code === 'ArrowRight') {
                if (currentIndex < flashcards.length - 1) {
                    currentIndex++;
                    renderCard();
                }
            }
        });

        updateContent();
    </script>
</body>
</html>`;
};

export const exportFlashcards = (
    flashcardsData: FlashcardItem[],
    format: ExportFormat,
    tabTitle: string,
    timestamp: string
): ExportResult => {
    if (format === 'CSV') {
        const rows = flashcardsData.map((c, index: number) => ({
            ID: index + 1,
            Front: c.f,
            Back: c.b
        }));
        const ws = XLSX.utils.json_to_sheet(rows);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Flashcards");
        const filename = `notebooklm_flashcards_${tabTitle}_${timestamp}.xlsx`;
        XLSX.writeFile(wb, filename);
        return { success: true, count: flashcardsData.length };
    }

    if (format === 'JSON') {
        const filename = `notebooklm_flashcards_${tabTitle}_${timestamp}.json`;
        downloadBlob(JSON.stringify({ flashcards: flashcardsData }, null, 2), filename, 'application/json');
        return { success: true, count: flashcardsData.length };
    }

    if (format === 'HTML') {
        const html = generateFlashcardsHtml(flashcardsData, tabTitle);
        const filename = `notebooklm_flashcards_${tabTitle}_${timestamp}.html`;
        downloadBlob(html, filename, 'text/html');
        return { success: true, count: flashcardsData.length };
    }

    if (format === 'Anki') {
        const formatForAnki = (text: string) => {
            // 1. Replace existing newlines with <br>
            // 2. Wrap long lines if they don't have natural breaks (simple heuristic)
            let processed = text.replace(/\n/g, '<br>');

            // Simple auto-wrapping for very long continuous text without breaks
            // This is a basic implementation; robust wrapping would require more complex logic
            // Anki handles wrapping visually, but the user requested "wrap long lines".
            // If the user meant "visual wrapping in the file", we just add newlines.
            // If they meant "hard wrap in the content so it shows wrapped in Anki", we use <br>.
            // We'll add a check for extremely long words or segments without spaces
            const maxLineLen = 80;
            if (processed.length > maxLineLen && !processed.includes('<br>')) {
                const chunks = [];
                let current = processed;
                while (current.length > 0) {
                    let splitIndex = current.lastIndexOf(' ', maxLineLen);
                    if (splitIndex === -1 && current.length > maxLineLen) splitIndex = maxLineLen; // Force split if no space
                    if (splitIndex === -1) splitIndex = current.length;

                    chunks.push(current.substring(0, splitIndex).trim());
                    current = current.substring(splitIndex).trim();
                }
                processed = chunks.join('<br>');
            }

            // 3. Escape tabs (Anki separator)
            processed = processed.replace(/\t/g, '    ');
            return processed;
        };

        const rows = flashcardsData.map((c) => {
            const front = formatForAnki(c.f);
            const back = formatForAnki(c.b);
            return `${front}\t${back}`;
        });

        const content = rows.join('\n');
        const filename = `notebooklm_flashcards_${tabTitle}_${timestamp}.txt`;
        downloadBlob(content, filename, 'text/plain');
        return { success: true, count: flashcardsData.length };
    }

    return { success: false, error: 'Unsupported format' };
};
