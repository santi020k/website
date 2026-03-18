---
name: Adding Pages
description: Steps for creating new top-level routes and updating standard site navigation.
---

# Adding Pages Skill

Use this skill to create a new standalone route/page in the application.

## Workflow

### 1. Create the Route

- Add a new `.astro` file in `src/pages/` (e.g., `src/pages/about.astro`).
- Use file-based routing: the filename becomes the URL path (`/about/`).

### 2. Implement the Base Layout

Every major page should wrap its content with the `Base.astro` layout to ensure consistent headers, footers, meta tags, and transitions.

```astro
---
import BaseLayout from '@/layouts/Base.astro'

const meta = {
  title: 'About Me',
  description: 'Learn more about my background and experience.'
}
---

<BaseLayout meta={meta}>
  <div class="prose mt-8 max-w-none">
    <h1 class="title">About Me</h1>
    <p>Welcome to my page...</p>
  </div>
</BaseLayout>
```

### 3. Update Site Navigation

If the new page should be linked in the header/footer menus:

- Open `src/site.config.ts`.
- Add the new route to the `menuLinks` array:

  ```any
  export const menuLinks: { path: string, title: string }[] = [
    { path: '/', title: 'Home' },
    { path: '/portfolio/', title: 'Portfolio' },
    { path: '/about/', title: 'About' }, // <--- New link
  ]
  ```

### 4. Verify

Ensure the page builds without errors and functions correctly with view transitions (`<ClientRouter />` is active in `BaseLayout`). Validate that the `siteConfig` updates are reflected site-wide.
