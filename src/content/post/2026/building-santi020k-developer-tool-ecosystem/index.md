---
title: "How I Built the santi020k Developer Tool Ecosystem"
description: "How Lumen, ESLint Config Basic, Quality, Astro Doctor, Commitprompt, Dep Beacon, OG, Theme, and Auth form one practical system for my projects."
publishDate: "2026-09-24T22:45:00.000Z"
coverImage:
  alt: "A violet geometric core connecting interface modules, verification gates, and a delivery path"
  src: "./cover.webp"
tags: ["developer-experience", "developer-tools", "open-source", "automation", "design-systems"]
postType: "Deep Dive"
seriesId: "the-santi020k-way"
seriesOrder: 14
---

I did not set out to build an ecosystem.

I built one tool because I was tired of solving the same problem. Then I built another because the
first tool exposed a different repeated decision. Over time, the projects started to form a system:
shared design foundations, consistent code-quality rules, faster feedback, safer releases, and fewer
small choices that every application had to rediscover.

That system now includes [Lumen UI](/portfolio/lumen-ui/),
[`@santi020k/eslint-config-basic`](/portfolio/eslint-config-basic/),
[Quality](/portfolio/quality/), [Astro Doctor](/blog/astro-doctor-announcement/),
[Commitprompt](https://github.com/santi020k/commitprompt), [Dep Beacon](/portfolio/dep-beacon/),
[`@santi020k/og`](/portfolio/og/), [Santi020k Theme](/portfolio/santi020k-theme/), and a public,
experimental authentication package that is still being validated in real applications.

They do not share one runtime, one release cycle, or one definition of success. They share a more
important thing: decisions I do not want each project to make from scratch.

## The ecosystem is a set of boundaries, not a monolith

The word _ecosystem_ can easily become an excuse to connect everything to everything else. That is
not the goal here.

Each tool needs to remain independently useful. An Astro site should be able to use Astro Doctor
without adopting Lumen. A polyglot repository should be able to use Quality without replacing its
native analyzers. A product should be able to generate social cards with `@santi020k/og` while
keeping complete ownership of its visual design.

The tools connect through contracts rather than hidden coupling:

- Theme owns shared visual tokens and assets.
- Lumen turns design decisions into accessible interface primitives and native foundations.
- ESLint Config Basic and Astro Doctor keep implementation patterns explicit.
- Quality coordinates the checks a repository already trusts.
- Commitprompt and Dep Beacon keep routine maintenance close to the work.
- OG handles repeatable social-image generation without taking over a product's brand.
- Auth owns reusable authentication policy without creating one shared account database.

That separation matters. Shared tooling should remove repeated work, not move every product into one
large dependency graph.

## Design starts with Theme and becomes product UI through Lumen

[Santi020k Theme](/portfolio/santi020k-theme/) is the visual foundation. It coordinates the color
language I use across editors, Codex, terminals, browsers, documentation, and product surfaces. The
shared `@santi020k/theme` and `@santi020k/theme-core` packages make those tokens and assets available
to code instead of leaving them as colors copied between repositories.

[Lumen UI](/portfolio/lumen-ui/) sits above that foundation. It provides more than 150 web
primitives, shared native foundations, templates, Figma resources, an agent skill, and an MCP server.
Its job is not to make Astro, React, Web Components, React Native, SwiftUI, and Jetpack Compose look
like the same framework. Its job is to let them share semantics, accessibility expectations, tokens,
and interaction decisions while preserving native authoring models.

That boundary is important to me. A design system should make good interface behavior easier. It
should not force a specialized product screen into a generic abstraction that makes the experience
worse.

## ESLint Config Basic, Astro Doctor, and Quality cover different feedback loops

These three tools all deal with quality, but they work at different levels.

[`@santi020k/eslint-config-basic`](/portfolio/eslint-config-basic/) is the static-analysis foundation
for JavaScript and TypeScript projects. It provides an ESLint 10 flat config with automatic project
detection and focused packages for the frameworks and tools a repository actually uses. The goal is
to make strong defaults easy to adopt without turning every project into the same stack.

[Astro Doctor](https://github.com/santi020k/astro-doctor) adds Astro-specific judgment. It looks for
performance, accessibility, security, and architectural patterns that may compile successfully while
working against the reason a team chose Astro. It can run as a CLI, ESLint plugin, Oxlint config,
GitHub Action, editor extension, or agent guidance.

[Quality](/portfolio/quality/) operates one level higher. It detects and coordinates native analyzers
across Rust, Swift, Android and Kotlin, Python, JavaScript, TypeScript, and Astro repositories. It does
not replace the native analyzers those ecosystems already trust. It gives the repository one
predictable way to invoke them, normalize evidence, and run the same policy locally and in GitHub
Actions.

The distinction keeps the stack honest:

- ESLint Config Basic owns reusable lint configuration.
- Astro Doctor owns Astro-specific diagnostics and explanations.
- Quality owns orchestration and consistent evidence across languages.

Combining those responsibilities into one package would make every tool harder to adopt and harder
to maintain.

## Commitprompt and Dep Beacon reduce repeated maintenance decisions

Some developer-experience problems are not dramatic. They are small interruptions that happen often
enough to create noise.

[Commitprompt](https://github.com/santi020k/commitprompt) handles one of them: writing and validating
Conventional Commits without asking developers to remember syntax or repository-specific rules. It
supports the commit workflow while leaving Git hooks and the repository's policy as the final
authority.

[Dep Beacon](/portfolio/dep-beacon/) handles another: understanding dependency state while editing a
manifest. Its VS Code and Zed integrations surface npm versions, practical update targets, pnpm
workspace catalogs, and OSV security signals beside the dependency that needs attention.

Neither tool tries to replace engineering judgment. They shorten the distance between the question
and the evidence needed to answer it.

That is a recurring principle in the ecosystem: automate the repetitive part, then leave the
consequential decision visible.

## OG and Auth share machinery without stealing product ownership

Social images and authentication look unrelated, but the reusable boundary is similar.

[`@santi020k/og`](/portfolio/og/) owns deterministic generation: paths, fingerprints, caching,
concurrency, safe cleanup, output formats, and read-only CI verification. The consuming project still
owns its content, fonts, layout, assets, and visual identity. The valuable shared abstraction is the
pipeline, not a universal card design.

The open-source [`santi020k auth`](/portfolio/auth/) project follows the same rule for a more
sensitive boundary. Its first public package, `@santi020k/auth-cloudflare`, owns reusable
authentication policy and a Cloudflare Workers and D1 integration for compatible Santiago-owned
applications. Each product still owns its identity data, migrations, secrets, cookies, passkeys,
recovery process, email copy, and deployment.

Sharing authentication code must never quietly become a shared account system. Auth is public as an
experimental `0.x` package while its migrations, passkey behavior, and integration contract are
validated against real origins and real consumers.

## Real projects decide whether a shared tool deserves to exist

I do not want to extract a package because two files look similar. I want to extract a decision only
after multiple projects prove that the decision is stable and genuinely shared.

The process usually looks like this:

1. Solve the problem inside a real product.
2. Notice which part is policy or machinery rather than product behavior.
3. Test the boundary against a second consumer.
4. Extract the smallest useful contract.
5. Keep validating the package through the applications that depend on it.

That last step matters. A package can have a clean build, complete tests, and polished documentation
while still being awkward in a real product. Consumer projects expose the details a package's own
playground tends to miss: layout constraints, release ordering, migration risk, native-platform
behavior, and the cost of changing an API after adoption.

This website is one example. It uses Lumen, Theme, ESLint Config Basic, Commitprompt, and OG in the
same repository, but each tool owns a narrow part of the workflow. The site remains an Astro product,
not a demonstration shell built around the packages.

## Preferred does not mean mandatory

For my own projects, these tools are the first options I evaluate. That is different from installing
all of them everywhere.

An application without an interface does not need Lumen. A non-Astro repository does not need Astro
Doctor. A project with a deliberately different authentication model should not adopt Auth just
because I own it. Adding a package without a real fit creates coupling instead of leverage.

The standard is simple: prefer the shared tool when it satisfies the requirement, matches the
runtime and security boundary, and reduces maintenance without forcing the product into the wrong
abstraction.

The ecosystem should make projects more independent by giving them better foundations. If it makes
them harder to change, the boundary is wrong.

## What I want to improve next

The next stage is less about adding more tools and more about making the existing relationships
clearer.

I want installation and upgrade paths to be easier to discover. I want machine-readable contracts
that help coding agents use current APIs instead of guessing. I want release evidence to remain
traceable from local checks through GitHub Actions and post-release verification. And I want real
consumer feedback to keep shaping the packages instead of allowing their documentation sites to
become the only successful examples.

That is the ecosystem I am trying to build: separate tools, explicit contracts, shared standards,
and products that remain in control of their own behavior.

Explore the current work in my [developer-experience portfolio](/developer-experience/). I publish
irregularly, so follow via [RSS](/feed.xml) if you want the next field note when it is ready.
