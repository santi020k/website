---
name: web-design
description: UI/UX design, visual design system, and web animations for this Astro + Alpine.js + Tailwind v4 website. Use this skill when designing or refining components, building animations and transitions, working on the design system (colors, typography, spacing), implementing scroll-triggered effects, micro-interactions, hover states, page transitions, or any task about how the site looks and feels. Trigger on mentions of design, animation, transition, hover effect, scroll animation, micro-interaction, UI component design, typography, color palette, layout, dark mode, or visual polish.
---

# Web Design + Animations Skill — santi020k Website

Stack: **Astro 6 + Alpine.js + Tailwind CSS v4**. Design tokens live in `src/styles/global.css` under `@theme`. All animations should respect `prefers-reduced-motion` (see Accessibility skill).

---

## Design System

### Tokens — `src/styles/global.css`

All custom colors, spacing, fonts, and effects are defined in the `@theme` block. This is the Tailwind v4 way — no `tailwind.config.js` needed.

```css
@theme {
  /* Colors */
  --color-accent-base: oklch(65% 0.2 250);
  --color-accent-subtle: oklch(65% 0.2 250 / 15%);
  --color-surface: oklch(98% 0 0);
  --color-surface-raised: oklch(96% 0 0);
  --color-muted: oklch(50% 0 0);

  /* Typography */
  --font-sans: 'Inter Variable', system-ui, sans-serif;
  --font-mono: 'JetBrains Mono Variable', monospace;

  /* Shadows */
  --shadow-soft: 0 2px 8px 0 oklch(0% 0 0 / 8%);
  --shadow-medium: 0 4px 24px 0 oklch(0% 0 0 / 12%);
}

/* Dark mode overrides using data-theme attribute */
[data-theme="dark"] {
  --color-surface: oklch(12% 0 0);
  --color-surface-raised: oklch(16% 0 0);
  --color-muted: oklch(60% 0 0);
}
```

### Typography Scale

Use Tailwind's built-in scale. Establish semantic patterns as `@utility` in `global.css`:

```css
@utility title {
  @apply text-3xl font-bold tracking-tight leading-tight;
}

@utility subtitle {
  @apply text-xl text-muted leading-relaxed;
}

@utility prose-link {
  @apply text-accent-base underline-offset-2 hover:underline;
}
```

### Spacing System

Stick to the Tailwind scale (4px base unit). For layout spacing, prefer:
- **Component padding**: `p-4` to `p-6`
- **Section gaps**: `gap-8` to `gap-16`
- **Page margins**: `px-4 md:px-6 lg:px-8`

---

## Component Design Patterns

### Cards

A consistent card pattern used across projects, blog posts, and other listings:

```astro
<article class="
  group relative flex flex-col gap-3
  rounded-xl border border-border bg-surface-raised
  p-5 shadow-soft
  transition-all duration-200
  hover:shadow-medium hover:-translate-y-0.5
  motion-reduce:transition-none motion-reduce:hover:translate-y-0
">
  <h2 class="text-lg font-semibold leading-snug group-hover:text-accent-base transition-colors">
    {title}
  </h2>
  <p class="text-sm text-muted leading-relaxed">{description}</p>
  <a href={href} class="absolute inset-0" aria-label={title}>
    <span class="sr-only">{title}</span>
  </a>
</article>
```

The `group-hover:` trick lets child elements react to the card hover without extra JS.

### Buttons

Define button variants as utilities so they're consistent everywhere:

```css
/* global.css */
@utility btn {
  @apply inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium
         transition-all duration-150 focus-visible:outline-2 focus-visible:outline-offset-2;
}

@utility btn-primary {
  @apply btn bg-accent-base text-white hover:bg-accent-base/90 focus-visible:outline-accent-base;
}

@utility btn-ghost {
  @apply btn text-muted hover:bg-surface-raised hover:text-foreground;
}
```

### Badges / Tags

```astro
<span class="inline-flex items-center rounded-full bg-accent-subtle px-2.5 py-0.5 text-xs font-medium text-accent-base">
  {tag}
</span>
```

---

## CSS Animations

### Keyframe Definitions — `global.css`

```css
@keyframes fade-in {
  from { opacity: 0; }
  to   { opacity: 1; }
}

@keyframes slide-up {
  from { opacity: 0; transform: translateY(12px); }
  to   { opacity: 1; transform: translateY(0); }
}

@keyframes slide-down {
  from { opacity: 0; transform: translateY(-8px); }
  to   { opacity: 1; transform: translateY(0); }
}

@keyframes scale-in {
  from { opacity: 0; transform: scale(0.95); }
  to   { opacity: 1; transform: scale(1); }
}
```

Register them as theme animation values:
```css
@theme {
  --animate-fade-in: fade-in 0.3s ease-out both;
  --animate-slide-up: slide-up 0.4s ease-out both;
  --animate-scale-in: scale-in 0.2s ease-out both;
}
```

Use with Tailwind's `animate-*` class:
```html
<div class="animate-slide-up motion-reduce:animate-none">...</div>
```

