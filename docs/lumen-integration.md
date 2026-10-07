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
- Package-manager `CodeTabs` (`src/components/molecules/PackageManagerCodeTabs.astro` and the
  markdown-time equivalent built by `src/plugins/rehype-lumen-code.ts`) share one consumer-owned
  `data-package-manager-code-tabs` attribute plus Lumen's public `data-slot="code-tabs"` hook
  as their styling root.
  `src/styles/partials/ui.css` and `src/styles/partials/prose.css` style the tab list, tabs, and
  panels through `[role="tablist"]`/`[role="tab"]`/`[role="tabpanel"]` — Lumen's documented Tabs
  contract — instead of `CodeTabs`' private `.ui-code-tabs__list`/`__tab`/`__panel` implementation
  classes, which `pnpm exec lumen doctor` flags as unstable hooks. The generated markup retains
  Lumen's `ui-tabs` and `ui-code-tabs` base classes for its shared outer surface and compact code
  styling, plus `data-ui-tabs` for runtime behavior. Consumer CSS targets the data hooks and roles.
- Organization carousel controls use Lumen `Button` with `size="icon"` and `variant="secondary"`.
  The site retains its responsive pagination and focused-link visibility controller.
- Blog topic links delegate `aria-current="page"` through the site `Pill` wrapper to Lumen `Pill`,
  so the selected topic and All posts link expose their current-page state.
- The resume print stylesheet hides Lumen's `SkipLink` through its documented `data-slot`
  attribute (`[data-slot="skip-link"]`) rather than the private `.ui-skip-link` class Lumen
  happens to render it with.

## Intentional site-owned controllers

These stay app-owned by design rather than migrating to a Lumen primitive:

- `src/components/atoms/Button.astro` / `ButtonLink.astro` wrap Lumen's `Button`/`ButtonLink` for
  their public `variant` contract, then layer a site-specific magnetic pointer-follow effect
  (`data-magnetic`) that has no Lumen equivalent and is skipped for touch input and reduced motion.
- `src/plugins/rehype-lumen-code.ts` hand-builds Lumen's `Code`/`CodeTabs` public DOM contract
  (`data-ui-code`, `role="tab"`/`"tabpanel"`, `data-value`, `aria-selected`) for markdown-rendered
  code blocks, because that content is produced by a Unified/Rehype pipeline outside the Astro
  component tree and cannot render the real Astro components directly.
- The share toolbar (see above) keeps its own controller for the native share-sheet fallback.

## Upgrade checks

After updating Lumen, run these package-owned checks before the website gates:

```bash
pnpm exec lumen migrate v2
pnpm exec lumen audit-tokens src
pnpm exec lumen doctor
```

The migration command should report no pending rewrites, the token audit should report no
incompatible semantic variables, and the doctor should confirm one Astro adapter, one stylesheet
boundary, and one runtime mount.

Audit source CSS under `src` so generated, minified files in `dist` are not mistaken for token
declarations.

Unused local Badge, FloatingBadge, Separator, SocialIconLink, MiniNote, PillCount,
ReadingProgressBar, and ParticlesBackground components were removed rather than duplicated in the
shared library.
