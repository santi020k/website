---
title: "Aaronmgz"
description: "Built a growing family web platform with a nautical personal site, public message board, baby-shower experience, admin tools, and a shared Cloudflare API."
brand:
  primary: "#1677a6"
  secondary: "#0d2256"
  surface: "#06152f"
role: "Creator"
startingDate: "25 May 2026"
githubUrl: "https://github.com/santi020k/aaronmgz"
liveDemoUrl: "https://aaronmgz.com/"
typesId: "personal"
relevanceWeight: 35
impactMetrics: ["Unified four public and private experiences behind one domain", "Built shared contracts, content, database helpers, localization, media, and UI packages", "Added migration, schema-drift, accessibility, end-to-end, and deployment checks"]
technologies: ["Astro", "Next.js", "React.js", "TypeScript", "Tailwind CSS", "Hono", "Cloudflare Workers", "Cloudflare D1", "Drizzle ORM", "Zod", "Turborepo", "pnpm", "OpenNext", "i18next", "Accessibility", "Testing", "CI-CD", "Monorepo"]
coverImage:
  src: "./cover.webp"
  horizontal: "./cover-horizontal.webp"
  vertical: "./cover-vertical.webp"
  logo: "./logo.webp"
  logoAspect: "square"
  logoSurface: "dark"
  alt: "Nautical night scene with a paper boat, lighthouse, and connected web experiences representing Aaronmgz"
  ogImage: "./cover.webp"
---

## Building a family platform that can grow

I built Aaronmgz as a personal corner of the web for my son, Aaron. It began with a nautical website and grew into a monorepo that supports a public message board, a baby-shower invitation experience, an admin panel, and the API behind them.

The important architectural decision was to treat those experiences as one product family. They share a domain, visual language, data contracts, localization, and release process while keeping each application focused on its own audience.

### Goals

- **Create something durable** that can evolve from a family milestone into Aaron's long-term home on the web.
- **Keep public and private surfaces distinct** while sharing the contracts and infrastructure that should stay consistent.
- **Make family content approachable** in English and Spanish without maintaining two separate products.
- **Ship with real safeguards** around database migrations, authentication, accessibility, SEO, and deployment.

### What I built

- **An Astro personal site** with a nautical identity, static delivery, shared content, and the public “Para Aaron” message experience.
- **A Next.js baby-shower application** for invitations, RSVPs, gifts, and guest dashboards.
- **A separate admin surface** for managing the event and the content behind it.
- **A Hono API on Cloudflare Workers** with D1 storage, Drizzle schemas, validation, sessions, and typed contracts.
- **Shared workspace packages** for API types, database helpers, content, localization, media, message models, and UI.

### Technical highlights

- **Front ends:** `Astro 6`, `Next.js 16`, `React 19`, `Tailwind CSS v4`, and progressive islands where the static site needs interaction.
- **Backend:** `Hono`, `Cloudflare Workers`, `Cloudflare D1`, `Drizzle ORM`, and `Zod`.
- **Delivery:** `Turborepo`, `pnpm` workspaces, OpenNext, migration checks, schema-drift checks, smoke tests, accessibility tests, and end-to-end coverage.
- **Shared product language:** typed content and localization packages keep the family of apps aligned without copying records between them.

### Results

- **One coherent domain** for the public site, event application, messages, administration, and API.
- **A reusable foundation** that can add new chapters without rebuilding identity, content, or infrastructure each time.
- **A project with personal meaning** that still receives the same architectural care as a commercial platform.

### Why it matters

The best personal projects are not always small. Sometimes the emotional reason to build something is exactly what makes it worth designing for the long term.

That family story also led to [Between Contractions](/portfolio/between-contractions/), a calm, privacy-first timer I built while Alejandra and I prepared for Aarón's arrival. Aaronmgz holds the story of waiting for him; Between Contractions supports one practical part of the journey.

[Visit Aaronmgz](https://aaronmgz.com/).
