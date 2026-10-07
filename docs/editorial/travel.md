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
Selecting a country opens a compact place note; visitors can browse the next country, close the
note, or press Escape. Closing clears the selection so the same country can be opened again.
The country selector appears on keyboard focus, while the duplicate highlighted-country list is
hidden. On narrow screens, the map scrolls horizontally and reveals off-screen selections.
The story, notebook, and forthcoming stories share the hero’s 72rem alignment, thin rules, and
quiet canvas. Country entries use plain rows with inline visit labels rather than nested cards.
The full country notebook sits in a native Lumen disclosure and remains usable without JavaScript.
Browsing order is the data order, not a claimed travel timeline.

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
catalog entries and registry lockfile pin the published 4.0.0 packages. Normal development
and validation use the committed registry dependencies; local tarball paths must never
enter a deployment or commit. Regenerate the CV PDFs and rerun the website gates whenever
the coordinated packages change.

Verify map selection, keyboard zoom, navigation away and back, narrow layouts, themes, and draft
exclusion using `tests/travel.spec.ts`. Country details remain readable without JavaScript.

Rollback the website release through the established deployment workflow, or revert the travel
page, navigation, and metadata together. Draft source files can remain unpublished independently.
