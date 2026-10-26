---
name: web-design
description: Design system, editorial layouts, animations, and component patterns for this Astro and Lumen website. Use for design, styling, motion, typography, responsive layout, and visual polish.
---

# Web Design — santi020k

Stack: **Astro 7 · Lumen · Tailwind CSS v4 · Vanilla JavaScript**.

Read `docs/sculpted-style-guide.md` before styling a page. It is authoritative for the
approved navbar, homepage, supporting pages, typography, actions, spacing, and surfaces.
Read `docs/lumen-integration.md` for the installed component contracts and runtime boundary.

## Design direction

Favor open space, fine rules, Montserrat 500 headings, restrained purple emphasis, and solid
Lumen surfaces. Keep one surface per content unit. Do not truncate headings to make a layout fit.
Preserve the site background particles and respect reduced motion. Reading prose and résumé
print styles have their own contracts.

Use Lumen components and public props, tokens, `data-slot` attributes, and semantic roles.
Inspect the installed package before using an unfamiliar component. Do not target private
implementation classes or recreate a primitive that Lumen already provides.

## Styles and tokens

`src/styles/global.css` is the shared import boundary. Site extensions live in
`src/styles/partials/tokens.css`; core tokens come from `@santi020k/theme` and Lumen.
Page compositions live in the named partials. Reusable website utilities belong in
`src/styles/partials/utilities.css`, and public Lumen customizations in `ui.css`.

Use semantic names: `canvas`, `surface`, `surface-muted`, `line`, `ink`, `ink-soft`,
`ink-muted`, `brand`, `brand-solid`, `brand-soft`, and `accent`. Do not introduce a second palette.
Dark mode uses `data-theme="dark"` on `<html>` and the shared Tailwind `dark:` variant.

Use the typography and spacing scale in the style guide, the shared `PageHero`, or an approved
page composition. Do not restore legacy glass cards, floating hero notes, spinning borders,
or oversized gradient headings from historical versions of the site.

## Components and composition

- Check approved treatments and their shared components before proposing a new design.
  Reuse the existing component when it serves the same purpose on another page.
- Prefer `PageSection`, `SectionHeader`, and the existing page-specific section headings.
- Use `ProjectsGallery` and `PostsGallery` for collection layouts.
- Use Lumen `Card` when a distinct content surface is needed, with site-owned composition.
- Use the local `Button` and `ButtonLink` wrappers for the existing sculpted action styles.
- Use `Pill` for project status labels, `SculptedTag` for linked topics and technology counts,
  and `ReadingContents` for shared article and project navigation, embedded in
  `ReadingChapterOpener` on stacked layouts.
- Retain `glass-pro` only where the current reading surfaces use it; it is not the default card.

The retained layout utilities include `section-container-wide`, `section-copy`, `section-actions`,
`section-label` and `editorial-rail`. Check their source before composing a new layout.
`site-action` underpins `btn-primary`, `btn-secondary`, `btn-ghost`, and `btn-inline`; retain
transitive `@apply` dependencies even if no template names them directly.

Avoid nested decorative cards. Express hierarchy with typography, dividers, media, and spacing.
Use `GradientDivider` only where it fits the current composition.

## Motion

Lumen owns grouped motion and scroll reveals through `RevealGroup` and `MotionGroup`.
Do not reintroduce retired `data-animate` or `data-stagger` controllers.

The site retains only the keyframes currently consumed by its page entrances and share feedback:
`slide-up`, `reveal-lcp`, and `spring-up`. Their tokens live in `tokens.css`; keyframes live in
`animations.css`. Navigation and search keep their local state-specific animations.

Every new animation or transition needs a `motion-reduce:` variant or a
`prefers-reduced-motion` media query. Preserve Lumen's reduced-motion behavior and ensure
content remains visible without animation or JavaScript.

## Images and performance

Use Astro's `Image` or `Picture` and the existing site media wrappers. Supply meaningful alt
text, intrinsic dimensions, accurate `sizes`, and bounded responsive widths. Keep originals
when they are source material; measure generated browser assets before claiming size savings.

Do not delete historical `apps/v1`, `apps/v2`, or `apps/v3` assets as unused current-site code.
They are intentionally published under versioned routes. Generated OG aliases also have
compatibility consumers: inspect the generator and manifest before removing a duplicate.

## Verification

Capture before and after at the same route, viewport, data, theme, and motion preference for
material changes. Check mobile and desktop, light and dark themes, narrow layouts, and enlarged
text. Verify keyboard focus, touch targets, contrast, and reduced motion.

Run `pnpm run lint` and `pnpm run check` with zero diagnostics, relevant browser tests, and
`pnpm run verify:fast`. Use built-page and historical-page audits when assets or shared styles
change. Do not remove a style from browser coverage alone: trace templates, dynamic classes,
Markdown, component output, and transitive utility references first.
