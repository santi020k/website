---
title: "@santi020k/og"
description: "Built a renderer-agnostic Open Graph image pipeline with deterministic caching, safe cleanup, parallel generation, and CI verification while leaving every project's visual system in its own hands."
brand:
  primary: "#65f7bc"
  secondary: "#14b8a6"
  surface: "#071b17"
role: "Creator"
startingDate: "22 Aug 2026"
githubUrl: "https://github.com/santi020k/og"
liveDemoUrl: "https://og.santi020k.com/"
typesId: "personal"
relevanceWeight: 80
impactMetrics: [
  "Generates SVG, PNG, WebP, JPEG, and AVIF through project-owned renderers",
  "Supports Astro, Next.js, plain Node.js, monorepos, Markdown collections, and CMS data without a framework runtime",
  "Ships deterministic fingerprints, bounded worker concurrency, tracked cleanup, and a read-only CI check"
  ]
technologies: [
  "TypeScript", "Node.js", "Open Graph", "Satori", "Sharp", "SVG", "WebP", "AVIF", "Worker Threads",
  "Astro", "Next.js", "Turborepo", "pnpm", "NPM", "Vitest", "CI/CD", "Developer Experience (DX)",
  "Developer Tooling", "Open Source"
  ]
coverImage:
  src: "./cover.webp"
  horizontal: "./cover-horizontal.webp"
  vertical: "./cover-vertical.webp"
  logo: "./logo.png"
  logoAspect: "square"
  logoSurface: "dark"
  alt: "Open Graph card generation interface for the @santi020k/og toolkit"
  ogImage: "./cover.webp"
---

## Open Graph generation without surrendering the design

I built `@santi020k/og` to separate two concerns that are often bundled together: the mechanics of generating social images and the visual decisions that make those images belong to a product.

The package handles paths, output formats, caching, concurrency, cleanup, and verification. The consuming project supplies its content, assets, fonts, card composition, and renderer. That boundary makes the pipeline reusable without turning every brand into a preset.

### Goals

- **Keep brand ownership inside each project** instead of prescribing a template or content model.
- **Make committed social images verifiable** with deterministic fingerprints and a read-only CI command.
- **Regenerate only what changed** across collections that may contain hundreds of cards.
- **Stay framework-agnostic** so the same pipeline works with Astro, Next.js, Node.js, a CMS, or a static array.

### What I built

- **A typed configuration API and CLI** with `init`, `generate`, `check`, and force-generation workflows.
- **Sharp and Satori entry points** for SVG-based designs, HTML-like templates, font loading, and raster encoding.
- **Five output families** selected by extension: SVG, PNG, WebP, JPEG, and AVIF.
- **Content-aware caching** that fingerprints card data, dimensions, output names, configuration, templates, fonts, logos, and declared source files.
- **Bounded worker-thread generation** for large collections without letting native image work overwhelm CI memory.
- **Tracked cleanup** that removes only obsolete outputs recorded by the previous manifest instead of scanning and deleting arbitrary files.

### Technical highlights

- **Renderer contract:** projects can return SVG, use the bundled Sharp or Satori adapters, or provide a completely custom renderer.
- **Safe paths:** output files and the cache manifest are constrained to the project root to prevent traversal.
- **Deterministic CI:** `santi-og check` reports missing or stale outputs without mutating the repository.
- **Portable inputs:** card data can come from content collections, Markdown, CMS responses, framework loaders, or any serializable source.
- **Parallel builds:** worker renderer modules support structured-cloneable data and automatic or fixed concurrency.

### Results

- **One generation workflow across different stacks** without adding a framework runtime.
- **Faster repeat builds** because unchanged cards keep their existing output.
- **Safer repository maintenance** through manifest-scoped cleanup and explicit path validation.
- **Project-owned visuals** that remain free to evolve independently from the generator.

### Why it matters

Social images are small artifacts backed by a surprisingly repetitive build system. The valuable shared abstraction is not a universal card design. It is a dependable way to discover inputs, detect changes, render in parallel, encode files, clean obsolete artifacts, and prove that committed output is current.

`@santi020k/og` owns that machinery and stops at the boundary where a project's identity begins.

[Read the documentation](https://og.santi020k.com/) or [explore the source on GitHub](https://github.com/santi020k/og).
