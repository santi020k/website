---
title: "Lumen 4: From primitives to product workflows"
description: "Inside the Lumen 4 candidate: richer charts, media workspaces, motion, native refinements, and a deliberate migration from v3."
publishDate: "2026-10-06T15:00:00.000Z"
draft: true
coverImage:
  alt: "A luminous modular core connecting a desktop chart, a mobile frame, and a translucent media tile"
  src: "./cover.webp"
tags: ["design-systems", "cross-platform", "data-visualization", "accessibility", "developer-experience"]
postType: "Deep Dive"
---

When I opened the Lumen 4 release pull request, the size was hard to ignore: more than 6,500 changed files and roughly 343,000 added lines.

Those numbers need context. This is a coordinated release across web and native packages, with generated sources, documentation, tests, playgrounds, and release infrastructure in the same change. The diff is much larger than the hand-written component code alone.

Still, the scope reflects a real change in what I want [Lumen](https://lumen.santi020k.com/) to make possible.

The first version established a shared UI language for Astro, React, and Web Components. Native adapters carried that language into React Native, SwiftUI, and Jetpack Compose. With version 4, the work moves deeper into the interfaces products actually need: analytical dashboards, localized forms, media workspaces, and interactions that stay usable as state changes.

**This is a preview of the v4 candidate.** As of October 6, 2026, [the release PR](https://github.com/santi020k/lumen/pull/95) is open. The features described here belong to that candidate; package publication, documentation deployment, and store updates are separate steps.

## Real applications shaped the release

The most useful starting point was an audit of the applications around Lumen.

Financial interfaces needed date ranges, precise amounts, and charts that remained readable on a phone. Media products needed comparison views and attachment actions. Documentation sites exposed clipboard failures, navigation behavior, and spacing workarounds. Native apps needed better layouts and clearer data presentation.

That audit gave the release a concrete purpose: move reusable presentation and interaction into Lumen while leaving product decisions with the application.

An amount control can preserve a localized decimal draft. It should not decide a lending rule. A chart can expose exact values and an activation event. It should not calculate a product's business metrics. A media workspace can organize previews and controls. Storage, processing, and export still belong to its host.

That boundary matters more as the catalog grows.

## Charts become a richer product language

V4 expands the visualization vocabulary with components such as BulletChart, CalendarHeatmap, FunnelChart, and BoxPlot, alongside comparison, histogram, and waterfall views.

Each answers a different question. A bullet chart compares a measurement against a target and qualitative ranges. A calendar heatmap reveals activity across dates. A funnel preserves the supplied order of stages. A box plot displays quartiles, whiskers, and outliers supplied by the application.

The distinction is practical. Lumen owns the rendering contract; the application owns the statistics and meaning of the data.

The release also improves the less visible parts of charts: stable identities, localized detail, responsive labels, exact-data tables, keyboard actions, and motion that keeps accessible data available immediately.

Two observations can share the display label “Mon” without sharing the same identity. A missing measurement should stay missing instead of quietly becoming zero. A chart should still explain its data when its visual encoding is difficult to interpret.

Those rules are what make a visualization useful beyond a screenshot.

## Media interfaces get reusable building blocks

ImageComparison adds a focused way to inspect two images. The broader media work introduces controlled viewports, thumbnails, filmstrips, and persistent comparison modes, with installable Studio workspace, adjustment, and processing recipes.

Together, these pieces support a more complete editing surface: choose an asset, inspect it, compare states, and expose the next action through consistent controls.

Attachments also receive explicit composition for previews, fallback states, retry identity, and independent file actions.

The host still supplies media services and export behavior. Keeping that responsibility explicit makes the same UI useful for a photo tool, an asset review screen, or a processing workflow without making Lumen a media backend.

## Motion joins the interaction contract

V4 includes presence transitions, coordinated keyed motion, chart continuity, and optional visual effects. There are also optional integration entry points for Motion and Rive.

The goal is to make changes easier to follow: a panel entering, a list changing, a chart updating, or feedback appearing after an action.

That requires more than a smooth animation. Interrupted transitions, keyboard focus, reduced-motion preferences, and the availability of content all need to behave correctly.

The new visual playground makes those decisions easier to explore. Default, Studio, and Glass appearance presets provide distinct starting points, while theme customization covers radius, spacing, and borders. Native adapters expose corresponding palettes and explicit material choices with opaque fallbacks.

Appearance is a foundation choice. It should not require replacing every component in a product.

## Maps and device frames make examples more useful

WorldMap brings dotted and solid maps to the web adapters, with highlighted countries, labeled markers, selection, zoom controls, and mouse or pen panning. Its country geometry ships with the library rather than requiring runtime network requests.

That opens useful compositions for destination selection, regional summaries, and geographic storytelling. The application supplies the meaning of a selected country or marker.

DeviceFrame gives demonstrations a more intentional setting. Its presets include phones, tablets, laptops, and desktops, with models such as MacBook Air, MacBook Pro, iPad Pro, iMac, and Pixel. Frames can present images, live HTML, or a fixed iframe viewport.

These are presentation tools, but they solve a real documentation problem: showing how an interface fits a device without rebuilding a mockup for every example.

## Native consistency keeps platform conventions

The native work continues the same architecture: shared semantic foundations, with implementation details owned by each adapter.

V4 includes native chart and layout refinements, appearance changes, and updated playgrounds. Support remains intentional; a web component appearing in the catalog does not automatically promise an identical native API.

SwiftUI should still feel like SwiftUI. Compose should still use Android conventions. React Native should still follow its own interaction model.

The candidate's native changes also require consumers to rebuild. A source call that continues to compile does not prove binary compatibility, and a repository preview does not prove that a store build contains the same revision.

## A major version needs a deliberate migration

Some of the most consequential v4 changes are small API and layout decisions.

Web Stack and Grid gaps now follow the canonical spacing scale. To preserve v3 layouts, explicit `md`, `lg`, and `xl` gaps migrate to `group`, `xl`, and `2xl` respectively. The omitted default remains 16 pixels.

Select, PhoneInput, and Segmented use `visualSize` on Astro and React, and `visual-size` on Web Components. This separates visual sizing from native control sizing.

Card owns the spacing between its parts and no longer clips all overflow. That lets focus rings and floating content extend beyond the card, while an image frame can own media clipping. Applications should review old compensating margins and overflow rules as part of the upgrade.

Controlled selection also needs explicit ownership: accept changes into application state, or choose an uncontrolled default when that is the intended behavior.

The [v3 → v4 migration guide](https://github.com/santi020k/lumen/blob/release/v4.0.0/docs/migrating-v3-to-v4.md) includes a CLI preview and examples. Automated rewrites cover recognized source patterns; dynamic props, application CSS, native pins, and behavioral decisions still need review.

## Better tools for the people and agents using Lumen

The AI workflow work adds version-aware catalog use, migration discovery, and dedicated build, review, and migration guidance. The MCP catalog exposes current contracts so agents can look up supported components instead of guessing an API.

Version awareness is especially useful during a major release. An application with v3 installed should receive v3 guidance until it deliberately upgrades.

I am also keeping the evidence separate: deterministic catalog checks, authenticated agent exercises, package publication, and a working installed plugin answer different questions. None alone proves that every generated interface will be correct.

## What I want this version to enable

The size of the PR is striking, but the outcome I care about is simpler: more of the repeated UI work in my products should become reusable, documented, accessible building blocks.

Lumen 4 brings those blocks closer to complete product workflows while keeping business rules, data ownership, and platform structure with the application.

You can [follow the release PR](https://github.com/santi020k/lumen/pull/95), [explore Lumen](https://lumen.santi020k.com/), or read the candidate's [consumer audit](https://github.com/santi020k/lumen/blob/release/v4.0.0/docs/lumen-4-consumer-audit.md). When the release is published, start with the migration guide and verify the actual package versions before upgrading a production app.
