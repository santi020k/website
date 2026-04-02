# santi020k — Personal Website

Personal portfolio and blog for Santiago Molina (@santi020k).

## Tech Stack

- **Framework**: Astro 6 (file-based routing, content collections, View Transitions)
- **Interactivity**: Alpine.js v3 (lightweight JS, `x-data`, `x-show`, `x-transition`)
- **Styling**: Tailwind CSS v4 — configured via `src/styles/global.css` `@theme` block (no `tailwind.config.js`)
- **Language**: TypeScript (strict)
- **Deployment**: Vercel (`vercel.json`)
- **Analytics**: `@vercel/analytics` + `@vercel/speed-insights`
- **Testing**: Vitest (unit) + Playwright (E2E)
- **Linting**: ESLint with `@santi020k/eslint-config-*` packages
- **Commits**: Conventional Commits (Commitizen + Husky + lint-staged)

## Key Files & Directories

| Path | Purpose |
|---|---|
| `src/site.config.ts` | Site-wide metadata (title, description, author, nav links) |
| `src/styles/global.css` | Tailwind v4 theme tokens, custom utilities, base styles |
| `src/content.config.ts` | Content collection schemas (Zod) |
| `src/content/` | Markdown/MDX content (blog posts, projects) |
| `src/layouts/` | Page layout components |
| `src/components/` | Reusable Astro components |
| `src/pages/` | File-based routes (`.astro`, `.ts` for API) |
| `src/utils/` | Shared TypeScript utilities |
| `src/types.ts` | Shared TypeScript types |
| `public/` | Static assets served as-is |

## Code Conventions

- Use `@/` alias for absolute imports from `src/` (e.g., `import { siteConfig } from '@/site.config'`)
- Use trailing slashes for all internal links (e.g., `/posts/my-post/`)
- TypeScript interfaces for Astro component props, always destructured from `Astro.props`
- `class:list` for conditional Tailwind classes (not template literals)
- Icons via `astro-icon` — `<Icon name="collection:icon-name" />`; always add `aria-hidden="true"` on decorative icons

## Styling Rules

- Define all design tokens (colors, fonts, shadows) in `src/styles/global.css` under `@theme`
- Dark mode uses `data-theme="dark"` on `<html>` (not `class="dark"`)
- Custom repeated utilities go in `@utility` blocks in `global.css`
- Class order follows Tailwind Prettier plugin conventions (ESLint enforces this)
- Always include `motion-reduce:` variants when adding animations or transitions

## Running the Project

```bash
npm run dev          # Start dev server (localhost:4321)
npm run build        # Production build
npm run preview      # Preview production build
npm run lint         # ESLint
npm run check        # Astro type-check
npm run test         # Vitest unit tests
npm run test:e2e     # Playwright E2E tests
```

Always ensure `npm run lint` and `npm run check` pass with zero errors before considering work complete.

## Available Skills

Specialized guidance for this project is in `.claude/skills/`:

- **[seo](.claude/skills/seo/SKILL.md)** — Meta tags, structured data, sitemap, Core Web Vitals, image optimization
- **[marketing](.claude/skills/marketing/SKILL.md)** — Copy, brand voice, CTAs, blog strategy, social media
- **[accessibility](.claude/skills/accessibility/SKILL.md)** — WCAG 2.2 AA, ARIA, keyboard nav, Alpine.js a11y patterns
- **[web-design](.claude/skills/web-design/SKILL.md)** — Design system, Tailwind tokens, animations, Alpine transitions, dark mode

Claude Code agent skills are in `.agent/skills/` (adding content, creating components, testing, etc.).

## General Principles

- **Clean build**: `npm run lint` and `npm run check` must pass with zero errors
- **Accessibility**: WCAG 2.2 AA is the target — use the accessibility skill for all interactive components
- **Performance**: Aim for Lighthouse ≥ 90 on mobile. Use Astro's `<Image>` for all images
- **SEO**: Every page needs a unique title, meta description, and canonical URL
- **Animations**: Always pair animation code with `motion-reduce:` variants or a `prefers-reduced-motion` media query
