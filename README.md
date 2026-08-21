# [Santiago Molina](https://santi020k.com/)

[![CI](https://github.com/santi020k/website/actions/workflows/build.yml/badge.svg)](https://github.com/santi020k/website/actions/workflows/build.yml)
[![Astro Doctor](https://github.com/santi020k/website/actions/workflows/astro-doctor.yml/badge.svg)](https://github.com/santi020k/website/actions/workflows/astro-doctor.yml)
[![CodeQL](https://github.com/santi020k/website/actions/workflows/codeql.yml/badge.svg)](https://github.com/santi020k/website/actions/workflows/codeql.yml)
[![License: Source-Available](https://img.shields.io/badge/license-source--available-orange.svg)](./LICENSE)

![Santi020k Logo](./src/assets/brand/logos/logo-santi020k.webp)

## I build fast, accessible products and stronger frontend systems.

Personal website, blog, and portfolio of **Santiago Molina** — Full Stack Developer and Tech Lead with over a decade of experience in frontend architecture, product systems, and leading high-performance teams.

**→ Live at [santi020k.com](https://santi020k.com/)**

---

### 🚀 Key Features

- **Astro 7 Power**: Built with the latest Astro framework for optimized performance.
- **Tailwind CSS v4**: Modern, future-proof styling with zero-runtime CSS.
- **Native Script Interactivity**: Lightweight inline scripts and custom events without a framework runtime.
- **Content Collections**: Type-safe Markdown and MDX for blog posts and projects.
- **Site Search**: Header search (modal) across posts and projects; shortcuts `/` and ⌘K / Ctrl+K.
- **Accessibility First**: WCAG 2.2 AA compliant, validated with axe in E2E tests.
- **View Transitions**: Seamless, app-like navigation between pages.
- **Generated Assets**: Favicons, OG images, fonts, and brand assets built from scripts — no stale binaries.
- **Quality Gates**: [Astro Doctor](https://github.com/santi020k/astro-doctor), ESLint (via [`@santi020k/eslint-config-full`](https://github.com/santi020k/eslint-config-basic)), dependency audit, Vitest, Playwright, and Lighthouse CI share one read-only, path-aware pull-request job. A monthly CodeQL scan checks the protected default branch without granting write permissions to pull-request code.

---

### ⚡ Tech Stack

[![Astro](https://img.shields.io/badge/Astro-0C1222?style=for-the-badge&logo=astro&logoColor=FDFDFE)](https://astro.build/)
[![Tailwind CSS v4](https://img.shields.io/badge/Tailwind_CSS_v4-06B6D4?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![JavaScript](https://img.shields.io/badge/JavaScript-323330?style=for-the-badge&logo=javascript&logoColor=F7DF1E)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vitest](https://img.shields.io/badge/Vitest-6E9F18?style=for-the-badge&logo=vitest&logoColor=white)](https://vitest.dev/)
[![Playwright](https://img.shields.io/badge/Playwright-2EAD33?style=for-the-badge&logo=playwright&logoColor=white)](https://playwright.dev/)

---

### 📂 Project Structure

| Path | Purpose |
| --- | --- |
| `src/site.config.ts` | Site-wide metadata, navigation, and social links. |
| `src/content.config.ts` | Content collection schemas (Zod). |
| `src/content/` | Content collections (blog posts, portfolio projects). |
| `src/layouts/` | Core page layouts using Astro. |
| `src/components/` | Reusable UI components (Atoms, Molecules, Organisms). |
| `src/styles/global.css` | Tailwind v4 theme tokens and global styles. |
| `scripts/` | Asset generation (favicons, fonts, OG images, CV) and content linting. |
| `tests/` | Unit (Vitest) and E2E (Playwright) test suites. |
| `docs/` | Maintainer docs: deployment, theming, caching, observability. |

---

### 🛠️ Getting Started

**Requirements**: Node.js >= 24 and [pnpm](https://pnpm.io/) 10.

#### 1. Install Dependencies

```bash
pnpm install
```

#### 2. Start the Development Server

```bash
pnpm run dev
```

Accessible at `http://localhost:4321`.

#### 3. Build for Production

```bash
pnpm run build
```

#### 4. Other Commands

```bash
pnpm run lint         # Linting with ESLint
pnpm run lint:fix     # Lint and autofix
pnpm run lint:md      # Markdown quality checks
pnpm run lint:content # Content frontmatter quality checks
pnpm run check        # Astro type-checking
pnpm run test         # Unit testing
pnpm run test:e2e     # E2E testing
pnpm run lighthouse   # Local Lighthouse CI run
pnpm run verify:fast  # Spellcheck + lint + type-check + test + build
```

`test:e2e` commands auto-install Playwright browsers when needed.

For more stable CI/browser-constrained environments, use:

```bash
pnpm run test:e2e:ci:stable
```

---

### 🤝 Contributing & Maintainer Docs

This is a personal site, but issues and suggestions are welcome.

- [`CONTRIBUTING.md`](./CONTRIBUTING.md)
- [`.github/SECURITY.md`](./.github/SECURITY.md)
- [`CHANGELOG.md`](./CHANGELOG.md)
- [`docs/deployment.md`](./docs/deployment.md)
- [`docs/theming.md`](./docs/theming.md)
- [`docs/lumen-integration.md`](./docs/lumen-integration.md)
- [`docs/cache-strategy.md`](./docs/cache-strategy.md)
- [`docs/observability.md`](./docs/observability.md)
- [`docs/incident-response.md`](./docs/incident-response.md)

### 📄 License

This is a **source-available** project, not open source. You're welcome to read the code for reference and learning, but you may not use, copy, modify, or redistribute it — see [`LICENSE`](./LICENSE). All content (blog posts, images, brand assets, design) is © Santiago Molina.

---

### 📫 Connect with Santiago

[![LinkedIn Badge](https://img.shields.io/badge/LinkedIn-0A66C2?style=for-the-badge&logo=linkedin&logoColor=white)](https://linkedin.com/in/santi020k)
[![GitHub Badge](https://img.shields.io/badge/GitHub-181717?style=for-the-badge&logo=github&logoColor=white)](https://github.com/santi020k)
[![Medium Badge](https://img.shields.io/badge/Medium-000000?style=for-the-badge&logo=medium&logoColor=white)](https://medium.com/@santi020k)
[![WhatsApp Badge](https://img.shields.io/badge/WhatsApp-25D366?style=for-the-badge&logo=whatsapp&logoColor=white)](https://api.whatsapp.com/send?phone=573507990136)

---

&copy; 2026 Santiago Molina. All rights reserved.
