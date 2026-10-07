# Lumen UI integration

The committed production baseline uses `@santi020k/lumen-astro` 2.1.0. Lumen 4 is being
qualified locally while its coordinated packages remain unpublished. Import Lumen styles
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

The preview command temporarily overrides only the three Lumen packages. It keeps those
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

The travel page also consumes the public `WorldMap` and `lumen-core/world-map-data` exports.
Its implementation requires v4; the registry baseline cannot build this release until those
packages are published. See the [travel editing guide](editorial/travel.md) for the map data.

After publication, change both the Lumen adapter and core catalog entries in `pnpm-workspace.yaml`
to `4.0.0`, add exact release-age exceptions for the coordinated three packages if needed by the
existing supply-chain policy, and run `pnpm install` to commit a registry-backed lockfile.
Re-run the migration audit, website quality/build gates, Playwright interactions, and mobile /
desktop visual checks against those actual published packages before deployment. Use the
website's Changesets process in `docs/deployment.md`; reverting the adoption commit and
reinstalling the previous lockfile is the consumer rollback.

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

Unused local Badge, FloatingBadge, Separator, SocialIconLink, MiniNote, PillCount,
ReadingProgressBar, and ParticlesBackground components were removed rather than duplicated in the
shared library.
