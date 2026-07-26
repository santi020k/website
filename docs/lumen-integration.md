# Lumen UI integration

The website uses `@santi020k/lumen-astro` as its shared component layer. Import Lumen styles once
from `src/styles/global.css`, use public Lumen components instead of recreating their `ui-*`
classes, and keep site-specific wrappers only when the published package lacks a required semantic
contract.

## Statistics

All website metric cards, including the Experience, Team led, Cycle Time, and Community cards on
the homepage, render Lumen's `Stat` component through
`src/components/molecules/StatCard.astro`. The wrapper currently provides the outer `article`
element because the installed Lumen `0.3.0` release always renders `Stat` as a `div`.

The wrapper accepts Lumen's next `default`, `accent`, and `glass` variants and currently defaults to
`accent`. It temporarily includes the exact next-release variant styles because the installed
Lumen `0.3.0` stylesheet does not contain them. Prefer `default` for a neutral metric, `accent` for
a featured metric, and `glass` only when translucency fits the surrounding surface.

## Current primitive migrations

- About-page supplementary cards use Lumen `Note` directly.
- The homepage availability status uses Lumen `Marker`.
- The article and project table of contents use Lumen `Anchor` and its shared scroll-spy runtime.
- The local `Pill` wrapper delegates links, labels, and counts to Lumen `Pill`; it only keeps the
  site-specific hash prefix and temporary next-release variant styles.
- Series navigation uses Lumen `Progress` with a readable current/max value.
- Speaking, principle, testimonial, section-header, and project-sidebar surfaces use Lumen `Card`
  while retaining their site-specific composition and spacing.
- Testimonial identities use Lumen `Avatar`; optimized Astro images remain slotted inside it.
- Site-specific interface icons use Lumen `Icon` when Lucide provides the mark. Third-party brand
  logos remain on `astro-icon` because Lucide intentionally excludes brand assets.
- Reading layouts use a temporary compatibility wrapper matching Lumen’s next `ScrollProgress`
  contract.
- The site-wide background, including the footer, currently keeps the local
  `ParticlesBackground` behavior. It uses Lumen's `Particles` container but disables the published
  tiled background and generates the original slowly drifting `brand`, `accent`, and `glow`
  particles locally.

Unused local Badge, FloatingBadge, Separator, SocialIconLink, MiniNote, and PillCount components
were removed rather than duplicated in the shared library.

## Follow-up after Lumen 0.4.0

Lumen's next release adds `Stat as="article"`, Pill variants, hierarchical Anchor items, and
ScrollProgress. After `@santi020k/lumen-astro` 0.4.0 is published:

1. Upgrade the catalog entry in `pnpm-workspace.yaml` and refresh `pnpm-lock.yaml`.
2. Replace the outer `article` compatibility wrapper in `StatCard.astro` with
   `<Stat as="article" variant={variant}>`.
3. Remove the `data-stat-card-compat` hook and its inline compatibility stylesheet.
4. Pass `variant={tone}` from the local Pill wrapper, then remove `data-pill-compat`, the manual
   modifier class, and its compatibility stylesheet.
5. Replace `ReadingProgressBar` imports with Lumen `ScrollProgress`, then delete the compatibility
   wrapper.
6. Keep the Anchor composition but remove its local depth compatibility rule.
7. Keep the Stat description in the default slot and retain the full-height class.
8. Once a Lumen release containing the new drifting `Particles` implementation is published,
   replace the local `ParticlesBackground` compatibility behavior with Lumen `Particles` directly
   and remove the duplicated particle script and keyframes.
9. Run `pnpm run lint`, `pnpm run check`, `pnpm run test`, `pnpm run build`, and the Chromium E2E
   suite.
10. Remove this follow-up section once the migration is complete.
