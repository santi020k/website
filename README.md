# [Santiago Molina](https://santi020k.com/)

![Santi020k Logo](./public/logos/logo.webp)

## I build fast, accessible products and stronger frontend systems.

Santiago is a seasoned **Full Stack Developer** and **Tech Lead** with over a decade of experience. He specializes in frontend architecture, product systems, and leading high-performance teams to deliver scalable solutions.

---

### 🚀 Key Features

- **Astro 6 Power**: Built with the latest Astro framework for optimized performance.
- **Tailwind CSS v4**: Modern, future-proof styling with zero-runtime CSS.
- **Native Script Interactivity**: Lightweight inline scripts and custom events without a framework runtime.
- **Content Collections**: Type-safe Markdown and MDX for blog posts and projects.
- **Site search**: Header search (modal) across posts and projects; shortcuts `/` and ⌘K / Ctrl+K.
- **Accessibility First**: WCAG 2.2 AA compliant, ensuring an inclusive experience for all.
- **View Transitions**: Seamless, app-like navigation between pages.

---

### ⚡ Tech Stack

[![Astro](https://img.shields.io/badge/Astro-0C1222?style=for-the-badge&logo=astro&logoColor=FDFDFE)](https://astro.build/)
[![Tailwind CSS v4](https://img.shields.io/badge/Tailwind_CSS_v4-06B6D4?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![JavaScript](https://img.shields.io/badge/JavaScript-323330?style=for-the-badge&logo=javascript&logoColor=F7DF1E)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vitest](https://img.shields.io/badge/Vitest-6E9F18?style=for-the-badge&logo=vitest&logoColor=white)](https://vitest.dev/)
[![Playwright](https://img.shields.io/badge/Playwright-2EAD33?style=for-the-badge&logo=playwright&logoColor=white)](https://playwright.dev/)
[![Vercel](https://img.shields.io/badge/Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white)](https://vercel.com/)

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
| `tests/` | Unit (Vitest) and E2E (Playwright) test suites. |

---

### 🛠️ Getting Started

#### 1. Install Dependencies
```bash
pnpm install
```

### 2. Start the Development Server

```bash
pnpm run dev
```
Accessible at `http://localhost:4321`.

#### 3. Build for Production
```bash
pnpm run build
```

### 4. Other Commands

```bash
pnpm run lint      # Linting with ESLint
pnpm run lint:fix  # Lint and autofix
pnpm run lint:md   # Markdown quality checks
pnpm run lint:content # Content frontmatter quality checks
pnpm run check     # Astro type-checking
pnpm run test      # Unit testing
pnpm run test:e2e  # E2E testing
```

`test:e2e` commands auto-install Playwright browsers when needed.

For more stable CI/browser-constrained environments, use:

```bash
pnpm run test:e2e:ci:stable
```

### 🤝 Maintainer Docs

- [`CONTRIBUTING.md`](./CONTRIBUTING.md)
- [`docs/deployment.md`](./docs/deployment.md)
- [`docs/incident-response.md`](./docs/incident-response.md)

---

### 📫 Connect with Santiago

[![LinkedIn Badge](https://img.shields.io/badge/LinkedIn-0A66C2?style=for-the-badge&logo=linkedin&logoColor=white)](https://linkedin.com/in/santi020k)
[![GitHub Badge](https://img.shields.io/badge/GitHub-181717?style=for-the-badge&logo=github&logoColor=white)](https://github.com/santi020k)
[![Medium Badge](https://img.shields.io/badge/Medium-000000?style=for-the-badge&logo=medium&logoColor=white)](https://medium.com/@santi020k)
[![WhatsApp Badge](https://img.shields.io/badge/WhatsApp-25D366?style=for-the-badge&logo=whatsapp&logoColor=white)](https://api.whatsapp.com/send?phone=573507990136)

---

&copy; 2026 Santiago Molina. All rights reserved.
