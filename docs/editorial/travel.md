# Travel notebook

The `/travel/` page uses the destinations and country visit counts supplied by Santiago on
October 6, 2026, with Colombia's places and personal notes added from his answers on November 9, 2026.
Edit `src/data/travel.ts` for country names, places, visits, and residence labels.
Edit `src/components/pages/travel/TravelMap.astro` for the hero copy and
`src/pages/travel.astro` for the personal story.

There are 14 countries visited outside Colombia and 29 country visits. Colombia is the home
country, with no invented visit count. Medellín is where Santiago lives; Colombia's place list is
explicitly partial. Paraguay has seven visits and a separate residence label.
Mexico's list is explicitly partial. Patagonia remains a region. Columbus and Iguazu retain the
names supplied without inferring a state, exact city, or coordinates. The map highlights countries;
it does not imply that a country-level count applies to each city.

Dates, trip order, lengths of stay, photos, and claims about working in particular countries have
not been supplied. Add these only when confirmed. The current page is a geographic notebook rather
than a chronological itinerary.

## Country pages and personal scores

Each notebook entry has a page at `/travel/<country>/` and the matching Spanish interface at
`/es/travel/<country>/`. The country links in the travel notebook open these pages. Confirmed places,
visit counts, and home or residence labels still come from `src/data/travel.ts`; do not copy those
facts into the country files. The files below hold only Santiago's personal experience.

Edit the Markdown source files to fill the notebook. There is no browser form or account to save
changes. Use this checklist to open a country's file, add the details you remember, and preview
the result with `pnpm run dev`:

- [x] [Colombia](../../src/content/country/colombia.md)
- [ ] [United States](../../src/content/country/united-states.md)
- [ ] [Mexico](../../src/content/country/mexico.md)
- [ ] [Guatemala](../../src/content/country/guatemala.md)
- [ ] [Panama](../../src/content/country/panama.md)
- [ ] [Ecuador](../../src/content/country/ecuador.md)
- [ ] [Peru](../../src/content/country/peru.md)
- [ ] [Brazil](../../src/content/country/brazil.md)
- [ ] [Chile](../../src/content/country/chile.md)
- [ ] [Paraguay](../../src/content/country/paraguay.md)
- [ ] [Uruguay](../../src/content/country/uruguay.md)
- [ ] [Argentina](../../src/content/country/argentina.md)
- [ ] [Spain](../../src/content/country/spain.md)
- [ ] [France](../../src/content/country/france.md)
- [ ] [Japan](../../src/content/country/japan.md)

Personal fields start unanswered and are filled from Santiago's own answers. The shared schema in `src/data/travel-notes-schema.ts`
validates both the Astro `country` collection and `pnpm run lint:content`.

| Field | What to fill in |
| --- | --- |
| `code` | Keep the existing country code. It must match an entry in `src/data/travel.ts`. |
| `score` | Your experience, from `0` to `10`; decimals such as `8.5` are allowed. Leave `null` until scored. Zero is a real score, not an empty answer. |
| `summary` | A short personal explanation of the score or what stayed with you. Leave `''` until written. |
| `visitedWhen` | Optional context in your own words, such as a remembered month or several trips. Leave `''` when unknown; do not infer dates from visit counts. |
| `highlights` | A YAML list of your highlights. Keep `[]` until you have something to add; each item must contain text. |
| `wouldReturn` | `yes`, `maybe`, or `no`; leave `null` when unanswered. These display as a personal return preference. |
| `language` | `en` or `es`, matching the language of your summary, highlights, visit context, and narrative. |

Write longer notes in Markdown after the closing `---`, replacing the authoring comment. Use
third-level headings for sections beneath the page’s notes heading. Scores describe your own experience of the visits; they are
not an objective assessment of an entire country. Keep unanswered details blank instead of
creating sample experiences, dates, photographs, or a return preference.

The page controls and country facts follow the selected interface language. Your authored notes
retain their declared language; changing the interface does not translate or duplicate them.
Pages without a personal summary remain reachable from the notebook but use `noindex, follow`
and stay outside the sitemap. Once the summary is written, only the route matching `language`
becomes indexable; its other-language interface remains `noindex, follow`. Country notes do not
enter the blog feeds, the article body search index, or the existing title-only travel drafts.
Run `pnpm run generate:og` after adding a summary or changing its language to refresh the country's
share image and route metadata. The normal build also runs this generator automatically.
These files are public-site source, not private drafts: `noindex` controls search discovery,
not access. Changes appear on the deployed site only through its normal release workflow.

## Map hero interaction

The dotted Lumen map spans the full viewport width as the page hero, with the same quiet canvas,
typography, signature eyebrow, and thin rules as the home hero and sculpted navigation.
The map comes first, directly below the navigation, and extends to both page edges.
The title, introduction, and visit counts follow beneath it, aligned with the navigation.
Its country picker, zoom level, and zoom/reset controls share a Map folio below the map:
an opaque sheet with a large underlined native selector and a softly tinted control row.
The sheet aligns with the page content, stays compact on desktop, and fills the available
width on phones. The reset action moves to a separate ruled row when space is limited.
The hero totals use Margin totals: two ruled definition rows beside an accent margin,
with labels on the left and larger values on the right. The counts remain derived from
the notebook data, and the row gap tightens for narrow or enlarged-text layouts.
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
The native country selector comes before the zoom buttons in reading and keyboard order.
The existing Lumen nodes are grouped inside their original map root; selection, zoom state,
announcements, and navigation cleanup remain owned by Lumen. Its first group
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
Its Index fold opener pairs the derived country count with an accent rail, a larger “countries”
label, and the supporting line. The full sentence remains the accessible name. At narrow or
enlarged-text widths, the copy stacks beneath the count; Enter and Space toggle the complete notebook.
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

The page uses Lumen 5's public `WorldMap` component and
`@santi020k/lumen-core/world-map-data` export. The coordinated Astro, core, and umbrella
catalog entries and registry lockfile pin the three current-site packages to 5.0.0. Normal development
and validation use the committed registry dependencies; local tarball paths must never
enter a deployment or commit. Regenerate the CV PDFs and rerun the website gates whenever
the coordinated packages change.

Verify map selection, keyboard zoom, navigation away and back, narrow layouts, themes, and draft
exclusion using `tests/travel.spec.ts`. Country details remain readable without JavaScript.

Rollback the website release through the established deployment workflow, or revert the travel
page, navigation, and metadata together. Draft source files can remain unpublished independently.
