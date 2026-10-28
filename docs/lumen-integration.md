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
@import "@santi020k/lumen/layers.css";
@import "tailwindcss";
@import "@santi020k/lumen/styles.css";
@import "@santi020k/lumen/styles/motion.css";
```

`Base.astro` imports that global stylesheet and mounts `UIPrimitives` once. Pages and content
components import their public primitives from `@santi020k/lumen-astro`; they do not add a
second adapter or mount a second runtime. The site-owned Theme tokens follow the shared imports.

The current site uses the umbrella package's public stylesheet directly. The Astro 4.1.0
compatibility entry imports it again and appends device-frame rules already present in Lumen 4.2.0.
The production CSS optimizer already deduplicates those rules; this keeps the import boundary
current without claiming a duplicate-payload saving. Historical sites retain their own entries.

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

## Reusing the v5 editorial components

The editorial review recommends keeping the current compositions in the website and adding an
editorial recipe family to Lumen when a second application needs them. A separate
`lumen-cards` or `lumen-santi020k` package is not needed for this release. Lumen already owns
the accessible primitives; these designs also include headers, reading navigation, notices,
and page composition, so a cards-only package would misrepresent the reusable work.

The local Lumen repository's `packages/templates/README.md` and `package.json` identify
`@santi020k/lumen-templates` as a private workspace package for its gallery and metadata,
not an npm dependency for applications. Its documented distribution path is the public
adapter CLI's `lumen add <recipe> --target astro`. An editorial family can follow that
existing path without a second runtime, another adapter, or a new package release train.
That family is a recommendation; this website change does not add or publish it.

| Layer | Examples from this release | Reuse boundary |
| --- | --- | --- |
| Lumen primitives | `Card`, `Link`, `Icon`, `Collapsible`, `Anchor`, `DeviceFrame` | Keep using the installed public contracts and one root runtime. |
| Editorial recipes | `CoverSpread`, `ContentNotesHeader`, `ProjectReplacementNotice`, `ShippedSystemCard` | Candidates for an Astro recipe with explicit content props or slots and scoped semantic styles. |
| Website adapters | `ProjectsGallery`, `PostsGallery`, `PortfolioProjectSpotlight`, project focus and outcomes | Keep collection selection, URLs, status, ranking, claims, image policy, and project branding here. |
| Shared foundations | Theme colors, typography, focus, reduced motion | Reuse Lumen and Theme; avoid exporting a copy of the website's global CSS. |

`CoverSpread` already shares the article/project composition. `ContentNotesHeader` already
shares the reading introduction, and `PolicyContactCard` shares policy invitations. Reuse
those implementations before introducing another wrapper. Different approved card designs
retain their own compositions: shared words such as “folio” or similar corners are not a
stable component contract. In particular, do not collapse their typography, media rules,
heading hierarchy, or narrow-container behavior into a large set of boolean props.

Before extracting a recipe, exercise it in a second concrete application. Replace the
website's collection imports, `@/` utilities, fixed IDs, routes, personal copy, and global
page selectors with a small explicit input contract. Prove two instances can coexist and
check light/dark themes, narrow containers, enlarged text, keyboard focus, and reduced
motion. Keep Astro image handling in the adapter and avoid making React or Elements depend
on `astro:content`. Add other framework targets only when their consumers are identified.

The website has a source-available license; Lumen uses MIT. Moving selected original code
into public recipes requires an explicit licensing decision. Personal writing, photographs,
resume data, client logos, and screenshots are not recipe assets. A separately versioned
package becomes useful only if real consumers need synchronized fixes and have a stable
shared API; if that need emerges, a patterns-oriented boundary fits this work better than
`lumen-cards` or a second brand token package.

## Current cleanup boundaries

`ProjectsGallery` now has one editorial presentation, shared by the Projects page and
technology archives. Its retired default branch and related styles are removed, along with
the unused `ProjectSidebarCard`, generic scope/featured metadata, top-tag shortcut, old
Uses data, unused style utilities, and unused project surface-foreground calculation.
The remaining metadata and contrast helpers still support live routes and regression tests.
The unused optional cover gradient and the old Pill link/count/hash props are also removed.

The `--radius-sheet` and `--radius-folio` tokens centralize two repeated four-corner shapes
within an initial set of nine project, system, and policy components. Other components retain
their existing literals, even where values match; this is a scoped adoption, not a site-wide
shape migration. Their selectors, cascade position, padding,
media queries, and container queries remain local. Reading-rail and Work compositions under
active development retain their current rules.

`src/utils/responsive-image.ts` shares aspect-ratio calculation, width limits, candidate
deduplication, and sorting across `HoverableCover`, `PostsGallery`, and `BlogHero`.
Consumers retain their own image candidates, loading priority, formats, descriptions,
and `sizes` values. `TechnologyPillGrid` uses one ledger renderer for its two groups,
preserving the always-present featured group and optional supporting group.

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
spacing, Montserrat headings, fine dividers, and a purple emphasis. Its Experience first
opening uses the shared solid `ButtonLink` for a native jump to `#experience-heading`.
Open resume and LinkedIn remain secondary destinations, grouped so they wrap together
below the primary action when space is limited. LinkedIn keeps its external-link contract.
Its results row uses Lumen `Stat` with `variant="bare"`; technology links use `SculptedTag`.
Toolkit lanes group the same 18 interest-ranked technologies into Web foundations,
Mobile, Data & state, and UI systems. Counts and destinations remain collection-derived;
retain interest order within each lane. Omit empty lanes and show uncategorized highlighted
technologies under Other tools so changing the ranked selection cannot silently hide links.
The numbered headings sit beside the tags on wide screens and above them in narrow
containers. The groups add semantic headings and lists without client JavaScript.
Evidence captions use unstyled `ButtonLink` below each supported statistic's description.
The role and technology counts jump to their Work sections; named project captions link
directly to the relevant case-study chapter. Keep the articles passive and link only
the caption. Omit a caption when the claim's source has not been confirmed.
`CareerTimeline` uses Lumen `Timeline` for its ordered list and one unstyled `Card` per
linked role. A site-owned date rail and connector frame the Timeline folio layout without
styling private TimelineItem internals. Each role retains its complete description,
technologies, chronological dates, and keyboard-accessible case-study link. Its scoped
styles own the card and responsive date rail; Work page styles own only the page composition.
The three newest roles keep their full Timeline folio treatment. Later completed roles
use Compact timeline with smaller headings, tighter spacing, and no repeated status
masthead; active roles stay full. Both densities share the same Lumen components,
company hover colors, and continuous left rail. Connector endpoints account for the
next row's year size so the density transition does not interrupt the line.
Career close ends the toolkit with two named destinations: the resume and the full
technology index. Each uses a public Lumen `Link` around an unstyled `Card`, with a
heading-based accessible name and one decorative arrow. Preserve the project-count
explanation above this navigation; use the named technology destination instead of
the earlier numeric remainder link. These native links need no client controller.

## Portfolio cards

The Portfolio opening uses **Case study paths** in `PageHero`'s existing
`after-description` slot. Lumen `Link` and decorative `Icon` arrows provide native
fragment navigation to the two focusable collection sections. The page owns the
ruled two-column layout, responsive stacking, collection-derived counts, and quiet
work-history footer. Both collections remain visible; no filtering controller or
shared hero variant is added.

