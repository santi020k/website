# Astro Project Conventions

## Component Organization
- **Pages**: Located in `src/pages/`. Use file-based routing.
- **Components**: Located in `src/components/`.
  - Group related components (e.g., `src/components/blog/`).
  - Use `.astro` for templating and `Astro.props` for data passing.
- **Layouts**: Located in `src/layouts/`. Use for global page structures.

## Content Collections
- All content is defined in `src/content/config.ts`.
- Content files are in `src/content/{collection}/`.
- Always use `getCollection` and `getEntry` from `astro:content` to fetch data.
- Validate schemas when adding new collections.

## Routing
- Use trailing slashes for internal links (e.g., `/posts/my-post/`).
- Use `@/` alias for absolute imports from `src/`.

## Scripting
- Favor `<script>` tags in `.astro` files for client-side logic.
- Use `is:inline` only when strictly necessary for 3rd party scripts (like Pagefind).
- Use `alpinejs` for lightweight interactivity.
