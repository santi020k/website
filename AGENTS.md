# santi020k — Personal Website

Personal portfolio and blog for Santiago Molina (@santi020k).

## Tech Stack

- **Framework**: Astro 7 (file-based routing, content collections, View Transitions)
- **Interactivity**: Vanilla JS (lightweight inline scripts + custom events, no frontend framework runtime)
- **Styling**: Tailwind CSS v4 — configured via `src/styles/global.css` `@theme` block (no `tailwind.config.js`)
- **Language**: TypeScript (strict)
- **Deployment**: Static output (`dist/`); configure redirects and headers at your CDN or host (`docs/deployment.md`)
- **Analytics**: None bundled; Lighthouse CI covers lab performance in `pnpm run ci:verify`
- **Testing**: Vitest (unit) + Playwright (E2E)
- **Linting**: ESLint with `@santi020k/eslint-config-*` packages
- **Commits**: Conventional Commits (Commitprompt + quality hooks + lint-staged)

## Key Files & Directories

| Path | Purpose |
| --- | --- |
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
pnpm run dev          # Start dev server (localhost:4321)
pnpm run build        # Production build
pnpm run preview      # Preview production build
pnpm run lint         # ESLint
pnpm run check        # Astro type-check
pnpm run test         # Vitest unit tests
pnpm run test:e2e     # Playwright E2E tests
```

Always ensure `pnpm run lint` and `pnpm run check` pass with zero errors before considering work complete.

## Available Skills

Specialized guidance for this project is consolidated in `/.agent/skills/`:

### 🛠️ Core Development

- **[creating-components](/.agent/skills/creating-components/SKILL.md)** — Standards for Astro components, props, and Tailwind styling.
- **[content-collections](/.agent/skills/content-collections/SKILL.md)** — Zod schemas and data querying for content.
- **[adding-pages](/.agent/skills/adding-pages/SKILL.md)** — Creating new routes and updating navigation.

### ⚙️ Maintenance & Quality

- **[maintenance](/.agent/skills/maintenance/SKILL.md)** — Dependency updates, security audits, and linting workflows.
- **[testing](/.agent/skills/testing/SKILL.md)** — Unit testing with Vitest and E2E testing with Playwright.
- **[accessibility](/.agent/skills/accessibility/SKILL.md)** — WCAG 2.2 AA compliance and native JavaScript a11y patterns.

### ✍️ Content & Marketing

- **[add-content](/.agent/skills/add-content/SKILL.md)** — Guidelines for blog posts and project entries.
- **[adding-projects](/.agent/skills/adding-projects/SKILL.md)** — Detailed guide for adding new portfolio items.
- **[marketing](/.agent/skills/marketing/SKILL.md)** — Brand voice, CTAs, and content strategy.
- **[seo](/.agent/skills/seo/SKILL.md)** — Meta tags, sitemaps, and search engine optimization.

### 🎨 Design & Visuals

- **[web-design](/.agent/skills/web-design/SKILL.md)** — Design system tokens, animations, and transitions.
- **[brand-guidelines](/.agent/skills/brand-guidelines/SKILL.md)** — Visual identity and brand asset management.

### 🚀 Advanced Tools

- **[ui-ux-pro-max](/.agent/skills/ui-ux-pro-max/SKILL.md)** — Comprehensive UI research, palettes, and design reasoning.

See the **[Skills Index](/.agent/overview.md)** for a full overview of available agentic capabilities.

## General Principles

- **Clean build**: `pnpm run lint` and `pnpm run check` must pass with zero errors
- **Accessibility**: WCAG 2.2 AA is the target — use the accessibility skill for all interactive components
- **Performance**: Aim for Lighthouse ≥ 90 on mobile. Use Astro's `<Image>` for all images
- **SEO**: Every page needs a unique title, meta description, and canonical URL
- **Animations**: Always pair animation code with `motion-reduce:` variants or a `prefers-reduced-motion` media query

<!-- santi020k-quality-policy:start -->
## ESLint and TypeScript quality policy

- Treat every ESLint warning and TypeScript diagnostic as work to resolve, not successful output.
- Run the repository's canonical lint and type-check commands before handoff. Use
  `--max-warnings=0` for every direct ESLint command, including workspace scripts and
  `lint-staged`; never use `--quiet` to hide warnings.
- Fix the underlying implementation. Do not lower rule severity, widen ignores, or add
  `eslint-disable`, `@ts-ignore`, `@ts-expect-error`, `any`, unsafe casts, or non-null assertions
  merely to make a check pass.
- A narrow suppression is acceptable only when the root cause cannot be fixed safely. Explain why,
  scope it to the smallest surface, and leave a tracking path.
- Fix all safe and feasible diagnostics you encounter, including pre-existing ones exposed by the
  work. Never finish while feasible warnings or type errors remain.
- If an external or unrelated blocker cannot be resolved safely, report the exact command, file,
  and diagnostic instead of hiding it.
- Do not add ESLint or TypeScript to a repository that does not use that toolchain solely for
  uniformity; apply this policy when that toolchain exists or is introduced for project reasons.
<!-- santi020k-quality-policy:end -->

<!-- commitprompt:start -->
## Commit generation

- Inspect the repository status and staged diff before proposing a commit message.
- Run `pnpm exec commitprompt types --json` and
  `pnpm exec commitprompt instructions --json` to load the repository rules.
- Pass structured fields to `pnpm exec commitprompt format --json`, then validate
  the exact message with `pnpm exec commitprompt validate --json`.
- Only run `pnpm exec commitprompt commit --yes --json` when the user explicitly
  authorizes a commit. Never stage unrelated files or bypass Git hooks.
- Review messages generated by Zed or VS Code. The `commit-msg` hook is the final
  authority and rejected messages must be corrected, not forced through.
<!-- commitprompt:end -->
