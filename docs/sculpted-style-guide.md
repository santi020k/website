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

### Editorial project cards

The Projects gallery pairs the existing artwork with open editorial copy. Keep the standard
16:10 image and 1rem corners; the featured project retains its horizontal 16:9 composition.
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
moving the card or cropping the artwork. The default technology-archive gallery retains
its existing presentation.

### Editorial blog cards

All `PostsGallery` consumers use open cards with 16:9 artwork and 1rem image corners.
Place the post type and date beneath the image, followed by the complete 1.5rem title
at weight 500 and 1.35 leading. Descriptions use 0.875rem text with 1.75 leading;
metadata and the first two plain topic labels use 0.75rem. Keep a 1.25rem image-to-copy
gap, then one “Read article” footer with an arrow, reading time, and a fine bottom rule.
Align neighboring footers without clamping titles or descriptions.

Post frontmatter may provide `cardDescription`, a nonempty summary of at most 160
characters, with `description` as the fallback. The full description remains authoritative
for the article, search, feeds, and metadata. Preserve series sequence and draft labels.
The complete card is one naturally named link with a visible outline; hover changes
only the title color. Artwork stays still, and metadata and footers wrap for enlarged text.

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
without hover effects or new animation. Keep the dedicated Home, About, and Work
editorial statistics in their existing open layouts.

### Timeline folio career cards

Work's career list places the start year and month in an 8.125rem date rail beside a
single opaque Lumen Card. Keep the end month and year, or Present, in the rail too.
The purple connector leads each role; the card uses 1.125rem corners with a 0.375rem
lower-right corner and the navigation shadow token. A small status and decorative
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

### Layered editorial portfolio cards

Portfolio spotlights and related projects share one full-card link and an unstyled Lumen
Card. The artwork has 1.5rem corners; an opaque content sheet overlaps it by 3rem with
1.25rem side insets, 1.125rem corners, and a smaller lower-right corner. Keep the status
on an opaque badge over the artwork, followed by date, complete title, role, description,
outcomes, plain technology labels, and a ruled case-study action in the sheet.
Keep the outer Card transparent on both the portfolio index and reading pages so
the sheet's side insets expose the page canvas, not a second surface.

Use the horizontal project artwork, optimized at 16:10, so crops retain the central
brand mark without clipping social-preview text. Featured cards use a 2:1 artwork panel
to keep the portfolio page balanced. Below 36.25rem of card width, use a 4:3 crop, a
2.375rem overlap, and tighter insets; the same proportions apply in related-work shelves.
Below 20rem, scale long headings and let outcome columns stack. Never clamp descriptions
or outcomes. Explicit before/after and percentage-drop
statements may become value/label pairs; preserve all other statements verbatim and
retain the original wording for screen readers. Project colors highlight the title,
role, action, and sheet rules on hover and keyboard focus without moving the artwork.
Keep a complete outer focus outline, readable light/dark colors, and reduced-motion support.

### Project dossier sidebar cards

At a glance uses one opaque Lumen Card with 1.5rem corners and a 0.5rem lower-right
corner. Its plain header holds a sentence-case 0.75rem purple heading opposite the
info icon, matching Focus and Core stack. Show the full role at 1.125rem below its label.
Keep Type, Timeline, and Duration left-aligned below it, with quiet labels and fine
rules. Preserve semantic definition lists, individual time elements, the fallback role,
and computed duration. This is a passive reading surface with no hover feedback.
Below 16rem of rail width, reduce insets to preserve enlarged-text reading space.

### Margin note focus cards

Project Focus uses one opaque Lumen Card with the dossier's 1.5rem corners and
0.5rem lower-right corner. Place a sentence-case 0.75rem label opposite the small
target icon, then the complete focus statement at 1.125rem with 1.8125rem leading.
A 2px purple margin rule and 1.0625rem text inset give the statement its emphasis.
Use brand in light mode and accent in dark mode. Preserve the project-type copy,
semantic heading, and passive appearance. Below 16rem of rail width, tighten the
card and paragraph insets and use 1rem statement text to keep ordinary words intact.

### Stack ledger technology cards

