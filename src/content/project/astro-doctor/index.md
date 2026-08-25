---
title: "Astro Doctor"
description: "Built a deterministic Astro health-check toolkit with a CLI, ESLint plugin, editor extension, GitHub Action, docs site, and installable agent skills."
brand:
  primary: "#fc7719"
  secondary: "#ffbe78"
  surface: "#17111f"
seoTitle: "Astro Doctor: Astro Code Quality Toolkit"
seoDescription: "Explore Astro Doctor, a CLI, ESLint plugin, editor extension, and GitHub Action for catching Astro performance, accessibility, and security issues."
role: "Creator"
startingDate: "1 Jan 2026"
githubUrl: "https://github.com/santi020k/astro-doctor"
liveDemoUrl: "https://doctor.santi020k.com/"
typesId: "personal"
relevanceWeight: 85
impactMetrics: [
  "Catches Astro-specific performance, accessibility, security, and best-practice issues",
  "Reports health scores in local, editor, and CI workflows",
  "Installs agent skills that teach coding assistants Astro standards"
  ]
technologies: [
  "Astro", "TypeScript", "Node.js", "ESLint", "VS Code Extension", "GitHub Actions", "Code Quality", "CI-CD", "Developer Experience (DX)", "Developer Documentation", "Open Source", "Accessibility", "Performance Optimization"
  ]
coverImage:
  src: "./cover.webp"
  horizontal: "./cover-horizontal.webp"
  vertical: "./cover-vertical.webp"
  logo: "./logo.webp"
  logoAspect: "square"
  logoSurface: "dark"
  alt: "Astro Doctor orange logo on a dark geometric cover with code diagnostics and health-score UI"
  ogImage: "./cover.webp"
---

## Building a health check for Astro projects

I built Astro Doctor to make Astro-specific code quality visible before it reaches production. The project started from a simple problem: Astro can compile a page that still works against the reasons you chose Astro in the first place.

The tool scans `.astro` files and project configuration for patterns that affect performance, accessibility, security, and maintainability. It then reports actionable diagnostics, a project health score, and workflow-specific output for local development, editors, pull requests, and automation.

### Goals

- **Protect Astro's performance model** by catching eager hydration, raw images, blocking scripts, and missing image dimensions.
- **Keep accessibility checks close to the code** with rules for image alt text, document language, and island fallback content.
- **Make adoption practical** with a CLI, ESLint plugin, VS Code/Cursor extension, and GitHub Action instead of one rigid workflow.
- **Help AI-assisted teams** by installing agent skills that teach the same Astro standards the scanner enforces.

### What I built

- **A CLI package** (`@santi020k/astro-doctor`) that scans projects, filters by category, emits JSON reports, explains individual findings, and returns a 0-100 health score.
- **An ESLint plugin** (`@santi020k/eslint-plugin-astro-doctor`) for teams that want the rules inside their existing lint setup.
- **A VS Code and Cursor extension** with live diagnostics, hover explanations, quick fixes, status updates, and a health sidebar.
- **A GitHub Action** that can comment on pull requests and report only the new issues introduced by a change.
- **A documentation site** at [doctor.santi020k.com](https://doctor.santi020k.com/) with quick-start guides, rule docs, and setup examples.
- **Installable agent skills** so AI coding assistants can learn the expected Astro patterns directly from the repository.

### Technical highlights

- **Rule engine:** `TypeScript`, `ESLint`, `astro-eslint-parser`, and Astro-aware rule metadata.
- **Developer workflows:** local CLI scans, `doctor.config.ts`, JSON output, score thresholds, and CI presets.
- **Editor integration:** a language-server-backed VS Code extension with diagnostics, hovers, quick fixes, and sidebar UI.
- **CI integration:** GitHub Action support for changed-file scans, sticky PR comments, and configurable blocking behavior.
- **Docs:** an Astro documentation site with rule pages, installation guides, and generated Open Graph assets.

### Results

- **One rule system across multiple surfaces:** CLI, ESLint, editor diagnostics, CI comments, and agent guidance all point back to the same Astro standards.
- **Cleaner adoption path for existing projects:** teams can start with changed-file scans and avoid turning every pull request into a legacy cleanup project.
- **A stronger AI-assisted workflow:** generated code can be scanned after the fact and guided before the next change is written.

### Why it matters

Astro is fast by default, but defaults only help if the codebase keeps respecting them. Astro Doctor turns the patterns I look for during Astro reviews into repeatable tooling: fast feedback, clear explanations, and standards that can live in the repository instead of only in someone's head.

Read the [Astro Doctor launch story](/blog/astro-doctor-announcement/) for the reasoning behind the toolkit and the workflows it protects.
