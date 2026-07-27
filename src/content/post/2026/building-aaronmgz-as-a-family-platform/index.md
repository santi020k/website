---
title: "Building Aaronmgz as a family platform"
description: "How a nautical personal site became a shared family platform for messages, invitations, administration, and a long-lived digital home."
publishDate: "2026-06-04T15:00:00.000Z"
coverImage:
  alt: "Nautical night scene with a paper boat, lighthouse, and connected web experiences representing Aaronmgz"
  src: "./cover.webp"
tags: ["astro", "nextjs", "cloudflare", "product-architecture", "personal-projects"]
postType: "Case Study"
---

Some projects begin with a market gap. Aaronmgz began with a person.

I wanted to create a personal space on the web for my son, Aaron: something playful enough to feel like his, useful enough to support family moments now, and flexible enough to keep changing as he grows.

The first version could have been a single static page. Instead, the idea quickly became a useful architecture question:

How do you build a family platform without making it feel like enterprise software?

The answer was not to avoid structure. It was to put the structure underneath a warm, simple experience.

[Aaronmgz](https://aaronmgz.com/) now includes a nautical personal site, a public “Para Aaron” message board, the invitation application built for his baby shower, an admin panel, and the shared API behind those experiences.

## One identity, several jobs

Each part of the platform serves a different audience.

The personal website is public and story-driven. The message board is a place for family and friends to leave something Aaron can return to later. The baby-shower application handles invitations, RSVPs, gifts, and guest information. The admin panel helps manage that event. The API coordinates data and authentication across the system.

Those surfaces should not be one giant application. They also should not become disconnected mini-projects.

I used a `pnpm` and Turborepo monorepo so each app could keep a focused runtime while sharing the things that define the product:

- API contracts
- database helpers
- content records
- localization
- media metadata
- message types
- UI foundations

That boundary gives me both independence and consistency. The Astro site can stay static-first. The Next.js applications can own richer authenticated flows. The Hono worker can expose one typed backend. Shared packages connect them without forcing them into one deployment model.

## The public site stays static-first

The main website uses Astro 6.

That choice fits the part of the platform that should remain fast, durable, and easy to host. Most of the site is content. Astro can produce static HTML, then add React islands only where interaction earns its place.

This keeps the personal site from inheriting the runtime cost of the event application. It also creates a good long-term base for stories, photos, projects, and whatever Aaron wants the site to become later.

The visual direction is nautical: adventure, exploration, coastal colors, and a sense of a journey that is only beginning. I wanted the identity to feel optimistic without turning into generic children’s clip art. The system has room to mature as he does.

## The event app needed a different shape

The baby-shower experience uses Next.js.

Invitations and guest dashboards have a different behavior profile from a personal homepage. They need token-aware routes, forms, authenticated state, server interactions, and administrative workflows.

The app supports English and Spanish, because a family product should meet the family where it is. Shared dictionaries and locale helpers keep the translation model consistent across applications instead of letting each surface invent its own language structure.

The admin panel is separate from the guest experience. That makes the permission boundary easier to reason about and keeps operational controls out of the public application bundle.

## Cloudflare is the shared foundation

The API runs with Hono on Cloudflare Workers. Data lives in Cloudflare D1 and is modeled through Drizzle ORM. Zod validates the boundaries, and shared TypeScript packages give the front ends the same contract vocabulary.

This is more infrastructure than a one-page family site requires. It is the right amount for a growing platform with invitations, users, messages, and future features.

The repository includes checks for database migrations, generated schema drift, Cloudflare configuration, authentication smoke paths, accessibility, end-to-end behavior, SEO, and the normal build, lint, type, and test layers.

I do not add those checks because a personal project needs to imitate a company. I add them because personal data and family moments deserve reliability too.

## A platform can still feel personal

There is a useful tension in this project.

The implementation is a real multi-application system. The experience should never lead with that complexity. A visitor should see a warm message, an invitation, a photo, or a small part of Aaron’s story. The monorepo, typed contracts, migrations, and deployment checks should disappear behind that moment.

That is the architecture doing its job.

The project also reminds me that long-lived software benefits from a clear emotional reason to exist. There will always be another framework upgrade or deployment detail. The reason to keep caring is much simpler: I am building a place my son can grow into.

You can [visit Aaronmgz](https://aaronmgz.com/) and read the condensed [portfolio case study](/portfolio/aaronmgz/).
