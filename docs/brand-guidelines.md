# Santi020k — Brand Guidelines

> **Version 2.0** · Last updated: April 2026
> Personal brand for Santiago Molina (`@santi020k`). This document is the single source of truth for visual identity, voice, and implementation standards across the website and any related materials.

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
10. [Accessibility](#10-accessibility)
11. [Marketing & Content](#11-marketing--content)
12. [Technical Implementation](#12-technical-implementation)
13. [File Reference](#13-file-reference)

---

## 1. Brand Identity

### Overview

| Property      | Value                                    |
|---------------|------------------------------------------|
| **Name**      | Santi020k                                |
| **Full name** | Santiago Molina                          |
| **Handle**    | @santi020k                               |
| **Type**      | Personal portfolio & blog                |
| **Description** | The personal website of Santiago Molina |
| **Language**  | English (en-US)                          |

### Personality

The brand sits at the intersection of technical precision and human approachability. Four attributes define it:

**Technical** — developer-focused, code-aware, assumes technical literacy in the reader. Don't over-explain basics; do give context for non-obvious decisions.

**Clean** — minimal visual noise, well-structured content. Every element earns its place.

**Approachable** — personal and first-person in tone. Senior developer sharing what they know, not corporate marketing speak.

**Modern** — current with web standards and tooling. The stack choices (Astro, Alpine.js, Tailwind v4) reflect this deliberately.

### Target Audience

Developers, potential collaborators, recruiters, and the broader web and open-source community.

### Brand Promise

Fast, accessible, and well-crafted — the site itself should demonstrate the same engineering values it talks about.

---

## 2. Logo

The logo is a custom SVG wordmark (`/public/logo.svg`) — a stylised "S2K" letterform representing the handle `@santi020k`.

### Specifications

| Property          | Value                                           |
|-------------------|-------------------------------------------------|
| **Format**        | SVG (primary), PNG (fallback only)              |
| **Fill color**    | `#00D3DE` — Brand Cyan                          |
| **Viewbox**       | `0 0 800 309.1`                                 |
| **Minimum width** | 120px                                           |
| **Clear space**   | Equal to the cap-height of the mark on all sides |

### Usage Rules

The logo has a single color fill. Do not alter it.

| ✅ Do | ❌ Don't |
|---|---|
| Use the `.svg` source file for all web usage | Export to PNG unless SVG is unsupported |
| Place on white, light, or dark backgrounds | Place on mid-tone backgrounds that reduce contrast |
| Maintain clear space on all sides | Crop or crowd the mark |
| Scale proportionally | Stretch, distort, or rotate |
| Use `#00D3DE` fill | Recolor to anything else |
| | Add drop shadows, borders, or glows |

---

## 3. Color System

The palette is fully adaptive: it shifts between **Light** and **Dark** themes via `data-theme` on `<html>`. Both modes share a base hue of `200° (cool blue-teal)`. All colors are defined as CSS custom properties in `src/styles/global.css`.

**Rule:** Always reference semantic tokens (`--color-accent-one`, `--color-link`, etc.) in components. Never hardcode raw HSL or hex values.

### Brand Primary

| Name            | Hex        | HSL                    | Usage                              |
|-----------------|------------|------------------------|------------------------------------|
| **Brand Cyan**  | `#00D3DE`  | `hsl(183, 100%, 43%)`  | Logo — the anchor of the brand identity |

### Light Theme

| Semantic Token             | CSS Variable            | Hex (approx.) | HSL                           | Usage                          |
|----------------------------|-------------------------|---------------|-------------------------------|-------------------------------|
| Background                 | `--color-bgColor`       | `#F3F5F5`     | `hsl(200, 10%, 96%)`          | Page background                |
| Body text                  | `--color-textColor`     | —             | `hsl(200, 10%, 9%) / 60%`     | Paragraphs, UI labels          |
| Accent Base                | `--color-accent-base`   | `#205169`     | `hsl(200, 53%, 27%)`          | Buttons, active states         |
| Accent One                 | `--color-accent-one`    | `#205169`     | `hsl(200, 53%, 27%)`          | Primary interactive elements   |
| Accent Two                 | `--color-accent-two`    | `#CB2A42`     | `hsl(351, 66%, 48%)`          | Tags, secondary highlights     |
| Link                       | `--color-link`          | `#02699C`     | `hsl(200, 97%, 31%)`          | Inline text links              |

### Dark Theme

| Semantic Token             | CSS Variable            | Hex (approx.) | HSL                           | Usage                          |
|----------------------------|-------------------------|---------------|-------------------------------|-------------------------------|
| Background                 | `--color-bgColor`       | `#01161C`     | `hsl(200, 93%, 10%)`          | Page background                |
| Body text                  | `--color-textColor`     | —             | `hsl(200, 53%, 98%) / 60%`    | Paragraphs, UI labels          |
| Accent One                 | `--color-accent-one`    | `#E5DDB3`     | `hsl(50, 49%, 80%)`           | Primary interactive elements   |
| Accent Two                 | `--color-accent-two`    | `#D4AA40`     | `hsl(50, 72%, 63%)`           | Tags, secondary highlights     |
| Link                       | `--color-link`          | `#73B8D4`     | `hsl(200, 61%, 71%)`          | Inline text links              |

### Opacity Scale

The foreground-on-background scale uses the same base hue at stepped opacity levels, exposed via `--theme-color-50` through `--theme-color-900`. Use these for borders, dividers, muted text, and surface layers:

| Token                | Opacity  | Typical use               |
|----------------------|----------|---------------------------|
| `--color-color-900`  | 100%     | Headings, strong UI       |
| `--color-color-600`  | ~74%     | Accent color default      |
| `--color-color-500`  | ~60%     | Body text                 |
| `--color-color-350`  | ~29%     | Borders, dividers         |
| `--color-color-150`  | ~8%      | Subtle backgrounds        |
| `--color-color-75`   | ~3%      | Hover surfaces            |

### Accessibility: Contrast Requirements

All text/background pairings must meet **WCAG 2.2 AA**:

- Body text (< 18px, not bold): minimum **4.5:1** contrast ratio
- Large text (≥ 18px, or ≥ 14px bold): minimum **3:1** contrast ratio
- UI components and focus indicators: minimum **3:1** contrast ratio

Verify any new color pair with a contrast checker before shipping.

---

## 4. Typography

A single variable font is used across the entire brand for simplicity and performance.

### Typeface: Montserrat

| Property      | Value                                              |
|---------------|----------------------------------------------------|
| **Family**    | Montserrat (Variable)                              |
| **Source**    | Self-hosted — `/public/fonts/`                     |
| **Weights**   | 100–900 (continuous variable axis)                 |
| **Styles**    | Normal + Italic (separate variable font files)     |
| **Format**    | TrueType Variable Font (`.ttf`)                    |
| **Loading**   | `font-display: swap`                               |

Montserrat is mapped to all three Tailwind roles (`--font-sans`, `--font-serif`, `--font-mono`, `--font-display`) to ensure consistency regardless of the utility class used.

### Type Scale

| Role              | Tailwind Class          | CSS Variable       | Usage                        |
|-------------------|-------------------------|--------------------|------------------------------|
| Display / H1      | `text-2xl`              | `--text-2xl`       | Page titles                  |
| H2                | `text-xl`               | `--text-xl`        | Section headings             |
| H3                | `text-lg`               | `--text-lg`        | Sub-section headings         |
| H4                | `text-base` + semibold  | `--text-base`      | Minor headings               |
| Body              | `text-base`             | `--text-base`      | Paragraph text               |
| Small / Caption   | `text-sm`               | `--text-sm`        | Metadata, dates, UI labels   |
| Micro             | `text-xs`               | `--text-xs`        | Tags, footnotes, badges      |

### Typographic Rules

- Global letter spacing: `0.025em` (set on `html`)
- Use `font-semibold` for emphasis via the `.title` utility class
- Use sentence case for all headings — not Title Case Every Word
- One `<h1>` per page only. Never skip heading levels (e.g., h1 → h3)
- Heading levels communicate document outline, not visual size — size with Tailwind classes on the correct semantic element

---

## 5. Spacing & Layout

All spacing follows the Tailwind default scale (4px base unit).

### Recommended Spacing

| Context              | Classes                   |
|----------------------|---------------------------|
| Component padding    | `p-4` to `p-6`            |
| Section gaps         | `gap-8` to `gap-16`       |
| Page horizontal margins | `px-4 md:px-6 lg:px-8` |
| Card gap (internal)  | `gap-3` to `gap-4`        |

### Breakpoints

Design mobile-first. Layer up with breakpoint prefixes.

| Breakpoint | Value   | Target device              |
|------------|---------|----------------------------|
| `xs`       | 320px   | Small phones (custom token)|
| `sm`       | 640px   | Large phones / small tablets |
| `md`       | 768px   | Tablets                    |
| `lg`       | 1024px  | Laptops                    |
| `xl`       | 1280px  | Desktops                   |

Test every layout at **375px** (iPhone SE) and **1440px** (standard desktop) before shipping.

### Container Scale

Custom container tokens override Tailwind defaults for tighter reading widths:

| Class         | Max Width | Best for              |
|---------------|-----------|-----------------------|
| `max-w-lg`    | 32rem     | Narrow prose / forms  |
| `max-w-2xl`   | 42rem     | Blog post body        |
| `max-w-4xl`   | 54rem     | Content sections      |
| `max-w-5xl`   | 64rem     | Wide layout columns   |
| `max-w-6xl`   | 76rem     | Full-width page shell |

---

## 6. Imagery & Icons

### Photography Style

- Clean, intentional composition — no stock photo aesthetic
- Neutral or dark backgrounds preferred
- High contrast; images should read well at thumbnail size

### Core Image Assets

| Asset               | Path                    | Usage                        |
|---------------------|-------------------------|------------------------------|
| Author photo        | `/public/photo-me.webp` | Author attribution           |
| Default OG image    | `/public/default.webp`  | Social share fallback        |
| Logo                | `/public/logo.svg`      | Site identity                |
| Social icon         | `/public/social-icon.svg` | Favicon / social profile   |

### Open Graph Images

Generated server-side via Satori at `src/pages/og/`. Every page must have an OG image.

| Property     | Requirement                               |
|--------------|-------------------------------------------|
| Size         | 1200 × 630 px                             |
| Format       | PNG (output from Satori)                  |
| Content      | Page title + site branding                |
| Contrast     | Text must be clearly legible as a thumbnail |

### Astro Image Component

Always use `<Image>` from `astro:assets` — never a raw `<img>` tag.

```astro
import { Image } from 'astro:assets'

<Image
  src={heroImg}
  alt="Descriptive alt text"
  width={1200}
  height={630}
  format="avif"
  loading="eager"
  fetchpriority="high"
/>
```

- Set explicit `width` and `height` to prevent layout shift (CLS)
- Use `format="avif"` for hero images; Astro handles the webp fallback
- Decorative images: `alt=""` — no `role="presentation"` needed with `<Image />`

### Icons

Icons use the MDI set (`@iconify-json/mdi`) via `astro-icon`.

```astro
import { Icon } from 'astro-icon/components'

<!-- Decorative icon (beside visible text label) -->
<Icon name="mdi:github" aria-hidden="true" class="size-8" focusable="false" />

<!-- Standalone icon button — label the button, not the icon -->
<button type="button" aria-label="Open GitHub profile">
  <Icon name="mdi:github" aria-hidden="true" />
</button>
```

Always add `aria-hidden="true"` and `focusable="false"` on decorative icons.

---

## 7. Component Patterns

### Badges

`Badge.astro` supports the following variants. Use the named variant — do not recreate badge styles ad hoc.

| Variant        | Use case                                     |
|----------------|----------------------------------------------|
| `default`      | General tags, default state                  |
| `accent`       | Highlighted tag using accent color           |
| `accent-base`  | Accent using the base (lower contrast) tone  |
| `accent-one`   | Primary brand accent (adaptive to theme)     |
| `accent-two`   | Secondary brand accent (adaptive to theme)   |
| `muted`        | Low-emphasis tags, subtle content labels     |
| `outline`      | Bordered, no fill — for secondary actions    |
| `subtle`       | Neutral zinc surface, works on any background|
| `ghost`        | No background, minimal — for filters/toggles |
| `warning`      | Caution state (yellow palette)               |
| `danger`       | Error or destructive state (red palette)     |

Badges truncate at `200px` on mobile, `full` width on `sm` and above. Set `showHash={false}` when the `#` prefix is not appropriate.

### Cards

Cards lift on hover and use the semantic token system for theming:

```astro
<article class="
  group relative flex flex-col gap-3
  rounded-xl border border-color-200 bg-special-lighter
  p-5 shadow-sm
  transition-all duration-200
  hover:shadow-md hover:-translate-y-0.5
  motion-reduce:transition-none motion-reduce:hover:translate-y-0
">
  <h2 class="title text-lg group-hover:text-accent-one transition-colors duration-150">
    {title}
  </h2>
  <p class="text-sm text-color-500 leading-relaxed">{description}</p>
  <a href={href} class="absolute inset-0" aria-label={title}>
    <span class="sr-only">{title}</span>
  </a>
</article>
```

### Links

Inline links use the `.santi-link` utility: no underline by default, underline with `underline-offset-2` on hover. External links should use `target="_blank" rel="noreferrer"`.

### Buttons

Buttons should use semantic `<button type="button">` elements. Define variants as `@utility` in `global.css`:

```css
@utility btn {
  @apply inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium
         transition-all duration-150 focus-visible:outline-2 focus-visible:outline-offset-2;
}
@utility btn-primary {
  @apply btn bg-accent-one text-bgColor hover:brightness-90 focus-visible:outline-accent-one;
}
@utility btn-ghost {
  @apply btn text-color-500 hover:bg-color-100 hover:text-color-900;
}
```

---

## 8. Motion & Animation

All animations must include a `motion-reduce:` variant or a `prefers-reduced-motion` media query. This is non-negotiable — it is both an accessibility requirement and a CLAUDE.md constraint.

### Timing Principles

| Type                         | Duration   | Easing     |
|------------------------------|------------|------------|
| Micro-interactions (hover)   | 150–200ms  | ease-out   |
| Reveals (fade, slide-up)     | 300–400ms  | ease-out   |
| Large layout changes         | 400–500ms  | ease-in-out|
| Alpine show/hide             | 200ms in, 150ms out | ease-out / ease-in |

Snappy feels better than slow. Only use durations above 300ms for large reveals.

### Standard Motion Patterns

**Hover lift (cards):**
```html
class="transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md
       motion-reduce:transition-none motion-reduce:hover:translate-y-0"
```

**Reveal on scroll** — use `data-animate` attribute with IntersectionObserver (`src/` script):
```html
<section data-animate>...</section>
```

**Alpine.js show/hide** — always pair `x-show` with `x-transition`:
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

**Page transitions** — use Astro View Transitions (`<ViewTransitions />` in root layout). They automatically respect `prefers-reduced-motion`.

### Micro-Interaction Checklist

- Body links: underline on hover, `transition-colors duration-150`
- Buttons: `active:scale-95`
- Cards: `hover:-translate-y-0.5 hover:shadow-md`
- Icon buttons: color change on hover
- Form inputs: border color on `:focus`, not just a browser outline
- All transitions: `duration-150` to `duration-200` (snappy)

---

## 9. Voice & Tone

### Brand Voice

| Attribute     | What it means                                                                 |
|---------------|-------------------------------------------------------------------------------|
| **Direct**    | Say what you mean. No "In today's fast-paced world..." or filler openers.     |
| **Concise**   | Cut adverbs. Cut adjectives that don't earn their place. Short beats long.    |
| **Technical** | Comfortable with code and architecture. Don't over-explain, do give context.  |
| **Personal**  | First person on personal pages. Own your opinions — don't hedge everything.   |
| **Honest**    | Share real experiences and takes. No performative enthusiasm.                 |

### Tone by Context

| Context             | Tone                                                         |
|---------------------|--------------------------------------------------------------|
| Homepage hero       | Confident, identity-first, one clear CTA                     |
| Blog posts          | Conversational, educational, second person ("you")           |
| Portfolio / projects | Confident, factual, outcome-focused (what was built, why it matters) |
| About page          | First person, narrative — not a resume                       |
| Code comments       | Minimal; explain the *why*, not the *what*                   |
| Error pages (404)   | Light and friendly, not robotic                              |
| Commit messages     | Imperative, Conventional Commits (`feat:`, `fix:`, `chore:`) |

### Writing Rules

- Active voice over passive
- Sentence case for headings — not Title Case Every Word
- Avoid: "leverage", "synergy", "utilize", "seamless", "robust"
- Inline code: wrap with backticks `` `like this` ``
- Dates: use `Intl.DateTimeFormat` format — e.g., "Apr 1, 2026"
- Technical depth: assume a developer reader; don't explain Git or npm

### CTAs (Calls to Action)

One primary CTA per page. Make it verb-first and specific.

| ❌ Weak             | ✅ Better              |
|---------------------|------------------------|
| Learn more          | Read the full post     |
| Click here          | See the source code    |
| Contact me          | Send me a message      |
| Check it out        | Try the live demo      |
| Subscribe           | Get new posts by email |

---

## 10. Accessibility

Target: **WCAG 2.2 Level AA** throughout. Accessibility is not an afterthought — the site's quality reflects the brand's engineering values.

### Core Requirements

- One `<h1>` per page; never skip heading levels
- All interactive elements reachable and operable by keyboard
- Focus indicators visible and meeting 3:1 contrast minimum
- Every image has appropriate `alt` text (empty `alt=""` for decorative images)
- Color is never the sole means of conveying information
- `lang="en"` set on `<html>` (managed via `site.config.ts`)
- Skip-to-content link present (`SkipLink.astro` component)

### ARIA Guidelines

Prefer semantic HTML over ARIA. Before adding an ARIA attribute, ask: *is there a native element for this?*

| Use this...               | Not this...              |
|---------------------------|--------------------------|
| `<button>`                | `<div onclick>`          |
| `<nav>`                   | `<div class="nav">`      |
| `<main>`                  | `<div id="main">`        |
| `<label for="id">`        | Text near an input       |

- Always `aria-hidden="true"` on decorative icons
- Always `aria-label` on icon-only buttons
- Interactive Alpine components need `role`, `aria-expanded`, `aria-controls` as appropriate

### Dark Mode & Theming

Dark mode uses `data-theme="dark"` on `<html>` — never `class="dark"`. This is a hard constraint (see `global.css` `@custom-variant dark`).

---

## 11. Marketing & Content

### Homepage Hero Structure

Answer three questions in under 5 seconds: who, what, why keep reading.

```
[Role / Identity] — one line, bold, large
[Value proposition] — 1–2 sentences
[Primary CTA] — verb-first (e.g., "Read my work", "See projects")
```

Example:
> **Frontend Engineer & Open Source Contributor**
> I build fast, accessible web experiences and share what I learn along the way.
> [Read the blog →]

### Project Descriptions

Answer: what does it do, why does it matter, what was interesting to build?

```
[One-line summary]
[The problem it solves]
[One interesting technical detail]
[Link / CTA]
```

### Blog Headlines

Strong headlines are specific, useful, or surprising:
- "How I reduced my Astro build time by 40%"
- "The Tailwind class ordering guide I wish I had"
- "Alpine.js doesn't need a bundler — and that's the point"

Avoid vague headlines like "Thoughts on React" or "Some useful CSS tricks."

### Content Pillars

1. **Tutorials & how-tos** — using the actual stack (Astro, Alpine.js, Tailwind)
2. **Case studies** — what was built, why, and what was learned
3. **Opinions & takes** — considered positions on tooling and patterns
4. **Project updates** — what's being built and what's interesting

One quality post per month beats four rushed ones.

---

## 12. Technical Implementation

### File Conventions

| Convention              | Rule                                                     |
|-------------------------|----------------------------------------------------------|
| Import alias            | Use `@/` for all imports from `src/`                     |
| Internal links          | Always use trailing slashes (`/posts/my-post/`)          |
| Component props         | TypeScript `interface Props`, destructured from `Astro.props` |
| Conditional classes     | Use `class:list` — never template literal string concat  |
| Dark mode               | `data-theme="dark"` on `<html>` — never `class="dark"`  |
| Images                  | `<Image>` from `astro:assets` — never raw `<img>`        |
| Icons                   | `astro-icon` with MDI pack — always `aria-hidden="true"` on decorative |

### Design Token Rules

- All design tokens live in `src/styles/global.css` under `@theme`
- Custom repeated utilities go in `@utility` blocks — no one-off inline styles
- Never hardcode hex, HSL, or OKLCH values in components — use semantic tokens
- Class order follows Tailwind Prettier plugin conventions (ESLint enforces this)

### Quality Gates

Before any code is considered complete:

```bash
npm run lint    # ESLint — must pass with zero errors
npm run check   # Astro type-check — must pass with zero errors
```

### Performance Targets

| Metric        | Target           |
|---------------|------------------|
| Lighthouse    | ≥ 90 on mobile   |
| LCP           | `loading="eager"` + `fetchpriority="high"` on above-fold images |
| CLS           | Explicit `width` + `height` on all images |
| INP           | Alpine.js handlers lightweight; defer heavy work off main thread |

### Stack Summary

| Layer             | Technology                                  |
|-------------------|---------------------------------------------|
| Framework         | Astro 6 (file-based routing, content collections, View Transitions) |
| Interactivity     | Alpine.js v3                                |
| Styling           | Tailwind CSS v4 (tokens via `@theme` in `global.css`) |
| Language          | TypeScript (strict)                         |
| Deployment        | Vercel                                      |
| Analytics         | `@vercel/analytics` + `@vercel/speed-insights` |
| Testing           | Vitest (unit) + Playwright (E2E)            |

---

## 13. File Reference

### Brand Assets

| Asset                | Path                       |
|----------------------|----------------------------|
| Logo (SVG)           | `public/logo.svg`          |
| Social icon          | `public/social-icon.svg`   |
| Author photo         | `public/photo-me.webp`     |
| Default OG image     | `public/default.webp`      |
| Font files           | `public/fonts/`            |

### Key Source Files

| File                         | Purpose                                      |
|------------------------------|----------------------------------------------|
| `src/styles/global.css`      | All design tokens (`@theme`), custom utilities, base styles |
| `src/site.config.ts`         | Site-wide metadata (title, description, author, nav) |
| `src/content.config.ts`      | Content collection schemas (Zod)             |
| `src/components/Badge.astro` | Badge / tag component with all variants      |
| `src/components/ThemeToggle.astro` | Dark mode toggle                       |
| `src/components/SocialList.astro`  | Social links (GitHub, etc.)            |
| `src/layouts/`               | Page layout components                       |
| `src/pages/og/`              | Open Graph image generation (Satori)         |

### Social Presence

| Platform | Link                                         |
|----------|----------------------------------------------|
| GitHub   | [github.com/santi020k](https://github.com/santi020k) |

### Navigation

All internal links use trailing slashes.

| Route          | Page       |
|----------------|------------|
| `/`            | Home       |
| `/portfolio/`  | Portfolio  |

---

*Generated with the [Brand Guidelines Generator](https://mcpmarket.com/tools/skills/brand-guidelines-generator) skill. Update this document whenever design tokens, components, or brand direction change.*
