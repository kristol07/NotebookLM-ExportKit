# NotebookLM Quiz Export Implementation

This document describes the technical implementation of the quiz export feature in the NotebookLM Export Pro extension.

## Overview

The quiz export functionality allows users to extract quiz data from Google NotebookLM and save it as an Excel (.xlsx) file. The process involves:
1.  Targeting the active browser tab.
2.  Injecting a content script into **all frames** (including iframes) to locate the quiz data.
3.  extracting and decoding the proprietary `data-app-data` attribute.
4.  Parsing the JSON content.
5.  Formatting and exporting the data using the `xlsx` library.

## Architecture

### 1. Trigger (Dashboard Component)
The export process is initiated in `entrypoints/popup/components/Dashboard.tsx` via the `handleExport('CSV')` function.

### 2. Script Injection
The extension uses the `browser.scripting.executeScript` API to inject extraction logic. A critical configuration is `allFrames: true`, which is required because NotebookLM embeds content within cross-origin iframes (e.g., `usercontent.goog`).

```typescript
// Dashboard.tsx
const results = await browser.scripting.executeScript({
    target: { tabId, allFrames: true }, // <--- Critical for accessing iframes
    args: [format],
    func: (formatArg) => { ... }
});
```

### 3. Content Extraction Logic
The injected script runs inside every frame of the page. It performs the following steps:

1.  **Locate Data Element**: Searches for an element with the `[data-app-data]` attribute.
    ```javascript
    const dataElement = doc.querySelector('[data-app-data]');
    ```
2.  **Decode Content**: The content inside `data-app-data` is HTML-encoded. A helper function decodes it:
    ```typescript
    const decodeDataAttribute = (raw: string) => {
        const txt = document.createElement('textarea');
        txt.innerHTML = raw;
        return txt.value;
    };
    ```
3.  **Parse JSON**: The decoded string is parsed as JSON.
4.  **Validate**: Checks for the existence of `quiz`, `notes`, or `sources` properties.

### 4. Data Processing
The `Dashboard.tsx` component receives results from all frames but filters for the one that returns `{ success: true }`.

If valid quiz data is found:
1.  **Mapping**: The raw JSON is mapped to a flat structure suitable for Excel rows:
    *   ID
    *   Question
    *   Options A-D
    *   Correct Answer
    *   Rationale
    *   Hint
2.  **Excel Generation**: The `xlsx` library converts the JSON array to a worksheet and initiates a download.

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
