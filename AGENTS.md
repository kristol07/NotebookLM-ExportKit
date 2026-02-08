# Repository Guidelines

## Project Structure & Module Organization
- `entrypoints/` holds the browser extension entrypoints, including `background.ts` and the sidepanel UI under `entrypoints/sidepanel/`.
- `utils/` contains export logic, shared helpers, and Supabase integration. Extractors live in `utils/extractors/` and are split by content type.
- `docs/` includes architecture notes; start with `docs/EXPORT_ARCHITECTURE.md` when extending export formats.
- `public/` and `assets/` store static assets (icons, SVGs). `testdata/` includes sample inputs for manual checks.

## Build, Test, and Development Commands
- `pnpm install` installs dependencies (repo uses `pnpm`).
- `pnpm dev` runs the WXT dev server for the default browser.
- `pnpm dev:edge` / `pnpm dev:firefox` run browser-specific dev builds.
- `pnpm build` produces a production extension build.
- `pnpm zip` generates a distributable zip.
- `pnpm compile` runs a TypeScript type check (`tsc --noEmit`).

## Coding Style & Naming Conventions
- TypeScript + React with ESM (`"type": "module"`). Use 2-space indentation, semicolons, and single quotes to match existing files.
- React components use PascalCase filenames (e.g., `Dashboard.tsx`); utilities use kebab-case or descriptive names in `utils/`.
- For any export feature work, read `docs/EXPORT_ARCHITECTURE.md` first to align with the export pipeline design and avoid introducing inconsistent extractor/dispatch patterns.
- Whenever new features or improvements are shipped in a new version, read `docs/WHATS_NEW_POPUP.md` and update the version-gated "What's New" mapping flow (`WHATS_NEW_VERSION` + `WHATS_NEW_FEATURES_BY_VERSION`) in `entrypoints/sidepanel/components/Dashboard.tsx`.
- Keep locale files lean for "What's New": remove `whatsNew.feature.*` keys that are no longer referenced by `WHATS_NEW_FEATURES_BY_VERSION` (apply removals across all locale catalogs).
- Export logic is organized by content type; add new extractors in `utils/extractors/` and route via `utils/export-dispatch.ts`.
- After adding a new export feature, update related marketing/docs pages in `docs/site/` (including the landing page, Terms, and Privacy Policy when affected) and refresh the feature documentation in `README.md`.
- Add the AGPL copyright header to any new source files.
- When doing any UI design work, always review `docs/DESIGN_SYSTEM.md` first and follow its guidance.
- Ensure new UI elements use i18n message keys and update all locale catalogs accordingly.

## Testing Guidelines
- No automated test framework is configured yet.
- Use `pnpm compile` for type safety and verify export behavior manually (for example with `testdata/mindmap.html`).
- If you add tests, document the runner and commands here.

## Commit & Pull Request Guidelines
- Commit messages follow Conventional Commits (`feat:`, `fix:`, `refactor:`). Keep scopes concise and action-oriented.
- PRs should include: summary of changes, manual verification steps, and linked issues if applicable. Attach screenshots for UI changes in `entrypoints/sidepanel/`.
- Update architecture docs (for example `docs/EXPORT_ARCHITECTURE.md`) when export pipeline design or supported formats change.

## Security & Configuration Tips
- Configuration is loaded from `.env`; keep secrets out of the repo and update `.env.example` when adding new variables.