`PortfolioCollectionHeading` composes **Editorial bridge** from a semantic header,
collection-derived count, two-line accented headline, description, and Lumen `Link`
with a decorative `Icon`. The shared site component owns the open ruled layout and
container-responsive stacking. Both collection destinations remain native links;
the treatment adds no client JavaScript or shared Lumen variant.

`PortfolioProjectSpotlight` uses an unstyled Lumen `Card` and one named native link covering
its artwork and overlapping content sheet. Keep the readable content outside the link so
screen readers can browse it separately from the concise destination. Lumen `Badge` carries project status and `Icon`
provides the decorative action arrow. Site-owned styles define the layered editorial
composition, responsive crop and overlap, and project-colored hover/focus treatment.
The same component serves featured and supporting portfolio projects without client JavaScript.
Its **Evidence ledger** outcomes remain a semantic list within the existing sheet:
an accent margin rule, a quiet label, and either an emphasized numeric result or
readable qualitative prose. Shared metric formatting preserves attribution and
qualifiers; no new Lumen primitive, nested card, or additional link is introduced.

`RelatedProjectCard` composes a separate Continuation shelf for project detail pages:
an unstyled Lumen `Card`, optimized Astro `Picture`, and decorative Lumen `Icon`.
Its small artwork, title, role, complete description, and ruled action use one named
native link and the existing project-color helpers. Scoped container queries handle
narrow cards and enlarged text; it adds no client JavaScript. Related-project ranking,
ordering, destination URLs, and the Chapter tab shelf header remain in the page layout.

## Sculpted tags navigation

`SculptedTag` composes public Lumen `Link` with `variant="inherit"` and site-owned label
and count spans. Blog filters and related-topic shortcuts, Projects category shortcuts,
and Work technology links share this treatment without changing other Pill consumers. The count slot supports the Blog All posts icon.
The existing Astro navigation controller keeps topic selection, focus, and page position intact;
the layout wraps on mobile and desktop and requires no additional client JavaScript.

The Projects opening uses **Purpose first**: its existing `SculptedTag` navigation
moves into the signature hero, with live purpose counts and native fragment links.
The site owns the brand-soft opening treatment and responsive footer; the existing
Lumen `ButtonLink` retains GitHub's external-link contract. No new controller is
needed. The catalog's project selection, ranking, fragments, and schema are unchanged.

The category headings compose **Chapter links** from the shared `SectionHeader`,
native navigation lists, Lumen `Link`, and decorative `Icon` arrows. The Projects
page owns the ruled layout and responsive stacking. Each heading links to the other
nonempty purpose groups using the catalog's IDs and counts; existing focusable
section anchors work without additional JavaScript. A single category needs no links.

The optional `ProjectsGallery.productFirst` applies **Product first** on Projects.
Its neutral body reuses the existing gallery layout. Lumen `ButtonLink` with
`newTab` renders the named external destination, and `Link` renders the quieter
case-study action. `getProjectPrimaryDestination` supplies the existing URL and
website, archive, or repository label. Missing destinations omit the external action.
Technology archives keep the default single-link card and Matched stack behavior.

## Technology index search

`TechnologyEvidenceLedger` replaces the index's four statistics with **Evidence ledger**
and the existing sculpted character: one unstyled Lumen `Card` with a brand-soft total
and a native `Link` to the most recurring technology. The site owns the joined layout,
shaped corners, wrapping type, and inset keyboard outline. Counts use
`getTechnologyEntryCounts`, which counts each canonical technology once per entry
and breaks equal counts by slug. The summary retains full-portfolio scope while the
catalog is filtered. No extra animation or client behavior is added.

Technology archive openings use **Evidence index**, composed from the shared
`PageHero` after-description slot and public Lumen `Link` and `Icon` primitives.
Counts link to the existing rendered section headings; empty categories are omitted.
The site owns the ruled responsive layout and quiet escape links. Native fragment
navigation works without JavaScript, and the old closing statistics are removed.

`TechnologyArchiveChapter` supplies the site-owned **Evidence chapters** composition
for each gallery introduction. Semantic headings retain their fragment IDs; count
labels come from the rendered groups. Its scoped responsive styles use the shared
semantic tokens, while `ProjectsGallery` keeps the existing Lumen card composition.

The optional `ProjectsGallery.matchedTechnology` enables **Matched stack** only in
technology archives. Canonical slug matching moves the selected technology first,
deduplicates its aliases, and keeps at most three labels. A public Lumen check `Icon`
and semantic colors identify the match within the existing card link. Its accessible
prefix adds context without replacing the link's visible name or adding a nested link.
Keep the archive list unnamed so its technology labels remain in the wrapping link's
accessible name; an `aria-label` on that list would replace them during name computation.

`TechnologyStackConnections` supplies the **Stack connections** archive ending using
native Lumen `Link` and decorative `Icon` primitives. `getTechnologyConnections`
derives shared-entry counts from the visible published entries, deduplicates aliases
by canonical slug, and excludes the selected technology. The site owns the open
heading, ruled grid, responsive wrapping, and closing navigation. Links work without
JavaScript; archives with no connections omit the section.

The index opening uses **Catalog first**: a compact `PageHero`, the existing Search
dock immediately after its introduction, and native Lumen `Link` shortcuts to Core,
Regular, and Selective. Group counts and recurrence thresholds use the same data as
the catalog below. Quiet Work and Portfolio links follow the shortcuts. Filtering
hides the shortcuts while a query is active, preventing links to hidden groups;
clearing it restores them. Group headings retain their fragment IDs and accept
native fragment focus. No additional runtime is introduced.

The **Search dock** composition keeps the existing Lumen `Input` and technology
controller in the compact `PageHero` after-description slot. Its native label, decorative `Icon`,
and live count form one shaped search surface. The count and unit update inside an
atomic live region, retaining the full existing result sentence for screen readers.
The count compartment moves below the input on narrow containers. The original
empty state and technology destinations remain authoritative.

Active technology searches use **Match ledger**: a named list under a query heading,
with technology, recurrence group, portfolio-entry count, and a decorative arrow.
The existing controller moves matching Lumen `Link` rows into the result list;
it does not clone links or introduce a second dataset. Clearing the query restores
every row to its original Margin catalog group and order. Counts retain their
per-entry meaning, including work and community. Query headings use `textContent`,
and the live count and input focus remain stable. Without JavaScript, the complete
server-rendered grouped catalog remains available.

The technology index ending uses **Evidence paths**: three Lumen `Link` rows with
native Work, Projects, and Blog destinations, plus decorative Lumen `Icon` arrows.
The site owns the editorial header, rules, responsive number/copy placement, and
focus treatment. The existing section fragment stays stable; no client controller
or additional card primitive is needed.

## Blog topics search and sort

The **Search folio** panel composes an unstyled Lumen `Card`, a labeled `Input`,
decorative `Icon`, and controlled `Toggle` buttons in a named sort group. Site-owned
styles provide the sculpted frame, full-width search field, and quiet footer.
The existing topic controller owns filtering, sorting, focus retention, and result
announcements; `aria-pressed` is the single source for the selected sort treatment.
The options wrap into separate shaped buttons when space is limited, including at
enlarged text sizes. No new client controller is introduced.

