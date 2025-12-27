# NotebookLM Quiz Export Implementation

This document describes the technical implementation of the quiz export feature in the NotebookLM Export Pro extension.

## Overview

The quiz export flow now follows the shared export architecture: extract typed data, validate it, then dispatch to a type-specific exporter. Supported formats are Excel (.xlsx via CSV), JSON, HTML, and Anki-compatible (.txt).

## Architecture

### 1. Trigger (Dashboard Component)
The export process is initiated in `entrypoints/popup/components/Dashboard.tsx` via `handleExport('CSV' | 'JSON' | 'HTML' | 'Anki', 'quiz')`.

### 2. Extraction (Type-specific + Shared Core)
`extractByType('quiz', ...)` calls the quiz extractor in `utils/extractors/quiz.ts`, which uses `extractNotebookLmPayload` from `utils/extractors/common.ts`. The injected script runs in **all frames** (`allFrames: true`) because NotebookLM embeds content within cross-origin iframes (e.g., `usercontent.goog`).

```typescript
// Dashboard.tsx
const results = await browser.scripting.executeScript({
    target: { tabId, allFrames: true }, // <--- Critical for accessing iframes
    args: [format],
    func: (formatArg) => { ... }
});
```

### 3. Validation + Normalization
`utils/export-core.ts` validates the extracted payload via `validateQuizItems` and normalizes it to:
`{ type: 'quiz', items: QuizItem[], source: 'notebooklm' }`.

### 4. Dispatch + Export
`exportByType` in `utils/export-dispatch.ts` enforces supported formats and routes to `utils/quiz-export.ts`, which:
1.  **Excel**: Maps items to a flat row shape (ID, Question, Options A-D, Rationales A-D, Correct Answer, Hint) and writes a `.xlsx` file with `xlsx`.
2.  **JSON**: Stringifies the `QuizItem[]` array directly (no wrapper object).
3.  **HTML**: Generates a standalone interactive HTML quiz UI.
4.  **Anki**: Creates a tab-delimited `.txt` file with question/options on the front and correct answer + rationale on the back.

## Permissions

To ensure the script can run inside the necessary iframes, the `wxt.config.ts` (manifest) includes specific host permissions:

```typescript
// wxt.config.ts
host_permissions: [
  'https://notebooklm.google.com/*',
  'https://*.usercontent.goog/*' // Required for inner frames
]
```

## Data Structure
The `data-app-data` attribute contains a JSON object with a `quiz` array. Each quiz item generally follows this structure:

```json
{
  "question": "string",
  "answerOptions": [
    { "text": "Option 1", "isCorrect": false },
    { "text": "Option 2", "isCorrect": true, "rationale": "Reasoning..." }
  ],
  "hint": "string"
}
```
