# NotebookLM Flashcards Export Implementation

This document describes the technical implementation of the flashcards export feature in the NotebookLM Export Pro extension.

## Overview

The flashcards export flow now follows the shared export architecture: extract typed data, validate it, then dispatch to a type-specific exporter. Supported formats are Excel (.xlsx via CSV), JSON, HTML, and Anki-compatible (.txt).

## Architecture

### 1. Trigger (Dashboard Component)
The export process is initiated in `entrypoints/popup/components/Dashboard.tsx` via `handleExport('CSV' | 'JSON' | 'HTML' | 'Anki', 'flashcards')`.

### 2. Extraction (Type-specific + Shared Core)
`extractByType('flashcards', ...)` calls the flashcards extractor in `utils/extractors/flashcards.ts`, which uses `extractNotebookLmPayload` from `utils/extractors/common.ts`. The injected script runs in **all frames** (`allFrames: true`) because NotebookLM embeds content within cross-origin iframes (e.g., `usercontent.goog`).

```typescript
// Dashboard.tsx
const results = await browser.scripting.executeScript({
    target: { tabId, allFrames: true }, // <--- Critical for accessing iframes
    args: [format],
    func: (formatArg) => { ... }
});
```

### 3. Validation + Normalization
`utils/export-core.ts` validates the extracted payload via `validateFlashcardItems` and normalizes it to:
`{ type: 'flashcards', items: FlashcardItem[], source: 'notebooklm' }`.

### 4. Dispatch + Export
`exportByType` in `utils/export-dispatch.ts` enforces supported formats and routes to `utils/flashcard-export.ts`, which:
1.  **Excel**: Maps items to ID/Front/Back rows and writes a `.xlsx` file with `xlsx`.
2.  **JSON**: Wraps the array as `{ flashcards: [...] }` and downloads a `.json`.
3.  **HTML**: Generates a standalone HTML flip-card UI.
4.  **Anki**: Creates a tab-delimited `.txt` file (front <tab> back), normalizing newlines to `<br>`.

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

The `data-app-data` attribute contains a JSON object with a `flashcards` array. Each flashcard item generally follows this structure:

```json
{
  "f": "Front text",
  "b": "Back text"
}
```
