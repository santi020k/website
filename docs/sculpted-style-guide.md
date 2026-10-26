# Sculpted website style guide

The redesign starts with the sculpted navbar, the new Home hero, and the homepage sections.
The integrated navbar, Home, and footer are the shared visual authority. Supporting and reading
routes now follow this direction through an explicit scope; prose and resume print rules remain separate.

## Character

Quiet, precise, and personal. Let the work, typography, and generous spacing carry the page.
Use a single expressive image in the hero and real project imagery in the content. Purple is
an accent for identity and interaction. Keep the reading canvas calm.

- Align the hero, section headings, project rows, and writing to one grid.
- Give each section a distinct composition without inventing another visual language.
- Prefer open space and fine rules to repeated cards.
- Use one surface for each content group. Do not nest decorative cards inside cards.
- Keep copy direct and grounded in the actual work. Derive projects and articles from collections.

## Typography

Keep the existing, locally served Montserrat variable font from `@santi020k/theme`.
Use weight and scale for hierarchy, with sentence case for headings.

| Role | Size | Weight | Treatment |
| --- | --- | --- | --- |
| Home hero | Responsive, up to 5.5rem | 600 | Tight tracking, 1.02 line height |
| Section heading | 2.25–3.75rem | 500 | −0.065em tracking, 1.08 line height |
| Project title | 1.5–2rem | 500 | −0.055em tracking |
| Article title | 1.125–1.5rem | 500 | 1.4 line height; show the complete title |
| Body and descriptions | 0.875–0.9375rem | 400 | 1.8–1.85 line height |
| Compact supporting copy | 0.75–0.8125rem | 400 | Reserve for stats and secondary information |
| Metadata | 0.625–0.6875rem | 400–500 | Dates, roles, and short labels |
| Section eyebrow | 0.625rem | 600 | Uppercase, 0.13em tracking, optional section number |

Keep reading text in `ink-soft`, headings in `ink`, and metadata readable in both themes.
Do not truncate headings to make a layout fit. Wrap the layout instead.

## Color and surfaces

Consume the shared semantic tokens; do not introduce a second brand palette.

| Purpose | Token |
| --- | --- |
| Page background | `canvas` / `--theme-bg` |
| Opaque project surface | `surface` |
| Quiet grouping | `surface-muted` |
| Community panel | `brand-soft` |
| Headings and strong controls | `ink` |
| Paragraphs and metadata | `ink-soft` |
| Fine rules | `line`, typically at 65% opacity |
| Light-theme emphasis | `brand` |
| Dark-theme emphasis and focus | `accent` |

Use solid surfaces, restrained borders, and rounded corners. Save depth for the navbar and
artwork. Avoid page-wide glow, glass on every card, spinning borders, and continuous decorative
animation on content surfaces.

The site-wide background balls are an approved exception, restored at Santiago’s request.
Keep the shared Lumen `Particles` in the Base layout, behind content and non-interactive.
Respect its reduced-motion behavior; do not add competing glow or animation to cards.
Base's `backdrop` prop owns that composition: Home uses `particles`; About, Work, Projects,
and Travel use `plain`; other routes retain the default `decorated` background. Omitted
decorations are not rendered. Keep canvas selection in the layout instead of page-marker CSS.

## Layout and spacing

- Main alignment: **72rem** maximum content width, matching the hero and navbar.
- Desktop section spacing: **7rem**; mobile: **4.5rem**.
- Heading-to-content gap: **2.5rem**.
- Grid gap: **1.5rem**; larger editorial column gaps: **2.5–4rem**.
- Cards: **1.5rem** corner radius, **1.5–3rem** content padding.
- Community surfaces: **1.75rem** corner radius.
- Controls: approximately **1rem** radius; small arrow compartments: **0.625–0.875rem**.

Use open numbered rows for supporting projects and writing. Featured work can pair one large
image with its description. Independent projects can use two equal image cards. Keep the same
reading and keyboard order when columns collapse.

### Reading slip Start here recommendations

The homepage's curated articles follow the latest writing as three open illustrated reading slips.
Each transparent Lumen Card opens with its article's 16:9 cover, followed by a small accent label
and decorative number, the full 1.25rem title, and the complete recommendation. Use optimized,
lazy-loaded Astro images with descriptive alternatives and no overlaid copy. Keep one native
link per entry and align the ruled action rows on desktop. Avoid oversized numbers or an extra
opaque card surface.

Use the same 1.5rem column gap as latest writing, with three columns above a 56rem `home-writing`
container and one column below it. At 38rem of card width, place the cover beside the copy;
otherwise stack it above. Use 2.5rem between stacked recommendations. Reduce
heading scale below 16rem of slip width, allowing labels and actions to wrap at enlarged text.
Hover and keyboard focus underline the title using brand in light mode and accent in dark mode.
Keep the complete focus outline visible and the existing curated article order unchanged.

### Editorial project cards

The Projects gallery pairs the existing artwork with open editorial copy. Keep the standard
16:10 image and 1rem corners; the featured project retains its horizontal 16:9 composition
only while its image and copy sit side by side. When stacked on mobile or with enlarged
text, its image and copy fill the card width and use the same 16:10 artwork as the other cards.
Use the numbered date, an outline status pill, a complete 1.75rem title, and one
“View project” action with an arrow and a fine bottom rule. Do not add a second title arrow.
Metadata and technology labels use 0.75rem text; descriptions use 0.9375rem with 1.75 leading.
The image-to-copy gap is 1.5rem. Keep the action aligned at the bottom of adjacent cards.

Project frontmatter may provide `cardDescription`, a nonempty summary of at most 160
characters. It is used only by the editorial gallery, with `description` as the fallback.
Write a concise product purpose rather than truncating copy. Keep the full description for
case studies, metadata, and other existing consumers. Technology labels follow the first
three frontmatter entries, matching the project-artwork generator and homepage showcase.

The entire card is one named link. Preserve the visible keyboard outline, full title wrapping,
text-driven column reflow, and reduced-motion support. Hover changes text color without
moving the card or cropping the artwork. Technology archives reuse this editorial
presentation.

### Editorial blog cards

All `PostsGallery` consumers use open cards with 16:9 artwork and 1rem image corners.
Place the post type and date beneath the image, followed by the complete 1.5rem title
at weight 500 and 1.35 leading. Descriptions use 0.875rem text with 1.75 leading;
metadata and the first two plain topic labels use 0.75rem. Keep a 1.25rem image-to-copy
gap, then one “Read article” footer with an arrow, reading time, and a fine bottom rule.
Align neighboring metadata, title, summary, topic, and footer rows without clamping titles
or descriptions. Shared grid tracks let the longest content in each shelf set its shared rows;
the normal flex layout remains the fallback. Preserve the 3rem gap between shelves.

Post frontmatter may provide `cardDescription`, a nonempty summary of at most 160
characters, with `description` as the fallback. The full description remains authoritative
for the article, search, feeds, and metadata. Preserve series sequence and draft labels.
The complete card is one naturally named link with a visible outline; hover changes
only the title color. Artwork stays still, and metadata and footers wrap for enlarged text.

### Layered feature latest article

The Blog hero uses an opaque Lumen Card with a soft purple backing and a 16:10 cover.
Raise the inset reading sheet over the cover's lower edge by 2.375rem. Give the sheet
1.125rem corners, a 0.375rem lower-right corner, 1.5rem padding, and a fine border.
Show the complete title and description, then separate date, reading time, and action
with a rule. Preserve the responsive Astro Picture and eager image loading.

The full card is one native link. Hover and keyboard focus emphasize the title;
keep the artwork still and the focus outline outside the full card. Reduce insets,
overlap, and title size as the card narrows or text grows. Stack the hero when its
columns cannot accommodate enlarged text. Keep both themes and the
image-free fallback readable without JavaScript; respect reduced motion.

### Soft editorial series cards

`SeriesCard` uses one opaque surface, a fine border, and 1.25rem corners. Place the
plain status and article count above a complete 1.75rem title at weight 500 and
1.3 leading. Descriptions use 0.875rem text with 1.8 leading; focus areas use plain
0.75rem labels. Keep the cadence on the series detail page. The card ends with one
“Explore series” action and a decorative arrow above a shared bottom inset, separated
from the copy by a fine rule. Align neighboring footers without truncating content.

The complete surface is one naturally named link with a continuous keyboard outline.
Hover changes only the title color. Preserve planned status, zero and singular article
counts and theme contrast. When enlarged text narrows the section, tighten the insets
and size the title to its reading column so ordinary words stay intact.

### Reading folio series cadence cards

`SeriesCadenceCard` pairs a tinted Cadence header and decorative book icon with the
complete series cadence. Use a fine border, 1.375rem corners with a 0.5rem lower-right
corner, and 1.5625rem copy at weight 500. The inset ruled footer stays at the bottom
when the adjacent sculpted statistics make the row taller. Let content set the height;
do not clamp the copy or add a fixed height. Below 20rem, reduce the insets and type;
below 16rem, preserve reading width with tighter insets. The card remains passive and
works without JavaScript in both themes.

### Focus ledger series topics

The series introduction and `SeriesFocusCard` form one open, ruled spread. Use the
page's editorial heading weight and 0.9375rem body text instead of the article-prose
heading, left accent bar, and larger paragraphs. Keep the heading flush with the top
of the focus ledger. The series page owns its section spacing: use 4rem before the
summary and introduction, then the regular PageSection spacing before the chapter list,
without an additional page-frame gap. Above 52rem of section width, use a wider introduction column
and a narrower one-column focus list, separated by a fine vertical rule. Below that,
stack the introduction before the focus list and replace the vertical rule with a top
rule. The list can use two columns while its own width permits; keep all topic labels,
numbering, and order. Decorative numbers stay hidden from assistive technology.
Do not add a second card surface or keyboard stops; empty focus lists stay omitted.

### Series chapter rows

Series detail pages use the approved reading-index rhythm for their ordered article
list. Reuse `PostsGallery` with its chapter layout: compact artwork at the left, a
plain part number before the type, the complete title and summary, then topics and
one reading action. Separate entries with fine rules, without enclosing cards. Keep
the publication date and reading time aligned at the right edge. Titles use 1.625rem,
and the same image, metadata, and single native link as the regular editorial grid.

Use a 14rem artwork column, then 10rem below 46rem of gallery width; stack the artwork
above the copy below 34rem. Narrow enlarged-text rows use 1.125rem titles below 20rem.
Preserve complete titles, sequence, native navigation, focus outlines, and readable
fallbacks without JavaScript. The regular Blog, topic archives, DX, and related-writing
shelves retain their editorial grid.

### Reading index chapter navigation

Inside the series Continuation fold, group every chapter in one ruled index.
Use plain two-digit numbers in a
2.75rem margin column, 1.625rem row insets, fine dividers, and complete 1.125rem
titles at weight 500. The active chapter uses a purple wash, a visible “Reading now”
label, and `aria-current="step"`; other rows use “In this series”.

Keep complete chapter titles and native navigation without JavaScript.
Below 28rem of panel width, use a 2rem number rail, a 1rem gap, and 1.25rem insets
to give mobile titles more room. Below 20rem, reduce the rail to 1.75rem and the
insets and titles to 1rem. Keep two-digit numbers together with tabular figures.
Below 16rem, stack the number above the copy so enlarged text has the whole column. Retain the inset focus
outline on first and last rows. Hover and keyboard focus use the same
background and text emphasis, without moving content.

### Continuation fold series navigation

At the end of a series article, use one full-width composition: the series title
and description, the Directional folio, a closed native Lumen Collapsible containing
the Reading index, and an inline Explore the series link. The introduction pairs
Continue the series with Post N of M in plain 0.75rem labels. The position replaces
the previous progress bar and pills; it does not imply chapters have been read.

The disclosure uses fine top and bottom rules, an All N chapters label, a decorative
chevron, and a 4.25rem minimum summary height. Opening it reveals the complete
ordered index with its existing current-step label and focus treatment. Keep the
index in the same page, available with keyboard and without JavaScript. Do not add
another card frame inside the disclosure. Singular chapter counts use All 1 chapter.

### Directional folio article navigation

Before the Reading index disclosure, present previous and next articles as open columns with
fine top rules, 1.5rem top insets, and a 1.75rem gap. Pair a 0.75rem direction label
with a purple Lumen arrow, followed by the complete 1.25rem title at weight 500
and 1.8125rem leading. Keep the two-digit part number at the bottom of each column.

Use a named navigation landmark and native links. Show only available neighbors
at the first and last chapters, using the full width for a single link. Below 25rem
of available column width, stack previous before next. Keep an outward keyboard
outline on these open links and matching title emphasis on hover and focus. Do
not crop titles, add a second surface, or move content during interaction.

### Tool ledger technology snapshot

On Projects, keep the technology snapshot in one opaque Lumen Card with 1.75rem
corners and a 0.5rem lower-right corner. A soft purple header pairs the introduction
with the highlighted and full-index totals. Use 1.75rem insets and a 1.375rem title
at weight 500. Mix its emphasis color with 15% ink to retain readable contrast on
the tinted header in both themes. Keep the existing interest order and the six featured technologies.

Present tools as native links in ruled lists, with names on the left and project
counts on the right. Featured names use 1.0625rem type; supporting names use
0.875rem. Use three columns above 32rem of panel width, two below, and one below
20rem, with smaller insets. Keep complete labels and readable totals at enlarged
text sizes, singular and plural accessible count labels, and visible focus outlines.
Place the full-index link beneath the lists. Hover and focus emphasize link text
without moving content.

### Margin catalog technology index

The index statistics use **Evidence ledger with sculpted character**: replace the
four equal cards with one joined sheet under “Range, with a trail.” Keep a soft
brand wash behind the total and a ruled link to the most recurring technology, with
its entry count and “Explore the evidence” action. Reuse the 1.375rem sculpted
corners, shortened 0.5rem lower-right corner, fine border, and subtle navigation
shadow. Use two columns in a 1:1.25 ratio, stacking below 38rem of container width.
Retain an inset focus outline and wrap all text at enlarged sizes. Count canonical
technologies once per entry; keep the total explicitly scoped to the published
portfolio even while filtering the catalog. Remove Signals and Scope from this summary.

The technology index groups Core, Regular, and Selective into open catalogs with
an accent introduction rail, a prominent group title, and the live tool count.
An 11rem margin sits beside two columns of ruled Lumen links with aligned project
counts. The introduction rail stays with its copy, rather than stretching beside
long lists. Keep all technologies, existing relevance order, and exact archive URLs.
Below 47.5rem of index width, the introduction moves above the links; below 27.5rem,
links form one column. The full row is a link with a visible focus ring and a label
that includes its project count. Preserve live filtering, hidden empty groups,
result announcements, and Lumen's existing reduced-motion-aware list behavior.

### Catalog note technology empty state

Keep the technology index's no-results message open between the existing catalog's
top rule and a matching bottom rule. Pair a decorative Search X icon in a small
sculpted brand-soft mark with a 1.5rem heading and .875rem recovery guidance.
Use 1.75rem vertical space and a 1.5rem icon-to-copy gap. Below 32rem of index
width, reduce the heading to 1.375rem and the gap to 1rem; below 18rem, stack the
icon above the text. Below 12rem, use a 1.125rem heading. Disable automatic
heading hyphenation to keep complete words with enlarged text. Preserve both
sentences, search focus, live result counts,
and restoration of the catalog when the query is cleared. Hidden remains the
initial state, including without JavaScript.

The Blog topics empty state uses the same Catalog note direction, retaining its
single sentence as a heading centered beside the icon. Give it both rules and the
same responsive spacing, stacking below 18rem of topic-index width. Preserve the
search and sort controls, zero-result announcement, search focus, and restoration
of all topic links when the query is cleared. Keep automatic hyphenation disabled.

### Purpose first Projects opening

Keep the signature frame and Built for the love of it headline. The eyebrow gives
its live project total; the shorter introduction leads directly to the existing
SculptedTag category shortcuts. Derive each count and fragment from the same
published purpose groups as the catalog. Use a brand-soft tag surface and quiet
count compartments inside this opening only. A ruled footer pairs the short maker
statement with the native external GitHub link.

Below 34rem, give each category a full row and stack the footer. Below 14rem, place
the count below its label and let enlarged text wrap within the available width. The hero
statistics and generic Explore projects action are replaced by these direct paths;
there is only one category navigation. Preserve the catalog's projects fragment,
purpose sections, project ranking, and structured data.

### Evidence paths technology ending

The technology index closes with an open editorial section: Beyond the toolkit,
Follow it into the work, and a short introduction beside the heading. Three ruled
Lumen links lead to Work experience, Independent projects, and Writing, each with a
decorative number, a supporting sentence, and a forward arrow. Use semantic ink,
line, and brand tokens; the arrow and number use accent in dark mode. Retain the
`trace-the-evidence` fragment and `technology-evidence-heading` ID.

