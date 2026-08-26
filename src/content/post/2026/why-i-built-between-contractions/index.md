---
title: "Why I Built Between Contractions"
description: "How waiting for Aarón became a calm, private contraction timer across the web, iOS, Android, watches, widgets, and partner devices."
publishDate: "2026-08-20T15:00:00.000Z"
coverImage:
  alt: "Two rhythmic timing pulses synchronizing across private devices around a warm central light"
  src: "./cover.webp"
tags: ["product-engineering", "swiftui", "android", "astro", "privacy", "personal-projects"]
postType: "Case Study"
---

Some projects begin with a market gap. Between Contractions began while Alejandra and I were waiting for our son, Aarón.

I had already built [Aaronmgz](/portfolio/aaronmgz/) as a warm place where family and friends could wait with us. Between Contractions came from a more practical part of the same experience: thinking ahead to labor and noticing how many contraction timers felt crowded, commercial, or harder to use than the moment allows.

The product rule became simple: remove everything that does not help.

## One action has to carry the experience

The central interaction should be obvious from across the room. Tap when a contraction begins. Tap again when it ends.

Duration, start-to-start frequency, and recent history should appear without asking someone to navigate a dashboard while supporting a person in labor. If the interface needs an explanation at that moment, it has already asked too much.

That constraint shaped every platform. The browser, phone, watch, widget, and desktop surfaces do not need identical layouts, but they do need to preserve the same mental model.

## Local-first is part of the product, not a tagline

The core timer is free, ad-free, and usable without an account. The browser version stores its history on the current device. The native apps follow the same local-first principle, using platform storage and optional operating-system backup rather than sending every contraction to a shared service.

That choice removes an entire category of unnecessary data handling. It also makes the basic tool resilient: timing does not depend on creating an account or maintaining a network connection.

Some households still want a partner, doula, or relative to coordinate the same live timer. That is why Partner Sync exists as a separate, explicit feature. Shared data uses its own pairing flow and backend instead of quietly changing the privacy model of the free timer.

The distinction matters. “Private by default” should describe the architecture, not just the copy on a landing page.

## The same product, built natively

Between January and August 2026, the idea grew from a browser timer into a multi-platform product.

The web experience uses Astro and TypeScript for a fast bilingual site and an install-free timer. The Apple applications use SwiftUI and SwiftData, with widgets, Live Activities, watch support, and a companion macOS experience. Android uses Kotlin, Jetpack Compose, Room, Glance widgets, and Wear OS.

I chose native applications because the useful edges of this product live close to each operating system: widgets, watch interactions, notifications, shortcuts, health integrations, background behavior, and platform backup. A shared UI runtime would have reduced some duplication, but it would also have made those edges harder to treat as first-class product surfaces.

The code is shared where sharing creates leverage: product language, backend contracts, validation rules, release checks, and the core definition of timing behavior. The interfaces stay native where the platforms genuinely differ.

## Guidance needs a visible boundary

The app can recognize the familiar 5-1-1 timing pattern: contractions roughly five minutes apart, lasting about one minute, across approximately one hour.

It cannot know someone's clinical history, individual care plan, travel time, or whether another urgent symptom is present. The alert is therefore a prompt to follow guidance from the care team, never a diagnosis or a guarantee about when to go to the hospital.

That boundary is especially important in a product built for a medically significant moment. Clear disclaimers are not enough on their own; the interface, notification language, and feature design all need to avoid claiming certainty the software does not have.

## Connected to the reason it exists

[Aaronmgz](/blog/building-aaronmgz-as-a-family-platform/) and Between Contractions are different products, but they belong to the same family story.

One is a long-lived digital home for Aarón. The other is a focused tool built while preparing for his arrival. Connecting them makes the motivation visible without mixing their jobs or their data.

The browser timer is [available now](https://between.santi020k.com/app/). The iOS and Android applications are prepared for release, with availability depending on the App Store and Google Play review timelines.

The shape of the project became large. Its promise stayed small: help a family keep time without taking over the moment.

[Explore the Between Contractions project](/portfolio/between-contractions/).
