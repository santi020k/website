---
title: "What Is New in @santi020k/eslint-config-basic v2.0"
description: "Explore @santi020k/eslint-config-basic v2 with ESLint 10, one-package setup, lazy framework support, monorepo tooling, lite mode, and CLI checks."
publishDate: "2026-06-20T15:00:00.000Z"
updatedDate: "2026-08-20T00:00:00.000Z"
seoTitle: "ESLint Config Basic v2: ESLint 10 & Frameworks"
coverImage:
  alt: "Editorial cover showing modular ESLint configuration blocks, checks, docs, and framework nodes connected into one toolkit"
  src: "./cover.webp"
tags: ["eslint", "javascript", "typescript", "developer-experience", "open-source"]
postType: "Article"
seriesId: "eslint-in-practice"
seriesOrder: 5
---

Version 2.0.0 of [`@santi020k/eslint-config-basic`](https://www.npmjs.com/package/@santi020k/eslint-config-basic) is now live on npm.

This release is bigger than a helper cleanup. It changes the public shape of the package, moves the project to an ESLint 10 baseline, expands framework coverage, improves monorepo behavior, and adds better tooling for humans and AI coding assistants.

The goal is still the same one I wrote about in [Why I Moved My ESLint Library to @santi020k/eslint-config-basic](/blog/why-i-moved-my-eslint-library-to-eslint-config-basic/): I want strong linting defaults that are easier to adopt than a pile of hand-wired plugins.

## The short version

For most application projects, the starting point is still intentionally small:

```sh
pnpm add -D @santi020k/eslint-config-basic
```

Then create an `eslint.config.js`:

```js
import { defineConfig } from '@santi020k/eslint-config-basic'

export default await defineConfig()
```

That is the main direction of v2: a single public application package, deeper detection, and explicit escape hatches when a project needs them.

The important upgrade note is that v2 targets ESLint 10. If a project still needs ESLint 9, it should stay on the v1.x release line until the ESLint upgrade is ready.

## ESLint 10 is the new baseline

V2 is a major release because it moves the package family to ESLint 10.

That matters for a few reasons:

- ESLint 10 gives the config a cleaner foundation for modern flat config behavior.
- Per-file config lookup makes monorepos more flexible because workspace packages can own their own `eslint.config.*` files when that is the better shape.
- JSX reference tracking improves scope analysis without relying on older plugin workarounds.
- The package can align around the latest `@eslint/js` recommended baseline.

The supported runtime baseline is Node.js `^20.19.0 || >=22.18.0`, and TypeScript remains supported when TypeScript linting is enabled.

For teams migrating from older setups, my [ESLint 8 to ESLint 9 migration guide](/blog/migrate-eslint-8-or-less-to-eslint-9/) is still useful background, but v2 is now deliberately looking forward to ESLint 10.

## One package for most projects

The biggest public change is that application projects no longer need to install or import a stack of separate framework packages for the common path.

The repo is still modular internally. There are framework packages, integration packages, docs, playgrounds, and tests. But app-level usage is centered on `@santi020k/eslint-config-basic`.

Frameworks can be enabled with simple booleans:

```js
import { defineConfig } from '@santi020k/eslint-config-basic'

export default await defineConfig({
  frameworks: {
    next: true,
    react: true
  }
})
```

Or they can be enabled by auto-detection when the dependencies and project structure make the intent clear.

The framework footprint is also larger now. The package covers React, Next.js, Astro, Vue, Nuxt, Svelte, Solid, Angular, NestJS, Hono, Expo, Preact, Qwik, Remix, React Router, TanStack Start, Lit, Vite, and Slidev.

Next.js, Expo, and Remix also include React rules automatically when those framework layers are enabled.

## Lazy loading and a lite package

Bundling more framework support creates an obvious concern: install and startup weight.

V2 handles that in two ways.

First, framework configs are lazy-loaded. If a project does not enable Svelte, Angular, Storybook, GraphQL, Cypress, or another optional area, the config should not eagerly import that tooling at lint startup.

Second, there is now a lighter package for projects that want manual dependency control:

```sh
pnpm add -D @santi020k/eslint-config-lite eslint
```

The full `@santi020k/eslint-config-basic` package remains the recommended default because it keeps the tested plugin set together. The lite package is the escape hatch for dependency-sensitive projects that prefer to install framework and integration packages themselves.

The CLI also helps with that choice:

```sh
npx @santi020k/eslint-config-basic doctor --lite-install
```

That command can print the detected install command for moving a project from the full package to the lite package.

## Cleaner optional features

V2 keeps the enum-based API, but it also adds a compact `features` map for optional configs.

```js
import { defineConfig } from '@santi020k/eslint-config-basic'

export default await defineConfig({
  features: {
    boundaries: true,
    'github-actions': true,
    playwright: true,
    prettier: true,
    tailwind: true,
    unicorn: false,
    zod: true
  }
})
```

That gives teams a simple opt-in and opt-out layer without importing every enum in small configs.

The merge behavior has also been tightened. Under the default `optionMergeStrategy: 'merge'`, explicit options are unioned with detected and preset options. If you want a project to ignore detection and use only what you pass manually, use `optionMergeStrategy: 'replace'`, `autoFrameworks: false`, or granular `detection` controls.

## Better presets and strict mode

Presets are still there for common project shapes:

```js
import { defineConfig, Preset } from '@santi020k/eslint-config-basic'

export default await defineConfig({
  preset: Preset.App
})
```

The current presets include `Basic`, `Node`, `Browser`, `Worker`, `Library`, `App`, `CI`, `Monorepo`, and `All`.

V2 also formalizes strict mode:

```js
import { defineConfig } from '@santi020k/eslint-config-basic'

export default await defineConfig({
  strict: 'ci'
})
```

`strict: true` or `strict: 'ci'` promotes warnings to errors. `strict: 'pedantic'` goes further with additional best-practice rules for things like console usage, browser dialogs, complexity, and nesting.

## Monorepos are more practical

Monorepos were already a major reason I wanted this package to exist. V2 makes that story better.

You can still scope options with `projects`:

```js
import { defineConfig, Preset, Runtime } from '@santi020k/eslint-config-basic'

export default await defineConfig({
  preset: Preset.Monorepo,
  projects: {
    'apps/api': {
      preset: Preset.Node,
      runtime: Runtime.Node
    },
    'apps/web': {
      frameworks: { next: true },
      preset: Preset.App
    },
    'packages/core': {
      preset: Preset.Library,
      runtime: Runtime.Universal
    }
  }
})
```

With ESLint 10, there is another valid path too: packages can ship their own `eslint.config.*` files, and ESLint can resolve them from the linted file's directory. That means teams can choose between a central root config with `projects` or package-owned configs.

The `Preset.Monorepo` path can also detect workspace packages, which makes the initial setup less manual.

## Better CLI checks

The CLI has become more useful for explaining and auditing a setup.

```sh
npx @santi020k/eslint-config-basic explain
npx @santi020k/eslint-config-basic inspect
npx @santi020k/eslint-config-basic doctor
```

`explain` is the quick view of what auto-detection found. `inspect` gives a fuller view, including package-manager details, workspace projects, and active config features when the config can be loaded. `doctor` is for adoption checks: missing config files, stale v1 framework imports, duplicate ESLint majors, missing lint scripts, workspace packages that should use `projects`, and lite-package dependency gaps.

The migration and docs helpers are still part of the release:

```sh
npx @santi020k/eslint-config-basic migrate
npx @santi020k/eslint-config-basic docs
```

`migrate` reports v1-to-v2 changes. `docs` generates a project-local `ESLINT_STANDARDS.md` summary so teams can review the standards without reading the whole config.

## AI agent standards

The agent skill generator started as an experiment, but it fits the direction of the release.

```sh
npx @santi020k/eslint-config-basic generate-skill
```

It can generate or update ESLint standards files for AI coding assistants, including Cursor, Claude Code, Copilot, Windsurf, Aider, Gemini, Cline, Roo Code, Kiro, and `AGENTS.md`-based workflows.

V2 adds more useful workflow flags:

```sh
npx @santi020k/eslint-config-basic generate-skill --check
npx @santi020k/eslint-config-basic generate-skill --create
```

`--check` is the CI-friendly mode for detecting stale generated standards. `--create` can scaffold a root `AGENTS.md` when a project does not have one yet.

Generated AI artifact folders are ignored by the default config, so these assistant files do not accidentally become source files that the linter tries to police.

## Manual framework composition changed

Most projects should use booleans or auto-detection, but v2 also changes the manual framework exports.

Framework exports now use bare names and async factories:

```js
import { react } from '@santi020k/eslint-config-basic'

export default [
  ...(await react())
]
```

The older names like `reactConfig`, `nextConfig`, `vueConfig`, and `svelteConfig` remain as deprecated aliases, but they are no longer plain config arrays. If you compose framework configs manually, call and `await` them.

That is the kind of breaking change that belongs in a major release.

## Why this release matters

For me, v2 is about making stronger linting easier to live with.

The best parts of this release are:

- A single main package for most application projects
- ESLint 10 as the forward-looking baseline
- Lazy framework and integration loading
- A lite package for manual dependency control
- More framework coverage, including Nuxt, Lit, Preact, React Router, TanStack Start, Vite, and Slidev
- A simpler `features` map for optional configs
- Better merge and detection controls
- More practical monorepo support
- CLI commands for explainability, migration, generated docs, and adoption checks
- AI agent standards generation with CI-friendly stale checks
- Updated docs at [`eslint.santi020k.com`](https://eslint.santi020k.com/)

I do not want an ESLint setup that feels powerful only after a long setup process. I want one that starts simple, explains what it is doing, and still gives teams enough control when their repo becomes more complex.

That is what v2 is designed to do.

If you want to try the stable release, the package is available on npm:

[`@santi020k/eslint-config-basic`](https://www.npmjs.com/package/@santi020k/eslint-config-basic)

The project page is here:

[`@santi020k/eslint-config-basic` portfolio case study](/portfolio/eslint-config-basic/)

And the full docs are here:

[`eslint.santi020k.com`](https://eslint.santi020k.com/)