Core stack uses one opaque Lumen Card with the dossier's asymmetric corners.
Place a sentence-case 0.75rem heading opposite the layers icon. Show the first six
technologies in a two-column semantic list: 0.9375rem names at weight 500, fine
bottom rules, and 1rem between columns. Keep the original content order.

Additional technologies remain behind Lumen's native disclosure, with a readable
count and one column of complete 0.8125rem names. Preserve keyboard focus, reduced
motion, and operation without JavaScript. Only the disclosure has hover feedback.
Below 17rem of rail width, tighten the insets; below 16rem, stack the main list in
one column so enlarged names retain enough reading space.

### Impact rows outcome cards

Project Outcomes use an opaque Lumen Card with asymmetric corners and a plain header.
Place the 0.75rem purple heading opposite the trophy icon, matching Focus and Core stack,
then separate results with fine rules. Explicit metrics use a 1.875rem purple value
beside their complete 0.8125rem
context; before-and-after results retain the previous value above the current one.
Written achievements use a small check and complete 0.875rem text. Keep weight 500
for headings and values, weight 400 for context, and no hover feedback.

Reuse the portfolio metric parser for explicit changes. Leading percentages and
counts keep their suffixes and full context; qualified claims stay prose. Preserve
the original statement once for screen readers and omit empty outcome sections.
Below 16rem of rail width, stack value and context and tighten the insets so enlarged
text stays readable. The card remains fully rendered without JavaScript.

### Margin rail table of contents

Project and article navigation use Lumen Anchor inside an opaque, asymmetric panel.
Place the 0.75rem purple On this page label opposite the list icon. A fine vertical
rule organizes the complete heading list: level-two links use 1rem text, and nested
headings use 0.8125rem text with a deeper inset. A 3px purple marker sits on the rule
beside the current heading. Use accent in dark mode and keep visible keyboard focus.

Keep native fragment links, Lumen's scroll spy, 2.75rem minimum targets, and reduced
motion. Below 16rem of available rail width, tighten panel and link insets. Navigation
must remain usable in short, independently scrolling desktop rails and with enlarged text.
Reading pages fully disable CSS transitions with reduced motion, including inherited text
size transitions, so native fragment targets remain stable when text is enlarged.

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
- Article and project hero covers are passive reading images. Keep their static shadow and
  caption contrast gradient, with no hover glow, wash, zoom, or caption movement.
- Series step rows give keyboard focus the same color, background, and arrow feedback as hover.
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
- Keep the landing-page navigation strip open above the opaque hero frame. Scrolling
  fills the dock and adds modest depth. Separate desktop utilities with a fine
  vertical rule only when the contact action is visible.
- Preserve the attached mobile menu, numbered rows, utility spacing, 44px controls,
  keyboard behavior, and reduced-motion support. Opening fills the header into one
  continuous surface, with a short row reveal and 7px blur behind it. Keep the
  backdrop and scroll lock through the exit animation; reopening cancels the exit.
- Search uses the same raised title tab, diagonal step, solid body, accent close
  control, and blurred backdrop. Keep its input and results separated by fine rules.
  Long results scroll inside the dialog while the input and close control remain
  visible. At short heights, hide decorative copy and the visible shortcut legend
  before reducing the results scroll area; keep the legend available to assistive
  technology. Rem-based container queries adapt to enlarged text, with icon-only
  controls retaining a 44px target. When enlarged text leaves less than 20rem
  of width, omit decorative result thumbnails so titles keep a readable column.
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
- Use real outlines and borders for forced-colors focus, the mobile menu symbol,
  and the desktop current-page marker. Shared header styles own the search and
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
5. **Community:** one tinted panel for community and speaking links.
The integrated shared footer uses the same direction. Continue using `SiteFooter` so its contact,
navigation, social, and legal links stay consistent across routes.

Keep project ordering and article visibility under the existing content utilities. Development
mode may show drafts and scheduled articles; judge the public content against a production build.

## Responsive behavior and accessibility

Below 768px, switch editorial sections and featured cards to one column. Stats use two columns.
Supporting project descriptions move below their titles. Writing can omit the secondary excerpt
on small screens while retaining the full title, date, reading time, and link.

