# Lumen UI v2 integration

The website uses `@santi020k/lumen-astro` 2.x as its shared component layer. Import Lumen styles
once from `src/styles/global.css`, mount the default export from
`@santi020k/lumen-astro/runtime` once in `src/layouts/Base.astro`, use public Lumen components
instead of recreating their `ui-*` classes, and keep site-specific wrappers only when the published
package lacks a required semantic contract.

## Statistics

All website metric cards, including the Experience, Team led, Cycle Time, and Community cards on
the homepage, render Lumen's `Stat` component through
`src/components/molecules/StatCard.astro`. The wrapper uses the public `as="article"` and `variant`
contracts. Prefer `default` for a neutral metric, `accent` for a featured metric, and `glass` only
when translucency fits the surrounding surface.

## Current primitive migrations

- About-page supplementary cards use Lumen `Note` directly.
- The homepage availability status uses Lumen `Marker`.
- The article and project table of contents use Lumen `Anchor` and its shared scroll-spy runtime.
- The local `Pill` wrapper delegates links, variants, labels, and counts to Lumen `Pill`; it only
  keeps the site-specific hash-prefix composition.
- Series navigation uses Lumen `Progress` with a readable current/max value.
- Speaking, principle, testimonial, section-header, and project-sidebar surfaces use Lumen `Card`
  while retaining their site-specific composition and spacing.
- Testimonial identities use Lumen `Avatar`; optimized Astro images remain slotted inside it.
- Site-specific interface icons use Lumen `Icon` when Lucide provides the mark. Third-party brand
  logos remain on `astro-icon` because Lucide intentionally excludes brand assets.
- Reading layouts use Lumen `ScrollProgress` directly.
- The site-wide background uses Lumen `Particles` directly, including its reduced-motion behavior.
- Repeated card and content grids use Lumen v2 `RevealGroup` for selector-loaded, tokenized motion
  with a built-in reduced-motion path.
- Article and email copy actions use Lumen v2 `CopyButton`, including accessible success and error
  announcements. The share toolbar retains its site-owned controller because it also offers the
  platform-native share sheet on supported touch devices.

## Upgrade checks

After updating Lumen, run these package-owned checks before the website gates:

```bash
pnpm exec lumen migrate v2
pnpm exec lumen audit-tokens
pnpm exec lumen doctor
```

The migration command should report no pending rewrites, the token audit should report no
incompatible semantic variables, and the doctor should confirm one Astro adapter, one stylesheet
boundary, and one runtime mount.

Unused local Badge, FloatingBadge, Separator, SocialIconLink, MiniNote, PillCount,
ReadingProgressBar, and ParticlesBackground components were removed rather than duplicated in the
shared library.
