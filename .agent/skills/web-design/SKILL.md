---
name: web-design
description: Design system, glass UI utilities, animations, and component patterns for this Astro + Tailwind v4 site. Use this skill for ANY design or UI task — building components, implementing animations, choosing tokens, dark mode, scroll reveals, micro-interactions, or visual polish. Trigger on: design, animation, transition, hover, glass, card, button, section, layout, typography, color, dark mode, motion, scroll, reveal, gradient.
---

# Web Design — santi020k

Stack: **Astro 6 · Tailwind CSS v4 · Vanilla JS**.
Design tokens: `src/styles/partials/tokens.css`. Glass utilities: `src/styles/partials/utilities.css`. Animations: `src/styles/partials/animations.css`.

**Aesthetic direction: minimalist glass UI.** Frosted-glass surfaces, subtle purple brand gradients, crisp type, spring-physics hover lifts, and scroll-triggered reveals. Never add decorative noise that fights the minimal structure.

---

## Token System

All tokens are raw HSL values on `:root` / `[data-theme="dark"]`. Tailwind maps them via `@theme` — use the Tailwind class names, never hardcode hex.

### Semantic Colors (Tailwind class → CSS var)

| Tailwind | Raw var | Light | Dark | Usage |
|---|---|---|---|---|
| `canvas` | `--theme-bg` | `268 20% 98%` | `260 43% 8%` | `<html>` / `<body>` background |
| `surface` | `--surface` | `268 20% 100%` | `260 30% 12%` | Glass card base |
| `surface-muted` | `--surface-muted` | `268 20% 96%` | `260 25% 15%` | Muted glass layer |
| `surface-strong` | `--surface-strong` | `268 15% 90%` | `260 20% 21%` | Elevated UI |
| `line` | `--line` | `268 15% 84%` | `260 15% 30%` | Borders, dividers |
| `ink` | `--ink` | `268 10% 20%` | `260 10% 88%` | Headings, strong UI |
| `ink-soft` | `--ink-soft` | `268 8% 36%` | `260 8% 72%` | Body text, descriptions |
| `ink-muted` | `--ink-muted` | `268 6% 28%` | `260 6% 56%` | Metadata, captions |
| `brand` | `--brand` | `264 92% 47%` | `264 90% 58%` | CTAs, highlights |
| `brand-solid` | `--brand-solid` | `264 92% 42%` | `264 90% 52%` | Button fills (WCAG AA vs white) |
| `brand-soft` | `--brand-soft` | `264 60% 94%` | `264 45% 18%` | Tinted surfaces |
| `accent` | `--accent` | `264 95% 57%` | `264 90% 68%` | Hover, active states |
| `glow` | `--glow` | `264 95% 70%` | `264 85% 50%` | Glow blobs, gradients |

**Rules:**
- Always use token names — never hardcode `#5a0fdb` or `hsl(264 92% 47%)`.
- Opacity modifiers: `bg-brand/10`, `border-line/40`, `text-ink-soft` — no ad hoc rgba.
- Dark mode: `data-theme="dark"` on `<html>`. The `@custom-variant dark` handles `[data-theme="dark"] &`.

---

## Typography

**One font: Montserrat variable** — maps to ALL four Tailwind font roles (`sans`, `serif`, `mono`, `display`).

| Level | Size (desktop) | Weight | Class |
|---|---|---|---|
| Display / H1 | `text-[5.2rem]` lg / `text-6xl` sm | 800 | `font-extrabold` |
| H1 page | `text-3xl` → `text-5xl` | 700 | `font-bold` |
| H2 | `text-2xl` → `text-3xl` | 600 | `font-semibold` |
| H3 | `text-lg` → `text-xl` | 600 | `font-semibold` |
| Body | `text-base` / `text-lg` | 400 | — |
| Caption | `text-sm` | 400 | `text-ink-muted` |
| Micro | `text-xs` | 400/600 | badges, tags |

### Hero Headline Pattern

```astro
<h1 class="text-4xl/[0.98] font-extrabold tracking-[-0.06em] sm:text-6xl/[0.95] lg:text-[5.2rem]/[0.92]">
  Calm systems.
  <span class="bg-linear-to-r from-brand via-accent to-brand bg-clip-text text-transparent">
    Clear delivery.
  </span>
</h1>
```

### Eyebrow / Section Label

