# Note Extraction

This document captures the current note extraction logic used by `utils/extractors/note.ts`.

## Overview

Notes are extracted in-page via `browser.scripting.executeScript` and assembled into `NoteBlock` arrays.

## Root Selection

The extractor uses the first match from:

1. `note-editor`
2. `labs-tailwind-doc-viewer`
3. `document.body`

## Title

The note title is read from `input[aria-label="note title editable"]` and trimmed.

## Block Collection

- Blocks are collected from `div.paragraph` and `table` elements under the root.
- Paragraphs inside tables are skipped to avoid double counting.

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
- `span[aria-label]` where the label matches `^\d+\s*:` becomes a citation inline.
  - Citation text is not included in the inline stream.
- Adjacent inlines with identical `bold/italic` are merged.
  - Citation inlines are never merged into text inlines.
- Leading/trailing whitespace is trimmed from the first/last inline.
- Empty inlines are removed.

## Validation

Extracted blocks are validated with `validateNoteBlocks` before export.
