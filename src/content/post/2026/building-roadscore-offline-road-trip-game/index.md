---
title: "Building RoadScore: An Offline Road-Trip Game for One Shared Phone"
description: "How I designed RoadScore around a co-pilot, an offline catalog, flexible trip sessions, and privacy boundaries that keep game data on the device."
publishDate: "4 Sep 2026"
tags: ["roadscore", "expo", "react-native", "offline-first", "game-development", "accessibility"]
draft: false
postType: "Case Study"
coverImage:
  src: "./cover.webp"
  alt: "An abstract phone and three connected game cards arranged around an orange route through a purple landscape"
---

Road trips have a peculiar kind of empty time. Everyone is together, but the usual phone experience pulls each person into a separate screen. I wanted to build something that moved in the opposite direction: one phone, one shared game, and more reasons to look out the window or talk to the people in the car.

That became [RoadScore](https://roadscore.santi020k.com/), an English-and-Spanish road-trip card game for the co-pilot’s phone.

## Start with the safety boundary

The most important product decision was also the simplest: the driver does not operate RoadScore while the vehicle is moving.

During setup, the group chooses a driver and at least two passengers. The game can rotate the Card Reader between non-driver passengers, or keep the phone with one fixed person when passing it around is impractical. That constraint shapes the interface, the rules, and the way every card is written.

It also kept the product honest. RoadScore is not a dashboard for a driver. It is a shared activity for everyone else in the car.

## Make one phone feel communal

A shared-phone game has to move quickly. The active reader draws a card, taps everyone it applies to, and scores or skips it. Spotting challenges and delayed penalties can stay active in a drawer until they happen. The scoreboard remains visible, and mistakes can be corrected without restarting a trip.

The cards span four basic interactions:

- **Rewards and penalties** that can apply to one or several passengers.
- **Spotting challenges** for the first person to notice something outside.
- **Driver cards** that let passengers recognize safe, thoughtful driving—or call out a harmless road-trip offense.
- **Conversation, trivia, and activities** that do not depend on a score at all.

RoadScore’s free Road Trip Mix contains 350 curated cards in English and Spanish. Connections and Adults Only are separate optional decks, and mature content stays outside the playable pool until the group explicitly confirms that every player is an adult and consents.

## Design sessions, not endless shuffles

Random cards alone do not create a satisfying trip. A short drive needs a different rhythm from a long scenic route, and a conversation-focused group should not receive the same sequence as a competitive one.

RoadScore offers balanced, quick, scenic, conversation, and chaos recipes. Players can end after a card count, at a point target, after a time limit, or whenever the group decides. Competitive mode tracks individual leaders; Crew vs. the Road turns the same cards into a cooperative goal.

An on-device queue uses card metadata to vary the interaction types, favor the selected mood, respect favorites and hidden cards, and avoid piling up delayed challenges. The result still feels surprising, but it is intentionally paced.

## Treat offline behavior as the normal path

RoadScore has no account requirement, and a tunnel should not interrupt a game. The app bundles a complete playable catalog, then checks a small Cloudflare service for a newer published version when connectivity is available.

Published catalogs are immutable and schema-validated. A device downloads a complete snapshot, validates it, and only then replaces its cache. A failed, partial, older, or invalid response leaves the last known-good catalog untouched.

That boundary also protects privacy. The service receives no passengers, scores, trips, custom decks, favorites, hidden cards, or purchase history. It returns the same catalog to every device.

## Keep personalization local

Players can build custom decks and share versioned RoadScore deck files. Imports are previewed, size-limited, and validated before they reach the local library. Premium content cannot be exported, and portable files never contain passengers, scores, entitlements, or trip history.

Favorites, hidden cards, reactions, and the latest 20 completed trips stay in the on-device store. A rematch can restore the people, recipe, and settings from an earlier trip without turning that private journal into a cloud profile.

## Build every surface from the same product promise

The mobile app uses `Expo`, `React Native`, `TypeScript`, `Expo Router`, and `Zustand`. The public site uses `Astro`; the catalog API uses `Hono`, Cloudflare Workers, and D1. Shared Zod contracts keep the mobile cache and publishing service aligned, while Lumen provides accessible components and semantic themes across the app and website.

English and Spanish, light and dark appearances, screen-reader semantics, touch alternatives, and reduced-friction recovery are part of the main experience. They are not a separate polish pass.

## Be precise about what “launched” means

The RoadScore website, catalog service, and browser game are deployed today. Native iOS and Android builds have their own gates: physical-device testing, store uploads, processing, review, and public availability. The website keeps those store links marked as coming soon until real public listing URLs exist.

That distinction matters. A successful build is evidence that an artifact exists; it is not evidence that someone can download it from a store.

RoadScore is already playable where its launch state is proven. The next miles are about validating the native experience with real groups, finishing the store paths, and continuing to improve the deck without compromising the offline, private core.

[Play RoadScore on the web](https://roadscore.santi020k.com/app/) or see the [RoadScore project page](/portfolio/roadscore/).
