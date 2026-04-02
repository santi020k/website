# Project Rules Overview

This directory contains the rules and conventions for the Santi020k private website project.

## Core Rules

- **[Astro Conventions](./rules/astro-conventions.md)**: Guidelines for components, content collections, and routing.
- **[Styling Rules](./rules/styling-rules.md)**: Tailwind CSS 4.x and CSS variable patterns.
- **[Dependency Management](./rules/dependency-management.md)**: Standard procedures for updates and security audits.

## Available Skills

### Agent Skills (Claude Code — `.agent/skills/`)

- **[Add New Content](./skills/add-content/SKILL.md)**: Workflow for adding new blog posts or projects.
- **[Adding Pages](./skills/adding-pages/SKILL.md)**: Steps for creating new top-level routes and navigation.
- **[Content Collections Architecture](./skills/content-collections/SKILL.md)**: Guide to schemas and data querying.
- **[Creating Components](./skills/creating-components/SKILL.md)**: Rules for reusable components, props, and Tailwind styling.
- **[Project Maintenance](./skills/maintenance/SKILL.md)**: Standard maintenance tasks.
- **[Testing Infrastructure](./skills/testing/SKILL.md)**: Guidelines for unit and E2E tests.

### Claude Skills (Cowork — `.claude/skills/`)

- **[SEO](../.claude/skills/seo/SKILL.md)**: Meta tags, structured data, sitemap, Core Web Vitals, image optimization, content SEO.
- **[Marketing](../.claude/skills/marketing/SKILL.md)**: Brand voice, copy frameworks, CTAs, blog headlines, social media, content strategy.
- **[Accessibility](../.claude/skills/accessibility/SKILL.md)**: WCAG 2.2 AA, ARIA, keyboard nav, Alpine.js accessible patterns, reduced motion.
- **[Web Design](../.claude/skills/web-design/SKILL.md)**: Design system, Tailwind tokens, CSS/Alpine animations, scroll effects, dark mode, responsive patterns.

## General Principles

- **Clean Build**: Always ensure `npm run lint` and `npm run check` pass with zero errors.
- **Modern Standards**: Favor Astro 6 features and Tailwind 4 utility-first approach.
- **Centralized Config**: Use `src/site.config.ts` for site-wide metadata.