## Current primitive migrations

- `StartHereCard` composes the homepage's Reading slip recommendations with an
  unstyled Lumen `Card`, decorative `Icon`, and one native link. The site owns the
  responsive grid, optimized Astro cover images, complete editorial copy, numbered header, and focus treatment.
- About composes native profile, working-mode, and personal-photo sections around
  existing Lumen links, Stat articles, and the shared TestimonialCard. Its natural
  hero portrait uses matching Astro responsive sources, preload, and profile metadata.
- About's organization **Named index** uses Lumen `Button` with the public `ghost`
  variant. The site owns the ruled index and responsive card selection; native
  button activation, pressed state, focus preservation, and script-free cards remain intact.
- Organization **Contour backdrops** are site-owned CSS decoration around optimized
  Astro logos. They consume `getProjectBrandStyle` and the fixed logo-paper token;
  Lumen continues to own the existing selection controls and icons.
- About's **Linked counters** compose bare Lumen `Stat` articles with `Link` and
  decorative `Icon` source captions. Three desktop columns become ruled margin rows
  on narrower containers; links navigate natively to the Work timeline and matching Void.GG sections.
  The deployment figure uses the same documented 60% faster-deployments result as Work.
- About's **Practice links** retain the collaboration ledger and add Lumen `Link`
  and decorative `Icon` captions to each authored lane. The typed profile data owns
  the chapter destinations; native links work without JavaScript and keep the
  surrounding article passive.
- About's engineering-principle **Practice captions** use optional source data on
  the shared `PrincipleCard`, with Lumen `Link` and `Icon`. Only the editorial
  appearance renders the caption; the default DX-page cards retain their existing
  presentation. Profile data owns the six published article destinations.
- Articles and projects share `ReadingContents`, derived from Smith's approved Chapter
  groups and Captioned chapters. It composes Lumen `Anchor` and native `Collapsible`
  chapters from `getReadingChapters`; sections without children remain direct links.
  Colon-separated chapter names retain their captions and named overview links.
  `ReadingChapterOpener` embeds the same component without a second panel or title
  in its closed mobile disclosure. Both layouts use the same heading data and runtime;
  CSS exposes one navigation at a time. The former `TocCard` implementation is removed.
  The custom element follows Anchor's public `aria-current` marker to reveal the
  current chapter without computing another scroll position. It preserves manual
  choices and focus, opens incoming hashes, and cleans up on disconnection. Only
  inner chapter disclosures follow reading position; the outer mobile opener stays
  reader-controlled. A single chapter starts expanded, and native links and details
  remain usable without JavaScript. The version-pinned Anchor patch is documented below.
  The site's reading page boundary also sets `font-size: 1rem` explicitly: in WebKit,
  relying on inheritance left descendant layout stale
  after root text resizing during client navigation, shifting native fragment targets. This
  keeps the existing native links and Lumen marker synchronized without another controller.
  The site disables CSS transitions under the operating system's reduced-motion
  preference, matching Lumen's local motion preference. Its universal 1ms fallback
  otherwise starts inherited font-size transitions that WebKit can defer until a
  fragment jump. Chromium can also defer rem-based header and frame spacing after
  text resizing, shifting reading targets or separating joined frames. A single
  override in `base.css` keeps their geometry synchronized; remove it when the
  shared reset no longer creates these implicit transitions.
- The local `Pill` wrapper supplies project status labels to Lumen `Pill`. Linked topics
  and technology counts use `SculptedTag`; the retired hash-prefix and link props are removed.
- The Projects technology snapshot composes Connected stack from an unstyled Lumen
  `Card`, one `AnimatedNumber` total, native linked lists, and a Lumen `Link` with a
  decorative `Icon` in its footer. The heading and count explanation replace the outer
  introduction and duplicate index action. Personal-project and technology totals come
  from the published collection. Scoped container queries reflow the featured and
  supporting tools without another controller; existing fragments remain available.
- `PolicySections` composes Evidence rows from one unstyled Lumen `Card` and the
  existing `RevealGroup`, with semantic sections and level-two headings inside.
  Local container queries stack heading and copy without changing policy text or
  adding a controller. Privacy, Terms, and Accessibility share this composition.
- History chapters compose Stacked sheets from an unstyled Lumen `Card` for the
  introduction and the existing `ButtonLink` archive action. The authentic Astro
  images remain outside the card; container queries reflow its metadata and copy.
- Developer Experience shipped systems compose System folio from unstyled Lumen
  `Card` and `ButtonLink` components with decorative `Icon` labels and arrows.
  Local styles own the soft header, aligned action rows, and narrow-container reflow;
  every case-study destination remains a native link without another controller.
- Series navigation uses Continuation fold: the Directional folio precedes a closed
  native Lumen `Collapsible` containing the Reading index. The introduction retains
  the current/total position as text. A named native navigation landmark and ordered
  list retain complete titles, current-step semantics, and navigation without JavaScript.
  Directional folio uses a separate named native navigation landmark for adjacent
  article links, with decorative Lumen `Icon` arrows and responsive open columns.
- `ProjectCaseStudy` composes Margin chapters from an unstyled Lumen `Card`, `Icon`,
  and an ordered list with semantic chapter headings. Its scoped container queries
  retain complete narratives and optional chapters in narrow or enlarged-text layouts.
- `ProjectPreviews` composes Gallery sheet with an unstyled Lumen `Card` around a
  semantic figure. Lumen `Image` retains Astro optimization and complete screenshot
  proportions; the caption and decorative number reflow through scoped container queries.
  Contextual gallery is authored inside the project's MDX chapter with a Markdown h3
  slot so Astro collects its actual navigation position. The component reads validated
  collection preview data and preserves the legacy gallery fragment.
  `ProjectPreviewViewer` adapts project assets to the shared `GalleryViewer`, built with Lumen
  `Dialog`, `DialogTitle`, `DialogClose`, `Button`, and `ButtonLink`. Lumen owns native modal controls and focus
  return. The site custom element inserts an optimized full-size `Image` from an inert
  template, handles load/error states and keyboard detail panning, and aborts listeners
  on disconnection. The original-image link stays available until the public trigger
  binding is ready, preserving a useful no-JavaScript path. Modal shortcuts stay inside
  the viewer rather than opening site search above it.
  `ProjectComparison` reuses that viewer and its typed preview contract for Comparison
  spread. An unstyled Lumen `Card` groups two semantic figures with optimized `Image`
  captures. Scoped container queries stack the pair, and shared grid rows align their captions,
  images, and actions. MDX retains the existing comparison heading and source assets;
  no additional controller or comparison-slider runtime is introduced.
- `ProjectHeroDestinations` composes Destination brief with Lumen `Card`, `ButtonLink`, `Link`,
  and decorative `Icon`. The primary site is named, while repository, gallery, and browse links
  remain quiet secondary actions. Existing content URLs are retained; a gallery link requires
  both preview data and the matching rendered heading. Native links need no client controller.
