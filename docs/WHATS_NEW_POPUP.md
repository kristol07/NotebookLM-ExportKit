# What's New Popup (Sidepanel)

This document describes how the sidepanel "What's New" popup works and how to update it for each release.

## Behavior
- The popup is version-gated and shown once per extension version.
- Storage key: `exportkitWhatsNewSeenVersion`
- Current version gate and mapping live in:
  - `entrypoints/sidepanel/components/Dashboard.tsx`
  - `WHATS_NEW_VERSION`
  - `WHATS_NEW_FEATURES_BY_VERSION`
- `WHATS_NEW_VERSION` is read from `browser.runtime.getManifest().version`.
- On sidepanel load:
  - It collects feature keys for all mapped versions where `seenVersion < version <= WHATS_NEW_VERSION`.
  - If no unseen keys are found, popup does not show.
  - Otherwise, popup shows once with the merged unseen list.
- Closing the popup writes `exportkitWhatsNewSeenVersion = WHATS_NEW_VERSION`, so it stays hidden for that version afterward.

## Content Model
- The popup renders a dynamic list of i18n keys (`MessageKey[]`) merged from unseen versions in `WHATS_NEW_FEATURES_BY_VERSION`.
- This allows different item counts per version and supports users who skip intermediate releases.
- Modal component:
  - `entrypoints/sidepanel/components/dashboard/WhatsNewModal.tsx`

## Release Checklist
For each new release that should show a popup:

1. Add version item list:
   - `WHATS_NEW_FEATURES_BY_VERSION['<new version>'] = ['whatsNew.feature.xxx', ...]`
   - Keep prior version entries that still need to appear for users upgrading from older versions.
2. Add new i18n keys (if needed) across all locale files:
   - `entrypoints/sidepanel/i18n/messages/*.ts`
3. Remove stale i18n keys only when they are no longer referenced by any kept version entry:
   - Delete `whatsNew.feature.*` keys that are no longer referenced by any entry in `WHATS_NEW_FEATURES_BY_VERSION`.
   - Keep locale catalogs aligned (remove the same keys in all locale files).
4. Validate:
   - `pnpm compile`

If a release should not show popup, either:
- Do not add a version entry to `WHATS_NEW_FEATURES_BY_VERSION`, or
- Add an empty list for that version.
