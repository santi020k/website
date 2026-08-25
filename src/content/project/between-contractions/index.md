---
title: "Between Contractions"
description: "Built a calm, privacy-first contraction timer for the web, iOS, Android, watches, widgets, and optional real-time partner coordination."
role: "Creator"
startingDate: "8 Jan 2026"
githubUrl: "https://github.com/santi020k/betweencontractions"
liveDemoUrl: "https://between.santi020k.com/"
typesId: "personal"
orderInTypes: 1
relevanceWeight: 88
impactMetrics: ["Delivered one bilingual timer across browser, phone, watch, widget, and desktop surfaces", "Kept the core timer free, ad-free, account-free, and local-first", "Separated optional Partner Sync from private on-device contraction history"]
technologies: ["Astro", "TypeScript", "Lumen UI", "Swift", "SwiftUI", "SwiftData", "WidgetKit", "WatchConnectivity", "Kotlin", "Jetpack Compose", "Room", "Glance", "Wear OS", "Hono", "Cloudflare Workers", "Cloudflare D1", "WebSockets", "Turborepo", "pnpm", "Accessibility", "Testing", "CI-CD", "i18n"]
coverImage:
  src: "./cover.webp"
  horizontal: "./cover-horizontal.webp"
  vertical: "./cover-vertical.webp"
  logo: "./logo.png"
  logoAspect: "square"
  logoSurface: "dark"
  alt: "Between Contractions project journal cover with Santiago and Alejandra waiting for Aarón alongside their three dogs"
  ogImage: "./cover.webp"
---

## A calm timer for a moment that already asks enough

I built Between Contractions while Alejandra and I were waiting for our son, Aarón. The product begins with one deliberately simple action: tap when a contraction starts and tap again when it ends.

From there, it calculates duration, start-to-start frequency, and recent patterns without turning labor into a dashboard. The browser timer is available now; the native iOS and Android releases are prepared while their store reviews follow their own timelines.

### Goals

- **Reduce cognitive load** with one large, obvious timing action and clear recent history.
- **Keep the core private** with local-first storage, no ads, no analytics SDK, and no required account.
- **Support real households** with English and Spanish, light and dark themes, accessibility, widgets, and watch companions.
- **Treat timing as guidance** by presenting the 5-1-1 pattern as a prompt to follow a care plan, never as a diagnosis.

### What I built

- **A bilingual Astro website and browser timer** that works without installation and keeps its history on the current device.
- **Native Apple experiences** for iPhone and iPad, with SwiftUI, SwiftData, widgets, Live Activities, Apple Watch support, and a companion macOS surface.
- **Native Android experiences** with Kotlin, Jetpack Compose, Room, Glance widgets, and Wear OS support.
- **Optional Partner Sync** for households that choose to coordinate a live timer across devices and platforms.
- **A small Hono and Cloudflare backend** for the explicit shared features, separated from the local-first core timer.

### Technical highlights

- **Web:** `Astro 6`, `TypeScript`, `Lumen UI`, browser storage, bilingual content, and static delivery.
- **Apple:** `Swift`, `SwiftUI`, `SwiftData`, `WidgetKit`, `WatchConnectivity`, and native system integrations.
- **Android:** `Kotlin`, `Jetpack Compose`, `Room`, `Glance`, and `Wear OS`.
- **Shared delivery:** `Turborepo`, `pnpm`, automated checks, release preflights, accessibility coverage, and platform-specific test suites.

### Privacy is an architecture decision

The timer does not need a backend to perform its main job. Personal history stays local by default, and optional platform backup uses the operating system's own mechanisms. Data crosses devices only when someone deliberately enables a feature that requires it.

That separation kept the product promise legible: the free timer is useful on its own, while Partner Sync remains an explicit choice rather than hidden infrastructure.

### One family story, two products

[Aaronmgz](/portfolio/aaronmgz/) is the warm public space I built while our family waits for Aarón. Between Contractions came from the practical side of the same chapter: preparing for labor and protecting attention when the moment arrives.

The two projects now point to each other because neither story is complete in isolation.

[Try the browser timer](https://between.santi020k.com/app/) or read [why I built Between Contractions](/blog/why-i-built-between-contractions/).
