# Sculpted website style guide

The redesign starts with the sculpted navbar, the new Home hero, and the homepage sections.
This is the visual direction for future page updates. Existing routes can migrate incrementally;
adding a new homepage style must not silently restyle reading, résumé, or portfolio pages.

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
animation on the homepage.

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

## Buttons and links

Use Lumen `ButtonLink` with its public `unstyled` variant for the sculpted treatment.
Keep native anchors for links wrapping a complete project or article.

- Primary action: solid high-contrast rectangle with a distinct arrow compartment.
- Secondary action: plain text with a visible arrow and a generous hit area.
- Project action: the complete card or row is the link; the arrow is decorative.
- Icon-only actions need a meaningful accessible name and at least a 44px target.
- Use a visible 2px focus outline with space around the control.
- Keep hover changes subtle: color, border, or a small image scale. Do not move whole cards.
- External links opening a new tab include `noopener noreferrer`; retain `rel="me"` where used.

## Content sections

1. **Track record:** four bare Lumen `Stat` articles. Keep value, label, and context together.
2. **Selected work:** one featured project, followed by concise linked experience rows.
3. **Independent projects:** two featured products and supporting project rows.
4. **Writing:** chronological article rows with full titles, publication dates, and reading times.
5. **Community:** one tinted panel for community and speaking links.
The shared site footer is being redesigned separately. Continue using `SiteFooter` so its contact,
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

Keep motion optional. Hover transitions last 180–300ms; reduced-motion mode removes transitions
and image scaling. The homepage content adds no client JavaScript.

## Implementation reference

- `src/components/pages/home/`: homepage compositions.
- `src/styles/partials/home-hero.css`: hero styling.
- `src/styles/partials/home-content.css`: homepage content styling.
- `src/styles/partials/nav.css`: navbar styling, developed independently.
- `src/styles/partials/tokens.css`: website extensions to the shared theme.
- `src/components/organisms/SiteFooter.astro`: shared footer, developed independently.

Use Lumen `Stat`, `Card`, `ButtonLink`, and `Icon` rather than duplicating their component contracts.
Use Astro `Image` for optimized assets. Keep home-specific rules scoped to their compositions.
