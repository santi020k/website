---
name: site-components
description: Choose an existing Astro composition (feature folders, shared atoms/molecules/organisms, page sections, layouts) before building new UI for this website.
---

# Site components

Use this reference when choosing an existing composition for this Astro website.
Read `docs/sculpted-style-guide.md` before visual work and inspect each component's
current `Props` interface before using it.

## Structure

Feature folders hold UI that belongs to one feature; put new feature-specific components there:

- `article/`: article and series pages, reading contents, code, sharing, comments, and webmentions.
- `project/`: project case studies, the project hero and sidebar, and project galleries.
- `search/`: the site search dialog and its controller modules.
- `technology/`: technology archive sections.
- `layout/`: the site header and footer.

Shared UI used across features stays in the atomic folders:

- `atoms/`: site adapters for Lumen buttons, links, typography, dates, and images.
- `molecules/`: composed content units such as section headers, cards, pagination, and forms.
- `organisms/`: page sections, stats grids, and the career timeline.
- `pages/`: compositions specific to Home, About, Work, Projects, Travel, and Speaking.

Data a page needs is loaded and shaped in `src/loaders/`, not in the page's frontmatter.

## Reuse the current compositions

| Need | Existing component |
| --- | --- |
| Homepage portrait and introduction | `pages/home/HomeHero.astro` |
| Homepage project selection | `pages/home/HomeProjectShowcase.astro` |
| Homepage writing rows | `pages/home/HomeWriting.astro` |
| Homepage community links | `pages/home/HomeCommunity.astro` |
| Shared section introduction | `molecules/SectionHeader.astro` |
| Article and project contents | `article/ReadingContents.astro` |
| Mobile reading contents wrapper | `article/ReadingChapterOpener.astro` |
| Supporting page introduction | `molecules/PageHero.astro` |
| Article listings | `article/PostsGallery.astro` |
| Project listings | `project/ProjectsGallery.astro` |
| Recommendations | `molecules/TestimonialCard.astro` |
| Personal principles | `molecules/PrincipleCard.astro` |
| Page shell | `layouts/Base.astro` |

Keep content selection in the existing collection utilities. Prefer Lumen primitives
for new interface elements, using the installed package's public props and slots.
Do not recreate retired card or portrait wrappers from old examples.

## Implementation rules

Use `@/` imports, typed Astro props, and `class:list` for conditional classes.
Keep the approved editorial grid, semantic tokens, one surface per content unit,
complete wrapping titles, and visible keyboard focus. Respect reduced motion.
Verify mobile and desktop in both themes; add behavioral coverage for interactions.
