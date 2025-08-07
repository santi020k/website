---
title: "@santi020k/eslint-config-santi020k"
description: "Created and maintain a robust, opinionated ESLint configuration package to enforce consistency, code quality, and best practices across JavaScript, TypeScript, and React projects. Designed for scalability, DX, and flexibility across monorepos and modern frontend ecosystems."
rol: "Creator"
startingDate: "1 Mar 2024"
githubUrl: "https://github.com/santi020k/eslint-config-santi020k"
liveDemoUrl: "https://www.npmjs.com/package/@santi020k/eslint-config-santi020k"
typesId: "personal"
technologies: [
  "React", "Next.js", "TypeScript", "Node", "Astro", "Expo", "ESLint", "JavaScript",
  "Code Quality", "Monorepo", "CI/CD", "VSCode", "Automation",
  "npm", "Open Source", "Vitest", "TailwindCSS", "i18next", "Testing", "Documentation", "DX"
]
coverImage:
  src: "./cover.webp"
  alt: "Screenshot of npm package"
  ogImage: "./cover-eslint-config.webp"
---

## Elevating Code Quality with `@santi020k/eslint-config`

Starting in **March 2024**, I began building `@santi020k/eslint-config`, an open-source ESLint configuration package designed to simplify and standardize code quality across all my JavaScript and TypeScript projects.

It originated from a need for **consistency**, **performance**, and **reduced setup overhead** when spinning up new frontend and full-stack applications, particularly across monorepos and modern ecosystems like **Next.js**, **Expo**, and **Astro**.

### 🎯 Goals & Philosophy

My core objectives were:

* ✅ **One-command setup** for new projects
* 🧠 **Strict, but flexible rules** based on years of real-world development experience
* 📦 **Modular presets** for different environments (Node, React, Expo, Astro, TailwindCSS)
* 🤝 **Team-friendly** DX to reduce code review overhead and ensure maintainability
* 🔧 Support for **testing libraries** like Vitest and **i18n tools** like i18next

### 🛠️ Architecture & Features

The configuration is built with modularity and reusability in mind:

* **Base Rules**: Core TypeScript/JavaScript rules with strict linting and error-prevention.
* **React Preset**: Opinionated rules for React, JSX, Hooks, and accessibility.
* **Tailwind Preset**: Integrates with TailwindCSS plugin for better class sorting and linting.
* **Vitest Preset**: Provides testing-specific lint rules and globals.
* **Astro & Expo (Beta)**: Experimental support for framework-specific quirks and patterns.
* **Customizable Options**: All presets are opt-in, allowing fine-grained control over linting strategies.

The config also includes:

<!-- TODO: Not implemented yet -->
<!-- * Type-safe definitions using `zod` schemas -->
* Automated versioned publishing via GitHub Actions
* A growing [npm package](https://www.npmjs.com/package/@santi020k/eslint-config-santi020k) with documentation and usage examples

### 🚀 Developer Experience & Automation

A huge focus was placed on **DX** and **automation**:

* **Zero-config formatting** via ESLint (no Prettier needed)
* **Consistent rules across mono-repositories** with shared base configs
* Works seamlessly with `eslint-config-next` and supports ESLint 9+ out of the box
<!-- TODO: Not implemented yet -->
<!-- * Documentation includes recipes for integrating into CI/CD pipelines, VSCode setup, and edge cases -->

### 🌍 Community Impact & Adoption

Since launch, the config has:

* Been used across multiple real-world projects including client-facing apps, internal tooling, and open-source contributions
* Saved countless hours of boilerplate setup
* Reduced code review noise by enforcing consistent formatting and catching errors early
* Helped junior developers ramp up quickly on projects by codifying best practices

---

Working on this config has been a powerful reminder that **code quality isn’t just about the code, it’s about communication, shared expectations, and enabling teams to move faster with confidence**.

The project remains active and continues to evolve. Contributions and feedback are always welcome on [GitHub](https://github.com/santi020k/eslint-config-santi020k). If you're looking to improve your project’s code quality and developer experience, feel free to try it out or reach out, [connect with me on LinkedIn](https://www.linkedin.com/in/santi020k).
