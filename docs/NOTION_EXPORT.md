# Notion Export Setup (Design)

This guide captures the Notion delivery flow and the planned NotebookLM-to-Notion mapping.

## Overview
- Notion delivery is a Plus feature and requires sign-in.
- The extension connects to Notion via Supabase OAuth (integration access).
- Users pick a **Notion page** where the extension creates **one database**.
- Each NotebookLM notebook maps to a **data source** inside that database.
- Each export creates a **page** in the notebook’s data source.

## OAuth Requirements
1. Enable the Notion OAuth provider in the Supabase dashboard.
2. Add the extension redirect URL shown during the Notion connect flow.
3. Share the target Notion page (and any databases it contains) with the integration.

## Destination Model
We use the Notion 2025-09-03 API model where **databases** are containers and **data sources** hold properties.

- **User selects a page** (or page URL/ID).
- The extension creates (or reuses) one database under that page:
  - Title: `NotebookLM ExportKit`
  - Properties live on its **initial data source**.
- For each NotebookLM notebook:
  - Create (or reuse) a **data source** inside that database.
  - The data source name matches the notebook title.
- Each export is a new **page** in that notebook’s data source.

### Why this design
- Keeps a single Notion destination per user (one database under a chosen page).
- Preserves structured properties for filtering by type/format/source.
- Scales across many notebooks without flooding the workspace root.

## Data Model
### Database (container)
- Name: `NotebookLM ExportKit`
- Parent: user-selected page
- Data sources: one per NotebookLM notebook

### Data source (per notebook)
- Name: Notebook title
- Properties:
  - `Name` (title)
  - `Type` (select: Quiz, Flashcards, Mindmap, Note, Report, Chat, Data table, Sources, Slide deck, Infographic, Video overview)
  - `Format` (select: CSV, JSON, HTML, Markdown)
  - `Source` (rich_text)
  - `Exported` (date)
  - `Items` (number)

### Page (per export)
- Parent: `data_source_id`
- Properties:
  - `Name`: export filename or notebook title fallback
  - `Type`, `Format`, `Source`, `Exported`, `Items` from export context
- Children: Notion blocks generated from content (tables, toggles, etc).

## Mapping Storage
Store these in extension storage to avoid re-creating destinations:
- `notionDatabaseId`: the last-selected container database ID.
- `notionPageDatabaseMap`: `{ [pageId: string]: databaseId }` for per-page reuse.
- `notionNotebookMap`: `{ [notebookId: string]: { dataSourceId: string; name: string } }`

`notebookId` should be a stable NotebookLM identifier (not just title).

## Delivery Flow
1. User connects Notion via OAuth.
2. User selects a Notion **page** destination.
3. Extension resolves the `NotebookLM ExportKit` database under that page:
   - Check `notionPageDatabaseMap` for a saved database ID and validate it.
   - If missing, scan the page's child databases via `GET /v1/blocks/{page_id}/children`.
   - Ignore archived or trashed databases (Notion "trash" still returns them via the API).
   - Create a new database only if no existing one is found.
4. On each export:
   - Resolve notebook ID from the active NotebookLM page.
   - Get or create a data source for that notebook.
   - Create a page in that data source with properties + blocks.

## API Notes (2025-09-03)
- `POST /v1/databases` creates a database with `initial_data_source.properties`.
- `POST /v1/data_sources` creates additional data sources under a database.
- `GET /v1/databases/{database_id}` returns container metadata + data sources.
- `GET /v1/databases/{data_source_id}` returns data source properties.
- `POST /v1/pages` uses `parent: { data_source_id }` for inserts.

## Supported Formats
Notion exports are stored as native blocks. Most are text-based, and video overview uses uploaded media blocks.

| Content type | Supported formats |
| --- | --- |
| Quiz | CSV, JSON, HTML |
| Flashcards | CSV, JSON, HTML |
| Mindmap | HTML, Markdown |
| Note | Markdown |
| Report | Markdown |
| Chat | Markdown, JSON |
| Data table | CSV, Markdown |
| Sources | Markdown |
| Slide deck | HTML |
| Video overview | MP4 (native video; optional extracted frames) |

If you need a non-Notion-native export (PDF, Word, SVG, etc.), use the Download or Google Drive destinations.

## Archived Destination Gotcha
If the `NotebookLM ExportKit` database is deleted in Notion, it is **archived** (moved to trash), not permanently removed.
Archived or trashed databases can still be returned by the API and may accept new pages, but they will not show up in the workspace UI unless restored.
The integration now ignores `archived`/`in_trash` databases during destination resolution so a new database is created when the previous one is trashed.
`archived` is the legacy field used for deleted items; `in_trash` is the newer explicit flag for items moved to trash, and not all objects set both.
