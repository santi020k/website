---
title: "What Is New in @santi020k/eslint-config-basic v2"
description: "A simple overview of the new version of my ESLint configuration library: one package, smarter detection, presets, monorepo support, and better CLI helpers."
publishDate: "2026-06-11T15:00:00.000Z"
coverImage:
  alt: "Editorial cover showing modular ESLint configuration blocks, checks, docs, and framework nodes connected into one toolkit"
  src: "./cover.webp"
tags: ["eslint", "javascript", "typescript", "developer-experience", "open-source"]
postType: "Article"
seriesId: "eslint-in-practice"
seriesOrder: 5
---

I recently worked on version 2 of [`@santi020k/eslint-config-basic`](https://www.npmjs.com/package/@santi020k/eslint-config-basic), my ESLint flat-config library for JavaScript and TypeScript projects.

The main goal of this version is simple: make the setup easier to install, easier to understand, and easier to use in real projects.

Version 1 was already a big step because it moved the project into a more solid monorepo with framework packages, docs, playgrounds, and tests. Version 2 keeps that internal structure, but it makes the public experience much simpler.

Instead of asking application projects to install several framework config packages, v2 moves the normal user-facing setup into one main package:

```sh
pnpm add -D @santi020k/eslint-config-basic
```

Then, for many projects, the config can start like this:

```js
import { defineConfig } from '@santi020k/eslint-config-basic'

export default await defineConfig()
```

That is the main direction of v2: less setup work, more useful defaults.

## One package for most projects

The biggest change is that the public API is now centered around `@santi020k/eslint-config-basic`.

The internal architecture is still modular, and the repo still has packages for React, Next.js, Astro, Vue, Svelte, Solid, Angular, NestJS, Hono, Expo, Qwik, Remix, Vite, TypeScript, presentation projects, and integrations.

But app-level usage is cleaner now.

In v1, a project often needed the base package plus one or more framework packages. In v2, the main package can enable those framework layers through configuration and detection.

For example:

```js
import { defineConfig } from '@santi020k/eslint-config-basic'

export default await defineConfig({
  frameworks: {
    next: true
  }
})
```

That is easier to explain, easier to copy, and easier to maintain across projects.

## Smarter auto-detection

V2 makes auto-detection more useful.

The library can read project signals and enable common pieces automatically, including frameworks, TypeScript, runtime settings, testing tools, formats, libraries, and other integrations.

The goal is not magic for the sake of magic. The goal is to reduce repetitive setup while still allowing explicit control when a project needs it.

If you want to see what the config detected, you can run:

```sh
npx @santi020k/eslint-config-basic explain
```

That command is important because tooling should be understandable. If a config changes behavior, developers should be able to inspect why.

## Better presets

V2 also adds presets for common project shapes.

Instead of manually tuning every option from the beginning, you can start from a practical profile:

```js
import { defineConfig, Preset } from '@santi020k/eslint-config-basic'

export default await defineConfig({
  preset: Preset.App
})
```

The current presets cover common needs like apps, libraries, CI, Node, browser, workers, monorepos, and a basic core setup.

This makes the config easier to adopt gradually. You can start with a sensible baseline, then add stricter rules or integrations when the project is ready.

## Monorepo support

Another feature I am happy about is better support for monorepos.

Different folders in the same repository often need different linting behavior. An API package, a web app, and a shared library should not always be treated exactly the same.

V2 lets you define project-specific configuration:

```js
import { defineConfig, Preset, Runtime } from '@santi020k/eslint-config-basic'

export default await defineConfig({
  preset: Preset.Monorepo,
  projects: {
    'apps/api': {
      preset: Preset.Library,
      runtime: Runtime.Node
    },
    'apps/web': {
      frameworks: { next: true },
      preset: Preset.App
    }
  }
})
```

This keeps large repositories cleaner because each workspace can get the rules that make sense for it.

## Migration helpers

I also wanted v2 to be easier to migrate into.

The library includes commands for migration and local documentation:

```sh
npx @santi020k/eslint-config-basic migrate
npx @santi020k/eslint-config-basic docs
```

The migration command reports changes from the v1 style to the v2 style. The docs command can generate a local `ESLINT_STANDARDS.md` file so teams have a readable summary of the active standards.

This is especially useful when ESLint configuration is not just a personal setup, but something a team needs to understand and maintain.

## Agent skill generation

One experimental feature in the project is the agent skill generator.

The idea is to help AI coding tools understand the standards of the current project. It can generate guidance files for tools like Cursor, Claude Code, Copilot, Windsurf, Aider, Gemini, Cline, Roo Code, and `AGENTS.md`-based workflows.

You can run:

```sh
npx @santi020k/eslint-config-basic generate-skill
```

This is still a beta feature, but I think it fits the direction of modern development. If AI is writing or editing more code, the project standards should be easier for those tools to read.

## Why this version matters

For me, v2 is about reducing friction.

I do not want an ESLint config that feels powerful only after a long setup process. I want a config that can start simple, explain what it is doing, and grow with the project.

The best parts of this version are:

- One main package for most application projects
- Framework activation through simple boolean options
- Auto-detection that can be inspected with `explain`
- Presets for apps, libraries, CI, Node, browser, workers, and monorepos
- Project-level configuration for monorepos
- Migration and documentation CLI helpers
- Optional agent skill generation for AI-assisted workflows
- Updated docs at [`eslint.santi020k.com`](https://eslint.santi020k.com/)

It is not a flashy release for the sake of being flashy. It is a practical release focused on developer experience, maintainability, and making strong linting easier to adopt.

If you want to try it, the package is available on npm:

[`@santi020k/eslint-config-basic`](https://www.npmjs.com/package/@santi020k/eslint-config-basic)

And the full docs are here:

[`eslint.santi020k.com`](https://eslint.santi020k.com/)