At narrow widths the introduction stacks below the title. Below 20rem, place the
number and arrow above the full-width link copy so enlarged text keeps its room.
Preserve full-row native links, visible focus, and all three destinations without
JavaScript. This supersedes the Closing folio card and its general portfolio CTA.

### Principle spread working definition

The Developer Experience definition uses one opaque Lumen Card with 1.5rem corners
and a 0.5rem lower-right corner. Divide the body into equal columns: the system sits
on a soft purple surface, while the evidence stays on the main surface. Use small
uppercase labels, 1.4375rem headings at weight 500, and the complete original paragraphs
in 0.9375rem type with 1.95 leading. Keep a fine border between the columns.

Place the measurement-framework link in a full-width footer separated by a rule.
Use a decorative Lumen arrow, a visible keyboard outline, and underline emphasis
without movement. Below 35rem of available width, stack the system before the
evidence; below 22.5rem, reduce the insets. Preserve readable contrast in both themes,
complete copy at enlarged text sizes, and native navigation without JavaScript.

### System folio shipped systems

Developer Experience presents its three shipped systems as opaque Lumen Cards with
1.75rem corners and a 0.5rem lower-right corner. Each soft purple header pairs a
small category and decorative icon with the complete 1.5rem title at weight 500.
Keep two lines of title space in wide cards, 0.875rem body copy with 1.625rem leading,
and aligned action dividers at the bottom of neighboring cards.

Preserve the original descriptions and native case-study links. Use readable purple
category and action text in both themes, with visible keyboard focus and no card
movement. Container queries tighten the insets and let action content wrap in narrow
or enlarged-text layouts. Keep all words intact and all destinations usable without
JavaScript.

### Evidence rows policy sections

Privacy, Terms, and Accessibility share one opaque Lumen Card with 1.75rem corners
and a 0.5rem lower-right corner. Separate plain semantic sections with fine rules.
Each heading has a 2px purple margin rail, a small decorative number, and a complete
1.375rem title at weight 500. Put 0.875rem copy with 1.75rem leading in the wider
right-hand column. Use 1.75rem panel insets and row spacing, with a 2rem column gap.

Below 34rem of available panel width, place each heading above its copy. Below 16rem,
reclaim 0.5rem of each page margin, tighten the panel and heading insets, and use
1rem titles so enlarged text retains
complete words. Keep the original policy wording, dates, heading hierarchy, contact
links, and readable light/dark colors. The rows remain passive reading content.

### Chapter spread History hero

Lead the hero collage with the current-era capture at full width, preserving its
natural proportions. Use a 2rem upper-left corner, a 0.375rem upper-right corner,
and a straight lower edge. Below it, pair a 2rem accent version label with a
6.875rem brand-soft Today tab and a 1.75rem lower-right corner.

Place the two archive previews beneath the current capture in equal columns,
with a 1.25rem gap and 1.5rem top spacing. Keep each complete screenshot above a
fine caption rule, its version, and the existing archive label. The closing
preservation caption stays in normal flow. Below 24.375rem of exhibit width,
tighten the gap; below 17.5rem, stack each archive caption; below 13rem, stack
the archive figures and tighten the Today column so enlarged text retains words.
Use native figures and Astro images, without transforms, overlap, fixed heights,
new animation, or client JavaScript. Preserve the hero copy and chapter links.

### Timeline index History shortcuts

Below the hero, introduce the four chapter links with a 1.125rem label and a
smaller preservation line. Place the versions on a continuous fine rule, with
small circular markers, 2.25rem version labels, and visible directional arrows.
Dates and chapter descriptions follow in separate rows. Use the shared accent
for the current era's marker, rule and version, while retaining its explicit
current-chapter wording. This emphasis identifies the current website version;
it does not imply a selected scroll position.

Keep the native fragment links in chronological order. Reflow the four-column
index into two columns below 32.5rem of navigation width, then one below 13rem,
reclaiming the link's end padding in the single-column layout.
Retain complete words, visible keyboard focus, generous link targets, and native
navigation without JavaScript. Preserve the Chapter spread hero above it.

### Stacked sheets History chapters

Give each chapter introduction an opaque Lumen Card with 1.75rem corners, a
0.5rem lower-right corner, and a 0.375rem brand-soft sheet shadow. Reserve that
offset inside the timeline width. Keep the version, date, and chapter status in
an 8rem left column; put the title and description beside them with a 2rem gap.
The desktop and mobile captures sit below the introduction at the full chapter
width, followed by the existing archive action and preservation note.

Below 34rem of available chapter width, stack the metadata above the title and
copy. Below 16rem, reclaim some page margin and tighten insets and title size so
enlarged text keeps complete words. The captures follow the Split exhibit contract
below. Keep all four chapter anchors, authentic captures, descriptive image
alternatives, and full-document archive navigation. The sheet is passive content;
its shadow stays visible on hover and requires no animation or controller.

### Split exhibit History captures

Pair each chapter's original desktop and mobile screenshots in one unstyled Lumen
Card with a solid surface, fine border, and alternating 2rem / 0.375rem corners.
Use a compact version/address header above a bottom-aligned grid: the mobile
column takes 25% and both images remain complete, without overlapping. Separate
device names and dimensions with a fine caption rule; accent only the mobile rule
and version. Keep image alternatives, lazy loading, and archive destinations.

Use 1.5rem insets and a 1.375rem grid gap, tightening to 1.125rem and 1rem below
37.5rem of chapter width. Below 23.75rem of inner exhibit width, stack the images
and align the 8.125rem mobile figure to the right. At enlarged text sizes, reduce
outer insets below 16rem so device labels and dimensions retain complete words.
Use responsive image sizes matching the paired layout. The exhibit is passive
content and does not add browser controls, hover effects, or client JavaScript.

### Archive colophon History preservation

Close the History timeline with an unframed, two-column note beneath a fine rule.
Keep the preservation eyebrow, 2rem title, and sculpted book seal in the smaller
column. Put the unchanged preservation copy beside a thin accent rail in the
larger column, using a 1:1.8 ratio and 1.75rem spacing. The note retains its 48rem
reading width, native aside, and labelled heading.

Below 32rem of note width, move the copy below the heading and turn the accent
rail into a top rule. Place the seal beside the title until the note is narrower
than 17rem, then stack it. Preserve complete words with enlarged text, readable
light/dark colors, and the original archive contract. The note adds no interaction,
animation, or client JavaScript.

### Map folio Travel controls

Travel map controls use **Map folio**: a compact opaque sheet beneath the geography,
aligned with the page content. Put the visible country label and decorative globe above
a large underlined native select. A soft brand footer holds zoom out, the live zoom level,
zoom in, and Reset with a decorative return icon. Keep the alternating .375rem / 2rem
corners, fine outline, and 44px targets. Below 18rem of sheet width, tighten the insets
and give Reset its own ruled row. Keep keyboard order aligned with the visual order,
visible focus outlines, all countries, and Lumen's selection and zoom behavior.

### Margin totals Travel hero

Keep the hero totals unframed beneath the existing introduction. Use a native
definition list, a 2px accent margin, and 1.25rem left inset. Pair .75rem labels
with right-aligned 2.125rem values at weight 500, separating the two rows with a
fine rule and .75rem vertical spacing. Keep the count labels and derived values
explicit, including the distinction between countries abroad and total visits.

The totals stay within the existing 19rem context width and move with that
context on smaller screens. Below 12rem of inner width, tighten the label/value
gap to .375rem so enlarged labels retain complete words. Preserve native reading
order, light/dark contrast, and all content without JavaScript.

### Index fold Travel notebook opener

Keep the native Lumen disclosure on the ruled canvas. Its summary pairs a compact
“All” label and a 2.6875rem derived country count with a 2px accent rail, a larger
“countries” label, and the supporting line beneath. Use 1.5rem vertical spacing,
fine top and bottom rules, and one decorative chevron that turns when expanded.
The summary's accessible name preserves the full sentence and live country count.

Below 29rem of notebook width, tighten the count column and rail inset and use a
2.1875rem count with a 1.25rem title. Below 18rem, tighten the gap again; below
14rem, move the title and supporting line beneath the count to preserve whole
words at enlarged text sizes. Keep a visible focus outline, native Enter/Space
toggling, and all Journey ledger entries usable without JavaScript. Add no client
controller or motion; use the accent color in dark mode.

### Journey ledger Travel notebook

Use native country articles inside the existing Lumen disclosure. Give each entry
a 3.75rem country-code margin, a 1.5rem gap, and a fine top rule; the disclosure's
summary supplies the first rule. Larger 1.625rem names lead the content column,
with visit and residence labels alongside them. Keep city names in wrapping lists
with small accent markers, and preserve the home, partial-list, and region notes.
The codes repeat the country identity decoratively; browsing order remains data
order and does not imply an itinerary.

Below 28rem of notebook width, tighten the code margin to 2.75rem, place the visit
label beneath the name, and use 1.4375rem titles. Below 14rem, stack the code above
the content. Keep complete words at enlarged text sizes, readable light/dark
colors, native keyboard disclosure behavior, and all content without JavaScript.
The notebook adds no new client controller or animation.

### Origin spread Travel story

Frame Roots & returns in one opaque Lumen surface with alternating .375rem/2rem
corners and 1.75rem/2rem insets. Keep the accent eyebrow and decorative book icon
above the full-width 2.625rem heading. Below a fine rule, use equal columns:
the opening paragraph leads at 1.1875rem, while the remaining paragraphs use
.875rem type beside a slim accent rail. Preserve the full copy and reading order.

Below 36rem of section width, stack the story, turn the rail into a top rule,
use 1.5rem insets, and reduce the heading to 2.125rem. Below 18rem, use 1rem
horizontal insets, a 1.75rem heading, and a 1.0625rem opening paragraph. Below
11rem, tighten horizontal insets to .5rem and use a 1.25rem heading and 1rem
opening paragraph so enlarged country and city names retain complete words.
Maintain the Travel page's 72rem alignment, readable light/dark colors, and
complete country names at enlarged text sizes. The story remains static content
with a labelled native section and adds no client JavaScript.

### Story sleeve Travel invitation

Close the Travel page with one opaque Lumen surface and alternating 2rem/.375rem
corners. A soft brand cover holds the small accent eyebrow, decorative book icon,
and 2.625rem heading. Beneath it, pair the unchanged forthcoming-stories copy with
the blog link, separated by a fine vertical rule and a sculpted arrow tab. Keep
the section aligned to the same 72rem width as the introduction and notebook.

Below 34rem of section width, use 1.5rem insets, a 2.125rem heading, and place the
link beneath a horizontal rule. Below 18rem, reduce horizontal insets to 1rem and
the heading to 1.75rem. Preserve readable complete words at enlarged text sizes,
light/dark contrast, and a visible focus outline inset from the clipped surface.
The blog destination stays a native link; no new client JavaScript is needed.

### Compact topic cards

Topic cards keep the hashtag, opaque surface, 1.5rem corners, and purple meter.
Place the name and a single readable post-count badge on the top row, followed
by a 3px decorative meter. Use 1.25rem padding on phones and 1.375rem vertical
with 1.5rem horizontal padding on larger screens. Remove the repeated count
below the meter. Preserve the whole-card link, filtering, sorting, and focus outline.
At enlarged text sizes, reduce the insets and let the badge wrap below long names.

### Speaking and engineering-principle cards with clear hierarchy

Speaking topic, format, and boxed engineering-principle cards share one treatment:
an opaque Lumen surface, fine border,
1.5rem corners, and purple number. Present the title and supporting phrase in one semantic
heading: a 1.625rem title at weight 500 with 2.125rem leading, followed by a quiet
1rem phrase with 1.625rem leading. On phones, use 1.5rem and 0.875rem respectively.
Keep a 0.25rem gap within the heading and 1.25rem before the complete description.
Descriptions remain 0.875rem with 1.75rem leading. Preserve the full title in
structured data and the accessible heading, along with text-driven wrapping and
narrow-column insets. Cards remain passive, without hover changes. Use the same
`card-hierarchy` utility for their typography and reflow. Split the title at a natural
phrase boundary without removing words or punctuation. Keep About's open editorial
principles in their existing presentation.

### Margin counters About profile highlights

The three profile highlights use bare Lumen Stat articles in full-width, ruled rows.
Place the figure and its smaller unit in the left margin, with a label and complete
explanation beside a 2px accent rail. Keep experience derived from the shared site
configuration and preserve the authored team and delivery metrics. The section has
an accessible name and each article is named by its level-two heading.

Use About's semantic accent in both themes, 4rem figures, and a 0.65fr / 1fr split.
Reduce figures to 3.25rem below 53.125rem of container width. Below 31.25rem, use a
compact 6.5rem figure column, 2.75rem figures with their units below, 1.125rem labels,
and 1.5rem row insets. Below 20rem, stack the figure above the copy and put its unit
back on the same line. At enlarged text on a narrow phone, let the
figure scale with the container. These passive highlights add no links or animation.

### Margin brief About working modes

The working modes beside About's introduction use an open numbered list with fine
horizontal rules. A 2px accent rail leads the 1.75rem section heading. Each row pairs
a 2rem decorative numeral with a short 1.375rem heading and the complete existing
description, separated from the numeral by a fine vertical rule. Keep the native
list and heading hierarchy; these rows are passive and require no client script.

Use the working-mode container's width to tighten the number column and type below
18.75rem. Below 14.6875rem, put the numeral above the copy and remove its vertical
rule so enlarged text remains readable. Retain the surrounding introduction layout
and use About's light and dark accent tokens.

### Collaboration ledger About cards

About's collaboration lanes form three full-width, ruled articles. A purple numeral
leads each row, followed by a 1.5rem title and a separate description column with a
fine left rule. Keep the complete description and fit note together, with the fit
note set at 0.6875rem and weight 500. These are passive articles without hover effects.

Use the `about-page` container to move the description below its title at 50rem,
then stack the numeral above the copy below 33.75rem. Remove the vertical rule in
the stacked layout. Preserve reading order, all authored copy, and text-driven
row heights when text is enlarged.

### Exhibition sheets About organizations

The organization carousel uses tinted outer frames with 1.75rem corners and a
0.5rem lower-right corner. Retain the optimized artwork and individual logos in a
10.75rem cover. An opaque reading sheet overlaps the cover by 1.5rem and contains
the organization number, a 1.5rem heading, complete context, and a ruled action row.
The whole card remains one native case-study link with an outer focus outline.

Keep the carousel's three-, two-, and one-column paging, focus preservation,
reduced-motion behavior, and static list fallback. Number all nine organizations
continuously. Tighten sheet insets below 16rem of card width and title size below
14rem so enlarged text leaves room for complete names and descriptions.

### Margin index About invitation

Keep About's closing invitation open, with a 2px accent rail beside its introduction
and two full-row destination links beside it. Each ruled row has a decorative index,
a small context label, a 1.625rem action, and a stationary arrow. Use unstyled Lumen
ButtonLinks, native internal navigation, and a visible outer keyboard focus outline.

Stack the introduction and navigation below 53.125rem of About container width.
Below 33.75rem, tighten the rail inset and row spacing; below 17.5rem, move each
index above its label so enlarged text still has room. Keep both descriptions and
destinations intact, with accent colors from the active light or dark theme.

### Portrait spread About profile

Keep the About hero's complete 4:5 photograph above an open name caption and a soft
location mount. The image has a 2rem upper-left corner and a 0.375rem upper-right
corner; its lower edge stays straight. A 1.5rem inverse curve joins the location
mount to that edge, finishing in a 2rem lower-right corner. Use `brand-soft` for
the mount and About's theme-aware accent for the handle.

Set the name at 1.75rem and weight 500, below the small handle. Keep the location
and remote availability together in a 7.875rem column. Tighten the columns below
21.25rem of portrait width; below 16.25rem, move the location beneath the name as
a compact two-column row. Below 11rem, stack the location facts. Preserve native
figure semantics, descriptive alt text, responsive image sources, eager loading,
and the existing hero's introduction and actions. The portrait stays passive.

### Portrait cover speaker profile

The speaking hero uses an opaque Lumen Card with a fine border and asymmetric
1.75rem corners. Its optimized 4:5 portrait leads into a dark photographic scrim,
with a small profile label and 2.5rem name in the lower cover. Keep the existing
description and semantic community/location facts on the ruled surface below.
Use the dedicated portrait ink and scrim tokens so both themes preserve contrast.
Below 19.375rem, tighten the insets and name size. Below 14rem, move the caption
into its own row below the photograph so enlarged text cannot cover the face.
Retain eager image loading, descriptive alternative text, and the hero's existing
responsive column layout. This profile stays passive and requires no client script.

### Session folio speaking history

