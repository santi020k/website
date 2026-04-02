---
title: "@santi020k/eslint-config-santi020k"
description: "My original opinionated ESLint configuration library for JavaScript, TypeScript, and React projects — superseded by @santi020k/eslint-config-basic."
rol: "Creator"
startingDate: "1 Jan 2023"
endingDate: "1 Mar 2024"
githubUrl: "https://github.com/santi020k/eslint-config-santi020k"
typesId: "personal"
technologies: [
  "React.js", "Next.js", "TypeScript", "Expo", "Astro", "ESLint", "JavaScript", "Code Quality", "NPM", "Open Source", "TailwindCSS", "Vitest", "i18next"
]
coverImage:
  src: "./cover.webp"
  alt: "eslint-config-santi020k library"
---

> **This library has been superseded.** `@santi020k/eslint-config-santi020k` has been replaced by [`@santi020k/eslint-config-basic`](/projects/eslint-config-basic/), which is more composable, better documented, and actively maintained. New projects should use that instead.

## My original ESLint configuration

`@santi020k/eslint-config-santi020k` was my first published ESLint package — an opinionated set of rules for JavaScript and TypeScript projects designed to enforce consistent code quality and catch common mistakes early. It was the linting foundation I reached for across my own projects and recommended to teams I worked with.

## What it covered

- TypeScript support with strict, opinionated defaults.
- React and Next.js configurations out of the box.
- Expo (beta) and Astro with React (beta) support.
- Optional add-ons for Tailwind CSS, Vitest, i18next, MDX, and Markdown.

## Why it was replaced

As my projects grew and ESLint's flat config format became the standard, the original package's architecture became harder to extend and maintain. Rather than continuing to patch it, I rebuilt it from scratch as `@santi020k/eslint-config-basic` — a composable, auto-detecting toolkit that covers far more frameworks with significantly less setup friction and a full documentation site.

![NPM Package](npm.webp)