### Staggered List Animation

For lists that should animate in one item at a time, use CSS custom property delay:
```astro
{items.map((item, i) => (
  <li
    class="animate-slide-up motion-reduce:animate-none"
    style={`animation-delay: ${i * 60}ms`}
  >
    {item.name}
  </li>
))}
```

---

## Alpine.js Transitions

Alpine.js `x-transition` is the easiest way to animate show/hide state. Always pair with CSS custom properties for tweakable values.

### Basic fade
```html
<div
  x-show="open"
  x-transition:enter="transition-all duration-200 ease-out"
  x-transition:enter-start="opacity-0 scale-95"
  x-transition:enter-end="opacity-100 scale-100"
  x-transition:leave="transition-all duration-150 ease-in"
  x-transition:leave-start="opacity-100 scale-100"
  x-transition:leave-end="opacity-0 scale-95"
>
  <!-- content -->
</div>
```

### Slide from top (dropdown)
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
  Dropdown content
</div>
```

### Respecting reduced motion in Alpine
```html
<div
  x-show="open"
  :class="prefersReducedMotion ? '' : 'transition-all duration-200 ease-out'"
  x-data="{ prefersReducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches }"
>
```

---

## Scroll-Triggered Animations

Use the `IntersectionObserver` API with a simple Astro `<script>` block. This avoids any dependency and is tiny.

```astro
<script>
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible')
          observer.unobserve(entry.target) // animate once
        }
      })
    },
    { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
  )

  document.querySelectorAll('[data-animate]').forEach((el) => {
    observer.observe(el)
  })
</script>
```

In `global.css`, define the before/after states:
```css
[data-animate] {
  opacity: 0;
  transform: translateY(16px);
  transition: opacity 0.5s ease-out, transform 0.5s ease-out;
}

[data-animate].is-visible {
  opacity: 1;
  transform: translateY(0);
}

@media (prefers-reduced-motion: reduce) {
  [data-animate] {
    opacity: 1;
    transform: none;
    transition: none;
  }
}
```

Use it on any element:
```astro
<section data-animate>
  ...
</section>
```

---

## Page Transitions (Astro View Transitions)

Astro has a built-in View Transitions API. Enable it in the root layout:

```astro
---
import { ViewTransitions } from 'astro:transitions'
---
<head>
  <ViewTransitions />
</head>
```

For custom per-element transitions, use `transition:name` and `transition:animate`:

```astro
<!-- Hero image slides in from the left -->
<Image
  src={hero}
  alt="..."
  transition:name="hero-image"
  transition:animate="slide"
/>

<!-- Blog post title morphs between list and detail page -->
<h1 transition:name={`post-title-${post.slug}`}>
  {post.data.title}
</h1>
```

For a custom fade transition:
```astro
<main transition:animate="fade">
  <slot />
</main>
```

View Transitions automatically respects `prefers-reduced-motion` when using the built-in animations.

---

## Micro-Interactions Checklist

Polish every interactive element with thoughtful micro-interactions:

- **Links in body text**: underline on hover with `transition-colors` (not instant)
- **Buttons**: slight scale down on `:active` (`active:scale-95`)
- **Cards**: lift on hover (`hover:-translate-y-0.5 hover:shadow-medium`)
- **Icon buttons**: color change on hover with transition
- **Form inputs**: border color change on focus, not just an outline
- **Checkboxes / toggles**: smooth color transition

All transitions should use `duration-150` to `duration-200` — snappy feels better than slow. Only use longer durations (300ms+) for large layout changes or reveals.

---

## Dark Mode

The site uses `data-theme="dark"` on the root `<html>` element. Alpine.js manages the toggle:

```html
<html
  x-data="{ theme: localStorage.getItem('theme') ?? 'light' }"
  :data-theme="theme"
  x-init="$watch('theme', val => localStorage.setItem('theme', val))"
>
```

Dark mode toggle button:
```html
<button
  type="button"
  @click="theme = theme === 'dark' ? 'light' : 'dark'"
  aria-label="Toggle dark mode"
  :aria-pressed="theme === 'dark'"
>
  <Icon name="mdi:weather-sunny" aria-hidden="true" x-show="theme === 'dark'" />
  <Icon name="mdi:weather-night" aria-hidden="true" x-show="theme === 'light'" />
</button>
```

When designing components, always test both light and dark variants. Define colors using CSS variables in `@theme` so they automatically switch.

---

## Responsive Design

Design mobile-first. Start with base classes and layer up:

```html
<div class="
  grid grid-cols-1 gap-4
  sm:grid-cols-2
  lg:grid-cols-3
  xl:gap-6
">
```

**Key breakpoints (Tailwind default):**
- `sm`: 640px — small tablets, large phones
- `md`: 768px — tablets
- `lg`: 1024px — laptops
- `xl`: 1280px — desktops

Always verify designs at 375px (iPhone SE) and 1440px (standard desktop). Check that text never overflows, images scale, and navigation collapses correctly.