Use Lumen Timeline with native list items and individual unstyled Lumen Cards. Keep
the date rail outside each card, with the event and evidence label above the complete
talk title. Location, audience, and description remain in the body; a softly tinted
footer holds the plain topic list and independently focusable resource links.
Preserve qualified date ranges for private and reconstructed entries, without inventing
exact dates or resources. Below 32.5rem, move the date above the card. At enlarged text
sizes, reduce insets before compromising readable titles or evidence labels.

### Community dossier speaking card

The ReactJS Colombia card pairs a tinted role-and-title cover with the complete
community contribution and numbered impact rows. A shared footer keeps the community
and case-study links together. Use the opaque Lumen Card, fine border, and asymmetric
1.75rem corners; preserve content-driven impact data and label its semantic list.
Stack the cover above the body below 32rem, hide its decorative symbol, and tighten
insets below 22rem. Below 14rem, move the decorative row numbers above the evidence
so enlarged text keeps its reading space. Retain both link destinations and visible focus.

### Invitation folio speaking booking card

Keep the booking card as an opaque Lumen surface with a fine border and asymmetric
1.75rem corners. The tinted invitation holds the heading, complete briefing prompt,
and existing contact action. Three ruled notes keep their full text and sentence-case
headings in the adjoining column. At card widths below 32rem, stack the invitation
above the notes; reduce insets below 20rem and 14rem so enlarged text retains room.
Preserve the WhatsApp briefing URL, new-tab protection, visible keyboard focus, and
the existing reduced-motion-aware note reveals. Keep these styles scoped to Speaking.

### Split editorial testimonial cards

Testimonials use one opaque Lumen Card with a fine border and 1.375rem corners.
At card widths of 32.5rem or more, place the author in a 10.875rem tinted column
beside the complete quote. Keep the initials or optimized avatar, name, role,
and relationship together; separate the relationship with a fine rule. The quote
uses 1.0625rem text with 1.8125rem leading and a small decorative quote mark.
On narrower cards, stack the author header above the quote, using 1rem text with
1.75rem leading. Container queries also adapt to enlarged text: tighten the insets
and stack the avatar above the identity when needed. Preserve all quoted words,
use readable metadata in both themes, and keep the cards passive on hover.

### Sculpted statistics cards

The shared `StatCard` uses an opaque Lumen Stat surface with a fine border, subtle
navigation-token shadow, and 1.375rem corners except for the 0.5rem lower-right
corner. A 2.5rem tinted icon tile and short purple rule lead into a 3.125rem value,
then a 1rem label and complete 0.8125rem description with 1.4375rem leading.
Use weight 500, brand emphasis in light mode, and accent emphasis in dark mode.
Separate word prefixes and units from the value while keeping every qualifier
available to assistive technology. Preserve the existing AnimatedNumber behavior
and its static accessible value; text values remain static.

On phones the icon moves beside the value and the rule disappears. Narrow content
columns restore the stacked icon and scale long values to fit. Cards stay passive,
without hover effects or new animation. The homepage uses its dedicated Sculpted
ledger below, About uses Margin counters, and Work uses Career ledger.

### Identity spread resume profile

The `/resume/` profile uses an open, ruled Identity spread: a small accent margin label,
a prominent name and role, and a separate contact and download section aligned with the copy.
Contacts precede both native PDF downloads in reading and keyboard order. The layout stacks
at narrow or enlarged-text widths; all contact and download targets remain at least 44px tall.
These screen-only rules preserve the existing print header and the two-page and full CV PDFs.

### Margin index resume navigation

Place the four section links directly below Identity spread, sharing its closing rule.
Align On this page with the header's 8.125rem margin and use a two-column ordered list
beside it, with decorative accent numbers and plain 0.875rem links. Keep the 2.25rem
column gap, 1.25rem vertical padding, bottom rule, and 3rem space before Experience.
The margin contracts with the identity grid; below 36rem, stack the label and four links.
Each link has a 2.75rem minimum target, visible focus, and a hover underline.
Use the existing section fragments and native links without a scroll controller or
active-section tracker. Hide the entire navigation in print and both generated PDFs.

### Role folio resume experience

Detailed Experience and Community entries on `/resume/` use Role folio: a date margin beside the
company and role, open description text, a slim accent rail for impact, and plain
wrapping technology labels. Adjacent entries share a single rule. Below 31.25rem
of resume width, dates move above the company so enlarged text has the full line.
The existing resume container owns these breakpoints. These rules apply only on
screen; PDF pagination, print typography, and both download variants stay separate.
Community shares the screen layout while retaining its existing print header and
pagination in both PDFs. Earlier Experience uses Compact folio below.

### Evidence note resume case-study links

Finish each detailed role's impact rail with The decisions behind these results
and a named Read the [project] case study link. Use the existing accent, a single
top rule, 0.8125rem link text, and a decorative arrow at the opposite edge. Keep the
technology labels below the rail. Earlier roles and roles without listed metrics
use the same named link without the helper text or extra rule, retaining Compact folio.
Derive destinations from the collection entry and canonical portfolio-path helper.
Keep links native, at least 2.75rem tall, keyboard-visible, and screen-only; neither
PDF variant includes the note. Preserve the company headings and existing claims.

### Compact folio earlier experience

Earlier Experience on `/resume/` shares Role folio's date margin and responsive
column alignment. Smaller company headings, compact role labels, and a single
paragraph keep these four entries lighter than the detailed experience above.
Each row has one bottom rule; the section heading supplies the first top rule.
The full CV keeps its existing compact print layout, and the short PDF continues
to omit Earlier Experience. Content, chronology, and downloads stay unchanged.

### Capability ledger resume skills

Skills & Expertise on `/resume/` uses four ruled rows with accent category labels
in the same 10rem margin as the experience dates and complete skill descriptions
beside them. At narrower resume widths the margin contracts to 7.5rem; below 35rem
each label moves above its text. Keep the existing four groups and authored copy.
The screen-only layout leaves both PDFs with their compact two-column skill grid,
print typography, and existing pagination.

Linked skills keeps the Capability ledger's category margin and ruled rows. Technical
skills become wrapping native links with quiet underlines, a 1.25rem horizontal gap,
and a 2.75rem minimum target. Hover and keyboard focus use the existing accent. Keep
Languages as plain copy; link only skills with a published technology archive, using
REST APIs as the destination for the displayed REST label. One authored list supplies
both the screen links and the original comma-separated print paragraph. Preserve its
wording and order in both PDFs; the interactive list is screen-only.

### Experience first Work opening

The Work hero makes Explore experience its primary action, using the shared solid
button and a downward arrow to jump to the existing experience heading. Keep Open
resume and LinkedIn as plain secondary links, with LinkedIn in the softer text tone.
Group these supporting links so they wrap below the primary action when space is
limited, then wrap individually for enlarged text. Preserve native fragment navigation,
focus outlines, and the existing hero copy, Career ledger, and Timeline folio cards.

### Career ledger Work highlights

The Work introduction closes with four bare Lumen Stat articles in a two-column
ledger. Each article pairs a 3rem accent figure with a 1.0625rem heading and its
complete description beside a 2px accent rail. Fine horizontal rules organize the
rows without adding nested surfaces. Preserve the collection-derived professional
role and technology counts, along with the authored team and release metrics.

Use the Work intro container: below 53.125rem, show four full-width rows with a
0.6fr / 1fr split. Below 27.5rem, use a compact 5.75rem figure column, 2.5rem figures,
a 1rem gap, and 1.5rem row insets. Below 17.5rem, move each figure above its copy
to preserve a comfortable reading width. Scale the figure
with the container below 14rem for enlarged text. Use semantic light and dark
accents and level-two headings to name the articles. Keep each article passive,
without a card hover effect or new animation.

Keep the figures aligned with the top of their copy when captions extend a row.
The approved Evidence captions sit below each supported description in 0.75rem
accent text, with a 44px minimum target and a visible focus outline. Use a downward
arrow for the timeline and toolkit section jumps; named case-study sources use a
rightward arrow. Link only the caption, preserve the figures and their attribution,
and allow the complete source label to wrap on narrow screens. Do not invent a
source link for an unverified claim.

### Timeline folio career cards

Work's career list places the start year and month in an 8.125rem date rail beside a
single opaque Lumen Card. Keep the end month and year, or Present, in the rail too.
One continuous accent-tinted rail connects markers centered on the start years.
Use a filled marker with a quiet halo for active roles and outlined markers for
completed roles. Each segment reaches the next marker across the card gap; stop
at the final marker, without a dangling tail or horizontal rules cutting the rail.
Keep 2.5rem between desktop cards and 2rem between mobile entries. The card uses
1.125rem corners with a 0.375rem lower-right corner and the navigation shadow token. A small status and decorative
icon precede the complete company heading, role, and description. A tinted footer
holds plain technology labels and the case-study action.

Below 36.25rem of timeline width, dates move above the card and the connector moves
to the outer margin. Below 20rem, tighten the insets and scale the title to preserve
reading space with enlarged text. Keep one whole-row link, a visible inset focus
outline, semantic dates, and no description clamping. Hover and keyboard focus reveal
each company's brand color through the connector, card edge, subtle surface tint,
heading, role, and action. Reuse the project palette's readable light/dark colors,
mixed toward the text token for contrast on tinted surfaces. Keep the resting folio
unchanged, avoid movement, and disable the color transitions with reduced motion.

### Compact timeline earlier career entries

Keep the three newest Work roles in Timeline folio. Completed roles after those three
use Compact timeline; an active role always retains its full status treatment. Preserve
one continuous left rail and its markers through both densities. Each connector ends at
the next row's year center, including where the 2.1875rem year changes to 1.5rem.
The same connection holds when dates move above the cards on narrow screens.

Earlier entries omit the repeated Completed masthead and icon, use 1.375rem company
headings, 1.125rem by 1.25rem content insets, a 0.75rem description gap, and 1.5rem
between rows. Their footer uses the card surface with a fine top rule and 0.75rem
vertical padding. Keep every description, date, role, technology label, and case-study
link visible. Company hover colors, keyboard focus, reduced motion, and the final
marker endpoint remain shared with the full entries.

### Layered editorial portfolio cards

Portfolio spotlights use one full-card link and an unstyled Lumen
Card. The artwork has 1.5rem corners; an opaque content sheet overlaps it by 3rem with
1.25rem side insets, 1.125rem corners, and a smaller lower-right corner. Keep the status
on an opaque badge over the artwork, followed by date, complete title, role, description,
outcomes, plain technology labels, and a ruled case-study action in the sheet.
Keep the outer Card transparent so the sheet's side insets expose the page canvas,
not a second surface.

Use the horizontal project artwork, optimized at 16:10, so crops retain the central
brand mark without clipping social-preview text. Featured cards use a horizontal
overlap above 56rem of card width, with a 4:3 artwork panel that keeps the brand mark
intact independently of the text height. At intermediate widths, a 2:1 artwork panel
sits above the sheet. Below 36.25rem of card width, use a 4:3 crop, a
2.375rem overlap, and tighter insets.
Below 20rem, scale long headings and let outcome columns stack. Never clamp descriptions
or outcomes. Explicit before/after and percentage-drop
statements may become value/label pairs; preserve all other statements verbatim and
retain the original wording for screen readers. Project colors highlight the title,
role, action, and sheet rules on hover and keyboard focus without moving the artwork.
Keep a complete outer focus outline, readable light/dark colors, and reduced-motion support.

### Related projects

Project detail pages end with an open, ruled heading and compact related-project
cards. The header pairs its small uppercase label, full title, and short description
with the browse action on wide containers; below 44rem, the action follows the copy.
Keep the original project-type heading, fragment, and parent destination.

Use one column of open, numbered editorial rows, separated by fine rules. Each
transparent unstyled Lumen Card pairs a decorative two-digit index, 16:10 artwork
with 0.75rem corners, and the role, complete 1.75rem title, full description, and action.
Keep a 2.5rem column gap and 2rem vertical padding. The project color accents the
index, uppercase role, and plain forward reading action.

The list owns the `related-list` container. Below 56rem, tighten the columns.
Below 42rem, pair a 5.5rem square thumbnail with the role and 1.375rem title.
Place the decorative index at the end of the role line, reserving space so long
roles cannot overlap it. Give the full description its own full-width row with
1.75 leading, followed by a 44px-minimum action with the arrow at the far edge.
Use 1rem gaps, 1.5rem top padding, and 1rem bottom padding for a compact reading rhythm.
Below 20rem, use a 4.5rem thumbnail and 1.25rem title. Below 16rem, omit the
decorative artwork and index so enlarged text has the full width;
below 14rem, omit the decorative arrow.
Never clamp content. Keep the existing selection, order, descriptions, and destinations
without adding dates or technology inventories.

Keep the Read case study action at the bottom of each text column. Each row retains
one named native link and a complete outer focus outline. Hover and keyboard focus
underline the title in the project color without movement. Color transitions respect
reduced motion. The portfolio index
retains its Layered editorial cards.

### Hero-led project facts

Keep Role, Timeline, and Duration once in the hero's Margin imprint. Preserve its
semantic definition list, native date elements, fallback role, and computed duration.
The project type remains in the eyebrow and breadcrumb above the cover. Omit the
former At a glance sidebar card instead of repeating these facts while reading.
After navigation, the sidebar continues with Focus. Outcomes belong in the project story.

### Scope ledger focus cards

Project Focus uses one opaque Lumen Card with 1.5rem corners and a 0.5rem
lower-right corner. Keep the sentence-case 0.75rem label opposite the target icon.
Replace the generic project-type statement with two or three authored `focusAreas`
from the project frontmatter. Each entry has a short `label` and a specific
`description` supported by the case study; do not turn technologies or outcome
metrics into a second inventory here.

Use a semantic definition list. Set labels at 1rem with a 2px purple margin rule;
place their 0.8125rem descriptions below, aligned to the label text. Separate rows
with fine rules and 1.125rem vertical space, without nested cards or hover feedback.
Use brand in light mode and accent in dark mode. Preserve the Focus heading and
`#sidebar-focus` fragment. Below 16rem of rail width, tighten horizontal insets and
use 0.875rem labels with 0.75rem descriptions so complete words remain readable
with enlarged text. Keep description tracking neutral rather than inheriting the
page's wider letter spacing.

### Reading close project sequence

When the reading layout stacks, follow the story with the existing Focus card,
then Dispatch sleeve sharing and Return folio navigation. Keep one copy of each
surface, in that DOM order, with 2rem between the reading groups. The story's
closing rule supplies the transition; omit the former decorative sidebar divider.

At the existing desktop reading breakpoint, place the sidebar beside the story
and closing actions, spanning both grid rows. Preserve its sticky position and
native scrolling in short viewports. Focus remains in the sidebar on desktop;
the single `#sidebar-focus` fragment and all closing links work without JavaScript.

### Hero-only project stack

The hero's Sculpted band is the single technology inventory on project detail pages.
Keep the Progressive stack: the first six authored technologies remain visible and
all remaining technology links stay behind the native More technologies disclosure.
Short stacks display completely. Preserve the total count, technology destinations,
keyboard focus, reduced motion, and operation without JavaScript. Below 14rem of
stack width, omit the decorative technology marker and tighten link insets so
ordinary technology names remain whole with enlarged text.

Omit the former Core stack sidebar card and its repeated disclosure. Navigation and
Focus retain their existing spacing and reading order. Keep
`#technologies` on the hero's technology content; `#sidebar-stack` remains a legacy
fragment on the hero section so existing links reach the complete stack.

### Impact rows outcome cards

Project Outcomes use an opaque Lumen Card with asymmetric corners and a plain header.
Place the 0.75rem purple heading opposite the trophy icon, matching Focus,
then separate results with fine rules. Explicit metrics use a 1.875rem purple value
beside their complete 0.8125rem
context; before-and-after results retain the previous value above the current one.
Written achievements use a small check and complete 0.875rem text. Keep weight 500
for headings and values, weight 400 for context, and no hover feedback.

Reuse the portfolio metric parser for explicit changes. Leading percentages and
counts keep their suffixes and full context; qualified claims stay prose. Preserve
the original statement once for screen readers and omit empty outcome sections.
Below 16rem of card width, stack value and context and tighten the insets so enlarged
text stays readable. The card remains fully rendered without JavaScript.

Client caption adds explicit client context when a case study spans several clients.
Pass `attribution` to `ProjectOutcomesCard` with the client and short project context.
Below the Outcomes label, use a wrapping 0.8125rem caption with a medium-weight
client name, muted context, and a 0.75rem top gap. Smith uses Marcone and Storefront
rebuild. Remove only that client's repeated name from measured display labels;
keep the original full claims in `impactMetrics` and the accessible summaries.
Unattributed cards, written claims, values, and existing fragments stay unchanged.

