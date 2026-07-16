# Note Extraction

This document captures the current note extraction logic used by `utils/extractors/note.ts`.

## Overview

Notes are extracted in-page via `browser.scripting.executeScript` and assembled into `NoteBlock` arrays. Before extraction, `utils/extractors/rich-text.ts` injects the shared `public/exportkit-rich-text.js` helper so notes, reports, chats, and source details use the same rich-text and equation handling.

## Root Selection

The extractor uses the first match from:

1. `note-editor`
2. `labs-tailwind-doc-viewer`
3. `document.body`

## Title

The note title is read from `input[aria-label="note title editable"]` and trimmed.

## Block Collection

- Blocks are collected from `.paragraph`, `table`, and `pre` elements under the root.
- Using `.paragraph` instead of `div.paragraph` includes list items and other paragraph containers used by NotebookLM.
- Paragraphs inside tables are skipped to avoid double counting.
- Ordered and unordered list items receive a textual list marker in their first inline run.

## Table Parsing

- Each table is mapped to rows (`tr`).
- Cells are `th`/`td` elements.
- Each cell is parsed into inline runs.
- Empty rows are discarded.

## Inline Parsing (Paragraphs and Table Cells)

The extractor walks child nodes recursively and produces inline runs:

- Text nodes are added with whitespace normalized (`\s+` → space).
- `<b>/<strong>` set `bold = true`.
- `<i>/<em>` set `italic = true`.
- KaTeX nodes (`.katex` and `.katex-display`) become first-class `math` inlines containing:
  - `latex`: the TeX expression.
  - `html`: sanitized rendered KaTeX markup for visually faithful HTML/PDF output.
  - `display`: whether the expression is block-level.
- TeX is read from KaTeX's `application/x-tex` annotation or formula data attributes when available. If NotebookLM only exposes rendered KaTeX HTML, the helper reconstructs common TeX structures such as fractions, roots, scripts, accents, operators, matrices, symbols, and math fonts.
- `span[aria-label]` where the label matches `^\d+\s*:` becomes a citation inline.
  - Citation text is not included in the inline stream.
- Adjacent inlines with identical `bold/italic` are merged.
  - Citation and math inlines are never merged into text inlines.
- Leading/trailing whitespace is trimmed from the first/last inline.
- Empty inlines are removed.

## Validation

Extracted blocks are validated with `validateNoteBlocks` before export.