```html
<p class="section-label text-brand">Section title</p>
```

`section-label` = `text-xs font-semibold tracking-[0.22em] uppercase text-ink-muted`

---

## Glass UI Utilities

These are the core surface utilities. **Always use these instead of writing ad hoc glass styles.**

### `panel-card`

Primary card surface. Glass gradient + 12px blur + subtle top-edge inset glow.

```astro
<div class="panel-card p-5">
  <!-- card content -->
</div>
```

### `card-interactive`

`panel-card` + hover spring lift + brand border tint. Use for clickable project/post cards.

```astro
<article class="card-interactive p-5">
  <!-- interactive card -->
</article>
```

### `glass-pro`

Premium glass with SVG noise texture overlay. Use for hero floating elements or feature callouts.

```astro
<div class="glass-pro rounded-2xl p-6">
  <!-- premium surface -->
</div>
```

### `section-shell`

Full section wrapper with larger radius (`rounded-[2.25rem]`). Use for framed content blocks.

```astro
<section class="section-shell">
  <!-- section content -->
</section>
```

### `section-shell-subtle`

Lighter glass than `section-shell`. Use for secondary or nested sections.

### `panel-surface`

Tightest glass — for header, nav, or inline panel overlays.

### `mini-note`

Compact glass card with animated left accent bar on hover. Good for stats, info snippets, floating labels.

```astro
<div class="mini-note p-5">
  <p class="section-label">Label</p>
  <p class="mt-1 text-2xl font-bold text-ink">Value</p>
</div>
```

### `talk-card`

Rich glass card with specular top highlight + brand glow blob on hover. For speaker/feature cards.

### `stat-card`

Glass card with animated conic-gradient spinning border on hover (via `--border-angle` CSS property).

---

## Buttons

Defined as `@utility` in `utilities.css`. Always use these — never build ad hoc button styles.

| Utility | Purpose |
|---|---|
| `btn-primary` | Purple glass gradient; shimmer sweep + lift on hover |
| `btn-secondary` | Neutral glass; spinning border arc + brand tint on hover |
| `btn-ghost` | Transparent; glass fill sweeps in on hover |
| `btn-inline` | Text link; animated underline grows from left |

Use the `ButtonLink.astro` component which wires these up automatically.

---

## Animation System

### Scroll-Triggered Reveal

Add `data-animate` to any element — the JS observer adds `.is-visible` when it enters the viewport.

```astro
<!-- Slide up + fade (default) -->
<section data-animate>...</section>

<!-- Fade only -->
<div data-animate="fade">...</div>

<!-- Scale in -->
<div data-animate="scale">...</div>
```

### Auto-Stagger Grid Children

Add `data-stagger` to a grid/list container — all direct children animate in sequence.

```astro
<!-- 60ms default stagger -->
<div class="grid gap-6 md:grid-cols-2" data-stagger>
  {items.map(item => <Card {item} />)}
</div>

<!-- Custom delay (ms) -->
<div class="space-y-4" data-stagger="80">...</div>
```

### Keyframe Animations (Tailwind `animate-*` classes)

| Class | Use case |
|---|---|
| `animate-slide-up` | Initial content reveals |
| `animate-fade-in` | Subtle opacity entrance |
| `animate-scale-in` | Modals, tooltips |
| `animate-spring-up` | Bouncy entrance for cards |
| `animate-float-y` | Floating hero elements (6s loop) |
| `animate-float-y-slow` | Slower floating (8s loop) |
| `animate-glow-pulse` | Ambient glow blobs |
| `animate-shimmer` | Loading skeleton shimmer |
| `animate-border-spin` | Conic gradient border rotation |

**Always pair with `motion-reduce:`:**

```html
<div class="animate-float-y motion-reduce:animate-none">...</div>
```

### Inline Stagger Delay

```astro
{items.map((item, i) => (
  <div
    class="animate-slide-up motion-reduce:animate-none"
    style={`animation-delay: ${i * 60}ms`}
  >
    {item}
  </div>
))}
```

---

## Layout Utilities

### `editorial-section`

Asymmetric 2-column section grid. Left: 0.72fr header. Right: 1.28fr content.

```astro
<div class="editorial-section">
  <!-- Left: eyebrow + title + description -->
  <div class="editorial-rail">
    <p class="section-label text-brand">Eyebrow</p>
    <h2 class="text-2xl font-semibold tracking-tight">Title</h2>
    <p class="text-sm text-ink-soft">Description</p>
  </div>
  <!-- Right: cards / list / content -->
  <div>...</div>
</div>
```

