# i18n Feature Plan

## Goals
- Localize all user-facing extension UI strings in the sidepanel (Dashboard + Login + modals).
- Support multiple locales with a consistent, typed message catalog.
- Respect the user's UI language by default, with an explicit language override saved locally.
- Keep styling aligned with `docs/DESIGN_SYSTEM.md` tokens/components.

## Non-Goals
- Localize exported file content (PDF/Word/Markdown) or manifest metadata in this pass.
- Add runtime translation downloads; catalogs are bundled with the extension.

## Locale Strategy
- Supported locales (initial): `en` (default), `es`.
- Locale resolution order:
  1. User override from local storage (`exportkitLocale`).
  2. Browser UI language (`browser.i18n.getUILanguage()` when available).
  3. `navigator.language` fallback.
  4. Default to `en`.
- Normalize language tags to the closest supported locale (`es-ES` -> `es`).
- Update `document.documentElement.lang` to the active locale.

## Message Catalog Structure
- Create `entrypoints/sidepanel/i18n/messages.ts` with:
  - `MESSAGES` map: `{ en: { ... }, es: { ... } }`.
  - Flat message keys for simple lookup.
  - Function-valued messages for pluralization and dynamic strings.
- Provide `Locale` and `MessageKey` types for safe usage.

## Formatting & Pluralization
- Implement `t(key, vars)` with:
  - `{{token}}` interpolation for string messages.
  - Function messages that receive `{ locale, ...vars }` for advanced logic.
- Use `Intl.PluralRules` to choose `one`/`other` forms.
- Use `Intl.DateTimeFormat` for date display (billing end date) with the active locale.

## UI Integration
- Add `I18nProvider` and `useI18n` hook in `entrypoints/sidepanel/i18n`.
- Wrap the sidepanel app with the provider in `entrypoints/sidepanel/App.tsx`.
- Replace all hard-coded UI strings with `t(...)` calls.
- Move export section titles and Notion layout copy into the catalog.

## Language Selection UI
- Add a "Language" section to the account panel using existing card styles:
  - Label: "UI language"
  - `select` with locale choices (English, Espanol) using existing input styling.
- Persist selection to local storage and update the UI immediately.

## Implementation Steps
1. Add i18n core (`messages.ts`, `i18n.tsx`) and locale resolver.
2. Wire `I18nProvider` in the sidepanel app.
3. Replace Dashboard and child component strings with `t(...)` keys.
4. Update Login component strings.
5. Add language selector UI in AccountPanel.
6. Verify default locale detection and local override behavior manually.

## Files to Update
- `entrypoints/sidepanel/i18n/messages.ts` (new)
- `entrypoints/sidepanel/i18n/i18n.tsx` (new)
- `entrypoints/sidepanel/App.tsx`
- `entrypoints/sidepanel/components/*`
- `entrypoints/sidepanel/components/dashboard/*`

## Manual Verification
- Launch sidepanel and confirm strings in English by default.
- Switch language in Account -> UI updates immediately.
- Refresh sidepanel; language preference persists.
- Verify pluralization text for trial counts (0/1/2).
