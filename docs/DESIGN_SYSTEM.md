# Design System

This document captures the shared visual language for NotebookLM ExportKit across the landing page, success page, and extension UI.

## Brand
- **Name:** NotebookLM ExportKit
- **Logo mark:** the "brand dot" (gradient core + soft ring)

### Brand dot spec
CSS reference (from the UI and site):
```css
.brand-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: linear-gradient(135deg, #d3542c, #ff8f5a);
  box-shadow: 0 0 0 6px rgba(211, 84, 44, 0.15);
}
```
Notes:
- The core is the gradient circle (accent -> accent light).
- The ring is a soft glow using a translucent shadow.
- Icon assets in `public/icon/` mirror this motif.

## Tokens
Use these tokens as the source of truth across UI and site.

| Token | Value | Usage |
| --- | --- | --- |
| `--bg` | `#f6f1e7` | Primary background |
| `--bg-deep` | `#efe4d6` | Background depth gradient |
| `--ink` | `#171717` | Primary text |
| `--muted` | `#5b5b5b` | Secondary text |
| `--accent` | `#d3542c` | Primary accent |
| `--accent-light` | `#ff8f5a` | Accent highlight |
| `--accent-dark` | `#b14320` | Accent emphasis |
| `--teal` | `#1f6f78` | Success/support accents |
| `--card` | `#fff7ef` | Card background |
| `--stroke` | `#e3d6c5` | Borders/dividers |
| `--shadow` | `0 18px 40px rgba(23, 23, 23, 0.12)` | Card shadow |
| `--disclosure-size` | `16px` | Expand/collapse indicator size |
| `--disclosure-stroke` | `2px` | Expand/collapse indicator stroke |
| `--radius-xs` | `8px` | Tight radius (chips) |
| `--radius-sm` | `10px` | Inputs/small buttons |
| `--radius-md` | `12px` | Buttons/default cards |
| `--radius-lg` | `14px` | Section cards |
| `--radius-xl` | `18px` | Hero/success cards |
| `--radius-2xl` | `22px` | Large marketing cards |
| `--space-0` | `4px` | Hairline spacing |
| `--space-1` | `6px` | Micro spacing |
| `--space-2` | `8px` | Tight spacing |
| `--space-3` | `10px` | Button padding |
| `--space-4` | `12px` | Compact padding |
| `--space-5` | `14px` | Default spacing |
| `--space-6` | `16px` | Base padding |
| `--space-7` | `18px` | Section spacing |
| `--space-8` | `20px` | Comfortable padding |
| `--space-9` | `24px` | Large spacing |
| `--space-10` | `32px` | Oversized spacing |
| `--space-11` | `28px` | Marketing padding |
| `--space-12` | `36px` | Hero padding |
| `--space-13` | `48px` | Large gaps |
| `--space-14` | `64px` | Section padding |
| `--space-15` | `72px` | Large vertical spacing |
| `--space-16` | `88px` | Section separation |
| `--space-17` | `96px` | Footer/CTA spacing |
| `--font-display` | `'Space Grotesk', sans-serif` | Headlines |
| `--font-body` | `'IBM Plex Sans', sans-serif` | Body/UI |
| `--size-xxs` | `10px` | Tiny labels |
| `--size-xs` | `11px` | Micro labels |
| `--size-sm` | `12px` | UI text |
| `--size-md` | `14px` | Body text |
| `--size-base` | `16px` | Secondary headings |
| `--size-lg` | `18px` | Section titles |
| `--size-xl` | `20px` | Page titles |
| `--size-2xl` | `24px` | Hero titles |
| `--size-3xl` | `28px` | Section headings |

## Color
Primary palette:
- Background: `#f6f1e7`
- Background deep: `#efe4d6`
- Ink: `#171717`
- Muted text: `#5b5b5b`
- Accent: `#d3542c`
- Accent light: `#ff8f5a`
- Accent dark: `#b14320`
- Teal support: `#1f6f78`
- Card: `#fff7ef`
- Stroke: `#e3d6c5`

Gradients:
- Background (site + extension):
  - radial `#ffd2b9` and `#cfe7e6` on top of the warm base
- Primary button:
  - `linear-gradient(90deg, #d3542c, #f28c5b)`

## Typography
Primary fonts:
- **Headings:** Space Grotesk (600-700)
- **Body:** IBM Plex Sans (400-600)

Usage:
- Headlines: Space Grotesk, tighter letter spacing
- Body, labels, UI: IBM Plex Sans

## Components
Buttons:
- Rounded pill/soft corners (10-12px)
- Default: white fill + warm stroke
- Primary: warm gradient, white text

Cards:
- Warm card background with soft shadow
- Rounded corners (14-22px)
- Border `#e3d6c5`

Badges/labels:
- Uppercase, small, with teal or muted tone

Toasts:
- Centered, small, high contrast
- Success uses teal, error uses warm red

## Do / Don't
Do:
- Use warm gradients and the brand dot to anchor identity.
- Keep cards soft and tactile with subtle shadows.
- Prefer short, action-led copy (e.g., "Export in seconds").
- Use the accent gradient for primary actions only.
- Keep spacing tight in the sidepanel and roomy on marketing pages.

Don't:
- Use cool neon colors or heavy drop shadows.
- Mix multiple font families beyond the two brand fonts.
- Overload the UI with outlines or dense borders.
- Use purple-on-white or dark-mode defaults.
- Add excessive motion or micro-animations.

## Spacing & Layout
Extension sidepanel:
- Compact base width (280px), expands at 360px and 420px breakpoints
- Tighter spacing on small widths, more breathing room on larger widths

Landing/success pages:
- Centered layout, large card modules
- Generous padding for readability

## Motion
- Subtle rise-in on landing sections (`@keyframes rise`)
- Toast fade-in (`@keyframes fadeIn`)
- Keep motion minimal and purposeful

## Where styles live
- Extension UI: `entrypoints/sidepanel/App.css`
- Landing page: `docs/site/index.html`
- Success page: `docs/site/success/index.html`
- Icons: `public/icon/*`