Context trail adds optional same-page `contextLinks` after the outcome rows. Keep a
fine top rule, 1rem vertical padding, and the card's existing horizontal insets.
Pair the muted 0.75rem Explore label with 0.8125rem medium-weight links and decorative
down-right arrows. Links retain a 2.75rem minimum target and visible focus. Below
35rem of available width, stack the label and full-width links with right-aligned
arrows. Below 16rem, omit the decorative arrows so enlarged labels keep whole words.
Smith links to Marcone's Before and after and Technical highlights sections.
Lumen uses the same treatment for Capabilities, Technical highlights, and Used in
this website, pointing to its existing narrative fragments. These provide chapter
context, not benchmark citations. Omit the trail when no links are authored and
preserve native navigation without JavaScript.

Outcome chapter includes Lumen's Outcomes between Inside the product and Goals in
the existing contents rail and mobile Chapter opener. Author its level-three
Markdown heading in the card's slot so Astro collects the same label and position
as the story. Keep one visible heading and the Impact rows header treatment; retain
`#sidebar-outcomes` on the wrapper as an alias for the new `#outcomes` heading.
Reuse the rail's active marker, disclosure, keyboard behavior, and native links.

### Chapter evidence placement

Author one `ProjectOutcomesCard` in each project's MDX narrative with its collection
ID as `projectId`. Place it after the relevant chapter introduction, before its
technical subsections. When that introduction has a Contextual gallery, keep the
gallery first. Smith's claims belong in the Marcone chapter, before F.W. Webb.

Read the existing `impactMetrics` from the collection; do not copy claims into MDX
or repeat the card in the sidebar. Keep the Impact rows composition, original
qualifiers, and legacy `#sidebar-outcomes` fragment. Use a level-three heading
inside the chapter and isolate the card from prose typography. Its responsive
container follows the story width on desktop and mobile, without client relocation.

Unified evidence consolidates repeated numeric results into that one panel. Keep
all existing claims and client attribution in `impactMetrics`; remove the repeated
prose list rather than displaying the same results twice. Smith's Marcone panel
includes Lighthouse, Time to Interactive, accessibility, and First Contentful Paint.
Pass the old section fragment as the card's optional `id` when removing a heading,
so existing links still reach the consolidated evidence. Preserve `#sidebar-outcomes`.

### Shared reading contents

Articles and projects use `ReadingContents`, based on Smith's approved Chapter groups
and Captioned chapters. Keep one component, grouping utility, and controller for both
page families. Retire the older flat Margin rail implementation rather than maintaining
another navigation design. Reuse an approved composition before proposing a new one
when its content and interaction contract already fit.

Group each level-two heading with its following level-three sections inside native
Lumen Collapsible components. Headings without subsections remain direct links; keep
leading level-three headings reachable without inventing a parent. The opaque panel
uses the approved asymmetric corners, 0.75rem purple label, and fine rules between
chapters. Use 0.875rem chapter summaries, 0.8125rem section links, and 2.75rem minimum
interactive targets. Each expanded chapter starts with a named overview link to its
original heading. Keep the current section's 3px margin marker and accent in dark mode.

Captioned chapters separates a `Name: description` chapter summary into a 1rem name
at weight 500 and a 0.75rem description in `ink-soft`. Preserve the full heading text,
accessible punctuation, and existing fragment. Display its caption in sentence case;
name the overview link after the chapter, such as F.W. Webb overview. Ordinary chapter
headings retain a single label. Derive every label from the authored heading.

Single-chapter outlines start expanded. Lumen Anchor owns current-section tracking;
the shared custom element follows its public `aria-current` marker to open the owning
chapter. Previously automatic chapters close as reading moves on, unless the reader
has toggled them, selected a chapter link, or focus remains inside. Manual closing is respected until the active
section changes. Direct hashes open the inner chapter. Disconnect the observer and
fragment listener when Astro removes the component. Keep native disclosures and links
usable without JavaScript.

When an expanded mobile index is above the viewport, preserve the reading position as its
automatic chapters change height. Preview fallback links and enhanced buttons share their
width, wrapping, and minimum height so activating the viewer cannot shift a section below it.
Allow their labels to wrap within the available width when text is enlarged.

Below 16rem of rail width, tighten panel and link insets. Below 9rem, tighten them
again so enlarged text can wrap. Preserve visible keyboard focus in short, independently
scrolling desktop rails. Reading pages disable transitions under reduced motion so
native fragment targets remain stable when text is enlarged. Omit empty navigation
without a replacement card or reserved gap; project sidebars then begin with Focus.

### Chapter opener reading navigation

In stacked article and project layouts, `ReadingChapterOpener` places navigation before
the article opening or Work notes. Its closed native Lumen Collapsible shows On this
page, the top-level section count, and a downward chevron. Retain the opaque panel,
asymmetric corners, 0.75rem label, and 4.25rem minimum summary height.

Opening it reveals the same `ReadingContents` used on desktop, including collapsible
chapters where subsections exist. Embedded contents omit their own panel and title.
The outer opener remains under reader control even when a hash or scroll-spy change
opens an inner chapter. Scope the two disclosure levels separately.

Show the desktop rail only when the reading layout has both a 64rem viewport and a
56rem container. Hide the other copy with CSS so only one navigation is available to
keyboard and assistive technology. Preserve no-JavaScript navigation, enlarged-text
reflow, and omission when no eligible headings exist.

### Margin chapters case study summaries

Case study summaries use one opaque Lumen Card with asymmetric corners and a small
purple Case study heading opposite the notebook icon. Each ordered chapter pairs a
1.75rem purple number with a neutral vertical rule, a 1.1875rem heading, and the
complete 0.875rem narrative. Keep the numbers decorative and the chapter titles as
level-three headings beneath the level-two card title. Optional Metrics content
adds a fourth chapter; projects without summaries render no card.

Use plain rows without hover feedback. Tighten the margins in narrow reading columns;
below 16rem of card content width, place the number above the copy. Preserve readable
text, theme contrast, and full content when text is enlarged.

### Ownership ledger project detail lists

Project detail lists use full-width rows separated by fine neutral rules. A purple
3px margin rule introduces the authored lead at 1.125rem and weight 500; the complete
explanation sits opposite it at 0.9375rem with relaxed leading. Use a 0.9fr/1.1fr split
with a 2rem gap. Preserve the author's copy, inline code, links, and emphasis.

Below 32.5rem of list width, stack lead and explanation with aligned text insets.
Below 18rem, tighten the margin to preserve enlarged-text reading space. Plain entries
and standalone emphasized claims use the full row, without inventing a missing column.
Keep nested lists and ordered-list numbering semantic. This passive composition has
no card fill, shadow, decorative dots, or hover feedback.

### Intent brief project goals

Project goals retain their Section cadence heading and fragment. Present each complete
goal as one continuous statement in a named native list, with its opening phrase at
weight 500 in the semantic accent color. Use 1.1875rem text, 1.75 line height,
-0.01em tracking, and a 37em measure; the remaining text uses `ink-soft`.

Frame the list with fine neutral top and bottom rules, separate statements with the
same rule, and use 1.5rem vertical insets. Keep the composition open and preserve all
authored goals. Below 35rem of available width, reduce text to 1.0625rem while
keeping each sentence in normal flow. No extra headings, icons, or controls are added.

### Capability spread project entries

Product capability entries use an open two-column spread with 1.75rem gaps.
Each entry starts with a fine neutral rule, 1.5rem top inset, and a decorative
0.75rem accent number. Use a 1.25rem, weight-500 h4 with 1.4 line height, then
the complete description at 0.9375rem with 1.733 leading. Leave 0.75rem between
number, title, and copy. Preserve inline code and the authored entry order.

Below 35rem of available width, stack the entries in one column. Keep native
list semantics and associate the list with its existing Section cadence heading.
Entry headings do not add chapter navigation destinations. Use no card fill,
hover behavior, or client script; responsibilities and results retain Ownership ledger.

### Gallery sheet product previews

Contextual gallery places the existing Gallery sheets inside the relevant story
chapter, following its introduction and before technical details. Keep the gallery
fully visible, use a level-three heading and level-four caption titles, and let
reading navigation follow the authored order. Preserve the original gallery fragment
and all development-preview disclosures. Isolate the gallery from prose typography
so its image insets, caption scale, and card shapes stay consistent.

Product previews use one opaque Lumen Card with 1.5rem corners and a 0.5rem lower-right
corner. Place the complete screenshot on a quiet purple wash above its caption, with
1.25rem image insets. Keep intrinsic proportions, contain fitting, lazy loading, and a
32rem maximum image height so portrait screens remain balanced alongside web previews.

The caption pairs a decorative 2rem purple number with a 1.25rem title and the complete
0.875rem description. Use 1.75rem caption insets and a 2.75rem number column. Below
31.25rem of card width, tighten image and caption insets; below 18rem, stack the number
above the copy. Preserve descriptive image alternatives and product-preview disclosures.
Keep the sheet itself passive, without hover motion. Gallery viewer adds a small
View larger control below the screenshot, aligned to the right. Its outlined surface
uses 0.75rem corners with a 0.25rem lower-right corner and a 2.75rem minimum target.

The native Lumen Dialog retains the screenshot title, complete caption, and a visible
Close control. Fit the whole image initially; Inspect detail shows its full pixel width
inside a scrollable canvas. Keep the canvas keyboard reachable, support arrow-key panning,
and announce loading, complete-image, detail, and error states. Escape and backdrop
activation close the viewer and return focus. Keep the close row visible when enlarged
text or a short viewport requires scrolling. Both themes use opaque semantic surfaces.

Full-resolution images live in inert templates until requested. View larger remains a
direct image link without JavaScript; replace it with the dialog trigger only after
Lumen binds the trigger. Failed images offer an original-image link. Native Lumen
controls own modal opening, closing, and focus return; a small custom element manages
image insertion, detail inspection, and listener cleanup on page transitions.

### Comparison spread project screenshots

Before and after screenshots share one opaque Lumen Card with the Gallery sheet's
1.5rem corners and 0.5rem lower-right corner. A fine ruled header pairs the client
name with the comparison context. Keep each state label above its level-four title,
followed by the complete screenshot and the shared Gallery viewer control.

Use equal columns with 1.25rem insets and aligned caption, image, and action rows.
The After column uses the soft brand surface; a fine vertical rule separates it
from Before. Below 32.5rem of container width, stack Before above After and move
the dividing rule to the top. Below 18rem, reduce insets to 1rem. Preserve intrinsic
image proportions, descriptive alternatives, both visible states, and native
full-image links without JavaScript. The surrounding authored heading stays in
reading navigation; the comparison does not introduce extra navigation chapters.

### Context exhibit project illustrations

Keep supporting concept artwork beside the chapter copy in an open two-column layout.
Use a 15rem figure column, a 1.75rem gap, and a fine margin rule with 1.25rem inset.
Preserve the complete image at its native aspect ratio, with 1.25rem corners and a
0.3125rem lower-right corner. A small accent label identifies it as a concept illustration;
the project name follows in quiet text. This distinction separates artwork from product evidence.

Below 35rem of available width, stack the figure after the text, remove the margin rule,
and keep the image at most 15rem wide. Retain the authored chapter heading and original
paragraphs; use optimized lazy-loaded Lumen images without a new card or client script.

### Client masthead chapter headings

Introduce each client chapter with a small accent Client project label and sequence number,
followed by a fine horizontal rule. Set the client name at 2.375rem and weight 500, with
tight tracking; place the original descriptive subtitle beneath at 1.25rem in `ink-soft`.
Use open space rather than another card, and replace the standard heading underline with
the label's rule. Leave 1.75rem before the chapter introduction.

Below 35rem of available width, use a 2.25rem name and 1.1875rem subtitle. Allow complete
text to wrap, including at enlarged text sizes. Keep one authored Markdown h2 with spans
for the name and subtitle; retain the colon as screen-reader text. This preserves the full
heading, chapter index, and existing fragment without duplicate headings or client code.

### Context lead opening

Combine the project notes label and live stage with the authored opening heading and
introduction. Use a fine top rule, 1.5rem top padding, and a wrapping metadata row with
the accent label at 0.875rem and quiet stage at 0.8125rem. Leave 1.875rem before the
heading, set at 2rem, weight 500, and tight tracking. The original introduction follows
after 1.5rem at 1.125rem with 1.8 line height; below 35rem it uses 1.0625rem.

Opt in with `notesLayout: context-lead` and `ProjectContextLead` around the Markdown
heading and opening paragraphs. Give each paragraph the same reading scale and 1.5rem
separation. All project entries use this treatment and retain their complete introductions.
Follow the [shared authoring patterns](editorial/project-detail-patterns.md) for new entries.
Derive the label and stage from the existing project metadata.
Retain the original heading fragment, links, and claims; omit the generic preface rather
than repeating it. Margin preface remains available to other notes layouts.

### Section cadence narrative headings

Article body sections use the same fine trailing rule with a 1.6875rem, weight-500 h2,
1.4 line height, and −0.035em tracking. Leave 1.5rem between title and rule, 2.5rem
before the section, and 1.5rem before its body. Below 32rem of prose width, use a
1.5rem title, 1rem gap, and a 1.5rem minimum rule; below 14rem, reduce only the gap
and rule to 0.75rem so enlarged text retains room to wrap.

Keep each native h2 and its fragment. `rehypeArticleHeadings` places the existing
inline content in a span at build time so code, emphasis, and links remain in normal
text flow. It applies only to top-level h2 elements in current article content.
Nested component headings, project prose, and archives retain their existing
treatments. The rule is decorative and adds no navigation label.

Article body h3 elements use Subsection cadence: 1.3125rem type at weight 500,
1.4 line height, and -0.025em tracking. Leave 2.25rem before a subsection and
0.75rem before its content. Below 32rem of prose width, use 1.1875rem type.
Keep these headings unadorned beneath the ruled h2 sections. Style only direct
article prose children, preserving native heading levels, fragments, inline markup,
and the shared contents navigation. Component headings and deeper levels retain
their own treatment; no wrapper or runtime is needed.

Use a 1.5rem, weight-500 h3 with 1.4 line height and a fine trailing rule. Leave 1.5rem
between the heading and rule, 2.5rem before the subsection, and 1.5rem before its body.
Allow the original heading to wrap, including inline formatting, without clipping its
text or the rule. Keep the native h3 and fragment inside `ProjectSectionHeading`.

Adjacent narrative paragraphs use `ink-soft`, 1.125rem type, and 1.8 line height; below
40rem viewport width they use 1.0625rem. Apply the treatment to plain story subsections.
Keep the approved gallery, technical folio, client masthead, and reflection compositions
intact rather than layering another heading treatment over them.

Lumen uses Section cadence for Goals, What Lumen 4 brings together, Technical highlights,
Used in this website, and Why it matters. Preserve their authored content and fragments;
the product gallery and Outcomes keep their existing composed headings.

### Evidence brief project references

Lumen's compatibility and validation note uses an open Evidence brief beneath Technical
highlights. Keep its two qualifications intact, with a fine top rule, 1.5rem top inset,
and a 0.8125rem accent label. The main paragraph uses 1.125rem type and 1.8 line height;
the second uses 0.9375rem `ink-soft` text with 1.25rem separation.

Place the two existing references below in equal columns with a 1.5rem gap. Each native
link has a top rule, a 0.9375rem underlined name, a 0.8125rem description, and a decorative
arrow. Give links 1.5rem top and 1rem bottom insets, visible keyboard focus, and safe
new-tab behavior. Below 35rem of available width, stack links and use a 1.0625rem main
paragraph. Below 16rem, omit only the decorative arrows to preserve room for enlarged text.
The note is a named section; its label adds no entry to the chapter navigation.
When it follows an Ownership ledger, reuse that list's closing rule and bottom spacing
instead of adding a second divider.

### Architecture brief technical highlights

Lumen's Technical highlights keep the Section cadence heading and existing fragment.
Open with a fine accent rule, a 0.8125rem Web adapters label, and a 1.3125rem introduction.
Show Astro, React, and Web Components in three equal columns with 0.75rem gaps, fine
neutral rules, 1rem labels, and complete 0.75rem package names. These are readable
package identifiers, not controls. Preserve every authored technical claim.

Follow with an open definition list: one-third label and two-thirds description,
1.5rem gaps and vertical insets, and neutral rules between rows. Use 1.0625rem,
weight-500 labels and 0.9375rem descriptions. Inline code uses semantic accent text
over a 45% brand-soft tint to preserve dark-mode contrast. Below 35rem of available
width, stack adapters and definition rows; package names become 0.8125rem and wrap
without clipping. The following Evidence brief remains a separate qualification.

### Consumer trail website examples

Lumen's Used in this website section keeps its Section cadence heading and fragment.
Follow a 1.125rem introduction with two open example links in equal columns, using
1.5rem gaps, fine top and bottom rules, and 1.5rem vertical insets. Link the travel
notebook to `/travel/` and homepage product previews to `/#projects-heading`.
Each link has a 1.125rem, weight-500 title, a 0.875rem description with inline code,
and a decorative outward arrow. Keep the complete link target at least 2.75rem tall.

