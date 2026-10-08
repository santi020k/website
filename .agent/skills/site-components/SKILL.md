# Site components

Use this reference when choosing an existing composition for this Astro website.
Read `docs/sculpted-style-guide.md` before visual work and inspect each component's
current `Props` interface before using it.

## Structure

- `atoms/`: site adapters for Lumen buttons, links, typography, dates, and images.
- `molecules/`: composed content units, search, sharing, reading controls, and forms.
- `organisms/`: navigation, footer, galleries, timelines, and article/project headers.
- `pages/`: compositions specific to Home, About, Work, Projects, Travel, and Speaking.

## Reuse the current compositions

| Need | Existing component |
| --- | --- |
| Homepage portrait and introduction | `pages/home/HomeHero.astro` |
| Homepage project selection | `pages/home/HomeProjectShowcase.astro` |
| Homepage writing rows | `pages/home/HomeWriting.astro` |
| Homepage community links | `pages/home/HomeCommunity.astro` |
| Shared section introduction | `molecules/SectionHeader.astro` |
| Supporting page introduction | `molecules/PageHero.astro` |
| Article listings | `organisms/PostsGallery.astro` |
| Project listings | `organisms/ProjectsGallery.astro` |
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
