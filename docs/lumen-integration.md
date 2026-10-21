# Lumen UI integration

The dependency catalog and lockfile use the `@santi020k/lumen` 4.2.0, `@santi020k/lumen-astro`
4.1.0, and `@santi020k/lumen-core` 4.1.0 registry packages.
Normal development and validation use those published dependencies. Import Lumen styles
once from `src/styles/global.css`, mount the default export from
`@santi020k/lumen-astro/runtime` once in `src/layouts/Base.astro`, use public Lumen components
instead of recreating their `ui-*` classes, and keep site-specific wrappers only when the published
package lacks a required semantic contract.

## Published setup and stable styling

The website follows the same one-adapter setup as Lumen's README. Keep the layer order in the
shared stylesheet so Tailwind utilities can override component defaults:

```css
@import "@santi020k/lumen-astro/layers.css";
@import "tailwindcss";
@import "@santi020k/lumen-astro/styles.css";
@import "@santi020k/lumen/styles/motion.css";
```

`Base.astro` imports that global stylesheet and mounts `UIPrimitives` once. Pages and content
components import their public primitives from `@santi020k/lumen-astro`; they do not add a
second adapter or mount a second runtime. The site-owned Theme tokens follow the shared imports.

| Contract | Website usage |
| --- | --- |
| Public component props | Variants and semantic element choices for cards, actions, metrics, and disclosures. |
| Semantic variables | Site theme values and the documented `--ui-card-gap` layout override. |
| Public `data-slot` hooks | Styling component parts, including print visibility for `SkipLink`. |
| Semantic roles | Markdown `CodeTabs` styling through tablist, tab, and tabpanel roles. |
| Application-owned state | Search, sorting, navigation, share-sheet selection, and travel data. |