- `ProjectContextExhibit` pairs authored Markdown with a semantic figure and Lumen `Image`.
  Context exhibit keeps concept artwork small, labelled, and uncropped beside the reading copy;
  container queries stack it after the copy on narrow layouts. The image remains optimized and
  lazy loaded. Keep the original Markdown chapter heading outside the component for navigation.
- `ProjectClientMasthead` uses a semantic header and the existing Markdown heading slot.
  Client masthead separates the client name from its descriptive subtitle without changing
  the full accessible heading or its generated fragment. The sequence label and fine rule
  introduce each client chapter. It uses shared semantic tokens and no client runtime.
- `ProjectContextLead` groups the notes label, current project stage, authored heading, and
  introduction in a semantic section. It reads the existing project metadata and requires
  `notesLayout: context-lead`, which removes the generic layout preface. Markdown retains
  the heading and inline link; shared tokens provide the open composition without client code.
  All project entries use this opening, retaining every authored introduction paragraph
  without a second generic preface. See [project detail patterns](editorial/project-detail-patterns.md).
  The project layout inserts a native definition list below the original heading,
  using the shared reading-time helper and rendered chapter outline. Context lead owns its
  Reading brief typography and semantic colors; this passive composition needs no new
  Lumen control, client script, or manually maintained per-project counts.
- `ProjectSectionHeading` wraps an authored Markdown h3 with Section cadence typography
  and a decorative trailing rule. Inline heading content stays in normal text flow; long
  labels wrap without changing their names or fragments. Adjacent narrative paragraphs
  use the reading scale, while composed gallery and evidence headings keep their own styles.
  All projects use this component for ordinary narrative subsections; Markdown headings
  remain the source for chapter links and native fragment navigation.
- `rehypeArticleHeadings` applies Section cadence to current article body h2 elements at
  build time. Native headings, generated fragments, and inline links remain intact;
  a span keeps formatted titles together beside a CSS rule. The article prose container
  adapts the typography and rule spacing. Natural headings removes the decorative rule
  below 32rem of prose width and uses manual hyphenation so mobile titles have room for
  whole words beside the existing copy control. `ArticleSectionReferences` adds Section reference
  by moving server-rendered Lumen `CopyButton` controls beside these headings. It uses the
  local article URL and existing fragments, including syndicated posts. Controls remain
  hidden without JavaScript; native headings and contents links still work. The shared
  runtime owns clipboard handling, success/error feedback, and announcements. Placement
  runs idempotently on Astro page loads without a second clipboard controller or runtime.
- `ProjectIntentBrief` presents project goals as a named native list with continuous
  statements and accent opening phrases. The site owns the open rules and responsive
  reading scale; the authored Section cadence heading remains the source of its name
  and fragment. Native Markdown list-item slots preserve inline code and links; the plain-text data
  form remains supported. No replacement Lumen control or client controller is added.
- `ProjectCapabilitySpread` and `ProjectCapabilityEntry` compose product capabilities
  as a named native list with open ruled entries, decorative numbers, and h4 labels.
  They preserve authored MDX descriptions and inline code, use semantic tokens, and stack
  below 35rem of available width. No Lumen control or client controller is needed for this
  passive editorial composition; professional responsibilities and results retain Ownership ledger.
- `ProjectArchitectureBrief` composes a named native adapter list and authored definition
  rows for project technical highlights. The adapter lead is optional; projects without
  adapters render only their authored definitions. Site-owned container queries stack the package
  names and notes below 35rem. It retains Section cadence and the existing chapter fragment;
  this passive composition adds no client controller or replacement Lumen primitive.
- `ProjectEvidenceBrief` groups authored qualifications with named external references in
  an open semantic section. Lumen `Link` supplies safe new-tab behavior and `Icon` supplies
  decorative arrows. Keep the reference URLs and qualifications in the project content;
  each native link name includes its visible title and description without redundant ARIA
  overrides. No controller or new chapter heading is added.
- `ProjectConsumerTrail` composes the website-use examples with public Lumen `Link` and
  decorative `Icon` components. Authored example names and descriptions point to real
  internal destinations through native same-tab links. Site-owned styles provide open
  ruled columns, responsive stacking, and visible focus. The original migration guide
  remains authored Markdown with safe external-link attributes; no controller is added.
- `ProjectPrincipleClose` composes Lumen's closing principle and three audience benefits
  as an open native list with h4 labels. Semantic accent tokens distinguish the policy
  sentence, and container queries stack the perspectives below 35rem. The authored
  Section cadence heading retains its fragment; no new controller or Lumen primitive
  is needed for this passive editorial composition. Other projects reuse the existing
  first sentence as their lead with authored prose in the slot, without inventing audience groups.
- `ProjectStoryPair` composes curated related writing with native article headings and Lumen
  `Link` and `Icon`. Equal insets and shared CSS grid rows align both entries; container queries
  stack them at narrow widths. A single eligible post fills the row, and no eligible posts
  produce no section. Explicit collection references preserve editorial intent, while the
  shared resolver excludes drafts and scheduled posts even in development.
- `ProjectReleaseNote` uses a prominent current-release lead and a sculpted pending-state
  note, with native Lumen links. Both states retain their authored availability qualifications;
  platform preparation and provider approval never become active publishing controls.
- `ProjectSynthesis` composes Synthesis spread with a named semantic section, a Markdown
  heading slot, and an open list of client perspectives. Container queries stack the
  perspectives before the shared takeaway. The original heading remains in chapter
  navigation; internal perspective labels do not add navigation entries or client code.
- Project timeline endpoints use separate native `time` elements. Hero-led project
  facts keep Role, Timeline, and Duration in the hero without a repeated sidebar dossier.
  Project sidebar card labels are level-two headings. `ProjectFocusCard` uses an unstyled
  Lumen `Card` and a semantic definition list for its Scope ledger composition.
  Its labeled work areas come from validated project frontmatter, without client code.
  Reading close places the single sidebar between the story and closing actions
  in source order. CSS Grid retains the desktop rail while stacked layouts read
  through Focus, Dispatch sleeve sharing, and Return folio navigation in sequence.
- `ProjectOutcomesCard` composes Impact rows with `Card`, `Icon`, and semantic lists,
  keeping original claims accessible. Chapter evidence places it once in the authored
  MDX chapter with a level-three heading and the legacy Outcomes fragment. It reads
  validated `impactMetrics` using `projectId`, with no sidebar copy or client relocation.
  Unified evidence keeps repeated claims in that single source; the optional `id`
  preserves a removed prose section's fragment alongside `#sidebar-outcomes`.
  Client caption keeps client attribution above the measured rows. Context trail
  uses inherit-style Lumen `Link` and decorative `Icon` inside a labeled native
  navigation region, with optional authored chapter fragments and no client script.
  Lumen reuses this trail for capabilities, technical highlights, and website examples,
  with its three existing fragments authored in MDX and native same-page navigation.
  Outcome chapter supplies Lumen's Markdown heading through the card's slot and
  `headingId`, allowing Astro's collected outline to populate both contents surfaces.
  The `#outcomes` heading labels the region; the wrapper retains `#sidebar-outcomes`.
  Other projects retain the default generated heading and existing fragments.
  Focus and Outcomes share small purple labels, right-aligned icons, and plain surfaces.