Use a 1rem paragraph for the site's responsibilities, then the existing feedback
and migration-guide paragraph at 0.9375rem with 1.5rem separation. Below 35rem,
stack the links with one shared divider and reduce only the introduction to 1.0625rem.
Below 16rem, omit decorative arrows to preserve enlarged-text reading space.
Internal examples use native same-tab navigation; the migration guide opens safely
in a new tab. Keep all visible example text in each accessible link name and preserve visible keyboard focus,
and the existing chapter navigation. No card fill or client controller is needed.

### Principle close project takeaway

Lumen's Why it matters section retains its Section cadence heading and fragment.
Give the central principle a 1.6875rem lead with 1.5 line height, -0.025em tracking,
and a 23em measure. The application-policy sentence uses semantic accent color and
weight 500. Keep the composition open, without a card fill or decorative icon.

Below the lead, place the three audience perspectives in equal columns with 1.5rem
gaps and 2rem separation. Each has a fine neutral top rule, 1.25rem top inset,
a 1rem weight-500 h4, and 0.9375rem secondary copy at 1.8 line height. Use a native
list; its audience labels do not become chapter links. Below 35rem of available
width, stack the perspectives and reduce the lead to 1.4375rem. Preserve all three
benefits and the distinction between reusable interfaces and application policy.

### Synthesis spread closing reflection

Close a multi-client case study with an open composition: a small What carries forward
label and fine rule, the original heading at 2rem and weight 500, then its introduction.
Arrange the client perspectives in two equal columns with 1.75rem gaps. Give each a fine
top rule, a 1.125rem name, and 0.9375rem explanatory copy. A full-width rule introduces
the shared takeaway at 1.125rem, with its key phrase at weight 500.

Below 35rem of available width, stack the perspectives, reduce the heading to 1.875rem,
and use 1rem introduction and takeaway text. Preserve all original claims and the
closing heading's fragment. Keep this composition free of another card surface or
client script; perspective labels do not create additional navigation chapters.

### Destination brief project hero actions

Use one soft brand Lumen Card for the named external destination. Pair a quiet context
label and 1.375rem name with a dark Visit action, keeping the existing site's accessible
button contract. The panel has 1.5rem corners and a 0.375rem lower-right corner, with
1.5rem insets and a 1.25rem gap. The action uses 1.125rem corners and a 0.3125rem
lower-right corner. Let the title and action wrap naturally rather than shrinking text.

Place preview, repository, and browse links below, with 44px minimum targets. Use a
downward arrow for the chapter preview, an outward arrow for external destinations,
and a right arrow for the parent archive. Show the archive context for archived sites.
Below 35rem of container width, reduce panel insets to 1.25rem; below 18rem, use 1rem.
Projects without an external destination retain the browse link without an empty panel.

### Connected folio technical highlights

Keep chapter-specific technologies in one opaque Lumen Card, with 1.75rem corners
and a 0.5rem lower-right corner. The soft brand header identifies the client,
retains the authored chapter heading, and explains the connections to other projects.
Use three ruled groups with decorative icons and three columns of native links.
Each link places its name above the project count, with the arrow beside the count
so long names have the full column width. Counts match the technology archive and
include the current project. Never invent destinations or copy counts into content.

Use 1.75rem horizontal insets and 70px minimum technology rows. Below 35rem of
container width, use two columns and 1.25rem insets; below 15rem, use one column.
The footer explains the counts and links to All technologies. Preserve keyboard
focus, both themes, and the heading's existing fragment without adding group
headings to chapter navigation. This contextual subset complements the hero's
complete inventory and adds no client JavaScript.

### Letter folio newsletter signup

The Blog newsletter uses one opaque Lumen Card with a small upper-left corner and
1.75rem remaining corners. A soft brand header pairs the 1.875rem editorial heading
with a decorative mail icon. Give the form a visible email label and an always-visible
Get new posts action. A fine rule separates the consent copy, Privacy link, and RSS link.

Use 1.75rem horizontal insets and keep controls at least 44px tall. Below 25rem of
card width, stack the field and button and place RSS beneath the consent copy. Tighten
insets and omit decoration when enlarged text needs the space. Preserve the native
POST, hidden embed field, email validation, new-tab behavior, and existing destinations;
the signup needs no additional client script.

### Margin reply article mentions

Article replies and mentions use a flat Lumen Card with fine top and bottom rules.
Place the author and optional date in a narrow margin with a 3px brand rail, and
give the response the wider column with 1.125rem text and a 1.8 line height.
The View original link follows the response with a 44px minimum target.

Use a 0.65fr / 1.65fr split and a 1.75rem gap. Below 27rem of card width, stack
the identity above the response; below 18rem, reduce insets to preserve reading
space. Long names and unbroken response text must wrap without horizontal overflow.
Keep normalized timestamps, anonymous-author fallbacks, escaped plain-text replies,
the 2,000-character limit, and safe external links. Likes use the separate Reader margin strip.
This passive layout adds no client script or hover motion.

### Reader margin article likes

Place the derived like count in an 11.875rem margin beside a wrapping reader list,
with a 1.75rem gap and fine top and bottom rules. Pair a 2.25rem count with a small
singular/plural label and “Across the IndieWeb” beneath. An accent rail separates
the list; each native Lumen link pairs a 44px avatar with the full reader name.
Reuse Lumen Avatar with an Astro Image slot to preserve lazy loading, the empty
image alternative, and the no-referrer policy for remote images.

Below 30rem, stack the heading over the list; below 18rem, tighten the inset and
gap. Long names wrap without truncation and every link keeps a visible focus
outline and at least a 44px target. Preserve source-link and “Someone” fallbacks,
initials when no photo exists, and the complete list. With zero likes, omit the
strip; replies and mentions remain independent. Use accent in dark mode and add
no client controller, additional data requests, or hover motion.

### Code accent inline code

Article inline code uses the existing `font-code` monospace token, matching fenced
examples while keeping the purple text, soft brand background, rounded corners,
padding, weight, and relative size of the current treatment. Preserve native `code`
semantics and wrapping in paragraphs, lists, headings, quotations, and tables.
Scope this font change to article prose; retain Code folio and Tab folio layouts.

### Code folio article examples

Standalone article code blocks use a soft brand toolbar, a small Lumen code icon,
language and optional filename, and a visible Copy action. Keep the asymmetric
0.375rem / 1.625rem corners, fine outline, opaque surface, and no shadow.
Use the site `font-code` token at 0.875rem with a 1.85 line height. A quiet ruled
line-number gutter supports scanning without adding numbers to copied text.

Keep long snippets horizontally scrollable in their labeled, keyboard-focusable
code region. Wrap long filenames and toolbar controls; reduce insets at 27rem
and 18rem of card width for mobile and enlarged text. Retain Shiki highlighting,
Lumen copy success/error announcements, visible copy states, and a 44px target.
Package-manager tabs use the related Tab folio treatment and shared runtime.

Scroll cue adds a quiet ruled footer inside a standalone article Code folio only
when its code region overflows horizontally. Use the Lumen `move-horizontal` icon
and “Scroll horizontally to read more” at 0.75rem with a 1.6 line height. Match
the code insets as the card narrows. Keep the cue stable while scrolling and hide
it when the example fits. Associate visible guidance with the code region through
`aria-describedby`; preserve native scrolling, keyboard focus, and Lumen copy.
Recalculate after resizing and font loading, and disconnect observation when the
figure leaves the page. Without JavaScript, leave the cue hidden and code readable.

### Tab folio package-manager commands

Use the same asymmetric corners and fine outline as Code folio, with an underlined
active manager in a soft brand toolbar. Put the visible Copy action at the toolbar's
end, moving it onto a separate row below the choices when the card is narrower than
28rem. Tabs wrap so all choices remain available with enlarged text.

Keep the monospace command on its own opaque surface. The small shell prompt is
decorative and must never enter copied or spoken command text. Lumen retains tab
selection, keyboard navigation, synchronized saved preferences, copy feedback, and
accessible announcements. Without JavaScript, show every command in document order
and hide the inert toolbar. Do not overlap the copy control with scrolling code.

### Update folio article notes

Use `ArticleUpdateNote` for an authored update to an existing article. Its labeled
Lumen Callout has a soft brand title band, a decorative notebook icon, and an opaque
reading area with normal text and underlined links. Keep the asymmetric 0.375rem /
1.75rem corners, fine outline, complete date label, and all original destinations.

Import the component in an MDX article and pass the visible label as `title`; write
the body as Markdown inside its slot. The title is a note label, not a new article
section. Preserve ordinary blockquotes for quoted material. Reduce the note insets
below 30rem and 18rem of container width so enlarged text and link focus remain clear.
This static treatment requires no client script.

### Margin quotation article blockquotes

Ordinary article quotations use an open surface with fine top and bottom rules,
a decorative Lumen quote icon in the margin, and a slim accent rail beside the
text. Keep the native blockquote, citation attributes, authored paragraphs, inline
formatting, links, lists, and nested quotations. Use upright, regular-weight text
with a generous line height; do not add automatic quotation punctuation.

Below 29rem of quote width, move the icon above the passage and reduce the text
and inset. Tighten the rail inset again below 18rem for enlarged text. Use the
theme's readable accent in dark mode. This build-time treatment adds no client
script and does not change project prose or convert update notes into quotations.

### Successor spread project replacement notices

Use `ProjectReplacementNotice` in MDX when a project has an authored replacement.
Keep the superseded statement and original package in an open context column,
beside one soft brand destination with the successor's namespace, larger package
name, and an inset circular arrow. Fine top and bottom rules frame the notice;
the explanation sits beneath the spread. Preserve the recommendation for new
projects and the internal replacement URL.

The labeled Lumen Callout composes an inherit-style Link and decorative Icon.
Let the link's visible recommendation, package name, and action supply its accessible name.
Its labels do not add article sections or table-of-contents entries. Keep ordinary
blockquotes unchanged. Stack the spread below 35rem of container width, reduce
destination insets below 26rem and 18rem, and allow long package names and enlarged
text to wrap. The whole destination is keyboard accessible without client script.

### Table folio article comparisons

Markdown comparison tables use Lumen's existing keyboard-scrollable table surface.
Keep an opaque paper background, fine outline, alternating 0.375rem / 1.75rem
corners, and a soft brand column header. Give the first column a subtle tint and
medium-weight text so row labels remain easy to scan. Separate body rows with
quiet rules and use 1.25rem cell insets.
Reduce horizontal insets below 24rem and 18rem of container width, allowing header
labels to wrap at the narrowest size so each cell fits even with enlarged text.

Preserve native table markup, authored alignment, captions, headings, and complete
cell content. Let column widths follow the content instead of fixing proportions
for one example. Wide tables scroll inside the named region on narrow screens;
the page itself must not overflow. Keep a visible focus outline, keyboard access,
and readable header accents in both themes. This treatment requires no script.

### Reader colophon article closing

Articles close with an open sequence of comments, existing webmentions, and sharing.
Align Comments and Share in a 5.375rem margin with a 1.5rem
column gap. The discussion invitation uses a 2px purple rail, a 1.5rem text inset,
and a 1.4375rem lead. Use a quiet underlined Reply on GitHub link with a 44px target.
Sharing pairs Pass it on with the existing copy or native share action, followed
by its three social destinations. Fine bottom rules separate the sections.

Stack the margin above the content below 32rem of available width,
reduce the discussion inset below 18rem, and let actions wrap at enlarged text
sizes. Keep complete labels, visible focus, and theme-aware semantic colors.

The invitation sits above the provider widget. Keep Giscus lazy loading, theme
synchronization, and polite failure guidance in the existing controller. The
GitHub destination must remain available while loading, after failure, and without
JavaScript. Align the widget beneath the discussion column on wide layouts and
use the full width on narrow layouts. Do not reserve an empty widget area for readers
without JavaScript. Project pages retain Dispatch sleeve and Return folio through
the shared components' default variants.

### Final return article closing links

Place the existing Reader colophon Back to Blog and Back to top links after the
optional related-writing section. The final row spans the page's content container
and uses the shared `ProjectFooterNav` colophon variant, with no additional card
surface or client behavior. Keep exactly one page-end navigation landmark.
`RelatedPosts` owns its conditional section wrapper, so an article without
recommendations proceeds directly from sharing to the return row without an empty
section. Preserve the native `/blog/` and `#main` destinations and wrapping controls.

### Article progress

Retain the thin purple Lumen progress indicator at the viewport edge. Measure only the
article prose: begin at its reading position below the sticky header, finish when its last
line is visible, and remain complete through the series continuation and page closing.
Scrolling back into the prose reduces progress again. Keep the accessible percentage in
sync with the visible bar, including resized viewports and enlarged text. Do not add a
visible percentage badge, second indicator, or new card. Project pages keep their existing
document progress.

### Reading measure

Keep ordinary article paragraphs and top-level lists aligned to the left reading edge,
with a maximum inline size of 40rem (640px at the default text size). Let the available
column width constrain them naturally on narrow screens; the rem-based measure expands
with enlarged root text. Preserve the approved Margin lead opening, Section cadence
headings, quotations, code, tables, and illustrations at their existing widths. Keep the
contents rail, series continuation, and closing sections in their established positions.
Scope the measure to authored prose inside `data-article-prose`, leaving project pages
and embedded component layouts independent. No wrapper or client behavior is added.

### List rhythm

Article lists follow the paragraph reading scale: 1rem below the shared `sm`
breakpoint and 1.125rem above it, with a 1.625 line height. Apply this to direct
unordered and ordered lists in article prose; nested list items inherit the scale.
Keep Reading measure, native markers, numbering, authored links and emphasis,
and the existing list spacing and indentation rules. Preserve list markup and
embedded component layouts without a transform or client script.

### Margin imprint article publication details

Article headers use one semantic description list between fine horizontal rules.
Give the published date a purple left rule, 1.4375rem type, and a wider first column.
Read time and word count sit beside it with neutral margin rules, 0.75rem sentence-case
labels, and 1rem values. An optional update date occupies a quiet row beneath those
two details; omit that row and its space when no update date exists. Keep native
Lumen `FormattedDate` output and the existing reading-stat calculations.

Use 1.5rem vertical insets and column gaps, with 1.125rem inside each margin rule.
Below 32rem of available width, put the published date above two reading-detail
columns and let the update line span the full width. Below 16rem, stack all details
and the update label. Preserve whole labels, complete values, and both theme palettes
with enlarged text. This passive composition adds no client JavaScript.

### Margin topics article links

Article topics use a named navigation landmark with a small Hash icon and Topics
label in a 6.75rem margin. Put the existing topic links in a wrapping semantic list
beside a 2px purple rail. Use 1.0625rem medium-weight text, fine link underlines,
small directional arrows, and 44px minimum targets. A fine bottom rule closes the
composition. Keep every topic, its order, and its canonical archive destination.

Below 32.5rem of available width, place the label above the list. Tighten the rail
inset and text at 18.75rem and 14rem; allow decorative arrows to wrap below a long
label with enlarged text. Preserve complete labels, visible keyboard outlines,
brand/accent theme colors, and the reduced-motion entrance. This needs no new script.

### Margin imprint project header facts

Project headers use one semantic description list between fine horizontal rules.
Give the role a purple margin rule, 1.4375rem type, and the widest column. Timeline
and duration use neutral rules, 0.75rem sentence-case labels, and 1rem values.
Keep the existing role fallback, native timeline dates, and computed duration.
Use 1.5rem vertical insets and gaps, with 1.125rem inside each margin rule.

Below 37rem of available width, put the role above the two supporting facts.
Below 22.5rem, stack all three fields. Below 12rem, use 1.125rem role type to keep
long words intact with enlarged text. Complete values remain visible in both
themes. This passive composition adds no client JavaScript.

### Sculpted band project technology strips

The project hero stack uses one opaque Lumen Card with alternating 2rem / 0.375rem
corners. A 10rem ink-colored margin holds the Layers icon, Stack heading, technology
count, and label. Invert its foreground with the surface token in both themes and
finish the margin with a small soft-brand curved corner.

Use the **Progressive stack** opening: show the first six technologies in authored
order, matching the sidebar's core selection. Keep the complete count in the margin.
Place the remaining technologies in interest order inside a native Lumen Collapsible
with a ruled `More technologies (N)` summary. Omit the disclosure when six or fewer
technologies exist. Preserve every technology link and support keyboard and pointer
expansion without JavaScript. Use semantic lists of Lumen links with 0.875rem text,
44px minimum targets, small asymmetric corners, and a
purple vertical marker. The links retain canonical technology archives and use the
project's readable accent on hover and keyboard focus, with a separate visible outline.