Test at 320, 375, 768, and 1440px in light and dark modes. Verify horizontal overflow, keyboard
focus, full-card links, navigation after Astro page swaps, and automated accessibility checks.
Preserve one `h1`, meaningful section headings, and semantic navigation landmarks.

The sticky header ends 6rem below the viewport top, so the root scroll padding is `7em` on
`<html>` (equal to 7rem there) and fragment targets land below it. It uses `em` because WebKit
can resolve a root `rem` scroll padding against the default font size, which places enlarged-text
headings under the header. Article and project layouts mark their `<article>` with
`data-reading-layout`, a named `reading-layout` container. The prose and its sidebar
(`data-reading-body` and `data-reading-rail`) share a row only on desktop viewports whose reading
container is at least 56rem in root-relative units, so enlarged text stacks the sidebar below the
prose instead of squeezing it; the default 1024px layout keeps both columns. Under that same
condition the semantic sidebar `<aside>` stays sticky, caps its height to the viewport below the
header, and scrolls natively; inline padding keeps the table of contents' active marker and focus
rings visible. Otherwise rails stay in normal flow. The generic `editorial-rail` utility, such as
the 404 suggestions, never becomes a scrolling region. Hero metadata grids use a named
`editorial-meta` container: articles drop from four to two columns below 32rem, and article and
project metadata stack to one column below 16rem, so enlarged labels never split mid-word. Decorative
cover captions appear only when the cover's container is wide enough in root-relative units,
so narrow screens and enlarged text omit them rather than overflow the image. Pills, resume
contacts, history actions, and talk links wrap inside their containers with enlarged text.
The screen resume has no rounded clipping boundary, so its edge labels and focus rings stay visible.
The footer colophon reserves the Back to Top corner wherever the two would meet.
The phone homepage hero also reflows its heading, actions, and project shelf when text grows.
On tablets and desktops, the Home frame's `home-hero` container adopts the phone layout for the
stage, portrait, caption, shelf, and actions below 39.5rem, keeping the viewport's type scale,
so enlarged headings never split words or run into the portrait. The default desktop and 768px
tablet compositions are unchanged, and the frame's own padding still follows the viewport.
These rules apply only inside Home; other `maker-hero` pages are unaffected.
The `home-content` container adapts the sections below the hero as well: statistics
use two columns below 28rem and one below 20rem. Below 20rem, project and writing
rows place their copy beneath the number and arrow, featured project titles omit
the decorative arrow, and card and community insets tighten to preserve reading space.
About's `about-page` container and the `projects-intro` container stack their columns below 40rem
the same way, and the Projects ledger stacks below 17.5rem. Below 14rem, About tightens its frame
inset and scales headings to the container so whole words fit. Editorial project cards stay in two
columns only while each keeps 20rem, and the featured card stacks below 40rem. Below 14rem a card
hides its decorative title arrow so the full title gets the row. Portfolio cards
tighten their inset below 20rem and wrap plain technology labels. The About carousel grid shows up to three 18rem
columns. Its script uses the resolved column count as the page size, and it moves focus to the
opposite control when paging disables the focused one. On Travel, the country panel stays inside
the map and scrolls. A `travel-atlas` container below 30rem uses the phone overlay positions.
Below 20rem, the hint, zoom toolbar, and details panel leave the overlay and sit in flow, so none
covers the map or a focused control. The close control takes its own row above the country name. The scrolling mobile topic filter pads its row so pill focus rings
stay visible.

Prose headings, History eras, Travel sections and countries, and the Developer Experience
`#field-guides` target use the root scroll padding without an additional header-sized scroll
margin. Fragment targets start at their visible heading rather than at a padded section top.

Supporting pages follow the same rule: a viewport breakpoint sets the default composition, and a
root-relative container width decides whether side-by-side columns still fit, so enlarged text
stacks content instead of splitting ordinary words. Single-column grids use `minmax(0, 1fr)`
rather than an implicit `auto` track, so one long word or control cannot widen the page.