- Speaking, principle, testimonial, section-header, and project-sidebar surfaces use Lumen `Card`
  while retaining their site-specific composition and spacing.
- `ProjectTechnicalHighlights` composes Connected folio with unstyled Lumen `Card`, inherit-style
  `Link`, and decorative `Icon`. Authored Markdown headings preserve chapter navigation; grouped
  native links resolve canonical technology routes with per-project counts from cached content.
  Container queries reflow the ruled links without a client controller or extra navigation headings.
- Hero-only stack keeps `ProjectHeroStack` as the single project technology inventory.
  Its Lumen `Card`, `Link`, and `Collapsible` retain the Sculpted band and Progressive stack.
  The native disclosure supports keyboard input and works without JavaScript; projects with
  shorter stacks show their complete list directly. The former sidebar stack is omitted;
  its `#sidebar-stack` fragment now targets the hero, alongside the existing `#technologies`.
- Testimonial identities use Lumen `Avatar`; optimized Astro images remain slotted inside it.
- About recommendations reuse the existing unstyled Lumen `Card`, `Icon`, and
  `Avatar` through TestimonialCard. About-only styles create open two-column
  Reading rows that stack on narrow containers; complete quotes and author footers
  remain intact. The shared card and homepage keep their own presentations.
- About photos and recommendations use Lumen `RevealGroup` with the shared slow
  slide-up entrance, 90ms stagger, and explicit zero threshold. Reduced-motion
  and no-JavaScript content visibility remain owned by the existing Lumen runtime.
- Site-specific interface icons use Lumen `Icon` when Lucide provides the mark. Third-party brand
  logos remain on `astro-icon` because Lucide intentionally excludes brand assets.
- Reading layouts use Lumen `ScrollProgress` directly. Articles pass `targetId="article-content"`
  to measure the prose alone; project layouts retain document progress.
- `ProjectReplacementNotice.astro` composes Lumen `Callout`, inherit-style `Link`,
  and decorative `Icon` for the Successor spread notice in project MDX. The site
  owns its open context column, soft destination surface, responsive rules, and
  typography. The named aside preserves replacement guidance without adding
  article headings or client JavaScript.
- `ArticleUpdateNote.astro` composes Lumen `Callout` and `Icon` for dated article
  updates. The author supplies its title and Markdown body in MDX. Its labeled aside
  and native links work without JavaScript; ordinary Markdown blockquotes are unchanged.
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
  Tab folio uses nested CSS grids to share the tablist and copy toolbar row while keeping
  panel and figure semantics intact. The visible Copy/Copied/Copy failed labels and shell
  prompt are decorative CSS content; Lumen supplies the accessible names and announcements.
  Package-manager panels opt into the same Scroll cue as standalone code. The pinned
  Astro patch forwards the public `scrollCue` prop from `CodeTabs` to each `Code`;
  Markdown-generated groups reuse `createLumenScrollCue`. Lumen owns overflow detection,
  description IDs, hidden-panel updates, and navigation cleanup. Tabs refresh their
  cue visibility synchronously across selected and synchronized panels before scrolling.
  Fully visible triggers avoid an unnecessary native scroll transaction; clipped triggers
  retain native scrolling, including the root header clearance and clipping ancestors.
  Keyboard focus uses `preventScroll` so activation remains the single scrolling owner.
  Cue-bearing tab activation briefly suspends document scroll anchoring across the
  synchronized layout and two paint frames, then restores it. This prevents intermediate
  measurements from moving WebKit while retaining native scrolling for off-screen tabs.
  The shared five-row
  grid reserves optional recovery and cue rows without adding empty space.
  Narrow cards move the copy toolbar below the wrapping tabs. Script-free visits disable
  this grid and hide its headers so all commands remain readable in document order.
- Organization carousel controls use Lumen `Button` with `size="icon"` and `variant="secondary"`.
  The site retains its responsive pagination and focused-link visibility controller.
- Blog topic links delegate `aria-current="page"` through `SculptedTag` to Lumen `Link`,
  so the selected topic and All posts link expose their current-page state.
- The resume print stylesheet hides Lumen's `SkipLink` through its documented `data-slot`
  attribute (`[data-slot="skip-link"]`) rather than the private `.ui-skip-link` class Lumen
  happens to render it with.
- Resume Margin index uses public Lumen `Link` with `variant="inherit"` inside a named
  navigation landmark and ordered list. Decorative numbers stay out of accessible names;
  native fragment links reach the four existing sections without a controller. The index
  is screen-only and is excluded from both PDF variants.
- `ResumeEvidenceNote` composes Lumen `Link` and a decorative `Icon` for each role's
  canonical portfolio destination. Detailed roles place it inside their impact rail;
  earlier roles use its compact presentation below their description. Native links
  need no controller, and the entire note stays hidden in both print variants.
- Resume Linked skills uses Lumen `Link` for published technology archives, preserving
  the Capability ledger and the authored labels. Unmatched skills remain plain text.
  Screen links and comma-separated print paragraphs derive from the same skill lists;
  Languages stays passive. REST resolves to the existing REST APIs archive.

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
  outline. The **Search cover** panel inside Lumen's fullscreen `Dialog` is site-owned:
  a tinted heading and inset field compose the existing `SearchField`, `Button`, and `Icon`
  primitives without changing the search controller. Its rem-based container queries compact
  the chrome for narrow, short, or enlarged-text viewports while the results list stays the
  only scroll region.
  `SiteSearch.astro` imports its typed controller from `site-search.ts` through a processed Astro
  script. The bundled module owns one set of lifecycle listeners and one lazy index cache across
  page swaps. A successful response, including an empty index, is reused until a full document
  load; failures refetch on the next open or through Retry. Index validation, ranking, topic
  suggestions, and recent-search normalization (five searchable, case-insensitively unique
  queries) live in `src/utils/search.ts`.
  Completed requests render the current input, including when a visitor edits a deep-linked query
  before the index arrives. Back or Forward that changes only the fragment and the controller's own
  `q` closes an open dialog and restores trigger focus unless the destination carries a searchable
  `q`; other query or path changes stay with Astro. Clearing an absent `q` leaves the URL untouched.
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
  Standalone article examples add the site-owned `data-article-code-folio` hook:
  a soft toolbar, a Lumen `code-xml` icon from the public icon registry, visible
  `copy-idle`/`copy-copied`/`copy-error` slots, and decorative line numbers.
  The original Shiki code children and authored line-number offsets remain intact.
  The Husky article uses the same fenced-code pipeline for its four standalone
  examples; package-manager groups retain the real Astro `CodeTabs` component.
  Imported source uses the site-owned `ArticleCode` composition. It builds a literal
  code node and runs the same Pretty Code themes and `rehypeLumenCode` adapter at
  build time. This keeps the approved Code folio header and line numbers in one
  renderer while preserving the Lumen copy and scroll runtime. Source notation
  comments remain literal, filenames are escaped, and imported cue IDs are assigned
  by Lumen when the assembled page is enhanced. No new dependency or client script
  is added. Use this composition for standalone imported article examples; the real
  `Code` primitive remains available outside that site-owned editorial context.
  Long standalone article examples use Example fold: the shared adapter emits
  Lumen's native `data-ui-collapsible` disclosure contract with a 12-line preview
  above the 24-line threshold. Full source stays in the disclosure and Copy uses
  its explicit public `data-copy-value`, even when collapsed. Each complete/preview
  region uses its own `data-ui-scroll-cue` root, so Lumen observes the visible region
  after native expansion without a site controller. Preview clones omit IDs to
  avoid duplicate authored fragment targets. Short snippets and tabs are unchanged.
  `ArticleExampleFolds` adds the approved Fold return enhancement with Lumen
  `Button` and `Icon`: a bottom action closes its native disclosure and returns
  focus and scroll to the summary. It moves the existing cue into a shared footer,
  preserving Lumen's region and description binding. Initialization is idempotent
  on Astro navigation; the action is absent without JavaScript and hidden in print.
  `ArticleCodeRecovery` listens to the public `ui:copy-error` and `ui:copy-success`
  events on article Code folios and package-manager tabs. It uses Lumen Button/Icon for a manual
  selection fallback, retaining Lumen's clipboard operation and timed feedback.
  Native Range selection covers the complete highlighted source; opening folded
  examples and returning focus are site-owned composition. The recovery persists
  until a successful retry or navigation. Package-manager tabs also clear recovery
  on the public `ui:tabs-change` event, including synchronized groups, and ignore
  delayed failures from hidden panels. Both Astro and Markdown-generated tabs reuse
  this controller and template. Project code remains outside the article scope.
  Scroll cue uses Lumen's shared `data-ui-scroll-cue` contract inside each standalone
  article figure. The runtime observes the existing code region and content, showing a
  footer and accessible description only on horizontal overflow. It cleans up on Astro
  navigation and preserves other descriptions. The website's custom element is removed;
  Lumen owns overflow guidance, copy, and code tabs.
