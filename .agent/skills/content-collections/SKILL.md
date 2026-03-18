---
name: Content Collections Architecture
description: Understanding the Astro Content Collections configuration, Zod schemas, and data querying.
---

# Content Collections Skill

Use this skill when modifying the data structure of markdown/MDX content or when fetching content for display.

## Architecture

This project uses Astro Content Collections defined in `src/content.config.ts`. The schema uses Zod (`astro:content`'s exported `z`) to ensure strict typing and validation.

Available collections:

- `post`: Blog posts (`src/content/post/`)
- `project`: Portfolio projects (`src/content/project/`)
- `note`: Short-form notes (`src/content/note/`)
- `series`: Post series categorizations (`src/content/series/`)
- `types`: Project type categorizations (`src/content/types/`)

## Modifying a Schema

When adding a new frontmatter field to a collection type:

1. Open `src/content.config.ts`.
2. Locate the relevant `defineCollection` block.
3. Add the field using Zod validation.

    ```any
      // Example: Adding an optional 'featured' boolean
      featured: z.boolean().default(false).optional()
    ```

4. If the field is a reference to another collection or a complex type, consider using `.transform()` to sanitize or format the data on load. Wait for `npm run check` to verify types.

## Fetching Content

Always use the built-in `getCollection` and `getEntry` methods from `astro:content`.

```any
import { getCollection, getEntry } from 'astro:content'

// Fetch all entries in a collection
const allPosts = await getCollection('post', ({ data }) => {
  // Filter out drafts automatically
  return data.draft !== true
})

// Sort by date (descending)
const sortedPosts = allPosts.sort((a, b) => b.data.publishDate.valueOf() - a.data.publishDate.valueOf())

// Fetch a single entry by ID
const specificProject = await getEntry('project', 'my-cool-project')
```

## Referencing Images

When defining `coverImage` or `ogImage` schemas, the collection uses Astro's `image()` helper to natively resolve relative image assets into processed `<Image />` objects. Always ensure image paths in markdown resolve correctly relative to the markdown file itself.
