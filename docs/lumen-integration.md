# Lumen UI integration

The dependency catalog and lockfile use the coordinated `@santi020k/lumen`,
`@santi020k/lumen-astro`, and `@santi020k/lumen-core` 4.0.0 registry packages.
Normal development and validation use those published dependencies. Import Lumen styles
once from `src/styles/global.css`, mount the default export from
`@santi020k/lumen-astro/runtime` once in `src/layouts/Base.astro`, use public Lumen components
instead of recreating their `ui-*` classes, and keep site-specific wrappers only when the published
package lacks a required semantic contract.

## Statistics

Homepage metrics use Lumen `Stat` directly with `variant="bare"` and `as="article"` to create
a quiet typographic strip. Other metric cards use `src/components/molecules/StatCard.astro`.
Prefer `default` for a neutral metric, `accent` for a featured metric, and `glass` only when
translucency fits the surrounding surface. The homepage project surfaces use `Card` with
`variant="unstyled"`, and its actions use `ButtonLink` with `variant="unstyled"` so the shared
semantics remain intact while the site owns its visual composition.

## Work page composition

The Work page follows the solid editorial canvas of the homepage and navbar: generous
spacing, Montserrat headings, fine dividers, a purple emphasis, and the shared solid resume
button. Its results row uses Lumen `Stat` with `variant="bare"`; technology links use `Pill`.
The existing `CareerTimeline` has an opt-in `appearance="editorial"` for Work, keeping the
portfolio index's default presentation. Work shows complete role descriptions, with the
same chronological content and keyboard-accessible case-study links in both themes.
Page-specific styles live in `src/styles/partials/work.css`.

## Current primitive migrations

- About-page supplementary cards use Lumen `Note` directly.
- The About hero availability status uses Lumen `Marker`.
- The article and project table of contents use Lumen `Anchor` and its shared scroll-spy runtime.
- The local `Pill` wrapper delegates links, variants, labels, and counts to Lumen `Pill`; it only
  keeps the site-specific hash-prefix composition.
- Series navigation uses Lumen `Progress` with a readable current/max value.
- Speaking, principle, testimonial, section-header, and project-sidebar surfaces use Lumen `Card`
  while retaining their site-specific composition and spacing.
- Project stack cards use Lumen `Collapsible` for technologies beyond the first six. The native
  disclosure supports keyboard input and works without JavaScript; projects with shorter stacks
  show their complete list directly.
- Testimonial identities use Lumen `Avatar`; optimized Astro images remain slotted inside it.
- Site-specific interface icons use Lumen `Icon` when Lucide provides the mark. Third-party brand
  logos remain on `astro-icon` because Lucide intentionally excludes brand assets.
- Reading layouts use Lumen `ScrollProgress` directly.
- The site-wide background uses Lumen `Particles` directly, including its reduced-motion behavior.
- Repeated card and content grids use Lumen `RevealGroup` for selector-loaded, tokenized motion
  with a built-in reduced-motion path.
- Article and email copy actions use Lumen `CopyButton`, including accessible success and error
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

## Motion and effects

- Numeric homepage metrics and stack counts compose `AnimatedNumber`, with a stable screen-reader
  value and final content rendered on the server. Text-only statistics remain static.
- Topic sorting and technology filtering use keyed `MotionGroup` children. Site controllers retain
  ownership of sorting, search, focus, and result announcements.
- `@santi020k/lumen/styles/motion.css` enables native disclosure height transitions in supporting
  browsers. Unsupported browsers keep the native immediate toggle.
- Stack cards use a static mesh effect. The sculpted homepage hero uses its site-owned artwork
  without continuous animation or a pause-control requirement.
- The existing Void homepage screenshot is rendered with `DeviceFrame` and Astro's optimized image.
  Other project artwork remains unframed; it does not represent actual product screens.
- The travel notebook uses Lumen `WorldMap` with site-owned visit data. Charts and AI interfaces
  are absent because current content does not require them.

## Lumen 4 candidate preview

Use Node 24 or newer and this website's pinned pnpm 11.25.0. Build and pack `lumen-core`,
`lumen`, and `lumen-astro` from one fixed Lumen release revision in an isolated checkout.
Follow the Lumen repository's own build instructions and package manager there. Keep the
three `santi020k-*-4.0.0.tgz` files outside tracked source, for example in `.cache/tarballs/`.
Do not pack mutable checkouts while another release task is changing them.

Run a local preview or a validation command:

```bash
pnpm run preview:lumen:v4 .cache/tarballs
pnpm run preview:lumen:v4 .cache/tarballs pnpm run verify:fast
```

The preview command temporarily overrides only the three Lumen packages. The umbrella package is
also a direct website dependency so its public optional stylesheet resolves under pnpm. It keeps those
overrides active while the child command runs, then restores the workspace, lockfile, and
published dependencies on normal completion or command failure. Do not run another install,
preview session, or dependency edit concurrently in this checkout. If the process is forcibly
terminated, recover the two dependency files from Git after preserving unrelated changes,
then run `pnpm install --frozen-lockfile`. Local tarballs must never enter a deployment or commit.

The v4 source migration currently requires no automatic rewrites in this Astro consumer.
Existing site cards own their spacing through utility classes and composed content, so
`src/styles/partials/ui.css` sets the public `--ui-card-gap` variable to zero to avoid adding
v4's default gap to those layouts. Explicit gap utilities still work. Media frames retain their
own clipping, and the root stylesheet and runtime imports remain valid. The Markdown adapter
assigns each scrollable code block a distinct accessible landmark name, because the v4 runtime
enhances these blocks as regions and repeated default names fail the article accessibility audit.
The build clears Astro's generated content store so changes to Markdown adapters regenerate
article markup instead of reusing HTML from the previous integration.

The initial candidate comes from Lumen revision `f7bfcc07a0805a420ffeb6ad5f24da709ecca6dd`.
This is local consumer evidence, not qualification of the Lumen release or published v4 packages.

The travel page consumes the public `WorldMap` and `lumen-core/world-map-data` exports
from the published v4 packages. See the [travel editing guide](editorial/travel.md) for map data.

The registry rollout updates all three catalog entries together and retains exact release-age
exceptions for those owned 4.0.0 packages under the existing supply-chain policy. The lockfile
contains registry resolutions, and CV downloads are regenerated from the resulting build.
Run the migration audit, website gates, Playwright interactions, and mobile / desktop visual
checks after future upgrades. Use the website's Changesets process in `docs/deployment.md`;
reverting the coordinated dependency and consumer changes together is the rollback.

## Upgrade checks

After updating Lumen, run these package-owned checks before the website gates:

```bash
pnpm exec lumen migrate v4 --dry-run
pnpm exec lumen audit-tokens src
pnpm exec lumen doctor src
```

The migration command should report no pending rewrites. Review its manual findings against the
actual rendered site. The source token audit should report no incompatible semantic variables.
Confirm one Astro adapter, one stylesheet boundary, and one runtime mount; generated `dist/`
styles are excluded from the source audit because minified selectors can produce false positives.

Audit source CSS under `src` so generated, minified files in `dist` are not mistaken for token
declarations.

Unused local Badge, FloatingBadge, Separator, SocialIconLink, MiniNote, PillCount,
ReadingProgressBar, and ParticlesBackground components were removed rather than duplicated in the
shared library.