- Project prose lists use Ownership ledger. `rehype-project-ledger.ts` separates an authored
  leading `strong` from its explanation at build time, preserving links, code, nested lists,
  ordered-list metadata, and plain or fully emphasized entries. Only project content receives
  the project composition; native list semantics remain intact without client JavaScript. Root lists
  use neutral dividers and purple lead rules, with a single column when reading space is narrow.
- Article **Checklist ledger** reuses the project ledger composer and shared prose styles.
  `rehype-article-checklists.ts` applies it only to labeled lists inside checklist sections;
  ordinary article lists retain List rhythm. Native numbering, authored content, nested lists,
  and paragraph structure remain intact, with no component runtime or new dependency.
- `PostHero` uses Reading imprint for article publication details: two native description
  lists group the published and optional updated dates beside reading time and word count.
  The existing `FormattedDate` wrapper preserves Lumen's native `time` output. Site-owned
  attributes and semantic tokens handle the responsive margin rules without a card
  primitive or client script. The groups stay side by side on phones and stack below
  16rem of available width for enlarged text. `ProjectHero` retains Margin imprint
  for its role, timeline, and duration, keeping the existing `ProjectTimeline` native
  dates and duration helper. Its wider role column and project-specific container
  breakpoints preserve long role names.
- Article Topics use the site-owned Margin topics composition: a named native `nav`,
  semantic list, public inherit-style `Link`, and decorative `Icon` primitives. Scoped
  container queries reflow complete topic labels and arrows while retaining their order,
  canonical archives, keyboard outlines, theme colors, and no-JavaScript navigation.
- Article hero actions use Series byline: the existing series context supplies its
  position and linked title, paired with a quiet public `CopyButton` in link style.
  Standalone articles keep only the copy action; syndicated articles retain their
  original Medium destination through an inherit-style `Link` with `newTab`.
  Site-owned rules provide the open row, responsive stack, and keyboard outlines.
  Lumen still owns clipboard feedback and the existing no-script rule hides inert
  copy controls. The Blog breadcrumb provides the archive destination.
- `SeriesNavigator` uses Series close when there is no next published chapter:
  a latest-chapter heading, linked series title, and compact previous-chapter row
  precede the existing Lumen `Collapsible` chapter index and series overview link.
  A single-chapter series omits the previous row and earlier-chapter invitation.
  First and middle chapters retain Continuation fold. The shared component owns
  the responsive typography and dividers using semantic tokens; no client script,
  completion tracking, or separate navigation component is added.
- `ProjectHeroStack` composes Sculpted band with public unstyled `Card`, inherit-style
  `Link`, and `Icon` primitives. The site owns the ink margin, wrapping technology list,
  semantic-token colors, responsive insets, and project-colored hover/focus states.
  All sorted technology links and the existing anchor remain available without JavaScript.
- `ContentNotesHeader` uses the site-owned Margin preface composition: an open label
  and type margin beside a description rail. Plain metadata replaces the former Pill;
  no interactive primitive or additional card surface is needed. Lumen semantic tokens
  keep the rules and text consistent on project reading pages without Context lead.
- Article openings use the site-owned Margin lead composition with a plain format
  label beside the authored first paragraph. A build-time Markdown transform preserves
  inline markup and preceding update notes; scoped container queries stack the margin
  on narrow screens. Semantic tokens provide the rail and text colors. This passive
  composition needs no interactive primitive, card surface, or client controller.
- Article opening references use **Reference ledger**. Before Margin lead runs,
  `rehype-article-references.ts` groups explicitly labeled, standalone Related post,
  GitHub Repository, and Previous post links before the first chapter. It retains
  the original anchors, destinations, and external-link attributes. Repository
  names come from their existing GitHub URLs; no URL is invented or redirected.
  Lumen's public icon data supplies decorative waypoints and direction arrows.
  The article layout owns the responsive rows and semantic colors, with no client
  script or additional card surface. Inline links, annotated or formatted links,
  chapter references, and unmarked closing links stay in their authored positions. Margin
  lead skips standalone link paragraphs so the actual introduction receives emphasis.
  **Series connection** reuses that same renderer and article-scoped CSS for a final
  standalone Related series link. Its Markdown link title supplies the series name;
  the closing row says Another series under Related reading, while Continuation fold
  keeps the actual next chapter. This adds no component, controller, or duplicated style.
- `ProjectFooterNav` composes Return folio with public unstyled `Card`, inherit-style
  `Link`, and decorative `Icon` components. A native named navigation landmark keeps
  parent, top, named website, preview chapter, and repository destinations available without JavaScript.
  Named return shares destination naming with the hero through `getProjectPrimaryDestination`,
  including archived websites. Both use the same rendered-chapter guard for preview links.
  Site-owned attributes style the surface and responsive rows; `Link` supplies safe
  external new-tab attributes. Empty destination footers are omitted.
  Optional project `closingLinks` add external resources after the primary destination and
  select Unified return's compact header and responsive link grid. Lumen moves its existing
  playground link here and removes the repeated narrative CTA; standard project and article
  variants retain their existing output. No controller is added.
- Archive `Pagination` composes Split pager with public `Pagination`, inherit-style
  `Link`, unstyled `ButtonLink`, and decorative `Icon` components. Site-owned data
  attributes provide the ruled layout, circular numbers, and prominent next action.
  Native URLs, `aria-current`, previous/next relationships, endpoint placeholders,
  and the existing page-gap utility remain intact without client JavaScript.
