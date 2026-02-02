# i18n Guideline: Adding New Language Support

## Purpose
This document is a maintenance guide for adding new UI languages after the initial i18n rollout. It focuses on design considerations, architecture touchpoints, and the concrete steps needed to add a locale safely.

## Scope
- Sidepanel UI only (Dashboard + Login + modals + account panel).
- Extension UI strings only (not exported files or manifest metadata).
- Catalogs are bundled with the extension (no runtime download flow).

## Architecture Overview
- Catalogs live in `entrypoints/sidepanel/i18n/messages/` with one flat key map per locale file.
- `entrypoints/sidepanel/i18n/messages.ts` aggregates locale catalogs and exports helpers/types.
- Shared i18n types live in `entrypoints/sidepanel/i18n/messages/types.ts`.
- Shared helpers (pluralization) live in `entrypoints/sidepanel/i18n/messages/helpers.ts`.
- The i18n runtime is in `entrypoints/sidepanel/i18n/i18n.tsx` (provider + `useI18n` + `t()`).
- Locale selection persists to local storage via the `exportkitLocale` key.
- Supported locales: `en-US`, `es-ES`, `de-DE`, `it-IT`, `pt-BR`, `fr-FR`.
- Locale resolution order:
  1. User override (`exportkitLocale`).
  2. Browser UI language (`browser.i18n.getUILanguage()`).
  3. `navigator.language` fallback.
  4. Default to `en-US`.
- Stored values are region-specific locales (current: `en-US`, `es-ES`, `de-DE`, `it-IT`, `pt-BR`, `fr-FR`).
- Language tags are normalized to the closest supported region-specific locale (e.g., `es-MX` -> `es-ES`).
- The document `lang` attribute is set to the active locale for accessibility and proper font fallback.

## Design & UX Guidelines
- Use the same components and spacing tokens defined in `docs/DESIGN_SYSTEM.md`.
- Keep label lengths reasonable to avoid wrapping in cards and buttons.
- Avoid UI-only abbreviations that are hard to translate.
- Prefer neutral phrasing that makes sense across locales.
- When a translation could be ambiguous, add context in the message key name.

## Message Catalog Rules
- Keep keys flat and stable (no nested JSON).
- Use consistent key naming: `section.element.action` or `section.element.label`.
- Use function-valued messages for pluralization and any locale-specific grammar.
- Interpolate variables with `{{token}}` and keep token names consistent across locales.
- Update `Locale` and `MessageKey` types alongside catalog changes.

## Adding a New Locale (Checklist)
1. **Define the locale**
   - Decide the region-specific locale tag (e.g., `de-DE`, `pt-BR`).
   - Add it to the `Locale` union type.
   - Update `normalizeLocale` to map any related language tags to the chosen locale.
2. **Add catalog entries**
   - Add a new locale file in `entrypoints/sidepanel/i18n/messages/` (e.g., `ja-JP.ts`).
   - Export a `const XX_MESSAGES` map with the same keys as other locales.
   - Import the new locale in `entrypoints/sidepanel/i18n/messages.ts` and add it to `MESSAGES`.
   - Translate all existing keys; do not introduce locale-only keys.
   - Keep punctuation and sentence case consistent with existing locales.
3. **Update language selector**
   - Add the locale to the UI select list with a native language label.
   - Keep the list order stable and readable (English name + native name if needed).
   - Labels are defined in `LOCALE_LABELS` and must include the new locale.
4. **Verify formatting**
   - Check plural forms and dynamic messages (`Intl.PluralRules` / `Intl.DateTimeFormat`).
   - Verify date and number formatting are correct in the new locale.
5. **Check layout fit**
   - Scan key screens (Dashboard, Login, modals) for overflow or truncation.
   - Adjust copy only (avoid ad-hoc CSS tweaks).
6. **Document**
   - Update this file with the new locale.
   - If new UI copy is introduced, add a note to `docs/EXPORT_ARCHITECTURE.md` only when export formats change.

## Files Most Likely to Change
- `entrypoints/sidepanel/i18n/messages.ts`
- `entrypoints/sidepanel/i18n/messages/*.ts`
- `entrypoints/sidepanel/i18n/messages/types.ts`
- `entrypoints/sidepanel/i18n/messages/helpers.ts`
- `entrypoints/sidepanel/i18n/i18n.tsx`
- `entrypoints/sidepanel/components/AccountPanel.tsx` (language selector)
- `entrypoints/sidepanel/App.tsx` (provider wiring)

## Manual Verification
- Launch sidepanel; confirm default language matches browser UI.
- Change language in Account panel; UI updates immediately.
- Refresh sidepanel; language preference persists.
- Verify pluralization output for 0/1/2 values.

## Notes
- Do not localize exported file content in this process.
- Keep catalogs bundled; no runtime download flow is expected.
