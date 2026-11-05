---
title: "Between Contractions: Local-First Partner Sync"
description: "How I designed optional cross-platform Partner Sync without making a contraction timer depend on the network, an account, or a central history database."
publishDate: "2026-08-21T07:00:00.000Z"
coverImage:
  alt: "Three independent device platforms connected through an optional cloud synchronization layer around a local timer"
  src: "./cover.webp"
tags: ["distributed-systems", "cloudflare", "websockets", "swiftui", "android", "local-first"]
postType: "Deep Dive"
---

The most important requirement in a contraction timer is not synchronization.

It is that the timer works immediately.

[Between Contractions](https://between.santi020k.com/) has an optional Partner Sync feature for households that want several devices to coordinate the same live session. Building it introduced the usual distributed-systems problems: multiple writers, intermittent connections, delayed events, independent databases, and purchases managed by two stores.

None of those problems can be allowed to block the core action.

The architecture therefore begins with a constraint: Start and Stop remain local operations. Sync can coordinate them, reconcile them, and replay them, but it cannot become a prerequisite for recording a contraction.

This is the technical story. The personal reason the product exists lives in the official bilingual journal: [Why I built Between Contractions](https://between.santi020k.com/journal/why-i-built-between-contractions/).

## The local database remains the source of personal history

Each application owns its records on the device.

The Apple apps persist contractions with SwiftData. Android uses Room. The browser timer stores its history locally as well. A family can use the free timer without an account, a subscription, or a connection to my backend.

That boundary does two jobs.

First, it protects the basic experience from network failures. Losing connectivity should not turn a large Start button into a spinner.

Second, it keeps the backend from becoming a permanent central database of labor history. Partner Sync needs enough server-side state to authenticate members, coordinate a live group, and deliver events that another device has not applied yet. It does not need to replace the databases already on each phone.

Local-first here is not “everything stays on one device forever.” It means the local application remains useful and authoritative for its own history, while sharing is an explicit layer on top.

## One room coordinates up to five independent devices

Partner Sync uses a Hono API on Cloudflare Workers, D1 for subscription and group metadata, and one Durable Object per device group.

The Durable Object gives each group a single coordination point. Connected devices communicate over WebSockets, and the room can arbitrate simultaneous commands instead of asking several phones to independently decide which Start event won.

When a contraction begins, the room assigns a canonical identifier. Every participating device stores that identifier with its own local record. Later Stop, intensity, note, edit, or delete events can then refer to the same contraction across SwiftData and Room without relying on timestamps or insertion order.

The model supports one payer and up to four joined devices in any Apple and Android mix. Billing determines who can create and maintain the group; it does not change who can participate in the shared timer after joining.

## Acknowledgement means persisted, not merely received

A WebSocket delivery receipt is too weak for this product.

If a phone acknowledges an event as soon as bytes arrive, the backend can discard it before the application commits the matching record. A background transition, process termination, or storage error in that gap would leave the group looking synchronized when one device had actually lost the update.

Partner Sync acknowledges an event after the client applies it to SwiftData or Room. Until every current member has done that, the relay can retain the event for store-and-forward delivery.

This makes reconnection more than “open a socket again.” A device returning after a temporary outage can request the events it has not persisted, apply them in order, and acknowledge the resulting local state.

The backend still avoids becoming a history service. Retained events exist to complete delivery, not to provide a permanent second copy of every contraction.

## Simultaneous Start is a reconciliation problem

Two people may tap Start at nearly the same moment.

Creating two contractions would be confusing. Waiting indefinitely for the network would be worse.

The interface can respond optimistically while the group room arbitrates the command and returns the canonical event. If another device won the race, the client reconciles its temporary local state with the accepted identifier rather than silently creating a second session.

The same principle applies when connectivity is poor: preserve the user's action first, then make convergence visible and deterministic. Distributed consistency matters, but it cannot outrank the timer's immediate local behavior.

## Platform differences stay behind the protocol

The two native applications do not share a UI runtime.

Apple uses SwiftUI, SwiftData, WidgetKit, WatchConnectivity, and StoreKit. Android uses Jetpack Compose, Room, Glance, the Wearable Data Layer, and Play Billing. Those differences are valuable because widgets, watches, background execution, purchases, and backup behavior are platform capabilities rather than generic screens.

The shared layer is the protocol:

- canonical contraction identifiers
- versioned event payloads
- group membership and device limits
- persistence-aware acknowledgements
- reconnect and catch-up behavior
- subscription and entitlement states

That is the part that needs identical meaning. The interface and storage implementation only need to honor the same contract.

## Optional infrastructure should remain optional

Partner Sync is the most distributed part of Between Contractions. It is also deliberately outside the critical path of the free timer.

This separation made the system more complex in one place and much simpler everywhere else. The native apps can offer real-time cross-platform coordination when a family chooses it, while the primary Start and Stop experience remains fast, private, and useful on its own.

That is the architecture I want for personal data: local capability first, explicit sharing second, and a backend with no more authority than the feature requires.

[Explore the complete Between Contractions project](/portfolio/between-contractions/).