- `ShareButtons` composes Dispatch sleeve with Lumen `Card`, `Button`, and `Icon`:
  an invitation beside the main action and three native social links in a tinted footer.
  It keeps native sharing on supported coarse-pointer devices and clipboard copying
  elsewhere. Its visible label and accessible name say "Share link" for native sharing and
  "Copy link" for clipboard-only use. Cancellation preserves the idle label; fallback feedback
  returns to the label for the available action. Only one share or copy may run at a time;
  keyboard focus remains on the busy control, and leaving the article cancels its pending
  fallback and feedback. A separate live status announces results and manual-copy recovery
  without announcing the idle label when the button resets. The visible label and icons change
  at once, while the status is emptied and receives the result 100 ms later in a separate task,
  so a repeated identical result is never restored in the same task that cleared it.
- With JavaScript disabled, the document-head `noscript` stylesheet exposes every package-manager
  command and hides the unavailable tab, prose-copy, and Copy/Share link controls. Native contents links and social
  share links remain available. The fallback reuses the existing code panels; scripted visits keep
  Lumen's normal tabs, saved preference, and copy behavior.
- `src/plugins/rehype-readable-tables.ts` wraps Markdown tables in Lumen's `ui-table-wrap`
  surface (`data-slot="table"`). The native table and its headings remain intact inside a
  focusable region named from its caption or preceding heading. This lets keyboard users scroll
  wide tables in Safari as well as Chromium without client JavaScript. Table folio adds an
  opaque surface, asymmetric corners, a soft brand header, and a lightly tinted first column
  through the existing `data-prose-table` hook. Body cells wrap with a
  12-character minimum width, keeping explanatory sentences readable. Compact insets and wrapping
  headers below 18rem of container width keep complete cells readable with enlarged text.
  The four-column measurement table fits the desktop reading column and retains horizontal scrolling
  on narrow screens. Article tables opt into the same Lumen Scroll cue controller as
  code examples: a stationary “Scroll horizontally to compare” strip above the named
  viewport appears only while columns overflow. Project tables retain their existing markup.
  The opt-in Astro `Code`/`Table` API and runtime are tracked upstream for Lumen 4.4.0;
  the version-pinned 4.1.0 patch carries this additive change until publication. The cue
  stays hidden without JavaScript, leaving native table semantics and keyboard scrolling.
  Its resize observer schedules cue updates in the next animation frame so showing
  the message cannot resize its observed viewport during delivery. Cancel pending
  frames on cleanup; this avoids WebKit resize-loop warnings when text or width changes.
  Anchored comparison keeps the article table's first column at the inline start during
  horizontal scrolling, using opaque cells and the existing first-column tint. Separate
  cell borders travel with the pinned labels. Below 12rem of table space (including enlarged
  text), labels scroll with the values so the pinned column cannot crowd out the viewport.
  This is article styling; project tables and the shared Lumen component stay unchanged.
  `tests/article-table-scroll-cue.spec.ts` covers resize, themes, text zoom, and navigation.
  `tests/legacy-article-content.spec.ts` checks normal and enlarged text.
  Prose styles use site ink tokens for cells and Lumen's code foreground token for language badges in both themes.
- Article endings use Reader colophon. `CommentsSection` owns a semantic heading and
  open margin layout with a decorative Lumen `Icon` on its native GitHub reply link.
  Discussion fold reuses Lumen `Collapsible` inside the invitation: opening it loads
  Giscus, while scrolling past or focusing the summary does not. Closing preserves
  the widget and its draft; reopening does not load a second client. Direct `#comments`
  entry and client navigation open the fold. The existing controller retains theme
  synchronization and polite load errors, with a loading status until the widget
  signals readiness. The native GitHub link and no-script guidance remain available.
  Its mount aligns with the discussion column. Webmentions keep
  their existing conditional rendering between comments and sharing. The `colophon`
  variants of `ShareButtons` and `ProjectFooterNav` reuse their Lumen primitives,
  controllers, and destinations with open rules and inline actions. Project pages
  retain the default Dispatch sleeve and Return folio variants. The article layout
  places `ProjectFooterNav` after optional related writing as Final return, preserving
  one native page-end navigation landmark. No additional client
  behavior or external service is introduced.
- The share toolbar (see above) keeps its own controller for the native share-sheet fallback.
- Related writing uses `SectionHeader`'s `margin` variant (Margin continuation) inside
  a stacked `PageSection`. Native heading and paragraph markup provide the margin label
  and ruled copy; the existing Lumen-backed `ButtonLink` supplies the browse action.
  `RelatedPosts` owns the conditional section wrapper so empty recommendations leave
  no section spacing. **Fresh recommendations** retains the shared-tag/date ranking,
  series exclusions, two-card gallery, and contextual destination. The existing article
  reference transform exports only the recommendations it renders in Reference ledger
  or Series connection. Related writing excludes those destinations before taking two
  results, matching local post paths and declared canonical URLs without query strings
  or fragments. Ordinary prose links remain eligible. Drafts and scheduled posts stay
  excluded even during development; fewer eligible posts produce fewer cards, with no
  unrelated fallback. Project headers retain the separate approved `shelf` variant.

## Anchor runtime patch

The installed `@santi020k/lumen-astro` 4.1.0 runtime marks an `Anchor` heading current only when
its top reaches the numeric `activationOffset` in CSS pixels. Native fragment navigation lands the
heading at the root `scroll-padding-top` (`7em` on `<html>`, equal to 7rem; WebKit can resolve a
root `rem` value here against the default font size), which grows with root text size. With enlarged
text the destination therefore landed below the threshold and the marker stayed on the previous
section. Browser zoom was unaffected because it scales pixels and rems together.

The [version-pinned pnpm patch](../patches/@santi020k__lumen-astro@4.1.0.patch), registered under
`patchedDependencies`, updates
`runtime/controllers/document-navigation.ts` and documents the behavior in its README. The runtime treats a heading as
current once it reaches the greater of `activationOffset` and the native landing line, computed
from the owning window's root `scroll-padding-top` plus the heading's `scroll-margin-top`, within
one CSS pixel. Percentage scroll padding resolves against the scrolling element's height; `auto`
and unresolved values count as zero, and the offset is never negative or non-finite. The public
`Anchor` API, native fragment links, page-lifecycle initialization, and listeners are unchanged,
and the site adds no second scroll-spy or client bridge. Lumen still owns the behavior.

Do not compensate with negative heading `scroll-margin-top`: at 200% text it would place headings
under the sticky header. Remove the Anchor portion of the patch when a published `lumen-astro` release provides the same
landing-line activation. If `lumen-astro` changes version first, regenerate the version-specific
patch with `pnpm patch` and update its registration before validating the upgrade. Verify with the enlarged fragment-navigation and
text-size marker cases in `tests/responsive-reading.spec.ts`.

## Article prose typography

Direct article lists use List rhythm: the same responsive text size and relaxed
line height as paragraphs. Nested items inherit the scale. Native lists, numbering,
links, inline code, and component compositions remain intact without new markup.