- `PageSection` is a `page-section` container. Its editorial header column appears from 1024px
  only while the section has 50rem; `layout="stacked"` always stacks it.
- Below 20rem of section width, principle, topic, format, series, and newsletter cards
  reduce their insets to preserve reading space at enlarged text sizes. The newsletter
  header wraps, and its email field and labeled submit action stack below 16rem of content
  width; keep the native POST and email validation.
- The `card-grid-2`, `card-grid-3`, and `card-grid-4` utilities keep a grid's breakpoint column
  count while each card has `--card-grid-min` (16rem by default), then drop a column. They back
  `StatsGrid`, `PostsGallery`, the regular `ProjectsGallery`, series cards, and the Speaking and
  Developer Experience card grids. The regular gallery's featured project pairs image and copy
  only while its card has 44rem.
- Work's intro frame is a `work-intro` container: the hero stacks below 44rem, the statistics
  use two columns below 38rem and one below 14rem. Its section summaries wrap below their heading.
  Below 14rem the page also tightens its frame inset and scales the headline to keep short words whole.
- Speaking timelines move their marker above the row below 16rem. Career dates move above
  the folio below 36.25rem, with tighter insets below 20rem. Career rows keep their
  complete 2px accent focus outline inset within the link.
- Speaking's hero places the profile beside the headline only while it has 54rem; the community
  impact list and the three booking notes have their own surface containers.
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

## Implementation reference

Site-owned blog pictures and covers that preserve their native aspect ratio use AVIF sources
with a responsive WebP fallback. This avoids expanding WebP originals into large PNG fallbacks
while retaining the existing dimensions, crop, alternative text, and loading priorities.
Landscape article heroes use that same native-aspect path, so matching widths reuse
the listing's image URLs instead of generating identical bytes with different dimension options.
Portrait and square covers retain Lumen's contained frames.
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
solid Lumen surfaces with no hover lift. Statistics form quiet strips rather than nested
cards. Search, topic sorting, counts, disclosures, and pagination retain their existing
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
They keep the complete policy wording and review dates. Article and project headers use
lighter titles and open metadata rows; project titles retain their readable project-brand
accent. Long-form prose, code controls, reading progress, and sticky table-of-contents links
keep their existing reading behavior. The table of contents uses an open rule instead of
a glass panel. The resume uses the same canvas on screen; its separate print rules and
both downloadable PDF variants remain authoritative.

### Reading controls

- Package-manager tabs (`data-package-manager-code-tabs`) wrap onto extra rows instead of
  scrolling, so every manager stays visible with enlarged text. Lumen's keyboard runtime is
  unchanged. In the dark theme the selected tab uses `ink` text and focus uses `accent`.
- Their code panels place the copy header in its own grid column beside a `minmax(0, 1fr)`
  pre that scrolls horizontally, so the button never covers a long command. Rules target
  `[data-ui-code] > figcaption` and `> pre`; the copy button stays before the pre in the DOM.
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
  light theme and `ink` text with an `accent` border in the dark theme. Success, failure, reset,
  Web Share, and clipboard behavior are unchanged. The failed-copy state uses opaque `surface`
  with `ink` text and a `danger` border and icon; the visible failure label supplies the meaning
  without relying on color or translucent backgrounds.

### Recovery and discussion states

- Keep the 404 suggestion links underlined in both themes, including before hover or focus.
- Comments expose a real section heading and retain the GitHub link during loading, failure,
  and no-JavaScript visits. Reserve widget height only once the client has been mounted.
  A failed client request hides the empty widget and announces concise fallback guidance;
  delayed failures from a departed article cannot change the current page.
- Webmention likes and replies expose section headings with the existing label typography.
  Displayed dates retain their readable format and carry a valid ISO `datetime` value.

Consumer-owned `data-site-eyebrow` and `data-editorial-toc` attributes provide stable
styling boundaries where the Lumen component does not expose a `data-slot`. Other composed
surfaces use Lumen's documented Card, Stat, and ButtonLink slots. Do not target private
library implementation classes to extend this appearance.

See [remaining page coverage](remaining-page-designs.md) for route families, evidence,
validation, and local integration status.