Below 35rem of available width, move the margin above the links and put the count
beside the heading. Tighten insets at 18rem and typography at 14rem to preserve
complete labels with enlarged text. Retain the technology anchor and reduced-motion
entrance; this composition requires no additional JavaScript.

### Margin preface content notes

Project notes without Context lead use an open, ruled introduction before the main content.
Keep the label and plain type or stage in a 9.375rem margin, with the full description
beside a 2px purple rail. Use a 1.625rem column gap and vertical insets, 0.875rem
labels, 0.8125rem metadata, and 1.0625rem description text with 1.8 leading.

Below 28.75rem of container width, stack the description beneath the wrapping label
and type row. Keep the same reading order, semantic theme tokens, and complete copy
with enlarged text. The project content wrapper leaves the top rule and insets to
this header to avoid doubled borders. This passive composition adds no client script.

### Series byline hero actions

After Topics, use an open row with the series position above its linked title and
a quiet Copy link action alongside it. The metadata reads From the series followed
by the current post number and series total. Use 0.75rem muted metadata, a 1.3125rem
medium-weight title, a purple directional arrow, and a fine bottom rule with 1.5rem
of breathing room. Copy link uses a transparent 0.8125rem label and a subtle underline,
retaining its success and error feedback and at least a 2.75rem target.

Below 32rem of available width, stack the utility beneath the series and use a
1.25rem title. Preserve full labels, visible focus, and brand/accent colors in both
themes. Standalone articles keep only the utility, and syndicated articles retain
Read on Medium in that position. The Blog breadcrumb replaces the redundant
Browse blog button. No additional client behavior is needed.

### Margin lead article opening

Blog articles pair their format with the original opening paragraph, replacing the
generic Article notes preface. Use a 6rem margin, a 1.5rem column gap, a 0.8125rem
format label, and a 2px purple rail with a 1.5rem inset. The lead uses ink-colored
1.25rem text with 1.85 leading and retains authored links, emphasis, and inline code.
The following paragraph resumes the full reading width and normal prose styling.

Below 32rem of available width, place the format above the lead and reduce its rail
inset to 1.125rem. Below 20rem, use a 0.75rem inset and 1.125rem text; below 14rem,
use 1rem text to preserve readable words at enlarged text sizes. Keep brand/accent
tokens in their corresponding themes. No client script is required.

The article-only Markdown transform wraps the first top-level paragraph before a
section heading. Existing update notes stay before the opening. Do not extract
text, duplicate the introduction, or promote a paragraph from inside a callout,
quote, list, or section. Projects and historical sites retain their own treatments.

### Return folio page-end navigation

Article and project detail pages close with a Lumen Card containing a named native
navigation landmark. Use an opaque surface, fine outline, and alternating 1.75rem /
0.375rem corners. Pair a circular purple back arrow with a small Back to label and
larger parent destination; keep Back to top as the quieter action alongside it.
Optional website, preview, and repository links occupy a separate ruled footer. The
Named return project treatment reuses the hero's named website or archive action and
adds a link back to the existing preview chapter. Use an upward arrow for that internal
return and outward arrows for external destinations. Omit the row when no destination
exists, and retain native URLs and safe external new tabs.

Below 28.75rem of container width, wrap the top row and stack external destinations.
Below 18rem, omit the decorative circle and tighten horizontal insets so long parent
names and enlarged text retain space. Below 12rem, use body-sized destination text,
smaller insets, and text-only links to keep whole words readable. Keep visible keyboard focus, complete link
names, and at least 2.75rem targets. This composition needs no client script.

### Unified return project destinations

Lumen consolidates its closing resources in the existing Return folio after sharing.
Remove the repeated inline destination sentence from the narrative; keep its final
takeaway intact. The footer retains the primary website, product previews, and repository,
with the existing playground URL supplied by optional `closingLinks` metadata.

Use a compact Back to / Projects label with a 1rem plain arrow, a 0.9375rem destination,
and the existing Back to top action. Give the top row 1.25rem vertical and 1.5rem horizontal
insets. Put the four resources in two columns below an inset rule, using 0.8125rem accent
links with outward arrows for external destinations and an upward arrow for previews.
Preserve complete link labels, 2.75rem minimum targets, visible focus, and safe new tabs.
Below 35rem of navigation width, stack resources and use 1.125rem horizontal insets.
Projects without supplementary closing links retain Named return; article colophons remain separate.

### Split pager archive navigation

Blog and topic archives use an open top rule with circular page links on the left
and directional actions on the right. Outline the current page in readable purple;
pair a quiet circular previous arrow with the stronger ink-filled Next page action.
Give that action alternating 1rem / 0.25rem corners and an inset arrow compartment.
Keep native links, previous/next relationships, accessible page names, and decorative
placeholders at either endpoint. Single-page archives omit the pager entirely.

Below 26.25rem of available width, put page numbers above the directional actions.
Allow numbers to wrap, preserving ellipses for larger archives and 2.75rem targets.
Below 16rem, omit the decorative next-arrow compartment and let its label wrap so
200% text remains readable. Use semantic theme tokens and native keyboard focus;
the composition adds no client script.

### Dispatch sleeve sharing controls

Use `ShareButtons` on article and project detail pages. A Lumen Card pairs a quiet
Share this piece label and Pass it on invitation with a prominent copy or native
share button. Keep the opaque surface, alternating 1.75rem / 0.375rem corners,
fine outline, and shallow brand-soft sheet beneath it. Place the three social
links in a tinted footer, with generous targets and outward arrows.

Stack the header below 28.75rem of container width, allowing social links to wrap
and reducing insets again below 18rem. Keep the full action names readable with
enlarged text. Preserve the existing native share, cancellation, clipboard,
busy-state, route cleanup, and live-result behavior. Script-free visits retain
all three social destinations and hide the unavailable copy/share button.

## Buttons and links

Use Lumen `ButtonLink` with its public `unstyled` variant for the sculpted treatment.
Keep native anchors for links wrapping a complete project or article.

- Primary action: solid high-contrast rectangle with a distinct arrow compartment.
- Secondary action: plain text with a visible arrow and a generous hit area.
- Project action: the complete card or row is the link; the arrow is decorative.
- Icon-only actions need a meaningful accessible name and at least a 44px target.
- Use a visible 2px focus outline with space around the control. Inside clipped, rounded
  navigation rows, place the outline inside the padded link so every edge stays visible.
- For a card that clips its cover, paint the cover link's keyboard outline on the rounded
  card using `:has(> a:focus-visible)`. Remove the clipped link's duplicate ring, retain
  individual outlines for title and action links, and avoid pointer-only `:focus-within` rings.
- Shared action links stay within their parent and wrap their label and decorative arrow when
  enlarged text needs more room. Nested icon labels may shrink with the control.
- Related-work shelves reduce their insets in narrow sections, scale headings to their reading
  column, and omit decorative action arrows when space is limited. Keep the complete label.
- Webmention avatar and standalone source links provide at least 44px targets. Inline author
  names retain their text-link behavior. Policy email links stay underlined in both themes.
- Keep hover changes subtle: color, border, or a small image scale. Do not move whole cards.
- Series cards and navigator title links use one block with a continuous focus outline when the title wraps.
- Passive principle, testimonial, topic, and format cards keep their colors, tracking, and
  decoration still on hover; reserve interaction feedback for actual controls.
- Article and project hero covers are passive reading images, with no hover glow, wash,
  zoom, or caption movement. Both openings use the shared Cover spread composition.
- Series step rows give keyboard focus the same color and background emphasis as hover.
- Choosing a blog topic keeps the filter's vertical position and focuses the selected topic
  link. Its horizontal scroll is retained unless the chosen topic needs to be brought into view;
  the strip's scroll padding leaves room for its focus outline. Only filter-originated
  navigation does this; ordinary navigation still focuses `#main`.
- Numbered case-study summaries put the number above the copy when enlarged text leaves
  less than 16rem of space. Keep the text size and complete labels.
- Project sidebar disclosures use Lumen's native details/summary behavior and a visible accent
  focus outline. In narrow rails, the chevron follows the label so it does not consume a
  separate text column. Keep the shared stat typography consistent for numbers and words.
- Topic cards reduce their column count with enlarged text and let the count badge wrap
  below long names. The badge supplies the post count once; the meter is decorative.
  Supporting-page eyebrows stay neutral in both themes.
- Technology summaries keep a solid surface and medium-weight labels. Their totals stack
  when the container is narrow; keep every digit and the complete technology names available.
- Organization logos fit the card's actual width. Carousel status and controls wrap before
  they reach the viewport edge. Narrow speaking panels reduce their insets and omit decorative
  action arrows when enlarged text needs that space for complete link labels.
- External links opening a new tab include `noopener noreferrer`; retain `rel="me"` where used.

## Shared navbar

Use the approved Signature frame direction: the identity sits on a raised tab that
joins the opening hero on Home, About, Work, Projects, and the first Blog page as
one continuous surface. Travel, reading pages, archives, and the scrolled header
use a compact solid dock; keep the same wordmark, controls, and alignment.
The supplied navbar references inform its connection to the page canvas, restrained
type, distinct contact action, and signature silhouette. Translate these relationships
through the site's existing Montserrat, semantic tokens, and editorial grid.

- Match the main content gutters: 1.25rem on phones, 1.5rem from 640px, 2rem from
  1024px, and 2.5rem from 1536px, with the same 72rem maximum width.
- Use a Montserrat 600 wordmark and 500 navigation labels. The raised identity tab
  ends in a quiet diagonal step; do not add a second signature label above it.
- Mark the current desktop route with a fine accent underline and `aria-current`,
  leaving its surface open. Hover adds a quiet neutral fill.
- Center the desktop links in the space between identity and utilities, with
  0.875rem labels and generous hit areas. At 64rem of header width, show the Search
  label and its `/` shortcut; narrower headers retain the same icon button.
- Keep the landing-page navigation strip open above the opaque hero frame. Scrolling
  fills the dock and adds modest depth. Separate desktop utilities with a fine
  vertical rule only when the contact action is visible.
- Preserve the attached mobile menu, numbered rows, utility spacing, 44px controls,
  keyboard behavior, and reduced-motion support. Opening fills the header into one
  continuous surface, with a short row reveal and 7px blur behind it. Keep the
  backdrop and scroll lock through the exit animation; reopening cancels the exit.
- Use Lumen's menu icon and show Menu/Close labels on phones when the header has
  at least 21rem of width. Keep icon controls at 44px when text or width needs more room.
  The current mobile destination retains its underline and gains a quiet Current label,
  omitted below 18rem of menu width. Internal destinations use right arrows.
  At 34rem of menu width, arrange links and footer actions in two columns, keeping
  row-first reading and keyboard order; enlarged text restores the single column.
  Below 14rem, omit decorative row numbers and arrows, including the contact
  arrow compartment, so labels stay inside their actions.
- Search uses **Search cover**: an asymmetric solid sheet, a tinted title area,
  and a bordered search field overlapping the lower edge of that title area. Keep
  the close control on its own surface, the blurred backdrop, and the existing
  Cover ledger results and Recovery folio states below the field.
  Long results scroll inside the dialog while the input and close control remain
  visible. At short heights, hide decorative copy and the visible shortcut legend
  before reducing the results scroll area; keep the legend available to assistive
  technology. Rem-based container queries adapt to enlarged text, with icon-only
  controls retaining a 44px target. When enlarged text leaves less than 20rem
  of width, omit decorative result thumbnails so titles keep a readable column.
- Search results use Cover ledger: a contained cover tile, an accent content-type label,
  a larger title, and the complete description. Ruled rows use the same soft tint for hover
  and keyboard selection. A decorative Lumen arrow sits inside the row's 1rem end inset
  and 1.375rem bottom inset; never position it against the hover edge. Smaller layouts
  omit the arrow and reduce the cover tile, then omit artwork when enlarged text needs
  the full reading width. Search ranking, focus, announcements, and native links are unchanged.
- Search empty and unavailable states share one Recovery folio component: an asymmetric soft-tinted sheet with a large,
  left-aligned heading, a decorative search icon, and a ruled action area. The native
  Clear search button keeps its 44px target and returns focus to the input. Use the same
  composition without an action for the no-suggestions fallback. Narrow and enlarged-text
  layouts stack the icon and copy; short screens compact spacing while preserving scrolling.
  The unavailable state uses the danger icon and a Try again action in the same composition.
  Retrying keeps the query and returns focus to the input; preserve the real request deadline,
  loading feedback, and live announcements. Keep recent searches and popular topics unchanged.
- Pixel breakpoints set the default navbar. The header bar is also a `site-header`
  inline-size container: with enlarged text it hides the contact action below 60rem and
  switches to the attached menu below 50rem. From 640px it visually hides the Menu label
  below 26rem (keeping its accessible name) and the wordmark below 22rem. Below 12rem,
  the icon controls compact to exactly 44px. The open menu closes on resize only when the
  layout hides its toggle. Observe header size changes as well as window resizes;
  changing text size must keep the open surface attached. Keyboard wrapping must
  reveal the destination inside the scroll region. A completed new-tab action
  returns focus to the toggle, and switching to the desktop bar keeps the matching
  destination focused. Canceled actions leave the menu available. Below 500px of
  viewport height, compact header spacing and icon controls to leave room for a
  full navigation row, including with enlarged text.
- Use real outlines and borders for forced-colors focus and current-page markers;
  menu icons inherit the control's text color. Shared header styles own the search and
  theme controls; do not restore the retired conic borders or spring effects.

Opt into this composition with `headerVariant="signature"` on `Base` and the
`signature-frame` utility on the opening surface. The shared frame owns the
72rem alignment, inset spacing, solid background, and stepped corners. Keep each
page's content layout: About's portrait, Work's introduction and statistics,
Projects' summary, and Blog's latest story. The story sits directly on that
surface without a nested card border. Narrow Projects statistics stack when
their container cannot fit readable columns, including with enlarged text.

## Content sections

1. **Track record:** four bare Lumen `Stat` articles. Keep value, label, and context together.
2. **Selected work:** one featured project, followed by concise linked experience rows.
3. **Independent projects:** two featured products and supporting project rows.
4. **Writing:** chronological article rows with full titles, publication dates, and reading times.
5. **Community:** a tinted folio with community and speaking links on one inset reading sheet.
The integrated shared footer uses the same direction. Continue using `SiteFooter` so its contact,
navigation, social, and legal links stay consistent across routes.

Keep project ordering and article visibility under the existing content utilities. Development
mode may show drafts and scheduled articles; judge the public content against a production build.

### Portrait spread homepage profile

The homepage portrait shares About's curved caption treatment at a quieter scale.
Keep its existing 4:5 frame, centered 40% crop, responsive image sources, and eager
loading. Give the frame a 1.875rem upper-left corner, a 0.375rem upper-right corner,
and a straight lower edge. Below it, place the handle above a 1.4375rem name at
weight 500. The 7rem location mount uses `brand-soft`, a 1.5rem inverse curve, and
a 1.875rem lower-right corner. Use the active theme's accent for the handle.

Below 20rem of portrait width, tighten the name and location column. Below
16.25rem, move the location into a small right-aligned tab beneath the complete
name. Preserve the native figure, image description, hero actions, and product
bookmarks; do not add an overlay or animation to the portrait.

### Project bookmarks hero shortcuts

The homepage hero ends with a named product navigation containing two native project links.
Each bookmark pairs an optimized logo on a tinted rail with its title and complete short
summary. Keep Lumen UI and PostLens in their existing order and preserve their case-study
links. The separate “All projects” action remains visible at every width.

Use the `home-hero` container to stack the pair below 39.5rem. Tighten the rail and insets below
21.25rem and place the logo above the copy below 16rem for enlarged text. Keep full text,
visible focus, and stationary cards on hover. The hero headline, portrait, and primary actions
retain their existing layout.

### Sculpted ledger homepage statistics

The homepage's four experience and impact statistics use Lumen Stat articles with
tinted number panels, small decorative icons, and separate label and description
sections. Keep the existing values, suffixes, descriptions, and AnimatedNumber
behavior, including static accessible text and reduced-motion support.

Use fine borders, opaque surfaces, and 1.75rem corners except for the 0.5rem
lower-right corner. Values use brand emphasis in light mode and accent emphasis
in dark mode. Cards stay passive, without hover or navigation affordances.
The `home-content` container changes four columns to two below 53.125rem. Below 33.75rem,
use four horizontal rows with a 6.5rem tinted number rail beside each label and description.
Omit the decorative icons, reduce the number scale to 2rem, and keep every description in full.
Below 18rem of available width, stack the number panel above the copy so enlarged text stays
readable. Keep numbers and units together.

### Offset spread featured work