Direct article h3 elements use Subsection cadence through the prose stylesheet:
smaller, medium-weight headings with spacing that keeps them attached to their
content. The existing article container controls the narrow layout. Native
fragments and the shared reading navigation remain intact without a transform.

Article inline code uses Code accent: the site's existing `font-code` token with
the established purple treatment. This article-scoped prose rule leaves Lumen's
fenced code and package-manager tab components unchanged.

Article composition also applies Reading measure through the site's prose styles:
top-level paragraphs and lists have a 40rem maximum inline size. Lumen code and table
surfaces, approved editorial treatments, and the reading layout retain their existing
space. This is a scoped typography rule, without a new component or runtime behavior.

## Article progress runtime patch

Article progress preserves the existing Lumen indicator and its accessible value. The
version-pinned `lumen-astro` patch adds an optional `targetId` prop and measurement inside
the existing document-navigation controller. `Post.astro` targets only the authored prose,
excluding the hero, series navigation, comments, sharing, recommendations, and footer.

Progress begins when the prose reaches the root scroll-padding landing line and reaches
100% when the final line enters the viewport. A short article becomes complete once fully
visible; an empty target remains at zero. An absent or unresolved target preserves document
progress. Scroll, viewport resizing, font and content reflow update the same indicator;
resize observation reconnects after Astro navigation and disconnects before a page swap.

Remove this portion of the patch when a published Lumen release supports the same scoped
measurement contract. `tests/article-progress.spec.ts` covers completion, scrolling back,
enlarged text, both themes, reflow, short/empty content, client navigation, restored history,
and document fallback. No site-owned parallel scroll controller is introduced.

## Article quotations

Article blockquotes use Margin quotation through `rehype-article-quotes.ts`.
The build-time plugin retains the native blockquote and all authored children,
adds a decorative icon through Lumen core's public `getLumenIcon` API, and exposes
site-owned layout hooks for the margin and text rail. It only transforms current
article content, including nested quotes; project and archived prose keep their
existing treatment. It is idempotent and adds no client runtime. The site owns
the scoped responsive composition, while Lumen supplies the quote artwork.

## Article illustration captions

`rehype-article-figures.ts` runs after image unwrapping in the current site's Markdown pipeline.
It converts standalone article images with an authored Markdown title into native Caption spread
figures, retaining the same image node for Astro's asset transform. The title becomes a plain-text
caption, not an HTML string or tooltip. Descriptive alt text remains separate. Figure labels are
numbered per article; the decorative large number is hidden from assistive technology.
The site owns this editorial composition in `prose.css`. Inline images, linked images, existing
figures, project content and archives keep their own composition.

The same transform supplies ordered `articleFigureCaptions` in Astro's render metadata. The article
route validates that list and `ArticleFigureViewers` renders shared `GalleryViewer` instances outside
the prose, then places their existing controls below each caption. This lets the single Lumen runtime
bind before or after placement, without cloned controls or a second modal implementation. Gallery
viewer uses the same dialog, fit/detail controls, keyboard handling, load/error states, and focus
return as project previews. On demand it clones the already optimized article image, preserving its
source and alternative text; it does not request a separate image rendition or replace the inline asset.
Without JavaScript, the complete Caption spread illustration remains readable and inactive controls
stay hidden. Project viewers retain their direct-image fallback links and full-size inert templates.

## Article and project cover composition

`CoverSpread` owns the shared editorial grid used by `PostHero` and `ProjectHero`.
Landscape article artwork and project covers opt into the local
`HoverableCover` wrapper's `unstyled` prop, which removes only the wrapper's rounded frame
and shadow; Astro still supplies native dimensions, AVIF/WebP sources, loading priority,
and article view transitions. Project covers remain unnamed transition regions and preserve
their native aspect ratio. Square and portrait articles retain Lumen's contained `CoverImage`.
The default wrapper remains unchanged. No new client runtime is needed.

Route snapshot styling lives in `view-transitions.css`. Astro keeps its existing
navigation lifecycle and named article covers; the site uses Lumen's public
`--ui-ease-emphasized` token for snapshot movement. Destination documents receive
`data-client-navigation` before the swap to suppress duplicate hero entrances and
the header logo's public draw/pop/reveal hooks. First-load animations remain intact.
The header DOM still updates on every route, keeping active links, responsive
menus, and search controllers current. It is not a persisted component.

## Synchronized code tabs patch

The version-pinned Astro patch also keeps package-manager preferences synchronized without
scrolling the reader to another code block. Each bound tab group registers a passive activation
callback in a weak map. Reader input retains normal scrolling, keyboard focus, storage writes,
and synchronization; passive updates change selection and emit `ui:tabs-change` without scrolling
or propagating another update. Initial selection stays silent. Native disabled controls remain
unselected, and blocked storage does not prevent selection or synchronization.

`tests/package-manager-scroll.spec.ts` covers separated groups in both directions, pointer and
keyboard input, event counts, reload persistence, blocked storage, mobile and desktop layouts,
and both motion preferences. Remove this hunk once a published Astro adapter includes equivalent
behavior, then rerun these regressions and the existing Lumen interaction suites. This is a local
consumer patch; it does not establish an upstream release or issue submission.

## Cover image fallback patch

The same version-pinned patch exposes Astro Picture's typed `fallbackFormat` option on
`CoverImage`. Current-site project galleries and detail covers select `fallbackFormat="webp"`,
keeping AVIF sources while replacing the much larger PNG fallback. The redundant WebP source is
omitted because the fallback already supplies its responsive WebP `srcset`. The default remains
unchanged for the historical sites, which share this dependency.

Remove this addition once a published Lumen release supports the same option. Keep the Anchor
fix until its own upstream replacement is available. The isolated render regression in
`scripts/js/__tests__/cover-image-render.test.ts` checks both the opt-in and default output;
`tests/site-resources.spec.ts` checks the current-site image responses.

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
limited to Anchor behavior, synchronized code tabs, and the image option; there is no motion runtime patch.

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
- Homepage Lumen and PostLens captures use `DeviceFrame` with Astro's optimized images and static
  screens without visible captions. Development and illustrative-data disclosures stay in the case studies.
  The existing Void screenshot retains its device frame in the case study. Illustrations such as Smith's commerce artwork
  remain unframed because they do not represent actual product screens.
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
Its Map folio groups the original native picker and zoom controls inside the same map root,
using a Lumen Card shell and decorative Icons. The website controls layout and DOM order;
Lumen retains the existing nodes, event handlers, live zoom status, and selection behavior.
The application initializer groups them once per page, preserving View Transition cleanup.

The registry rollout updates the catalog entries together and retains exact release-age
exceptions for the installed `lumen` 4.2.0, `lumen-astro` 4.1.0, and `lumen-core` 4.1.0 packages
under the existing supply-chain policy. The lockfile
contains registry resolutions, and CV downloads are regenerated from the resulting build.
Run the migration audit, website gates, Playwright interactions, and mobile / desktop visual
checks after future upgrades. Use the website's Changesets process in `docs/deployment.md`;
reverting the coordinated dependency and consumer changes together is the rollback.

## Consumer styling cleanup

The local `ui.css` layer retains six source-used utility definitions, including the
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
