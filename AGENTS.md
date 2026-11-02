# santi020k — Personal Website

Personal portfolio and blog for Santiago Molina (@santi020k).

## Active release

The current integration target is `release/v5.0.0`. Santiago selected v5 on
October 26, 2026 and superseded the unpublished v4.1 release. Base new approved
work on v5 and coordinate merges in its clean, idle integration worktree. Preserve
the published v4.0.0 design in `apps/v4`; current-site design changes belong at
the repository root. See `docs/v5-release-readiness.md` for scope and gates.

## Tech Stack

- **Framework**: Astro 7 (file-based routing, content collections, View Transitions)
- **Interactivity**: Vanilla JS (lightweight inline scripts + custom events, no frontend framework runtime)
- **Styling**: Tailwind CSS v4 — configured via `src/styles/global.css` `@theme` block (no `tailwind.config.js`)
- **Language**: TypeScript (strict)
- **Deployment**: Static output (`dist/`); configure redirects and headers at your CDN or host (`docs/deployment.md`)
- **Analytics**: Optional Cloudflare Web Analytics when `CLOUDFLARE_WEB_ANALYTICS_TOKEN` is configured; Lighthouse CI covers lab performance in `pnpm run ci:verify`
- **Testing**: Vitest (unit) + Playwright (E2E)
- **Linting**: ESLint with `@santi020k/eslint-config-*` packages
- **Commits**: Conventional Commits (Commitprompt + quality hooks + lint-staged)

## Key Files & Directories

| Path | Purpose |
| --- | --- |
| `src/site.config.ts` | Site-wide metadata (title, description, author, nav links) |
| `src/styles/global.css` | Tailwind v4 theme tokens, custom utilities, base styles |
| `src/styles/pages/` | Route-only stylesheets, each imported by its page instead of the shared bundle |
| `src/styles/prose.css` | Article and case-study prose; only the `Post` and `Projects` layouts load it |
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
- External HTTP(S) links open in a new tab: use Lumen's `newTab` prop or
  `target="_blank"` with `rel="noopener noreferrer"`. Markdown uses `rehype-external-links`, which
  also adds `nofollow` to third-party destinations only; `*.santi020k.com` sites and Santiago's own
  profiles and packages keep follow (`src/plugins/external-link-rel.ts`).
- TypeScript interfaces for Astro component props, always destructured from `Astro.props`
- `class:list` for conditional Tailwind classes (not template literals)
- Client behavior uses processed `<script>` modules, which Astro bundles once and caches across
  routes. Reserve `is:inline` for code that must run before rendering, such as the theme bootstrap.
- Icons: Lumen's `<Icon name="lucide-name" />` is the default. It is decorative unless given a
  `label`, so do **not** pass `aria-hidden` — Lumen already emits it and a second one lands as a
  duplicate attribute. Brand marks use `astro-icon` (`<Icon name="collection:icon-name" />`), which
  does need an explicit `aria-hidden="true"` when decorative.

## Styling Rules

- Define all design tokens (colors, fonts, shadows) in `src/styles/global.css` under `@theme`
- Dark mode uses `data-theme="dark"` on `<html>` (not `class="dark"`)
- Custom repeated utilities go in `@utility` blocks in `global.css`
- `src/styles/partials/` holds styles every page may need; `global.css` loads them on every route.
  CSS for a single route goes in `src/styles/pages/<route>.css` (starting with
  `@reference "../global.css";`) and is imported by that page; a component's private rules can be
  imported by the component. Astro links these stylesheets before or after the shared bundle depending
  on the import graph, so resolve conflicts with shared rules through specificity, not source order.
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

## Skills

Project skills live in `.agents/skills/`, where Codex discovers them automatically. These
instructions, [`docs/sculpted-style-guide.md`](docs/sculpted-style-guide.md), and Lumen's public
contracts take precedence over the general design references at the end of this section.

| Skill | Use it for |
| --- | --- |
| [creating-components](.agents/skills/creating-components/SKILL.md) | Astro component props, structure, and Tailwind styling |
| [site-components](.agents/skills/site-components/SKILL.md) | Existing compositions to reuse before building new UI |
| [content-collections](.agents/skills/content-collections/SKILL.md) | Zod schemas and content queries |
| [adding-pages](.agents/skills/adding-pages/SKILL.md) | New routes and navigation |
| [add-content](.agents/skills/add-content/SKILL.md) | Blog posts and project entries |
| [adding-projects](.agents/skills/adding-projects/SKILL.md) | Portfolio entries in detail |
| [automation-scripts](.agents/skills/automation-scripts/SKILL.md) | Favicon, font, social image, and résumé generators |
| [maintenance](.agents/skills/maintenance/SKILL.md) | Dependency updates, security audits, and lint workflows |
| [testing](.agents/skills/testing/SKILL.md) | Vitest unit tests and Playwright browser tests |
| [accessibility](.agents/skills/accessibility/SKILL.md) | WCAG 2.2 AA and native JavaScript interaction patterns |
| [seo](.agents/skills/seo/SKILL.md) | Metadata, sitemaps, and search signals |
| [marketing](.agents/skills/marketing/SKILL.md) | Brand voice, calls to action, and content strategy |
| [web-design](.agents/skills/web-design/SKILL.md) | Design tokens, animation, and transitions |
| [brand-guidelines](.agents/skills/brand-guidelines/SKILL.md) | Visual identity and brand assets |
| [lumen-ui](.agents/skills/lumen-ui/SKILL.md) | Lumen packages, primitives, and tokens; installed from `santi020k/lumen` and pinned in `skills-lock.json` |

General design and audit references:

| Skill | Use it for |
| --- | --- |
| [accesslint-contrast-checker](.agents/skills/accesslint-contrast-checker/SKILL.md) | WCAG 1.4.3 and 1.4.11 contrast checks |
| [accesslint-link-purpose](.agents/skills/accesslint-link-purpose/SKILL.md) | WCAG 2.4.4 link purpose checks |
| [accesslint-use-of-color](.agents/skills/accesslint-use-of-color/SKILL.md) | WCAG 1.4.1 color-only state checks |
| [accesslint-refactor](.agents/skills/accesslint-refactor/SKILL.md) | Multi-file accessibility fixes |
| [vercel-web-design-guidelines](.agents/skills/vercel-web-design-guidelines/SKILL.md) | Audits against Vercel's Web Interface Guidelines |
| [ui-ux-pro-max](.agents/skills/ui-ux-pro-max/SKILL.md) | Palette, type pairing, and layout research |
| [anthropic-frontend-design](.agents/skills/anthropic-frontend-design/SKILL.md) | Exploring a distinctive visual direction |
| [bencium-ux-designer](.agents/skills/bencium-ux-designer/SKILL.md) | UX design-thinking prompts |

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
