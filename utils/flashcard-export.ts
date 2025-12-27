import * as XLSX from 'xlsx';
import { ExportFormat, downloadBlob } from './quiz-export';


export const generateFlashcardsHtml = (flashcardsData: any[], title: string) => {
    const jsonData = JSON.stringify(flashcardsData);
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title} - Flashcards Export</title>
    <style>
        :root {
            --bg-color: #1e1e1e;
            --card-bg: #2d2e31;
            --text-primary: #e3e3e3;
            --text-secondary: #c4c7c5;
            --accent-color: #a8c7fa;
            --btn-bg: #3c4043;
            --btn-hover: #4e5155;
            --progress-bg: #444746;
            --text-secondary: #a8a8a8;
            --accent-color: #a8c7fa;
            --btn-hover: rgba(255, 255, 255, 0.1);
        }

        body {
            font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            background-color: var(--bg-color);
            background-image: radial-gradient(circle at 10% 20%, rgba(9, 61, 137, 0.4) 0%, transparent 40%),
                              radial-gradient(circle at 90% 80%, rgba(26, 88, 51, 0.4) 0%, transparent 40%);
            color: var(--text-primary);
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
            max-width: 600px;
            padding: 20px;
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
            border-radius: 24px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.5);
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
            padding: 40px;
            box-sizing: border-box;
            background-color: var(--card-bg);
            border: 1px solid rgba(255,255,255,0.05); /* Subtle border */
            border-radius: 24px;
            text-align: center;
            font-size: 1.5em;
            line-height: 1.5;
        }

        .card-back {
            transform: rotateY(180deg);
            background-color: var(--card-bg);
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
            margin-top: 20px;
            font-size: 0.8rem;
            color: var(--text-secondary);
            text-transform: uppercase;
            letter-spacing: 1px;
            pointer-events: none;
        }
        
        .controls {
            display: flex;
            justify-content: space-between;
            align-items: center;
            width: 100%;
            max-width: 800px;
            margin-top: 40px;
            padding: 0 20px;
            gap: 24px;
        }

        .nav-btn {
            background: var(--btn-bg);
            border: none;
            color: var(--text-primary);
            width: 56px;
            height: 56px;
            border-radius: 50%;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 1.5em;
            transition: background 0.2s, opacity 0.2s;
            flex-shrink: 0;
        }

        .nav-btn:hover:not(:disabled) {
            background: var(--btn-hover);
        }

        .nav-btn:disabled {
            opacity: 0.3;
            cursor: default;
        }

        .progress-bar {
            flex: 1;
            height: 6px;
            background: var(--progress-bg);
            border-radius: 3px;
            position: relative;
            overflow: hidden;
        }

        .progress-fill {
            height: 100%;
            background-color: var(--accent-color);
            border-radius: 2px;
            width: 0%;
            transition: width 0.3s ease;
        }

        .progress-text {
            font-size: 1em;
            color: var(--text-secondary);
            min-width: 60px;
            text-align: center;
            font-variant-numeric: tabular-nums;
        }

        .top-hint {
            position: absolute;
            top: 20px;
            color: var(--text-secondary);
            font-size: 0.85em;
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

export const exportFlashcards = (flashcardsData: any[], format: ExportFormat, tabTitle: string, timestamp: string) => {
    if (format === 'CSV') {
        const rows = flashcardsData.map((c: any, index: number) => ({
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

        const rows = flashcardsData.map((c: any) => {
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
