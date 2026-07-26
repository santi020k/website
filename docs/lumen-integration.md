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

## Follow-up after Lumen 0.4.0

Lumen's next release adds `Stat as="article"`. After `@santi020k/lumen-astro` 0.4.0 is published:

1. Upgrade the catalog entry in `pnpm-workspace.yaml` and refresh `pnpm-lock.yaml`.
2. Replace the outer `article` compatibility wrapper in `StatCard.astro` with
   `<Stat as="article" variant={variant}>`.
3. Remove the `data-stat-card-compat` hook and its inline compatibility stylesheet.
4. Keep the description in the default slot and retain the full-height class.
5. Run `pnpm run lint`, `pnpm run check`, `pnpm run test`, `pnpm run build`, and the Chromium E2E
   suite.
6. Remove this follow-up section once the migration is complete.
