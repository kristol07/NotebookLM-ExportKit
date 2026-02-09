# Export Architecture Notes

This document summarizes the current export refactor and outlines how to extend it for new content types and formats. It also records the future plan for user-provided JSON inputs (not implemented).
For Google OAuth/Drive setup, see `docs/GOOGLE_OAUTH_SETUP.md`.

## Current Structure

### Core
- `utils/export-core.ts` owns shared types and validation.
- `utils/export-dispatch.ts` routes by content type to the correct exporter and enforces per-type format support.
- `utils/export-delivery.ts` handles delivery targets (download, Google Drive, Notion) after exporters build blobs or accept structured payloads for destination-native layouts.
- Clipboard delivery for Markdown (select content types) is handled in the dashboard when the target is **download**, so it can bypass file saving while reusing the same export pipeline.

### Content-specific
- `utils/quiz-export.ts`, `utils/flashcard-export.ts`, `utils/mindmap-export.ts`, `utils/datatable-export.ts`, `utils/note-export.ts`, `utils/report-export.ts`, `utils/slidedeck-export.ts`, `utils/infographic-export.ts`, and `utils/videooverview-export.ts` implement per-type formats and keep HTML UIs distinct where needed.
- `utils/extractors/` contains one extractor per content type (including notes and reports) and a shared `data-app-data` extraction helper.
- Note extraction details: see `docs/NOTE_EXTRACTION.md`.
- Notes currently support Markdown, Word, and PDF exports; PDF uses HTML rendering for layout.
- Slide decks support PDF, PPTX, HTML, and ZIP (Markdown + image files).
- Infographics support PNG, HTML, PDF, and Notion native rendering.
- Video overviews support MP4 and ZIP bundles (video + extracted frames + WAV audio + transcript outputs).
- Exporters return `{ blob, filename, mimeType }` so delivery targets can decide whether to download or upload.

### Destination renderers (native layouts)
- Some destinations (Notion) render **native primitives** instead of consuming file formats.
- `utils/notion.ts` accepts structured payloads (`items`, `meta`) and builds Notion blocks (tables, toggles, rich text).
- Format labels (CSV/JSON/HTML/Markdown) are still required for extraction, but the destination layout is **content-type driven**.
- Notion delivery uses a single **database container** and per-notebook **data sources**; see `docs/NOTION_EXPORT.md`.

### Notion delivery (mapping flow)
1. User selects a Notion **page** destination.
2. Extension creates or reuses the `NotebookLM ExportKit` database under that page.
3. Each NotebookLM notebook maps to a dedicated **data source** within that database.
4. Each export becomes a **page** in the notebook’s data source with properties + block content.

### PDF export size controls
- Note PDF rendering rasterizes each page via html2canvas in `utils/note-export.ts`.
- Users can choose `Size first` vs `Clarity first` in the dashboard; the selection is stored in `localStorage` as `exportkitPdfQuality`.
- The presets are defined in `PDF_PRESETS` (scale + image format); adjust those values to trade off size vs clarity.

## Extending for New Content Types (Normal Workflow)

Treat **type-specific extractors and type-specific format support** as the default. Quiz and flashcards only share formats by coincidence. New content types should bring their own extractor and format list even if they overlap.

Recommended steps:
1. **Type-specific extraction**
   - Keep extraction in `utils/extractors/` and add one extractor per content type.
2. **Supported formats per type**
   - Define a per-type supported-format list (e.g., `supportedFormats: Record<ContentType, ExportFormat[]>`) and enforce it before dispatch.
3. **Type-specific exporters**
   - Keep each content type in its own file with format-specific conversion logic (e.g., `exportSlidesToPptx`, `exportMindmapToOpml`, `exportMindmapToFreeMind`).
4. **Delivery targets**
   - Add new app exports (Drive, Notion, etc.) as delivery targets in `utils/export-delivery.ts`.
   - If a destination prefers native primitives, implement a renderer alongside the destination (similar to `utils/notion.ts`) that consumes structured payloads from extractors.

This keeps the core small and makes it straightforward to add new export types without assuming shared formats or extraction logic.

## Future: User JSON → HTML (Not Implemented)

Planned direction:
- Add a UI to let users **select the content type** (quiz or flashcards).
- Validate against the JSON schemas in `utils/export-schemas.ts`.
- Render HTML using the existing per-type HTML templates.

This is intentionally deferred for now.
