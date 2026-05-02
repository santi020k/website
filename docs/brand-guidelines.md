# Santi020k — Brand Guidelines

**Version:** 2.4 · **Last updated:** April 2026 · **Owner:** Santiago Molina (@santi020k)

> Single source of truth for the visual identity, voice, and implementation standards of the personal website and all related materials. Keep this document up to date whenever design tokens, components, or brand direction change.

---

## Related Skills

These `.claude/skills/` documents expand on specific areas of this guide:

| Skill | Scope |
| :---- | :---- |
| [`web-design`](../.claude/skills/web-design/SKILL.md) | Design tokens, component patterns, animations, dark mode |
| [`seo`](../.claude/skills/seo/SKILL.md) | Meta tags, structured data, sitemap, Core Web Vitals |
| [`accessibility`](../.claude/skills/accessibility/SKILL.md) | WCAG 2.2 AA, ARIA, keyboard navigation, Alpine.js patterns |
| [`marketing`](../.claude/skills/marketing/SKILL.md) | Copy, CTAs, blog strategy, social media |
| [`brand-guidelines`](../.claude/skills/brand-guidelines/SKILL.md) | This document — generation and maintenance |

---

## Table of Contents

1. [Brand Identity](#1-brand-identity)
2. [Logo](#2-logo)
3. [Color System](#3-color-system)
4. [Typography](#4-typography)
5. [Spacing & Layout](#5-spacing--layout)
6. [Imagery & Icons](#6-imagery--icons)
7. [Component Patterns](#7-component-patterns)
8. [Motion & Animation](#8-motion--animation)
9. [Voice & Tone](#9-voice--tone)
10. [Accessibility Standards](#10-accessibility-standards)
11. [Marketing & Content Strategy](#11-marketing--content-strategy)
12. [Technical Standards](#12-technical-standards)
13. [Social Presence & Navigation](#13-social-presence--navigation)
14. [Do's & Don'ts](#14-dos--donts)
15. [File Reference](#15-file-reference)
16. [Version History](#16-version-history)

---

## 1. Brand Identity

### Overview

| Property | Value |
| :------- | :---- |
| **Name** | Santi020k |
| **Full name** | Santiago Molina |
| **Handle** | @santi020k |
| **Role** | Engineering Leader & Full-Stack Architect |
| **Experience** | 12+ years — React, TypeScript, Architecture, Automation |
| **Specialisation** | Resilient systems, technical leadership, and developer experience |
| **Location** | Medellín, Colombia · Remote worldwide |
| **Contact** | [hi@santi020k.com](mailto:hi@santi020k.com) |
| **Profiles** | [LinkedIn](https://linkedin.com/in/santi020k) · [GitHub](https://github.com/santi020k) · [Medium](https://medium.com/@santi020k) |
| **Availability** | Open to tech lead, full-stack, and engineering leadership roles |

### Personality

The brand sits at the intersection of technical depth and human approachability — a senior developer and leader who shares what they know without ego, focusing on calm systems and clear delivery.

| Attribute | Description |
| :-------- | :---------- |
| **Approachable** | Personal and direct in tone. "Engineering leader sharing what they know" — not corporate marketing speak. |
| **Modern** | Current with web standards. The stack choices (Astro, Alpine.js, Tailwind v4) reflect this deliberately. |

### Target Audience

Developers, potential collaborators, recruiters, engineering teams, and the broader web and open-source community.

### Brand Promise

The site itself demonstrates the engineering values it talks about: fast, accessible, resilient, and well-crafted.

---

## 2. Logo

The logo is a custom WebP wordmark with a stylised "S2K" letterform representing the handle `@santi020k`.

### Specifications

| Property | Wordmark (Primary) | Icon (Square) |
| :---------------- | :------------------ | :-------------- |
| **Source file** | `src/assets/brand/logos/logo-santi020k.webp` | `public/logos/logo-square.webp` |
| **Primary format** | WebP | WebP |
| **Aspect Ratio** | 6.34:1 | 1:1 |
| **Rendered size** | `width="228" height="36"` | `width="32" height="32"` |
| **Primary Use** | Headers, Mastheads | Favicons, Manifest, App Icons |

### Usage Rules

| ✅ Do | ❌ Don't |
| :---- | :------- |
| Use the `.webp` source file for all web contexts | Use old logo or icon files |
| Place on white, light, or dark backgrounds | Place on mid-tone backgrounds that reduce contrast |
| Scale proportionally with `width` and `height` attributes | Stretch, rotate, or distort |
| Maintain clear space on all sides | Crop or crowd the mark |
| Keep the logo fill aligned with brand purple (`--color-brand`, approx. `#5a0fdb` in all themes) | Recolor to unrelated hues (e.g. blue or orange) |
| Wrap in an `<a>` with `aria-label` when used as a home link | Add drop shadows, borders, or glows |

---

## 3. Color System

The palette is fully adaptive between **Light** and **Dark** modes, toggled via `data-theme` on `<html>`. In **light** mode, neutrals use a subtle purple tint (hue **~268°**) and brand purple is aligned with the refreshed light logo and icon (hue **~267°**). **Dark** mode keeps the existing purple system (hue **277°** for neutrals and brand). All color tokens are defined in `src/styles/partials/tokens.css` (imported from `src/styles/global.css`).

**Rule:** Always use semantic CSS custom property tokens in components — never hardcode hex or raw HSL values.

### Brand Primary

| Tone | Token | HSL (raw) | Hex (approx.) | Usage |
| :------- | :----------- | :------ | :-------- | :----------- |
| **Purple** | `--brand` | `264 92% 47%` (light) / `264 90% 58%` (dark) | `#5a0fdb` / `#8747ff` | Logo, CTAs, highlights — deep purple |
| **Accent** | `--accent` | `264 95% 57%` (light) / `264 90% 68%` (dark) | `#7c3af7` / `#a66bff` | Hovers, active states |
| **Glow** | `--glow` | `264 95% 70%` (light) / `264 85% 50%` (dark) | `#a66bff` / `#7c3af7` | Background gradients, hero washes |

### Semantic Tokens — Light Mode

Raw HSL values live on `:root` / `[data-theme="light"]` in [`src/styles/partials/tokens.css`](../src/styles/partials/tokens.css). Tailwind maps them under `@theme` (for example `--color-canvas`, `--color-brand`).

| Role | CSS sources | HSL (raw) | Hex (approx.) | Usage |
| :---------- | :------------------ | :------------ | :--- | :---- |
| Page background | `--theme-bg` → `--color-canvas` | `268 20% 98%` | `#faf9fb` (exact) | `html` / `body` background |
| Surfaces | `--surface`, `--surface-muted`, `--surface-strong` | see tokens file | — | Cards, panels, muted bands |
| Borders | `--line` → `--color-line` | see tokens file | — | Dividers, outlines |
| Headings / strong UI | `--ink` → `--color-ink` | `268 10% 20%` | `#332e38` (approx.) | `h1`–`h6`, strong emphasis |
| Body / secondary text | `--ink-soft` | `268 8% 36%` | `#5b5463` (approx.) | Paragraphs, descriptions |
| Muted labels | `--ink-muted` | `268 6% 28%` | `#47434c` (approx.) | Metadata, captions |
| Brand wash | `--brand-soft` → `--color-brand-soft` | `267 52% 94%` | — | Tinted surfaces, selections |
| Links & interactive emphasis | `text-brand`, `hover:text-brand`, `--brand` / `--accent` | — | — | Use utilities; base `a` inherits context |

### Semantic Tokens — Dark Mode

| Role | CSS sources | HSL (raw) | Usage |
| :---------- | :------------------ | :------------ | :---- |
| Page background | `--theme-bg` → `--color-canvas` | `277 20% 10%` | `#1b141f` — deep purple‑tinted canvas |
| Surfaces | `--surface`, `--surface-muted`, `--surface-strong` | see tokens file | Elevated UI |
| Text | `--ink`, `--ink-soft`, `--ink-muted` | see tokens file | Hierarchy |
| Brand | `--brand`, `--accent`, `--glow`, `--brand-soft` | see Brand Primary table | Same semantics as light |

### Opacity and overlays

Use semantic tokens first. For translucent brand or border effects, prefer Tailwind opacity modifiers on those tokens (for example `border-brand/25`, `bg-brand/10`, `text-ink-soft`) rather than ad hoc hex values.

### Contrast Requirements (WCAG 2.2 AA)

| Text size | Minimum contrast ratio |
| :-------- | :--------------------- |
| Body text (< 18px regular, or < 14px bold) | 4.5 : 1 |
| Large text (≥ 18px regular, or ≥ 14px bold) | 3 : 1 |
| UI components and focus indicators | 3 : 1 |

Verify all new color pairings with a contrast checker before shipping.

---

## 4. Typography

A single variable font is used across the entire brand for consistency and performance.

### Typeface: Montserrat

| Property | Value |
| :------- | :---- |
| **Family** | Montserrat (variable) |
| **Source** | Self-hosted — `public/fonts/` |
| **Weight range** | 100–900 (continuous variable axis) |
| **Styles** | Normal + Italic (separate variable font files) |
| **Format** | TrueType Variable Font (`.ttf`) |
| **Loading strategy** | `font-display: swap` |
| **Tailwind roles** | `--font-sans`, `--font-serif`, `--font-mono`, `--font-display` |

Montserrat is mapped to all four Tailwind font roles to ensure visual consistency regardless of which utility is used.

### Type Scale

| Level | Font Family | Size (Desktop) | Weight | Line Height |
| :------- | :------------ | :------------- | :----- | :---------- |
| **Display** | Montserrat | 64px / 4rem | 800 | 1.1 |
| **H1** | Montserrat | 48px / 3rem | 700 | 1.2 |
| **H2** | Montserrat | 32px / 2rem | 600 | 1.2 |
| **H3** | Montserrat | 24px / 1.5rem | 600 | 1.3 |
| **Body (L)** | Montserrat | 18px / 1.125rem | 400 | 1.6 |
| **Body (M)** | Montserrat | 16px / 1rem | 400 | 1.6 |
| **Caption** | Montserrat | 14px / 0.875rem | 400 | 1.5 |
| **Code** | Montserrat (or system mono) | 14px / 0.875rem | 400 | 1.5 |

|Role|HTML element|Tailwind class|Usage|
|:-|:-|:-|:-|
|Display / H1|`<h1>`|`text-2xl` (base) → `text-3xl sm:text-4xl lg:text-5xl`|Page titles|
|H2|`<h2>`|`text-xl`|Section headings|
|H3|`<h3>`|`text-lg`|Sub-section headings|
|H4|`<h4>`|`text-base font-semibold`|Minor headings|
|Body|`<p>`|`text-base`|Paragraph text|
|Small / Caption|—|`text-sm`|Metadata, dates, UI labels|
|Micro|—|`text-xs`|Tags, footnotes, badge text|

### Custom Typography Utilities

Defined as `@utility` blocks in `src/styles/global.css`:

|Utility|Applies|Use for|
|:-|:-|:-|
|`.title`|`font-semibold`|Any heading-like element needing weight emphasis|
|`.santi-link`|No underline by default; `underline underline-offset-2` on hover|All inline text links|
|`.prose` / `.prose-santi`|`max-w-none` + custom blockquote styles|Long-form markdown content|

### Typographic Rules

- Global letter spacing: `0.025em` (set on `html`)
- Sentence case for all headings — not Title Case Every Word
- One `<h1>` per page — never skip heading levels
- Heading levels communicate document outline, not visual size: set size via Tailwind on the correct semantic element
- Blockquotes use curly quotation marks via `::before` / `::after` pseudo-elements

---

## 5. Spacing & Layout

All spacing follows the Tailwind default scale (4px base unit). Do not introduce one-off margin or padding values.

### Recommended Spacing

| Context | Classes |
| :------- | :------ |
| Component internal padding | `p-4` to `p-6` |
| Section vertical gaps | `gap-8` to `gap-16` |
| Page horizontal margins | `px-4 md:px-6 lg:px-8` |
| Card internal gap | `gap-3` to `gap-4` |

### Breakpoints

Design mobile-first. Add breakpoint prefixes as layouts widen.

| Breakpoint | Value | Target |
| :--------- | :---- | :----- |
| *(base)* | — | Mobile phones |
| `xs` | 320px | Small phones (custom token `--breakpoint-xs`) |
| `sm` | 640px | Large phones / small tablets |
| `md` | 768px | Tablets |
| `lg` | 1024px | Laptops |
| `xl` | 1280px | Desktops |

Test every layout at **375px** (iPhone SE) and **1440px** (standard desktop) before shipping.

### Content Width Tokens

Custom `--container-*` values in `@theme` override Tailwind defaults for tighter reading widths:

| Utility | Max width | Best for |
| :--------- | :------- | :------ |
| `max-w-lg` | 32rem | Narrow prose, forms |
| `max-w-2xl` | 42rem | Blog post body |
| `max-w-4xl` | 54rem | Content page sections |
| `max-w-5xl` | 64rem | Wide layout columns |
| `max-w-6xl` | 76rem | Full-width page shell |

---

## 6. Imagery & Icons

### Photography Style

- Clean, intentional composition — no stock photo aesthetic
- Neutral or dark backgrounds preferred
- High contrast; images must read clearly at thumbnail size

### Core Image Assets

| Asset | Source path | Usage |
| :----------- | :---------- | :---- |
| Logo | `src/assets/brand/logos/logo-santi020k.webp` | Site identity |
| Author photo | `src/assets/photos/about-me.webp` | Hero and author attribution |
| Default OG image | `public/default.webp` | Social share fallback |
| Favicon | `public/favicon.svg` | Browser icon generated from the square mark |
| Fonts | `public/fonts/` | Self-hosted Montserrat variable fonts |

### Open Graph Images

Generated server-side via Satori at `src/pages/og/`. Every page must have one.

| Property | Requirement |
| :------- | :---------- |
| Size | 1200 × 630 px |
| Format | PNG (Satori output) |
| Content | Page title + site branding |
| Contrast | Body text clearly legible at thumbnail size |

### Astro Image Component

Always use `<Image>` from `astro:assets` — never a raw `<img>` tag.

```astro
---
import { Image } from 'astro:assets'
import heroImg from '@/assets/photos/about-me.webp'
---

<Image
  src={heroImg}
  alt="Santiago Molina — Full Stack Developer"
  width={800}
  height={800}
  format="avif"
  loading="eager"
  fetchpriority="high"
/>
```

- Always set explicit `width` and `height` to prevent CLS
- Use `format="avif"` for hero images; Astro handles the WebP fallback
- Decorative images: `alt=""` — no additional `role` attribute needed with `<Image />`

### Icon Packs

Three Iconify packs are used across the site. Always match the correct pack to its context.

| Pack | Prefix | Used in | Example |
| :----------------------- | :-------- | :------- | :------- |
| **Material Design Icons** | `mdi:` | `<Icon>` component (astro-icon) | `mdi:github` |
| **Tabler Icons** | `tabler--` | Tailwind CSS utility class | `icon-[tabler--brand-linkedin]` |
| **Huge Icons** | `hugeicons:` | `<Icon>` component | `hugeicons:menu-01` |

Usage patterns:

```astro
<!-- astro-icon component — for inline SVG with props -->
<Icon name="mdi:github" aria-hidden="true" class="size-8" focusable="false" />

<!-- Iconify Tailwind4 utility — for CSS-only icons -->
<span class="icon-[tabler--brand-github] size-6" aria-hidden="true"></span>
```

Always add `aria-hidden="true"` on decorative icons. For standalone icon buttons, label the `<button>`, not the icon:

```astro
<button type="button" aria-label="Open GitHub profile">
  <Icon name="mdi:github" aria-hidden="true" />
</button>
```

---

## 7. Component Patterns

### Badges

`Badge.astro` (or `Pill.astro`) is the standard tag/label component. Use the named variant — never recreate badge styles inline.

| Variant | Use case |
| :------------ | :------- |
| `default` | General tags, neutral state |
| `accent` | Highlighted tag using the current accent |
| `accent-base` | Uses the lower-contrast base accent tone |
| `accent-one` | Primary brand accent |
| `accent-two` | Secondary brand accent (theme-adaptive) |
| `muted` | Low-emphasis, subtle background |
| `outline` | Bordered, no fill — secondary or filter contexts |
| `subtle` | Neutral zinc surface, universal background compatibility |
| `ghost` | No background, minimal — toggles and filters |
| `warning` | Caution state (yellow palette) |
| `danger` | Error or destructive state (red palette) |

Props: `title` (required), `variant` (default: `"default"`), `showHash` (default: `true`), `className`.

Badges truncate at `200px` on mobile, full width on `sm` and above.

### Cards

Use `transition-all duration-200` for hover lift. Always include `motion-reduce:` variants.

```astro
<article class="
  group relative flex flex-col gap-3
  rounded-xl border border-color-200 bg-special-lighter
  p-5 shadow-sm
  transition-all duration-200
  hover:shadow-md hover:-translate-y-0.5
  motion-reduce:transition-none motion-reduce:hover:translate-y-0
">
  <h2 class="title text-lg transition-colors duration-150 group-hover:text-accent-one">
    {title}
  </h2>
  <p class="text-sm text-color-500 leading-relaxed">{description}</p>
  <!-- Full-card click target — accessible overlay pattern -->
  <a href={href} class="absolute inset-0" aria-label={title}>
    <span class="sr-only">{title}</span>
  </a>
</article>
```

### Navigation Links

All nav links use hover underline with `underline-offset-2`. Active state is indicated via `aria-current="page"`.

```astro
<a
  aria-current={Astro.url.pathname === link.path ? 'page' : false}
  class="underline-offset-2 hover:underline"
  href={link.path}
>
  {link.title}
</a>
```

### Header

The header is `fixed` on mobile with `backdrop-blur-xl` and `bg-white/20` (dark: `bg-black/20`). On `md` and above it becomes `relative` with no blur. It uses `transition:name="header"` for Astro View Transitions.

### Footer

The footer displays `© {author} {year}` with the package version number, plus icon links to all social platforms. It uses `transition:name="footer"` for View Transitions.

---

## 8. Motion & Animation

All animations **must** include a `motion-reduce:` variant or a `prefers-reduced-motion` media query. This is a hard constraint — both an accessibility requirement and a `CLAUDE.md` rule.

### Timing Reference

| Interaction type | Duration | Easing |
| :------------------------------- | :-------- | :----------- |
| Hover micro-interactions | 150–200ms | `ease-out` |
| Content reveals (fade, slide) | 300–400ms | `ease-out` |
| Large layout changes | 400–500ms | `ease-in-out` |
| Alpine `x-show` enter | 200ms | `ease-out` |
| Alpine `x-show` leave | 150ms | `ease-in` |
| Mobile nav drawer | 300ms | `ease-in-out` |

Snappy always feels better than slow. Reserve durations above 300ms for large reveals only.

### Hover Lift (Cards & Interactive Surfaces)

```html
class="transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md
       motion-reduce:transition-none motion-reduce:hover:translate-y-0"
```

### Alpine.js Show / Hide

Always pair `x-show` with `x-transition`. Example — dropdown slide from top:

```html
<div
  x-show="open"
  x-transition:enter="transition-all duration-200 ease-out"
  x-transition:enter-start="opacity-0 -translate-y-2"
  x-transition:enter-end="opacity-100 translate-y-0"
  x-transition:leave="transition-all duration-150 ease-in"
  x-transition:leave-start="opacity-100 translate-y-0"
  x-transition:leave-end="opacity-0 -translate-y-2"
>
```

### Mobile Drawer

The mobile nav uses a slide-in drawer with `translate-y` transition on the drawer body (300ms, `ease-in-out`), managed by a custom `mobile-button` web component with `aria-expanded`.

### Page Transitions

Astro View Transitions are enabled globally (`<ViewTransitions />` in the root layout). Named transitions (`transition:name`) are set on: `header`, `footer`, `logo-link`. The built-in transitions automatically respect `prefers-reduced-motion`.

### Micro-Interaction Checklist

Before shipping any interactive element, verify:

- [ ] Links: underline appears on hover with `transition-colors duration-150`
- [ ] Buttons: `active:scale-95` on press
- [ ] Cards: `hover:-translate-y-0.5 hover:shadow-md`
- [ ] Icon buttons: color shift on hover with transition
- [ ] Form inputs: border color change on `:focus`
- [ ] All transitions have `motion-reduce:` variants

---

## 9. Voice & Tone

### Brand Voice

| Attribute | What it means in practice |
| :---------- | :----------------------- |
| **Direct** | Say what you mean. Cut openers like "In today's fast-paced world…" or "Are you tired of…". |
| **Concise** | Cut adverbs. Cut adjectives that don't earn their place. A short, punchy sentence beats a long winding one. |
| **Technical** | Comfortable with code, architecture, and web tooling. Assume the reader is a developer. Don't over-explain basics — do give context for non-obvious choices. |
| **Personal** | First person on personal pages. Own opinions. Don't hedge everything into oblivion. |
| **Honest** | Share real experiences and takes. No performative enthusiasm or inflated self-promotion. |

### Tone by Context

| Context | Tone |
| :------------------ | :--- |
| Homepage hero | Confident, identity-first, one clear CTA |
| Blog posts | Conversational, educational, second person ("you") |
| Portfolio / projects | Confident, factual, outcome-focused |
| About page | First person, narrative — not a resume |
| Code comments | Minimal; explain the *why*, not the *what* |
| Error pages (404) | Light and friendly, not robotic |
| Commit messages | Imperative, Conventional Commits (`feat:`, `fix:`, `chore:`, `docs:`) |

### Real Example — Homepage Hero (current)

> **Calm systems. Clear delivery.**
>
> Tech lead and full-stack engineer focused on architecture, automation, and developer experience.

This is the reference for the right level of directness, expertise, and human warmth.

### Writing Rules

- Active voice over passive
- Sentence case for headings — not Title Case Every Word
- Avoid: "leverage", "synergy", "utilize", "seamless", "robust", "cutting-edge"
- Inline code: wrap with backticks `` `like this` ``
- Dates: `Intl.DateTimeFormat` — e.g., "Apr 1, 2026"
- Technical depth: assume a developer reader; never explain Git, npm, or HTML basics

---

## 10. Accessibility Standards

Target: **WCAG 2.2 Level AA** throughout. Accessibility is not an audit checkbox — it makes the site better for everyone.

### Core Requirements

- One `<h1>` per page; never skip heading levels
- All interactive elements reachable and operable by keyboard
- Focus indicators visible, meeting 3:1 contrast minimum against adjacent colors
- Every image has appropriate `alt` text; decorative images use `alt=""`
- Color is never the sole means of conveying information
- `lang="en-US"` on `<html>` (set via `site.config.ts`)
- Skip-to-content link present (`SkipLink.astro`)
- All transitions include `motion-reduce:` variants

### Semantic HTML First

Before adding ARIA, ask: *is there a native element for this?*

| Use this | Not this |
| :------------------------- | :-------- |
| `<button type="button">` | `<div onclick>` or `<a>` with no `href` |
| `<nav aria-label="…">` | `<div class="nav">` |
| `<main>` | `<div id="main">` |
| `<h1>`–`<h6>` in order | Bold text in divs |
| `<label for="id">` | Text placed near an input |

### ARIA Usage

- `aria-hidden="true"` and `focusable="false"` on all decorative icons
- `aria-label` on icon-only buttons
- `aria-current="page"` on active nav links
- `aria-expanded` on toggles (mobile menu, dropdowns)
- `aria-label` on the `<header>`, `<nav>` (with distinct labels for each), and `<footer>` landmarks

---

## 11. Marketing & Content Strategy

### Homepage Hero Structure

Answer three questions in under 5 seconds: who, what, why keep reading.

```
[Role / Identity] — one line, bold, large
[Value proposition] — 1–2 sentences expanding on the identity
[Primary CTA] — verb-first, specific
```

### Project Description Template

```
[One-line summary — what it is]
[The problem it solves]
[One interesting technical detail or challenge]
[CTA: link to demo, repo, or case study]
```

### Blog Headlines

Strong headlines are specific, useful, or surprising:

| Pattern | Example |
| :------------------------------- | :------ |
| How I [result] with [method] | "How I reduced my Astro build time by 40%" |
| Why I switched from X to Y | "Why I switched from CRA to Vite" |
| [N] things I learned from [project] | "5 things I learned building a Tailwind v4 site" |
| [Common belief] is wrong | "Alpine.js doesn't need a bundler — and that's the point" |

Avoid vague headlines like "Thoughts on React" or "Some useful CSS tips."

### CTAs

One primary CTA per page. Verb-first and specific.

| ❌ Weak | ✅ Better |
| :------------ | :------- |
| Learn more | Read the full post |
| Click here | See the source code |
| Contact me | Send me a message |
| Check it out | Try the live demo |

### Content Pillars

1. **Tutorials & how-tos** — step-by-step guides using the actual stack
2. **Case studies** — what was built, why, what was learned
3. **Opinions & takes** — considered positions on tooling and patterns
4. **Project updates** — what is being built and what is interesting about it

Publishing cadence: one quality post per month is better than four rushed ones. The blog routes to the native `/blog/` page.

---

## 12. Technical Standards

### Code Conventions

| Convention | Rule |
| :------------------ | :--- |
| Import alias | `@/` for all imports from `src/` |
| Internal links | Always use trailing slashes (`/portfolio/`) |
| Component props | TypeScript `interface Props`, destructured from `Astro.props` |
| Conditional classes | `class:list` — never template literal string concatenation |
| Dark mode | `data-theme="dark"` on `<html>` — never `class="dark"` |
| Images | `<Image>` from `astro:assets` — never raw `<img>` |
| Decorative icons | Always `aria-hidden="true"` and `focusable="false"` |

### Design Token Rules

- All design tokens live in `src/styles/global.css` under `@theme`
- Custom utilities go in `@utility` blocks — never ad hoc inline styles
- Never hardcode hex, HSL, or OKLCH values in components — use semantic tokens
- Class order follows the Tailwind Prettier plugin (ESLint enforces this)
- Dark mode variant: `@custom-variant dark (&:where(.dark,[data-theme='dark'] *))`

### Quality Gates

All code must pass before being considered complete:

```bash
pnpm run lint    # ESLint — zero errors
pnpm run check   # Astro type-check — zero errors
```

### Performance Targets

| Metric | Target / Technique |
| :--------------- | :----------------- |
| Lighthouse score | ≥ 90 on mobile |
| LCP | `loading="eager"` + `fetchpriority="high"` on above-fold images |
| CLS | Explicit `width` and `height` on all images |
| INP | Alpine.js handlers lightweight; heavy work off the main thread |

### Stack Overview

| Layer | Technology |
| :----------- | :--------- |
| Framework | Astro 6 — file-based routing, content collections, View Transitions |
| Interactivity | Alpine.js v3 — `x-data`, `x-show`, `x-transition` |
| Styling | Tailwind CSS v4 — tokens via `@theme` in `global.css`, no `tailwind.config.js` |
| Language | TypeScript (strict) |
| Deployment | Static `dist/`; CDN/host config (`docs/deployment.md`) |
| Analytics | None by default; Lighthouse CI for lab Web Vitals |
| Testing | Vitest (unit) + Playwright (E2E) |
| Linting | ESLint with `@santi020k/eslint-config-*` |
| Commits | Conventional Commits — Commitizen + Husky + lint-staged |

---

## 13. Social Presence & Navigation

### Social Channels

| Platform | Link | Status |
| :--------- | :--- | :----- |
| GitHub | [github.com/santi020k](https://github.com/santi020k) | Active |
| LinkedIn | [linkedin.com/in/santi020k](https://linkedin.com/in/santi020k) | Active |
| Medium | [medium.com/@santi020k](https://medium.com/@santi020k) | Active (syndication) |
| WhatsApp | Contact link via `api.whatsapp.com` | Active (contact CTA) |
| Instagram | [instagram.com/santi020k](https://www.instagram.com/santi020k/) | Disabled |

External links must always use `target="_blank" rel="noopener noreferrer"`.

### Site Navigation

All internal links use trailing slashes.

| Route | Page | Notes |
| :----------- | :------ | :---- |
| `/` | Home | Hero + about intro + stats |
| `/about/` | About | Deep dive and recommendations |
| `/portfolio/` | Portfolio | Project showcase |
| `/speaking/` | Speaking | Speaking and community topics |
| `/blog/` | Blog | Native implementation |
| Contact | WhatsApp/Email link | No native contact form |

---

## 14. Do's & Don'ts

### Visual Identity

| ✅ Do | ❌ Don't |
| :------- | :------- |
| Use the logo WebP from `src/assets/brand/logos/logo-santi020k.webp` | Use older logo or terminal icon files |
| Reference colors via semantic CSS custom properties | Hardcode hex or HSL values in components |
| Define new tokens in `src/styles/global.css` `@theme` | Add one-off inline color values |
| Verify contrast ratios before shipping any new color pair | Assume a color combination is accessible |

### Typography

| ✅ Do | ❌ Don't |
| :------- | :------- |
| Use the `.title` utility for heading emphasis | Apply `font-bold` ad hoc outside established patterns |
| Use sentence case for headings | Use Title Case Every Word |
| Follow the heading hierarchy (`h1` → `h2` → `h3`) | Skip heading levels for visual sizing |

### Code & Implementation

| ✅ Do | ❌ Don't |
| :------- | :------- |
| Use `@/` import alias for all `src/` paths | Use relative `../../` paths from components |
| Use `class:list` for conditional Tailwind classes | Concatenate class strings with template literals |
| Use `<Image>` from `astro:assets` for all images | Use raw `<img>` tags |
| Pair all animations with `motion-reduce:` variants | Ship animated transitions without reduced-motion fallback |
| Use `data-theme="dark"` for dark mode | Use `class="dark"` — the `@custom-variant` won't match |
| Pass `pnpm run lint` and `pnpm run check` before finishing | Submit work with lint or type errors |

### Content & Voice

| ✅ Do | ❌ Don't |
| :------- | :------- |
| Write in first person for personal pages | Use corporate third-person ("Santiago Molina is a developer who…") |
| Use active voice | Default to passive constructions |
| Make CTAs verb-first and specific | Use vague CTAs ("Learn more", "Click here") |

---

## 15. File Reference

### Brand Assets

| Asset | Path | Notes |
| :--------------- | :-------------------------------- | :------------------------------ |
| Logo (WebP) | `src/assets/brand/logos/logo-santi020k.webp` | 6.34:1 aspect ratio |
| Author photo | `src/assets/photos/about-me.webp` | Hero and about sections |
| Default OG image | `public/default.webp` | Served statically |
| Favicon | `public/favicon.svg` | Square wrapper generated from the current mark |
| Fonts | `public/fonts/` | Montserrat variable font files |

### Key Source Files

| File | Purpose |
| :----------------------------------- | :---------- |
| `src/styles/partials/tokens.css` | HSL design tokens for light/dark and `prefers-contrast` |
| `src/styles/global.css` | Entry stylesheet: imports partials, `@theme` mappings, utilities, base |
| `src/site.config.ts` | Site-wide metadata — title, description, author, nav links |
| `src/content.config.ts` | Content collection schemas (Zod) |
| `src/types.ts` | Shared TypeScript types including `Badge` variants |
| `src/components/atoms/Pill.astro` | Pill / tag component |
| `src/components/atoms/ThemeToggle.astro` | Dark mode toggle |
| `src/components/layout/Header.astro` | Fixed/relative header with mobile drawer |
| `src/components/layout/Footer.astro` | Footer with social icons and version |
| `src/pages/og/` | Open Graph image generation (Satori) |
| `src/layouts/` | Page layout wrappers |

---

## 16. Version History

| Version | Date | Changes |
| :------ | :--------- | :------ |
| 2.4 | April 2026 | Updated brand identity and hero copy, changed blog to native route, added speaking and about routes, unified typography table to Montserrat. |
| 2.3 | April 2026 | Light theme **brand** and neutrals returned to match refreshed light logo/icon (hue **~267°** brand, **~268°** surfaces). Updated OG image tints in `render-social-image.js`. Replaced outdated §3 semantic token tables with `tokens.css` mappings. |
| 2.2 | April 2026 | Shifted brand chroma from blue‑violet (hue 262°) to **purple** (277° / 280° for glow). Updated tokens, OG/social image tints, project cover palette for eslint-config-santi020k, and clarified logo fill vs semantic `--brand`. |
| 2.1 | April 2026 | Fixed logo path (`src/assets/svg/logo.svg`). Added all social channels (LinkedIn, Medium, WhatsApp). Added Tabler and Huge Icons packs. Added actual homepage copy as voice example. Added mobile drawer motion pattern. Added content width token table. Consolidated Do's & Don'ts. Added Version History and Related Skills sections. |
| 2.0 | April 2026 | Major rewrite using Brand Guidelines Generator skill. Added component patterns, motion guidelines, accessibility section, marketing strategy, technical standards. |
| 1.0 | April 2026 | Initial generation from codebase audit. |

---

*Maintained with the [Brand Guidelines Generator](.claude/skills/brand-guidelines/SKILL.md) skill. Update this document whenever design tokens, components, social channels, or brand direction change.*
