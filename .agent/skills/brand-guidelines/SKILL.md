---
name: brand-guidelines
description: Maintain and apply the brand guidelines for santi020k.com. Use this skill when updating docs/brand-guidelines.md, adding new design tokens or components, changing brand colors or typography, or ensuring a new page/component aligns with the established visual identity. Also use when the brand direction changes and the source-of-truth document needs updating.
---

# Brand Guidelines — santi020k

**Source of truth:** `docs/brand-guidelines.md` (v2.5, May 2026).
**Design implementation:** See the `web-design` skill for token names, glass utilities, and component patterns.

This skill has two jobs:
1. Help Claude apply brand rules when building UI.
2. Keep `docs/brand-guidelines.md` accurate when the design evolves.

---

## Brand at a Glance

| Property | Value |
|---|---|
| Name / handle | Santi020k · @santi020k |
| Full name | Santiago Molina |
| Role | Engineering Leader & Full-Stack Architect |
| Tone | Direct, concise, technical, personal — never corporate |
| Primary font | Montserrat variable (all roles) |
| Brand color | Deep purple — `--brand` (light: `264 92% 47%`, dark: `264 90% 58%`) |
| Dark mode | `data-theme="dark"` on `<html>` |
| Aesthetic | Minimalist glass UI with purple brand gradients |

---

## Color Rules

- **Always use semantic tokens** — `text-brand`, `bg-brand/10`, `border-line/40` — never hardcode hex.
- Primary CTA color: `brand` / `brand-solid` (the solid variant has higher contrast for white text).
- Tinted surfaces: `brand-soft` (e.g., `bg-brand-soft/50`).
- Hover/active states: `accent` (one step lighter than `brand`).
- Glow effects: `glow` (lightest purple, for blur blobs and gradients).

Light theme neutrals are hue-shifted purple (`~268°`) — not neutral gray. Dark theme is deep purple-tinted (`~260°`). Both are already baked into the tokens.

---

## Typography Rules

- One typeface only: **Montserrat variable** (self-hosted in `public/fonts/`).
- Sentence case for all headings — not Title Case.
- One `<h1>` per page. Never skip heading levels for visual sizing — use Tailwind classes on the correct element.
- Hero headlines: tight tracking (`tracking-[-0.06em]`), fluid sizes with custom line-heights (`text-[5.2rem]/[0.92]`).
- Gradient headline: `bg-linear-to-r from-brand via-accent to-brand bg-clip-text text-transparent`.
- `section-label` utility for all eyebrow text.

---

## Logo

- Source: `src/assets/brand/logos/logo-santi020k.webp` (wordmark, 6.34:1 ratio)
- Square icon: `public/logos/logo-square.webp`
- Fill color aligns with `--brand` (deep purple, approx. `#5a0fdb` light / `#8747ff` dark)
- Never recolor, stretch, rotate, or add glow/shadow to the logo

---

## Voice Summary

| Context | Tone |
|---|---|
| Hero | Confident, identity-first, one clear CTA |
| Blog | Conversational, educational, "you" |
| Portfolio | Factual, outcome-focused |
| About | First person, narrative |
| Error pages | Light and friendly |

**Avoid:** "leverage", "synergy", "utilize", "seamless", "robust", "cutting-edge"
**Avoid:** Passive voice, vague CTAs ("Learn more", "Click here")
**Use:** Verb-first CTAs ("Read the full post", "See the source code")

---

## Component Brand Rules

### Badges / Pills

Use the `Pill.astro` component with named variants. Variant `accent-one` = brand purple. Never recreate badge styles inline.

### Cards

All cards use the glass utility system (`panel-card`, `card-interactive`, `mini-note`, etc.). See the `web-design` skill for the full list.

### Navigation

- Active state: `aria-current="page"` — **not** a class.
- Hover: underline with `underline-offset-2`.
- Header is `position: fixed` on mobile with `backdrop-blur-xl` and `bg-white/20` (dark: `bg-black/20`).

### OG Images

Generated via Satori at `src/pages/og/`. Every page needs one. Size: 1200×630px PNG.

---

## Updating `docs/brand-guidelines.md`

When the design changes (new tokens, new component patterns, updated copy), update the guidelines doc too. The document is version-tracked — bump the version in the header and add an entry to the Version History table (§16).

**What triggers an update:**
- New or renamed CSS tokens
- New reusable component pattern
- Change to the navigation structure
- New social channel or contact method
- Brand voice / copy direction shift

**What does NOT need a guidelines update:**
- Individual page copy changes
- Bug fixes with no visual change
- Adding a new blog post or project

---

## Quick Checklist — New Component

Before shipping any new UI component, verify it against the brand:

- [ ] Colors via token names only (no hex)
- [ ] Montserrat font — no overrides to another typeface
- [ ] Glass surface from `utilities.css` (`panel-card`, `mini-note`, etc.)
- [ ] All animations have `motion-reduce:` variants
- [ ] Responsive at 375px and 1440px
- [ ] WCAG AA contrast (4.5:1 body, 3:1 large / UI)
- [ ] `aria-hidden="true"` on decorative icons
- [ ] Dark mode tested with `data-theme="dark"`
