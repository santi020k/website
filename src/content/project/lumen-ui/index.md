---
title: "Lumen UI"
description: "Built a multi-framework design system with 123 accessible primitives for Astro, React, and Web Components, plus Figma, agent, MCP, and registry workflows."
role: "Creator"
startingDate: "3 Jul 2026"
githubUrl: "https://github.com/santi020k/lumen"
liveDemoUrl: "https://lumen.santi020k.com/"
typesId: "personal"
relevanceWeight: 100
impactMetrics: ["Ships 123 accessible primitives across Astro, React, and Web Components", "Shares tokens, contracts, styles, and interaction patterns without forcing one runtime", "Includes Figma resources, an agent skill, MCP server, llms.txt, and a machine-readable registry"]
technologies: ["Astro", "React.js", "Web Components", "TypeScript", "CSS", "Tailwind CSS", "Accessibility", "Design Systems", "Figma", "Model Context Protocol", "AI-assisted Development", "Vitest", "Playwright", "Turborepo", "pnpm", "NPM", "Developer Documentation", "Open Source"]
coverImage:
  src: "./cover.webp"
  horizontal: "./cover-horizontal.webp"
  vertical: "./cover-vertical.webp"
  logo: "./logo.webp"
  logoAspect: "square"
  logoSurface: "light"
  alt: "Translucent interface primitives connected across three luminous framework lanes"
  ogImage: "./cover.webp"
---

## One component system, three native authoring models

I built Lumen UI to give Astro, React, and standards-based Web Component projects one visual and interaction language without pretending those frameworks are the same.

The packages share tokens, component contracts, styles, and behavior rules. Each implementation still respects its host: progressive enhancement for Astro, native components and hooks for React, and custom elements for browser-standard delivery.

### Goals

- **Share product language, not framework compromises** across multiple rendering models.
- **Build accessibility into primitives** with semantic markup, keyboard paths, focus management, and reduced-motion support.
- **Work with or without Tailwind** through standalone layered CSS and an explicit integration path.
- **Make the system legible to designers and coding agents** as well as application developers.

### What I built

- **123 accessible primitives** implemented for Astro, React, and Web Components.
- **A shared core** for tokens, metadata, class helpers, public contracts, and behavior expectations.
- **A progressively enhanced Astro runtime** that activates interactive markup without adding a front-end framework.
- **An umbrella package and registry** for package discovery, recipes, and installable file groups.
- **A documentation site and Figma library** for human design and implementation workflows.
- **An agent skill and MCP server** that let coding assistants search the catalog, retrieve real source, and follow current tokens and rules.

### Technical highlights

- **Framework packages:** `@santi020k/lumen-astro`, `@santi020k/lumen-react`, and `@santi020k/lumen-elements`.
- **System packages:** `@santi020k/lumen-core`, the umbrella `@santi020k/lumen`, and `@santi020k/lumen-mcp`.
- **CSS architecture:** standalone component styles with documented cascade layers for Tailwind projects.
- **Quality controls:** interaction tests, accessibility checks, visual coverage, bundle-size checks, registry validation, and cross-framework contract checks.

### Results

- **One coherent API surface** across three implementation targets.
- **Portable accessibility decisions** that applications do not need to rediscover component by component.
- **A design system that supports AI-assisted work** with structured, source-backed discovery instead of prompt-only conventions.

### Why it matters

Multi-framework design systems often collapse into a stylesheet plus three unrelated implementations. Lumen treats shared behavior, accessibility, documentation, and machine-readable context as first-class parts of the system.

[Explore the Lumen documentation](https://lumen.santi020k.com/) or [see the source on GitHub](https://github.com/santi020k/lumen).