The homepage's featured professional work uses a soft outer Lumen card, an opaque copy sheet
that overlaps the artwork, and a separate result-and-role footer. Keep the project title,
description, and “View case study” together. Read the result through the shared portfolio metric
helper, preserve its complete screen-reader text, and keep unsupported metrics as prose.
Smith uses its existing commerce-system illustration with `object-fit: cover`; keep the central
brand visible and give the artwork slightly more than half the spread. The whole composition is
one native link with an outer focus outline and remains stationary on hover.

A `featured-work` container stacks a 16:10 artwork panel above the sheet below 38.75rem, including
when text is enlarged. Below 23.75rem, tighten the inset and allow evidence and metadata to wrap.
Keep independent product cards and supporting projects in their own layouts.

### Product previews on the homepage

Homepage independent products use paired Lumen cards with existing product captures in Lumen
DeviceFrame components. A web workspace pairs a laptop with a phone; native apps pair two phones.
Use quiet project-colored backgrounds and optimize the images with Astro. Keep each capture's
accessible description. Keep the homepage image area free of captions, with a quiet lower inset;
development and illustrative-data disclosures remain in the linked case study. These are static
previews within one native project link, without interactive device controls.

An opaque reading panel follows the preview with a small project mark, title, full description,
technologies, timeline, and “Explore the project”. Keep this panel flush with the card edges so the
image and copy share one frame. Align metadata and actions along the bottom of the pair. Projects
without preview captures retain their optimized cover fallback.

Stack the pair below a 44rem `home-content` container or a 768px viewport, including when text
is enlarged. Below a 23.75rem card container, reduce the inset. Below 16rem, omit the decorative
project mark and tighten padding. Preserve the outer keyboard focus outline and stationary hover.

### Supporting project cards

Supporting professional work and independent projects use individual Lumen cards with a quiet
brand-colored title panel above the full description and “Read case study” action. A numbered
masthead pairs the continuing project number with its optimized logo on the required light or
dark brand surface. Professional work also shows its first authored impact metric. Preserve
project order, full copy, one native link per card, and the outer keyboard focus outline.

Professional work forms three columns above a 58rem `home-content` container and stacks below it.
Independent supporting projects retain two columns until the 44rem threshold, with a 768px
viewport fallback. Below 20rem of card width, reduce insets; below 16rem, tighten the logo and
heading scale; below 12rem, omit the decorative logo. Let copy grow at enlarged text sizes and
keep the action row aligned at the bottom. Hover underlines the heading without moving the card.

### Editorial spread latest writing

The homepage writing section opens with one wide featured article: dimensional cover artwork
beside its title, complete excerpt, date, reading time, and a solid reading action. Follow it
with three open, image-led articles in one desktop row. Use an unstyled Lumen Card per article,
one native link per card, and the collection's chronological order. The lead card has an opaque
surface and sculpted corners; supporting articles use the page canvas with a fine action rule.
Avoid a second notebook frame, nested borders, or text laid over the artwork.

Select the three curated Start here recommendations first, then fill latest writing with the
four newest remaining posts. Each article appears once across the homepage writing section;
the visible recent list and its structured data use the same selection.

Use Astro Image for all four covers, preserving descriptive alternative text, responsive sources,
lazy loading, and the central subject of each image. Keep the supporting images at their native
16:9 ratio. The lead image may crop its quiet edges to fill the split composition. Its latest
article label, all post types, decorative numbers, and metadata remain outside the image.

Below a 64rem `home-writing` container, stack the lead artwork and copy to preserve the complete
cover and a comfortable title width on laptops. Below 56rem, show the remaining articles as
image-and-copy rows. Below 38rem, stack every article's image and text. Tighten the
lead's insets and title below 20rem and 16rem for enlarged text. Keep the complete excerpts,
visible keyboard outlines, and stationary hover behavior. All four recent links, three Start
here recommendations, and the RSS action remain available without JavaScript.

### Community folio homepage panel

The homepage community panel uses a tinted Lumen card with an introduction beside an opaque
reading sheet. Numbered destination rows keep their complete descriptions, role labels, and
explicit actions. Preserve the external community link, internal speaking links, section heading,
and shared footer action. Each row remains a native link with a fully visible focus outline.

The `home-community` container stacks the sheet below the introduction under 48rem and hides the
decorative conversation symbol. Tighten insets below 21.25rem, then reduce heading sizes and omit
decorative arrows below 16rem for enlarged text. Keep the action labels, descriptions, and all
destinations visible. Hover changes the title color and underline without moving the card.

### Closing statement footer invitation

The default footer is one continuous surface for the invitation, directory, and colophon.
An oversized two-line heading leads the composition, with a sculpted Lumen `ButtonLink`
for WhatsApp on the right. The quiet email link sits directly below that action. The desktop
contact column aligns with the social directory; fine rules separate the invitation and legal
information without introducing another enclosing card.

Preserve the complete invitation copy, contact values from `siteConfig`, native links, and
visible keyboard focus. Identify WhatsApp in the action so visitors know where it leads.
The compact footer on policy and recovery pages retains its directory without a contact pitch.

Use the `footer` container to stack the invitation below 48rem and place the contact options
in one column below 32rem. The large desktop action becomes a horizontal contact strip on
smaller screens. Reduce the heading scale below 21rem and 16rem; omit its decorative arrow
at the narrowest width. Keep full text visible at 200% text size, and preserve the fixed
Back to Top control's clearance at the end of the colophon, including tablet widths
where the open footer has less horizontal inset than the compact sheet.

### Page composition around the cards

The Base layout exposes its responsive flow gap through `--page-flow-gap`. A direct
`PageSection` and the manual Projects, Portfolio, Blog, topic, and technology archive
sections share `page-section-space`. This counts the existing flow gap toward one
spacing interval: 4.5rem on phones, 6rem on tablets, and 7rem on desktop. Nested
sections retain the full interval. Do not add another top margin or padding to these
sections. Topic archives keep one topic filter beside the results rather than
repeating the same destinations between the hero and article section.
Statistics keep their divider and cards in one group so the page does not insert
another gap between them. Preserve the separate spacing contracts of Home, About,
Work, Travel, History, and the reading templates.

Article and project templates use one hero-to-body interval: 3rem on phones, 4rem
when the reading container reaches 40rem, and 5rem from 56rem. The body owns this
padding; do not add a parent flex gap or a second top inset on the article notes.
Keep the article notes at the start of their column in the desktop reading grid.

Stacked section headers keep two generous title and description columns. When a
browse action is present, place it below the description instead of squeezing the
copy into a third column. DX uses this arrangement for its working definition and
field guides; the Principle spread occupies the full width below the introduction.
Work's section headings use the same 500 weight and responsive editorial scale.

Use a stacked `PageSection` for catalogs that already have their own hierarchy: the
Blog series shelf, series index, technology index, shipped systems, and speaking
history. At wide container sizes, place the section title beside its description
and optional action, then give the cards the full grid below. Narrative sections
such as the speaking community, formats, and booking invitation keep their split
introduction. Technology groups keep one category margin and use three link columns
only when the index has at least 64rem; two and one columns preserve reading space
as the container narrows. Statistics must declare the actual two, three, or four
columns, including conditional archive statistics, instead of leaving empty tracks.
On phones, statistics omit the empty prefix line so values align with their icons;
visible qualifiers such as “Since” retain their own line.

Technology archives reuse the approved Refined editorial project gallery from
Projects, including complete card descriptions, open surfaces, plain technology
labels, and a continuous keyboard outline. Project-colored hover and focus headings
use the palette's readable color for the active theme.

Within technology archives, use **Matched stack** in each card: put the selected
archive technology first, followed by up to two authored supporting technologies.
Compare canonical slugs so aliases such as CI/CD and CI-CD match once. Use the
archive's preferred label, a decorative check, and a small brand-soft background;
include an accessible “Archive match” prefix. Use ink text in dark mode to keep
the tinted badge readable. Keep the whole card as one link.
Only mark a match when the project actually lists that technology. Other gallery
consumers retain their authored first three technologies and plain labels. Let
long matched names wrap without clipping the check or the full-card focus outline.

The archive opening uses **Evidence index**: keep the shared editorial hero, use
“Technology evidence” and “In practice.”, and derive its entry count and category
description from the rendered collection. A ruled index presents Work experience,
Projects, and Community counts as native links to their existing section headings.
Omit empty groups and adapt singular copy; do not repeat statistics at the page end.
Retain the existing gallery order. All technologies and Portfolio sit below as
quiet text links. At less than 32rem of hero width, stack the index into count,
label, and arrow rows. Keep visible focus, enlarged-text reflow, and heading
clearance below the fixed navigation; no client script is needed.

Section introductions use **Evidence chapters**. Place the selected technology and
the collection-derived count on one wrapping metadata line, then pair one concise
category heading with its description in equal columns. Use the existing heading
IDs for the opening index and incoming fragments. Keep Projects, Community, and
Work experience in their existing order, with singular count labels where needed.
Use a fine closing rule, 1.75rem lower inset, and a 2rem column gap; below 40rem of
chapter width, stack the heading above the description with a 1.25rem gap. Retain
the shared gallery and its spacing below the introduction.

Archive endings use **Stack connections**: an open “Used alongside” heading followed
by up to six related technology links in a ruled two-column ledger. Derive counts
from the visible archive entries, counting each canonical technology once per entry;
exclude the selected technology and sort by shared count, then canonical slug.
Use singular entry copy and identify page-local counts on paginated archives.
Keep All technologies and Browse portfolio as quiet closing links. Below 36rem,
use one column; keep full names, counts, native links, and visible keyboard focus.
Omit the section when no connected technologies exist. No client script is needed.

Featured portfolio cards combine Layered editorial with the horizontal overlap of
Home's Offset spread. At 56rem of card width, artwork occupies the left side while
the content sheet overlaps its right edge. The complete description, metrics, and
action stay together in the sheet. Smaller containers retain the vertical overlap;
supporting and related-work cards retain their existing composition. Preserve the
status badge and full-card focus outline without covering either with the sheet.

## Responsive behavior and accessibility

Below 768px, switch editorial sections and independent product cards to one column. Featured work
uses its container threshold above. Stats use two columns.
Supporting project descriptions move below their titles. Writing retains the full title, excerpt,
date, reading time, and link on small screens.

Test at 320, 375, 768, and 1440px in light and dark modes. Verify horizontal overflow, keyboard
focus, full-card links, navigation after Astro page swaps, and automated accessibility checks.
Preserve one `h1`, meaningful section headings, and semantic navigation landmarks.

The sticky header ends 6rem below the viewport top, so the root scroll padding is `7em` on
`<html>` (equal to 7rem there) and fragment targets land below it. It uses `em` because WebKit
can resolve a root `rem` scroll padding against the default font size, which places enlarged-text
headings under the header. Project headings and evidence briefs rely on this single clearance;
do not add another header-sized scroll margin. Project subsection headings use manual hyphenation
to preserve whole words. Below 20rem of reading width, omit their decorative line so enlarged
words can use the whole column.
Article and project layouts mark their `<article>` with
`data-reading-layout`, a named `reading-layout` container. The prose and its sidebar
(`data-reading-body` and `data-reading-rail`) share a row only on desktop viewports whose reading
container is at least 56rem in root-relative units. Enlarged text moves reading navigation
to the Chapter opener and stacks project context below the prose instead of squeezing it;
the default 1024px layout keeps both columns. Under that same
condition the semantic sidebar `<aside>` stays sticky, caps its height to the viewport below the
header, and scrolls natively; inline padding keeps the table of contents' active marker and focus
rings visible. Otherwise rails stay in normal flow. The generic `editorial-rail` utility, such as
the 404 suggestions, never becomes a scrolling region. Hero metadata grids use a named
`editorial-meta` container: article publication dates move above two reading-detail columns below 32rem
and stack below 16rem. Project roles span both supporting facts below 37rem, and all project
facts stack below 22.5rem, so enlarged labels never split mid-word. Project covers keep artwork
clear of duplicate facts and captions at every width. Pills, resume
contacts, history actions, and talk links wrap inside their containers with enlarged text.
The screen resume has no rounded clipping boundary, so its edge labels and focus rings stay visible.
The footer colophon reserves the Back to Top corner wherever the two would meet.
The phone homepage hero also reflows its heading, actions, and project shelf when text grows.
On tablets and desktops, the Home frame's `home-hero` container adopts the phone layout for the
stage, portrait, caption, and actions below 39.5rem, keeping the viewport's type scale,
so enlarged headings never split words or run into the portrait. The default desktop and 768px
tablet compositions are unchanged, and the frame's own padding still follows the viewport.
These rules apply only inside Home; other `maker-hero` pages are unaffected.
The `home-content` container adapts the sections below the hero as well: statistics
use two columns below 28rem and one below 20rem. Below 20rem, project and writing
rows place their copy beneath the number and arrow, and community insets tighten
to preserve reading space. Featured cards use their own container rules above.
About's `about-page` container and the `projects-intro` container stack their columns below 40rem
the same way. Projects purpose shortcuts fill separate rows below 34rem. Below 14rem, About tightens its frame
inset and scales headings to the container so whole words fit. Editorial project cards stay in two
columns only while each keeps 20rem, and the featured card stacks below 40rem. Below 14rem a card
hides its decorative title arrow so the full title gets the row. Portfolio cards
tighten their inset below 20rem and wrap plain technology labels. The About carousel grid shows up to three 18rem
columns. Its script uses the resolved column count as the page size, and it moves focus to the
opposite control when paging disables the focused one. Travel country cards use Passport folio:
a soft cover, a real country silhouette, a prominent count, and numbered place rows. The desktop
map reserves 42rem for the card and controls; longer entries can scroll inside the card. Phones
and a `travel-atlas` container below 30rem put the card below the map.
Below 20rem, the hint, zoom toolbar, and details panel leave the overlay and sit in flow, so none
covers the map or a focused control. The close control takes its own row above the country name. The Blog topic filters wrap on mobile, with space between tags for visible focus outlines.

Prose headings, History eras, Travel sections and countries, and the Developer Experience
`#field-guides` target use the root scroll padding without an additional header-sized scroll
margin. Fragment targets start at their visible heading rather than at a padded section top.

Supporting pages follow the same rule: a viewport breakpoint sets the default composition, and a
root-relative container width decides whether side-by-side columns still fit, so enlarged text
stacks content instead of splitting ordinary words. Single-column grids use `minmax(0, 1fr)`
rather than an implicit `auto` track, so one long word or control cannot widen the page.

- `PageSection` is a `page-section` container. Its editorial header column appears from 1024px
  only while the section has 50rem; `layout="stacked"` always stacks it.
- Below 20rem of section width, principle, topic, format, and series cards reduce
  their insets to preserve reading space at enlarged text sizes. The newsletter owns
  its Letter folio container rules and stacks its field and labeled action below 25rem.
- The `card-grid-2`, `card-grid-3`, and `card-grid-4` utilities keep a grid's breakpoint column
  count while each card has `--card-grid-min` (16rem by default), then drop a column. They back
  `StatsGrid`, `PostsGallery`, series cards, and the Speaking and Developer Experience card grids.
  `ProjectsGallery` has one editorial presentation, shared with technology archives; its own
  container rules control the leading project's image and copy.
- Work's intro frame is a `work-intro` container: the hero stacks below 44rem, the statistics
  form one column below 53.125rem, use a compact figure rail below 27.5rem, and stack
  figures above copy below 17.5rem. Its section summaries wrap below their heading.
  Below 14rem the page also tightens its frame inset and scales the headline to keep short words whole.
- Speaking timelines move their date rail above the card below 32.5rem. Career dates move above
  the folio below 36.25rem, with tighter insets below 20rem. Career rows keep their
  complete 2px accent focus outline inset within the link.
- Speaking's hero places the profile beside the headline only while it has 54rem; the community
  dossier and booking invitation have their own surface containers.
  Profile facts keep two columns only while each has 7rem.
- The Technologies index places its filter and group labels in side columns only while the
  index has 38rem, so the search field stays inside its card.
  Below 20rem, its side insets tighten. Pill labels may wrap while counts keep all digits
  together. Group headings name the category and the filtered tool count.
- Policy rows keep their three-column ledger while the list has 42rem, stack each heading above
  its copy below that, and move the number onto its own row below 16rem.
- On screen, the resume header keeps the name and contacts in one row while the resume has
  36rem. Print rules and both PDFs are unchanged.
- Topic sort controls wrap under the label, and the 404 numeral scales down on narrow screens.
  The 404 illustration remains still with either motion preference.