`editorial-rail` = `sticky top-28 h-fit space-y-5` on `lg`.

### `section-actions`

Button row — stacks vertically on mobile, wraps on `sm`.

```astro
<div class="section-actions">
  <ButtonLink href="/work/" showArrow>View all work</ButtonLink>
  <ButtonLink href="..." variant="secondary" showArrow>GitHub</ButtonLink>
</div>
```

### `section-copy`

Consistent body text in sections: `text-base/7 text-ink-soft sm:text-lg/8`.

---

## Decorative Elements

### Gradient Divider

```astro
<div aria-hidden="true" class="divider-gradient w-full my-8"></div>
```

Variants: `divider-gradient-soft`, `divider-gradient-strong`, `divider-subtle`, `divider-soft`, `divider-medium`, `divider-strong`.

### Ambient Glow Blob

```astro
<div aria-hidden="true" class="brand-radial-glow motion-safe:animate-glow-pulse"></div>
```

### Mesh Background

```astro
<div class="bg-mesh-brand absolute inset-0 -z-10 opacity-60"></div>
```

### Grid Pattern

```astro
<div aria-hidden="true" class="grid-fade pointer-events-none absolute inset-0 -z-10"></div>
```

---

## Micro-Interaction Rules

Apply to EVERY interactive element. All transitions use spring easing for lift/lower.

| Element | Classes |
|---|---|
| Card hover lift | `hover:-translate-y-1 transition-all duration-300 motion-reduce:hover:translate-y-0` |
| Button press | `active:scale-[0.96] motion-reduce:active:scale-100` |
| Link color | `transition-colors duration-150` |
| Icon button | `hover:text-brand transition-colors duration-150` |
| Input focus | `focus:border-brand focus:ring-2 focus:ring-brand/10` |

**Spring easing for hover lift:**
```css
transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
```

---

## Dark Mode

Toggle: `data-theme="dark"` on `<html>`. Never use `class="dark"` — the `@custom-variant` won't match.

Tokens automatically switch. Do not add `dark:` class overrides for colors that are already tokenized — if `bg-surface` looks wrong in dark, fix the token, not the component.

---

## Responsive Design

Mobile-first. Key breakpoints: `sm` 640px · `md` 768px · `lg` 1024px · `xl` 1280px. Custom `xs` 320px for small phones.

Always test at **375px** and **1440px** before shipping.

---

## Quick Reference — Common Patterns

### Interactive Card with Scroll Reveal

```astro
<article class="card-interactive" data-animate>
  <div class="relative aspect-[16/10] overflow-hidden rounded-t-[1.7rem]">
    <Image src={cover} alt={title} class="h-full w-full object-cover" />
    <div class="absolute inset-0 bg-linear-to-t from-canvas/60 via-transparent to-transparent" />
  </div>
  <div class="p-5 space-y-3">
    <h3 class="text-xl font-semibold text-ink">{title}</h3>
    <p class="text-sm text-ink-soft line-clamp-2">{description}</p>
  </div>
</article>
```

### Section with Staggered Cards

```astro
<PageSection>
  <SectionHeader eyebrow="Work" title="Professional roles." />
  <div class="grid gap-6 md:grid-cols-2" data-stagger="60">
    {items.map(item => <ProjectPreviewCard project={item} />)}
  </div>
  <div class="section-actions">
    <ButtonLink href="/work/" showArrow>View all</ButtonLink>
  </div>
</PageSection>
```

### Floating Mini-Note (Hero)

```astro
<div class="mini-note glass-pro absolute -left-4 bottom-16 w-48 motion-safe:animate-float-y">
  <p class="section-label">Location</p>
  <p class="mt-1 text-sm font-semibold text-ink">Medellín, Colombia</p>
</div>
```

---

## Quality Gates

Before finishing any design work:

- [ ] All colors via token names — no hardcoded hex or HSL
- [ ] Every animation has `motion-reduce:` variant
- [ ] `pnpm run lint` passes (class order, no unused)
- [ ] `pnpm run check` passes (TypeScript)
- [ ] Tested at 375px and 1440px in both light and dark themes
- [ ] WCAG AA contrast on all text/background pairs
