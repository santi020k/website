---
title: "RoadScore"
description: "Built a bilingual, offline road-trip card game that turns one passenger-operated phone into a shared scoreboard, deck library, and private trip journal."
brand:
  primary: "#ff8a3d"
  secondary: "#4ea8ff"
  surface: "#12141c"
role: "Creator"
startingDate: "17 Aug 2026"
liveDemoUrl: "https://roadscore.santi020k.com/"
typesId: "personal"
orderInTypes: 2
draft: false
relevanceWeight: 95
impactMetrics: ["Ships a complete 350-card bilingual Road Trip Mix for offline play", "Supports competitive and cooperative trips with configurable card, point, and time finish lines", "Keeps passengers, scores, custom decks, purchases, and the latest 20 trips on the device"]
technologies: ["Expo", "React Native", "TypeScript", "Expo Router", "Zustand", "Astro", "Hono", "Cloudflare Workers", "Cloudflare D1", "Lumen UI", "iOS", "Android", "Web", "StoreKit", "Google Play Billing", "Accessibility", "Localization", "Testing", "CI-CD"]
coverImage:
  src: "./cover.webp"
  background: "./cover-background.webp"
  horizontal: "./cover-horizontal.webp"
  vertical: "./cover-vertical.webp"
  logo: "./logo.png"
  logoAspect: "square"
  logoSurface: "dark"
  alt: "RoadScore logo staged in orange and blue light above a layered road-inspired portfolio background"
  ogImage: "./cover.webp"
---

## Turning the miles into a game

RoadScore is a road-trip card game designed for one shared phone. A passenger runs the game, the driver stays focused on the road, and everyone in the car gets something to notice, discuss, or compete for.

I built the mobile game, its deck-catalog service, and a bilingual marketing site as one pnpm monorepo. The browser version is playable now; the native iOS and Android releases remain clearly marked as coming soon until their public store listings exist.

### Goals

- **Make road time social** without requiring every passenger to install an app or create an account.
- **Work offline by default** so a lost signal never ends the trip.
- **Protect the driver’s attention** by assigning control to a co-pilot or another fixed passenger.
- **Support different groups** with bilingual content, custom decks, flexible session recipes, and consent-gated adult content.

### What I built

- **A complete free Road Trip Mix** with 350 English and Spanish cards spanning trivia, spotting, conversations, challenges, and activities.
- **Flexible trip sessions** with balanced, quick, scenic, conversation, and chaos recipes; competitive or cooperative play; and optional card, point, or time finish lines.
- **Fast shared-phone scoring** with a rotating Card Reader, saved challenges, score correction, live standings, and accessible alternatives to gestures.
- **Private personalization** for favorites, hidden cards, custom deck import and export, and a 20-trip on-device journal with rematches.
- **Optional premium decks** with platform purchase restoration and a separate consent boundary for Adults Only content.
- **A versioned catalog pipeline** that publishes validated immutable deck snapshots while devices keep their last known-good catalog offline.

### Technical highlights

- **Mobile:** `Expo`, `React Native`, `Expo Router`, `TypeScript`, `Zustand`, and Lumen’s React Native components.
- **Web:** `Astro`, bilingual static content, an install-free browser build, and Lumen’s web components.
- **Services:** `Hono`, `Cloudflare Workers`, `D1`, signed owner access, and shared Zod contracts.
- **Delivery:** `Turborepo`, `pnpm`, EAS, GitHub Actions, deterministic catalog generation, and a broad release preflight.

### Privacy and safety boundaries

RoadScore does not need an account or analytics service. Passengers, scores, trip history, custom decks, and purchase state stay on the device. The catalog service receives no game data or device identifier; it only returns the same published card catalog to every player.

The game also states its most important rule plainly: RoadScore is for a passenger to operate. The driver should never handle the phone while the vehicle is moving.

### Current launch state

The production website, catalog service, and web game are deployed. iPhone and Android builds follow separate testing, store-processing, and public-release steps, so the site does not show store buttons until stable public listing URLs are available.

[Play RoadScore in the browser](https://roadscore.santi020k.com/app/).