Shared editorial heroes and the Speaking hero size their headlines to the reading column
below 14rem, following About and Work. History uses the same approach in its own hero copy
container. Its chapter navigation uses four, two, then one column as the reading space
narrows, so enlarged dates stay within the frame and each complete link remains available
to the keyboard. Archive labels and captions wrap; below 18rem, preview address bars omit
their decorative browser controls to leave room for the address.
The TOC marker reaches a heading at its native fragment landing line, including with enlarged
root text, through a temporary patch of Lumen's `Anchor` runtime. See
[the Lumen integration notes](lumen-integration.md#anchor-runtime-patch) for its ownership and
removal condition. Never use a negative heading scroll margin to align the marker.

Keep motion optional. Hover transitions last 180–300ms; reduced-motion mode removes transitions
and image scaling. The homepage content adds no client JavaScript.

### Page transitions

Keep the header and navigation progress visually steady during route changes.
Use viewport snapshots so different page lengths and scroll positions cannot
stretch or shift the outgoing content. Content exits in 90ms, then enters over
180ms with a 60ms start delay and a restrained 6px rise. Do not interpolate page heights or
replay initial-load hero and logo animations underneath the route transition.
Article covers retain their shared names and use Lumen's emphasized easing with
a 240ms geometry transition. Keep the header above those image snapshots.

Astro owns navigation, history, fragment scrolling, focus, and announcements.
Browsers without native View Transitions use an immediate client swap; reduced
motion removes snapshot animations. Verify both themes at 375px and 1440px,
including article entry and Back, topic filters, and cross-page fragments.

### Caption spread article illustrations

Standalone article illustrations use their full native aspect ratio above a short caption and
an accent figure number. The image has a large upper-left corner and a small upper-right corner;
its lower edge joins the caption. The numbered mount ends in a rounded lower-right corner.
A transparent concave corner beside the number follows the page backdrop without covering artwork.
Keep the caption as text, not a new section heading. Figure numbers restart for each article.

The caption uses 1.25–1.75rem medium type; the figure label uses 0.6875rem and the number 2.875rem.
Below 25rem of figure width, reduce the number column and spacing. Below 18rem, reduce the type
and number column again; below 12rem, stack the number below the complete caption. This also
supports enlarged text. Keep descriptive alt text, native image dimensions, lazy loading, and
Astro image processing. These reading images have no hover effect or added client JavaScript.

Author a short visible caption with the standard Markdown image title:
`![Descriptive alt text](./figure.webp "Short caption.")`. The current-site article adapter
converts standalone captioned images into native `figure` / `figcaption` markup. Images without captions,
inline images, linked artwork, and already-authored figures retain their existing markup. Project content and
historical sites use their existing image treatment.

### Cover spread article and project openings

Place the headline and artwork before the summary, author, Margin imprint publication
facts, Margin topics links, and existing article actions. Project openings use the same shared
`CoverSpread` layout, retain the project title gradient, and place the description, Margin imprint
project facts, actions, and Sculpted band technology strip below the artwork. Landscape artwork keeps its native
aspect ratio and optimized image pipeline. The headline occupies nine of twelve columns;
a transparent notch follows its lower corner, overlapping the artwork by at most 4.375rem. The cover has a
raised right corner and no shadow, gradient, or repeated caption. Keep the heading once.

Below 36.25rem of available width, widen the title and stack summary and byline. Below
23.75rem, remove the overlap and give the complete image a small asymmetric corner treatment.
Root-relative queries also stack enlarged text and moderate title size in very narrow reading
columns; keep title words whole instead of automatically hyphenating them. Square and portrait article images retain the existing
contained Lumen frame and never overlap the title. Articles without artwork keep their title,
summary, and metadata in reading order. Covers remain passive; do not add hover effects.

## Implementation reference

Site-owned blog pictures and covers that preserve their native aspect ratio use AVIF sources
with a responsive WebP fallback. This avoids expanding WebP originals into large PNG fallbacks
while retaining the existing dimensions, crop, alternative text, and loading priorities.
Landscape article heroes use that same native-aspect path, so matching widths reuse
the listing's image URLs instead of generating identical bytes with different dimension options.
Portrait and square article covers retain Lumen's contained frames; project artwork keeps its native aspect ratio.
The installed Lumen `CoverImage` still owns its own format selection; do not pass unsupported
format props through its wrapper. Keep source artwork and archived-site assets.

- `src/components/pages/home/`: homepage compositions.
- `src/styles/partials/home-hero.css`: hero styling.
- `src/styles/partials/home-content.css`: homepage content styling.
- `src/styles/partials/nav.css`: navbar styling, developed independently.
- `src/styles/partials/tokens.css`: website extensions to the shared theme.
- `src/components/organisms/SiteFooter.astro`: shared footer, developed independently.

Use Lumen `Stat`, `Card`, `ButtonLink`, and `Icon` rather than duplicating their component contracts.
Use Astro `Image` for optimized assets. Keep home-specific rules scoped to their compositions.

## Supporting pages and reading templates

The Blog landing and supporting routes opt into `remaining-pages` through the Base layout's `mainClass`.
The Blog keeps its image-led latest-post composition with the same editorial typography
and solid surfaces. The other primary landing pages retain their integrated compositions. Shared `PageHero`
uses a plain eyebrow, a Montserrat 500 headline, a solid purple emphasis, a short introduction,
and a fine metadata rule. Its `compact` mode serves smaller archive introductions.
The `editorial-title` text token controls responsive title size, leading, and tracking.

Archives, technology indexes, speaking, developer experience, and portfolio summaries use
solid Lumen surfaces with no hover lift. Statistics retain their approved sculpted cards in one shared grid. Search, topic sorting, counts, disclosures, and pagination retain their existing
Lumen and consumer behavior. Topic filtering restores its position after
the destination page has loaded. Long article grids render visibly without a group reveal
threshold. Remaining Lumen `RevealGroup` consumers keep the
[explicit `threshold={0}` settings](lumen-integration.md#tall-reveal-groups): a tall group must
reveal as soon as it intersects, even when less than 15% can fit in the viewport. Verify
painted opacity with motion enabled as well as reduced motion, including keyboard jumps to
the last item. All article titles wrap in full at every viewport width. The shared `Button`, `ButtonLink`, `Eyebrow`, and `SectionHeader` defaults also follow this
direction outside the page scope. Actions use a dark primary with a light arrow tile where
present, rounded secondary controls, and plain text links. All controls retain a visible
focus ring and at least a 44px target. Short motion respects reduced-motion preferences.

Legal and accessibility statements use numbered, divided rows with real section headings.
They keep the complete policy wording and review dates. The shared `PolicyContactCard`
uses Contact folio: a tinted label strip, a larger invitation, an underlined email link, and
a separate ruled note for dates and response expectations. Keep the policy-specific email
subjects and full wording. Its narrow-container rules preserve complete words with enlarged text.

Related-work shelf headers use the open, ruled composition described under Related
projects. Keep the full project-type heading, parent destination, and native navigation
at enlarged text sizes. Other `SectionHeader` variants retain their existing layout.

### Margin continuation related-writing headers

Article recommendations use the shared `SectionHeader` with `variant="margin"`, above
the existing two-column `PostsGallery` in a stacked `PageSection`. Keep Related writing
in a 6rem margin column, with a 1.625rem gap before the copy. A fine neutral vertical
rule and a 2px, 3.375rem accent segment mark the copy's edge; inset it by 1.75rem.
Use a 2.25rem, weight-500 title with balanced lines, a 0.875rem description, and the
existing inline browse action. Keep the header open, without another card surface.

Below 35rem of available width, place the label above the copy and reduce the title
to 1.875rem and the inset to 1.25rem. Below 18rem, use a 1.5rem title and a 0.625rem
inset so enlarged text and long action labels remain whole. Use accent in dark mode,
retain visible keyboard focus, and preserve the blog or developer-experience destination.
Recommendation selection, series exclusion, article cards, and project shelf headers stay
with their existing components and contracts. No client script is required.

Article and project headers use
lighter titles and open metadata rows; project titles retain their readable project-brand
accent. Long-form prose, code controls, reading progress, and sticky table-of-contents links
keep their existing reading behavior. The table of contents uses an open rule instead of
a glass panel. The resume uses the same canvas on screen; its separate print rules and
both downloadable PDF variants remain authoritative.

### Search dock technology index controls

The technology index uses **Search dock** within the **Catalog first** opening,
immediately after the compact headline and description. Keep the shaped bar,
quiet search field, and separate live-count surface. The introduction supplies the
search context; omit the former Stack snapshot eyebrow and repeated explanation.
Follow the dock with three ruled group shortcuts, each showing its live catalog
size and recurrence threshold. Stack those shortcuts into rows on narrow screens,
and hide them during a search. Quiet Work and Portfolio links close the opening.
Preserve native fragment destinations and visible keyboard focus.
The count moves below the field on narrow containers; remove the decorative search
icon only when needed to preserve input width. Keep visible focus, complete labels,
singular and plural counts, and the full result sentence for screen readers.
Filtering uses the Match ledger below and retains the Catalog note empty state.
Preserve technology order, recurrence counts, native technology destinations, and
text resizing.

### Match ledger technology results

When the technology search has a query, replace the large group introductions with
one open ledger. Use a small Matches for heading and a quiet explanation that
counts represent portfolio entries. Each ruled native link aligns its technology,
Core/Regular/Selective group, entry count, and decorative forward arrow. Keep the
existing catalog order and destinations, without duplicate links or added cards.
At narrow widths, place the group and count on a second line beneath the name and
arrow. Keep whole names, visible focus, light/dark contrast, and text enlargement.
Clearing restores the complete grouped catalog; zero matches use Catalog note.

### Search folio Blog topics controls

The Blog topics search and sort panel uses **Search folio**: one sculpted sheet,
a small search icon and visible field label, a large underlined search field, and
a muted footer joining the sort options with the live result count. Use `ink` and
`surface` for the selected sort segment, with visible focus around each control.
At narrow widths, let the footer wrap and separate the joined options when needed;
keep all controls and text within the panel at enlarged text sizes.
Preserve query normalization, both sort orders, topic links, the Catalog note empty
state, and the existing motion and navigation lifecycle. This treatment belongs to
the search controls; the approved Compact topic cards remain independent below it.

### Sculpted tags related-topic shortcuts

Topic archives use **Sculpted tags** for the Related topics links below their introduction.
Keep the existing up-to-six topic selection, exclude the current topic, and preserve counts,
order, and canonical archive destinations. The named navigation contains a semantic list;
links wrap at every width and retain the shared count compartments and visible focus outline.
These destination shortcuts have no selected state and add no client JavaScript.

### Sculpted tags Work technology links

The Work toolkit uses **Sculpted tags** for its 18 highlighted technologies. Reuse the
shared `SculptedTag` shape, separate count compartment, focus outline, and wrapping layout.
Keep the data-derived order within each group, professional-project counts, technology archive destinations,
count explanation, and full-index action. These are navigation links with no selected state.
List items shrink within narrow containers so enlarged labels wrap without widening the page.

The approved **Toolkit lanes** arrange these links in four ruled rows: Web foundations,
Mobile, Data & state, and UI systems. Each row pairs a 10rem margin heading with the tags,
using a 1.75rem gap, 1.5rem vertical padding, a small accent number, and a 2px heading rail.
Use level-three headings below the toolkit heading; keep the numbers decorative. Below a
36rem Work container, put the heading above its tags with a 1rem gap. Retain the existing
Sculpted tag appearance, keyboard focus, full-index action, and count explanation.

### Career close Work ending

After Toolkit lanes and its count explanation, present two destination sheets in a
two-column grid: Open resume and Explore the full toolkit. Keep the selected copy,
an accent category label, a 1.5rem heading, the complete description, and a decorative
arrow aligned at the lower right. Use the shared sheet radius, 1.5rem insets, a
1rem grid gap, and a 14.625rem minimum height. Tint the resume sheet with the semantic
brand-soft surface and keep the technology sheet on the standard surface.

The entire sheet is one native link named by its heading, with an external focus
outline and at least 1.25rem between the arrow and the border. Below a 36rem Work
container, stack the destinations. Narrow containers reduce insets to 1.25rem and
allow headings to wrap. Hover and focus change the heading and border color without
moving the sheet. Keep the global contact invitation separate below this page ending.

### Sculpted tags Projects category shortcuts

The Projects page uses **Sculpted tags** for its Developer tools, Apps, and Experiments
section links. Each link has a shaped outline and a separate quiet compartment for the
collection-derived project count. Reuse `SculptedTag` with the Blog filters so the visual
rules stay aligned. Category links keep their native fragment destinations and do not
claim a selected filter state. The group wraps at every width, preserves visible keyboard
focus, and tightens its insets when enlarged text leaves little space.

### Sculpted tags Blog topic filters

The Blog index and topic archives use **Sculpted tags**: shaped topic links with a separate,
quiet count compartment. The selected link reverses the ink and surface colors, while
“All posts” carries a decorative layers icon. Keep the real topic counts and destinations.
The group wraps at every width; all topics remain available without horizontal scrolling.
Long labels wrap within their tag at enlarged text sizes, and focus outlines remain visible.
Selected links retain `aria-current="page"` on their own archive and `aria-current="true"`
on later pages. Topic changes preserve keyboard focus and the filter's vertical position.

### Reading controls

- Package-manager tabs (`data-package-manager-code-tabs`) wrap onto extra rows instead of
  scrolling, so every manager stays visible with enlarged text. Lumen's keyboard runtime is
  unchanged. Selection uses an underline and a contrast-adjusted brand accent in dark mode.
- Their panels use shared grid rows to place the copy header beside the tablist on wide
  cards and beneath it on narrow cards. Code scrolls in a separate full-width row, so the
  button never covers a command. Rules target public roles and `[data-ui-code]` hooks;
  the copy button stays before the pre in the DOM. Script-free visits use block flow.
- Ordinary Markdown code headers (outside package-manager tabs) use a wrapping flex row instead
  of Lumen's fixed three-column grid. When everything fits, metadata stays centered between the
  dots and the copy control. At narrow widths or with enlarged text, the language badge and
  optional filename wrap clear of the control instead of running beneath it. Rules target the
  figcaption's `aria-hidden` dots, its metadata `span`, and `[data-ui-code-copy]`, not Lumen classes.
- Each panel passes Lumen's public `codeLabel`, derived from the tab set's `ariaLabel`, so
  scrollable code regions are not all named "Code example". Direct MDX `Code` blocks also
  need a descriptive `codeLabel` for their purpose; repeated filenames are not unique labels.
- The `santi020k` code theme overrides only two public variables: the light
  `--ui-code-token-string` mixes 70% `success` with 30% `ink`, and the dark
  `--ui-code-token-keyword` reuses `--ui-code-inline-fg`, which also colors the language badge.
- Shiki's light comments use the shared theme's `descriptionForeground` color, retaining
  their italic style. The theme's original comment color is too faint on the reading canvas.
- The share "Link copied!" state uses a solid `brand-soft` background, with `brand` text in the
  light theme and a contrast-adjusted `accent` for text and border in the dark theme. Success, failure, reset,
  Web Share, and clipboard behavior are unchanged. The failed-copy state uses opaque `surface`
  with `ink` text and a `danger` border and icon; the visible failure label supplies the meaning
  without relying on color or translucent backgrounds.

### Recovery and discussion states

The 404 orbital illustration sits beside the status number, without a separate card
competing with the Wayfinding folio. Omit the decorative illustration when enlarged
text needs the space. Offline recovery places its Connection folio beside the
introduction at wide container sizes and below it on smaller screens. Keep Retry as
the single primary action, preserve all native destinations and live connection
status, and retain the compact footer on both recovery pages.

- The offline cache note uses Connection folio: a soft header, readable explanation, and a ruled
  connection-status row. Keep the polite status announcement and its decorative icon synchronized
  when connectivity changes. At narrow widths, stack the status icon above its copy so enlarged
  text retains its reading space. The retry action stays with the page's primary actions.
- The 404 suggestions use Wayfinding folio: a soft header and three full-row destination links.
  Each row pairs a title and description with a directional arrow; hover and keyboard focus
  underline the title. Keep the visible focus outline and the complete title and description in
  each accessible link name. At narrow container widths, omit the decorative arrow and underline
  titles persistently so enlarged copy can use the full row. The folio stays outside the scrolling
  sidebar rules.
- Comments expose a real section heading and retain the GitHub link during loading, failure,
  and no-JavaScript visits. Reserve widget height only once the client has been mounted.
  A failed client request hides the empty widget and announces concise fallback guidance;
  delayed failures from a departed article cannot change the current page.
- Webmention likes and replies expose section headings with the existing label typography.
  Displayed dates retain their readable format and carry a valid ISO `datetime` value.

Consumer-owned `data-site-eyebrow` and `data-reading-contents` attributes provide stable
styling boundaries where the Lumen component does not expose a `data-slot`. Other composed
surfaces use Lumen's documented Card, Stat, and ButtonLink slots. Do not target private
library implementation classes to extend this appearance.

See [remaining page coverage](remaining-page-designs.md) for route families, evidence,
validation, and local integration status.
