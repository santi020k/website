---
title: "Lumen UI"
seoTitle: "Lumen UI: Web and Native Component Library"
description: "Built Lumen UI: shared design foundations for Astro, React, Web Components, and native interfaces, with accessible primitives, product layouts, Figma, and AI tooling."
cardDescription: "Shared design foundations for web and native apps. Accessible components, product layouts, and tools for consistent interfaces."
brand:
  primary: "#f49e0e"
  secondary: "#4b5563"
  surface: "#111827"
role: "Creator"
startingDate: "3 Jul 2026"
updatedDate: "20 Oct 2026"
githubUrl: "https://github.com/santi020k/lumen"
liveDemoUrl: "https://lumen.santi020k.com/"
typesId: "personal"
purpose: "developer-tools"
relevanceWeight: 100
previews:
  description: "Real interfaces built with Lumen: a web workspace and the SwiftUI playground. The screens use illustrative data."
  images:
    - src: "./preview-web.webp"
      alt: "Lumen web workspace with sidebar navigation, a revenue chart, recent activity, and a task form using illustrative data."
      title: "A workspace from shared parts"
      caption: "Navigation, charts, metrics, and form controls work together in one composition. Applications supply their own data and decisions."
    - src: "./preview-apple.webp"
      alt: "Lumen SwiftUI playground showing a release checklist with a date picker, accessibility checkbox, progress, and review actions."
      title: "The same foundations on iPhone"
      caption: "The native playground expresses a release checklist through SwiftUI controls. Shared tokens connect the visual language while the platform owns the interaction."
impactMetrics: ["Connects web and native interfaces through shared tokens and explicit component contracts", "Combines accessible controls, charts, maps, and operational layouts with platform-native authoring", "Supports design and AI workflows through Figma resources, an agent skill, MCP, and a machine-readable registry"]
technologies: ["Astro", "React.js", "Web Components", "TypeScript", "CSS", "Tailwind CSS", "Accessibility", "Design Systems", "Figma", "Model Context Protocol", "AI-assisted Development", "Vitest", "Playwright", "Turborepo", "pnpm", "NPM", "Developer Documentation", "Open Source"]
coverImage:
  src: "./cover.webp"
  horizontal: "./cover-horizontal.webp"
  vertical: "./cover-vertical.webp"
  logo: "./logo.webp"
  logoAspect: "square"
  logoSurface: "dark"
  alt: "Translucent interface primitives connected across three luminous framework lanes"
  ogImage: "./cover.webp"
---

## A shared language for web and native interfaces

I built Lumen UI to carry a consistent visual language across products while preserving each
platform's way of building. Astro, React, and standards-based Web Components share web contracts;
React Native, SwiftUI, and Jetpack Compose extend the foundations into native interfaces.

Shared tokens and explicit component contracts connect the system. Framework adapters own their
rendering and interaction: progressive enhancement for Astro, components and hooks for React,
custom elements for the browser, and platform-native composition for mobile and desktop apps.
Applications keep their business rules, data, routing, and recovery policy.

### Goals

- **Share product language** across web and native interfaces without forcing a common runtime.
- **Make accessible interaction repeatable** through semantics, keyboard paths, focus management,
  readable status feedback, and reduced-motion support.
- **Support real product work** with forms, data presentation, operational layouts, and recovery states.
- **Make design decisions discoverable** for developers, designers, and coding agents.

### What Lumen 4 brings together

- **Accessible controls and feedback:** buttons, disclosures, dialogs, fields, clipboard actions,
  progress, and error states with explicit interaction contracts.
- **Operational interfaces:** data tables, calendars, Kanban layouts, navigation, and complete
  dashboard templates that applications compose around their own state and workflows.
- **Data and presentation:** charts, `WorldMap`, `DeviceFrame`, and image comparison for readable
  product stories, analytics, and media experiences.
- **Motion with restraint:** reveal groups, animated numbers, and layout motion with stable content
  and reduced-motion paths.
- **Native foundations:** React Native, SwiftUI, and Compose adapters, alongside focused WidgetKit
  and Wear OS surfaces that respect their host platforms.
- **Design and AI resources:** a Figma library, portable agent skill, MCP catalog, CLI recipes,
  `llms.txt`, and machine-readable component and styling contracts.

### Technical highlights

- **Web adapters:** `@santi020k/lumen-astro`, `@santi020k/lumen-react`, and
  `@santi020k/lumen-elements`; choose the adapter for the existing application.
- **Shared foundations:** canonical design tokens, metadata, and behavior expectations; the
  umbrella `@santi020k/lumen` exposes the CLI and registry.
- **Public styling contracts:** semantic tokens, component props, documented variables, and stable
  part hooks instead of depending on private implementation classes.
- **CSS architecture:** standalone styles and explicit cascade layers for optional Tailwind use.
- **Verification:** interaction, accessibility, visual, package, and contract checks, with native
  compatibility and device evidence tracked separately.

The platform families share foundations, but their component coverage and supported toolchains
are qualified per adapter. A local build, a published package, a store build, and physical-device
accessibility are separate evidence. The
[native compatibility matrix](https://github.com/santi020k/lumen/blob/main/docs/native-compatibility.md)
and [device validation record](https://github.com/santi020k/lumen/blob/main/docs/native-device-validation.md)
make those boundaries visible.

### Used in this website

This site consumes the published Lumen 4 Astro, core, and umbrella packages. The travel notebook
uses `WorldMap`, the homepage presents a product screenshot through `DeviceFrame`, and reading
layouts compose shared progress, copy actions, and navigation primitives. The website keeps its
editorial styling, search, content ordering, and travel data.

This consumer work helps identify library improvements from real interfaces: clear defaults,
public styling hooks, accessible clipboard feedback, and predictable motion. The
[v3 to v4 migration guide](https://github.com/santi020k/lumen/blob/main/docs/migrating-v3-to-v4.md)
records the upgrade contract for other consumers.

### Why it matters

Lumen makes interface decisions reusable without moving application policy into a design system.
A developer can discover a real component contract, a designer can work from the same foundations,
and a coding agent can retrieve source-backed guidance instead of inventing an API.

[Explore the Lumen documentation](https://lumen.santi020k.com/),
[try the playgrounds](https://lumen.santi020k.com/#playgrounds), or
[see the source on GitHub](https://github.com/santi020k/lumen).
