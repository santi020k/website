# Travel notebook

The `/travel/` page uses the destinations and country visit counts supplied by Santiago on
October 6, 2026. Edit `src/data/travel.ts` for country names, places, visits, and residence labels.
Edit `src/components/pages/travel/TravelMap.astro` for the hero copy and
`src/pages/travel.astro` for the personal story.

There are 14 countries visited outside Colombia and 29 country visits. Colombia is the home
country, with no invented visit count. Paraguay has seven visits and a separate residence label.
Mexico's list is explicitly partial. Patagonia remains a region. Columbus and Iguazu retain the
names supplied without inferring a state, exact city, or coordinates. The map highlights countries;
it does not imply that a country-level count applies to each city.

Dates, trip order, lengths of stay, photos, and claims about working in particular countries have
not been supplied. Add these only when confirmed. The current page is a geographic notebook rather
than a chronological itinerary.

## Map hero interaction

The dotted Lumen map spans the full viewport width as the page hero, with the same quiet canvas,
typography, signature eyebrow, and thin rules as the home hero and sculpted navigation.
The map comes first, directly below the navigation, and extends to both page edges.
The title, introduction, and visit counts follow beneath it, aligned with the navigation.
Its zoom and reset controls sit inside the map.
Selecting a country opens a Passport folio card: a soft brand-colored cover pairs the country
name and code with its real silhouette; the body separates a prominent visit count from numbered,
ruled place rows. Numbers identify notebook entries, not trip order. Home and unlisted countries
use descriptive labels without invented counts. Residence context stays in the cover and the
accessible visit label. Partial-list and region notes remain visible beneath the places.
Desktop cards use the opposite side of the map from the selected country.
The silhouette reuses the selected country geometry; no city coordinates or travel details are inferred.
Visitors can browse in either direction, with the next country named in the card and both controls
naming their destination for assistive technology. Closing or pressing Escape clears the selection
so the same country can be opened again. Closing a phone card returns focus and the page to the
map while preserving its zoom and horizontal position.
The native country selector is visible below the map for touch and keyboard use. Its first group
contains the 15 notebook entries in data order, followed by the other countries. The duplicate
highlighted-country list is hidden. On phones, the map fills a taller viewport with proportionally larger geography, starts
around Colombia, and scrolls horizontally to reveal off-screen selections. The card follows the map
in the page flow, keeping the selected country and zoom controls unobstructed. Pointer selection
reveals the card; keyboard selection retains focus in the chooser. Enlarged text also moves the
card below the map when space is limited.
The story, notebook, and forthcoming stories share the hero’s 72rem alignment.
The Roots & returns story uses Origin spread: one opaque surface with a full-width heading,
a larger opening paragraph, and the remaining copy beside an accent rail. Narrow layouts
stack the paragraphs and turn the rail into a horizontal rule. Keep all three paragraphs
in their original reading order, with the supplied country and residence details intact.
The notebook retains thin rules and a quiet canvas. Country entries use Journey ledger:
a narrow country-code margin, larger names, separate visit labels, and fine rules.
Places retain their complete names in wrapping lists;
home, residence, partial-list, and region notes remain explicit. The margin tightens as the
notebook narrows and stacks above the entry for enlarged text or very narrow layouts.
The full country notebook sits in a native Lumen disclosure and remains usable without JavaScript.
Browsing order is the data order, not a claimed travel timeline.

The forthcoming stories invitation uses Story sleeve: a tinted heading cover above an opaque
body, with the existing copy and a separate, ruled blog link. The link moves below the copy
on narrow layouts and remains keyboard accessible without JavaScript. Keep the promise of
future stories and the `/blog/` destination; this invitation does not publish the travel drafts.

## Title-only drafts

These files contain no article body or artwork. Their descriptions repeat the working title to
satisfy the existing content schema. The provisional date is the draft creation date, not a
publication schedule. Keep `draft: true` until the content, cover, metadata, and publication date
are ready. Production excludes drafts from routes, search, feeds, and sitemaps; development includes
them for editing.

- `src/content/post/2026/how-i-became-a-digital-nomad/index.md`
- `src/content/post/2026/working-from-a-city-everyday-life/index.md`
- `src/content/post/2026/what-i-wish-i-had-known-before-working-while-traveling/index.md`
- `src/content/post/2026/the-place-i-keep-thinking-about-and-why/index.md`
- `src/content/post/2026/how-traveling-changed-what-i-want-from-everyday-life/index.md`

The city placeholder is intentional. Select the destination when writing that article. Content
lint permits an absent cover only for an empty, explicitly marked draft; written drafts and
published posts still require a valid cover.

## Map dependency and release boundary

The page uses Lumen 4's public `WorldMap` component and
`@santi020k/lumen-core/world-map-data` export. The coordinated Astro, core, and umbrella
catalog entries and registry lockfile pin `lumen` 4.2.0 and the Astro/core 4.1.0 packages. Normal development
and validation use the committed registry dependencies; local tarball paths must never
enter a deployment or commit. Regenerate the CV PDFs and rerun the website gates whenever
the coordinated packages change.

Verify map selection, keyboard zoom, navigation away and back, narrow layouts, themes, and draft
exclusion using `tests/travel.spec.ts`. Country details remain readable without JavaScript.

Rollback the website release through the established deployment workflow, or revert the travel
page, navigation, and metadata together. Draft source files can remain unpublished independently.