Prefer these contracts over private component class names. Lumen provides presentation and
accessible interaction; the website retains its content rules, routing, logging, and recovery
policy. Use the [Lumen error-handling guide](https://github.com/santi020k/lumen/blob/main/docs/error-handling.md)
when adding a failure state, rather than inventing another alert or toast system.

## Documentation and feedback

The repository README uses the site's generated OG hero and project artwork, with accessible
image descriptions and links to real routes. These images are artwork, not product screenshots.
Keep generated artwork under the existing OG pipeline rather than maintaining duplicate binaries.

Website bug reports collect a page or revision, expected and actual behavior, browser/device,
and relevant keyboard, screen reader, theme, zoom, and reduced-motion context. Content corrections
have a separate form. Reproduce a library-level issue against the installed Lumen package before
reporting it to [Lumen](https://github.com/santi020k/lumen/issues/new/choose); website-specific
composition and content reports belong in this repository. Security reports follow the
[private reporting policy](../.github/SECURITY.md).

## Statistics

Homepage metrics use Lumen `Stat` directly with `variant="bare"` and `as="article"` to create
a quiet typographic strip. Other metric cards use `src/components/molecules/StatCard.astro`.
The shared card composes `Stat` with `variant="bare"`, the public label slot, a decorative
Lumen `Icon`, and the existing `AnimatedNumber` for numeric values. Site-owned styles
provide the approved sculpted surface, shaped corners, and responsive hierarchy.
Pass an explicit icon and separate prefixes or word suffixes when needed; preserve full
text values and the numeric component's server-rendered accessible value.
The homepage project surfaces use `Card` with
`variant="unstyled"`, and its actions use `ButtonLink` with `variant="unstyled"` so the shared
semantics remain intact while the site owns its visual composition.

## Work page composition

The Work page follows the solid editorial canvas of the homepage and navbar: generous
spacing, Montserrat headings, fine dividers, a purple emphasis, and the shared solid resume
button. Its results row uses Lumen `Stat` with `variant="bare"`; technology links use `Pill`.
`CareerTimeline` uses Lumen `Timeline` for its ordered list and one unstyled `Card` per
linked role. A site-owned date rail and connector frame the Timeline folio layout without
styling private TimelineItem internals. Each role retains its complete description,
technologies, chronological dates, and keyboard-accessible case-study link. Its scoped
styles own the card and responsive date rail; Work page styles own only the page composition.

## Current primitive migrations

- About-page supplementary cards use Lumen `Note` directly.
- The About hero availability status uses Lumen `Marker`.
- The article and project table of contents use Lumen `Anchor` and its shared scroll-spy runtime,
  with the temporary runtime patch described below. The site's reading page boundary also sets
  `font-size: 1rem` explicitly: in WebKit, relying on inheritance left descendant layout stale
  after root text resizing during client navigation, shifting native fragment targets. This
  keeps the existing native links and Lumen marker synchronized without another controller.
- The local `Pill` wrapper delegates links, variants, labels, and counts to Lumen `Pill`; it only
  keeps the site-specific hash-prefix composition.
- Series navigation uses Lumen `Progress` with a readable current/max value.
- Project timeline endpoints use separate native `time` elements, and project
  sidebar card labels are level-two headings with the existing section-label style.
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
  platform-native share sheet on supported touch devices. Its copy and native-share actions use
  the server-rendered article permalink from `data-share-url`, the same URL as the social links,
  so address-bar queries, fragments, and preview origins are never shared.
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

- `src/components/atoms/Button.astro` / `ButtonLink.astro` wrap Lumen's `Button`/`ButtonLink` to
  keep the site's `primary`/`secondary`/`ghost`/`inline` action vocabulary. `Button` maps it to a
  Lumen variant plus the `data-site-action` hook; `ButtonLink` uses Lumen's `unstyled` variant with
  the matching `btn-*` utility from `src/styles/partials/utilities.css`. Neither adds a pointer
  effect or client script.
- The header search trigger (Lumen `Button`, `size="icon"`) and `ThemeToggle` keep Lumen's
  semantics and behavior. `src/styles/partials/nav.css` replaces their default glass, glow, and
  hover-lift styling with the sculpted header action treatment and the shared header focus
  outline. The search panel inside Lumen's fullscreen `Dialog` is site-owned: its rem-based
  container queries compact the chrome for narrow, short, or enlarged-text viewports while the
  results list stays the only scroll region.
- `src/plugins/rehype-lumen-code.ts` hand-builds Lumen's `Code`/`CodeTabs` public DOM contract
  (`data-ui-code`, `role="tab"`/`"tabpanel"`, `data-value`, `aria-selected`) for markdown-rendered
  code blocks, because that content is produced by a Unified/Rehype pipeline outside the Astro
  component tree and cannot render the real Astro components directly. Its copy button mirrors the
  installed `Code` attributes (`data-copy-label`, `data-copy-copied-label`,
  `data-copy-error-label`, `title`, `data-state="idle"`), because the runtime restores the label
  from them after each copy and otherwise falls back to generic text. The prose stylesheet
  gives `[data-ui-code-copy]` a minimum 44px touch target without replacing its Lumen runtime
  or keyboard focus treatment. Its code-header `figcaption` resets prose caption margins so
  Tailwind Typography does not insert a blank strip above the header; ordinary figure
  captions retain their spacing. Code-copy buttons keep stable geometry during hover and
  press: Lumen's scale animation could send an enlarged-text edge tap to the header.
  Color, border, copy-state feedback, and keyboard focus remain available.
- Project prose cards own their decorative list dots. The dots follow the first line height,
  and single-column grid tracks can shrink below their content width so enlarged text wraps
  inside phone viewports. Lumen does not supply these markers.
- `ShareButtons` keeps native sharing on supported coarse-pointer devices and clipboard copying
  elsewhere. Its visible label and accessible name say "Share link" for native sharing and
  "Copy link" for clipboard-only use. Cancellation preserves the idle label; fallback feedback
  returns to the label for the available action.
- `src/plugins/rehype-readable-tables.ts` wraps Markdown tables in Lumen's `ui-table-wrap`
  surface (`data-slot="table"`). The native table and its headings remain intact inside a
  focusable region named from its caption or preceding heading. This lets keyboard users scroll
  wide tables in Safari as well as Chromium without client JavaScript. Body cells wrap with a
  12-character minimum width, keeping explanatory sentences readable while headers stay together.
  The four-column measurement table fits the desktop reading column and retains horizontal scrolling
  on narrow screens. `tests/legacy-article-content.spec.ts` checks normal and enlarged text.
  Prose styles use site ink tokens for cells and Lumen's code foreground token for language badges in both themes.
- The share toolbar (see above) keeps its own controller for the native share-sheet fallback.

## Anchor runtime patch

The installed `@santi020k/lumen-astro` 4.1.0 runtime marks an `Anchor` heading current only when
its top reaches the numeric `activationOffset` in CSS pixels. Native fragment navigation lands the
heading at the root `scroll-padding-top` (`7em` on `<html>`, equal to 7rem; WebKit can resolve a
root `rem` value here against the default font size), which grows with root text size. With enlarged
text the destination therefore landed below the threshold and the marker stayed on the previous
section. Browser zoom was unaffected because it scales pixels and rems together.

The [version-pinned pnpm patch](../patches/@santi020k__lumen-astro@4.1.0.patch), registered under
`patchedDependencies`, changes only
`runtime/controllers/document-navigation.ts` and its README. The runtime treats a heading as
current once it reaches the greater of `activationOffset` and the native landing line, computed
from the owning window's root `scroll-padding-top` plus the heading's `scroll-margin-top`, within
one CSS pixel. Percentage scroll padding resolves against the scrolling element's height; `auto`
and unresolved values count as zero, and the offset is never negative or non-finite. The public
`Anchor` API, native fragment links, page-lifecycle initialization, and listeners are unchanged,
and the site adds no second scroll-spy or client bridge. Lumen still owns the behavior.

Do not compensate with negative heading `scroll-margin-top`: at 200% text it would place headings
under the sticky header. Remove the patch when a published `lumen-astro` release provides the same
landing-line activation. If `lumen-astro` changes version first, regenerate the version-specific
patch with `pnpm patch` and update its registration before validating the upgrade. Verify with the enlarged fragment-navigation and
text-size marker cases in `tests/responsive-reading.spec.ts`.

## Tall reveal groups

Keep the website's 13 `threshold={0}` settings. The installed `lumen-astro` 4.1.0 runtime observes
the configured threshold alone (`0.15` by default). In native Chromium and WebKit checks, a group
entering below that ratio did not reliably trigger another observer callback after its initial
offscreen notification. At 390 × 844 with 200% root text, the selected-projects group on
`/portfolio/` measured about 7,150px tall. Less than 15% could fit in the viewport, leaving the
featured card and supporting grid transparent when the zero threshold was removed.

The explicit zero thresholds reveal these groups on viewport entry without changing the shared
timing for other Lumen consumers. Observing `[0, threshold]` globally also revealed short sections
with custom thresholds on entry, so that runtime change was rejected. The installed patch remains
limited to Anchor; there is no motion runtime patch.

Before removing the overrides, verify a compatible upstream solution that preserves custom
threshold timing. Run `tests/reveal-entry.spec.ts` with native browser observers: it checks a
group too tall to reach the default ratio, actual painted opacity, keyboard navigation, and a
desktop entrance below that ratio. The route traversal in `tests/legacy-card-interactions.spec.ts`
covers the remaining consumers at mobile and desktop widths with 100% and 200% text.

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

The historical initial candidate came from Lumen revision `f7bfcc07a0805a420ffeb6ad5f24da709ecca6dd`.
That revision records historical local consumer evidence. Normal website development now uses
the published registry packages; historical candidate checks do not qualify later revisions.

The travel page consumes the public `WorldMap` and `lumen-core/world-map-data` exports
from the published v4 packages. See the [travel editing guide](editorial/travel.md) for map data.

The registry rollout updates the catalog entries together and retains exact release-age
exceptions for the installed `lumen` 4.2.0, `lumen-astro` 4.1.0, and `lumen-core` 4.1.0 packages
under the existing supply-chain policy. The lockfile
contains registry resolutions, and CV downloads are regenerated from the resulting build.
Run the migration audit, website gates, Playwright interactions, and mobile / desktop visual
checks after future upgrades. Use the website's Changesets process in `docs/deployment.md`;
reverting the coordinated dependency and consumer changes together is the rollback.

## Consumer styling cleanup

The local `ui.css` layer retains seven source-used utility definitions, including the
shared focus-ring dependency. Ninety-three unused primitive definitions were removed;
Lumen continues to own primitive defaults. `site-label` names the site's text utility
without sharing Lumen's internal Label class. Card spacing and Work metrics use public
`data-slot` hooks. About descriptions, testimonial authors, homepage icons, project
section eyebrows, and branded Work pills use consumer-owned attributes.

The installed `lumen-astro` 4.1.0 contracts do not expose styling parts for TimelineItem's connector,
dot frame, and content wrapper, or for every WorldMap frame/control part. Those scoped
internal selectors remain necessary to preserve the approved timeline and travel layouts.
ThemeToggle's icon-position override also remains until the adapter exposes icon parts.
Track their replacement in this section after Lumen publishes matching public parts;
do not replace them with child-index selectors or remove them solely to silence an audit.
The two Timeline part advisories from `lumen doctor src` therefore remain reviewed limitations.

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
