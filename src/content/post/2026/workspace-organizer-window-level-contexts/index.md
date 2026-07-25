---
title: "Workspace Organizer: Context switching at the window level"
description: "Why I built a native macOS workspace manager around individual windows, public system APIs, adaptive layouts, and privacy-safe automation."
publishDate: "2026-07-16T15:00:00.000Z"
coverImage:
  alt: "Scattered desktop windows flowing into three orderly, color-coded workspace clusters"
  src: "./cover.webp"
tags: ["macos", "swiftui", "productivity", "privacy", "native-apps"]
postType: "Deep Dive"
---

Most of my work happens inside a small set of applications.

The context changes constantly.

Safari can have windows for personal browsing, a client, documentation, and a product I am building. The same is true for terminals, editors, Finder, and AI tools. Application-level switching cannot tell those contexts apart.

That is why I built [Workspace Organizer](https://workspace.santi020k.com/), a native macOS app that groups individual windows into focused spaces inside named workspaces.

A workspace can be Personal, Work, or a project. Inside it, spaces such as Browser, Code, and AI hold the windows that belong together. The app remembers assignments and layouts, then restores the relevant scene from the app, menu bar, keyboard, trackpad, Shortcuts, URL commands, or a CLI.

The unit of organization is the window.

## Public APIs define the product boundary

Workspace Organizer does not use private macOS Spaces APIs.

It discovers standard windows through the public Accessibility API, moves and resizes them with supported system capabilities, and uses AppKit to hide applications when none of their windows belong to the active context.

This creates some constraints.

macOS controls Spaces and Stage Manager. A third-party app cannot safely recreate every part of those systems through public APIs. Workspace Organizer instead provides its own virtual context model over windows it can discover and control.

That boundary is documented because it affects setup. For the most deterministic switching, assigned windows should live on one macOS desktop and Stage Manager should be off. If Stage Manager stays enabled, its grouping rules still apply.

A native productivity tool should explain where the operating system remains in charge.

## Shared applications need window-level rules

Hiding an application is easy when every window belongs to the same context. The interesting problem is an application shared across spaces.

If one Safari window belongs to Work and another belongs to Personal, switching cannot hide Safari as a whole. Workspace Organizer raises the target windows and keeps inactive windows behind them.

The app recognizes Safari profiles when Safari exposes the relevant controls and labels. It uses Safari’s public Automation interface for window IDs and names only. Chrome, Edge, Brave, Vivaldi, Chromium, and Firefox profiles are matched on a best-effort basis from window-level metadata.

The product stores the profile name where useful, not the full title or URL.

That privacy boundary still allows a rule to distinguish “Personal browser profile” from “Client browser profile.”

## Layouts need to survive display changes

A saved rectangle is not a complete layout model.

Laptop-only work, an external monitor, and a different desk arrangement can all change the coordinate space. Restoring the same absolute positions can leave windows off-screen or stacked badly.

Workspace Organizer saves display-relative layout profiles and transforms them when the connected-display arrangement changes. Strongly overlapping fallback or learned layouts are tiled automatically. Choosing **Save Layout** preserves an intentional overlap.

The app can scope activation to every display or only the display under the pointer. Display-scoped switching avoids hiding a whole application when that action would disturb its windows on another display.

The layout model follows the context while respecting the current hardware.

## Smart Assist makes suggestions explainable

The app suggests a destination for unassigned windows based on local evidence.

Each suggestion can explain why it matched. A user can accept it, change the destination, dismiss it, or repair a saved matcher that became stale.

Smart Organize builds an editable plan before it changes the workspace. Applied changes can be undone, including after relaunch when the workspace structure still matches the recorded operation.

The app can learn from repeated accepted choices and optionally assign a high-confidence destination after the same pattern is accepted three times in a row. The auto-assignment stays visible, has one-click undo, and can be disabled per application.

This is a better model for local intelligence than an unexplained “organize everything” button:

- show the plan
- show the evidence
- let the user edit
- record the change
- support undo

## Context switching needs more than one interface

Different transitions need different controls.

A visual app is useful when defining workspaces, assigning windows, or reviewing a layout. A menu-bar switcher is faster for ordinary changes. Numbered keyboard shortcuts work when the space order is familiar. A context-first MRU switcher helps return to the last-used space. A window finder helps when the user remembers the app or title but not the assigned context.

Workspace Organizer also supports:

- configurable directional focus shortcuts
- backward and forward space navigation
- an optional trackpad gesture
- pinned global shortcuts
- notch and top-edge switchers
- schedules and display-arrangement triggers
- App Intents and native Shortcuts actions
- a validated `workspace-organizer://` URL scheme
- a bundled privacy-safe CLI

These are not multiple ways to show the same screen. They support different distances between intent and action.

## Automation should not expose the workspace

The CLI can list configured contexts, read the active context, open a workspace or space, and stream context-change events.

It does not expose window titles, URLs, or document metadata.

The URL scheme accepts a defined set of validated commands. Native Shortcuts actions use dynamic workspace and space pickers. Apple’s on-device language model can help interpret supported workspace commands when available, with local matching everywhere else.

Automation receives enough information to act without turning the app into an export of everything visible on the desktop.

## Local-first still needs a sync story

Workspace data stays local by default.

Users can export a versioned JSON document and import it on another Mac with merge or replace. Import creates a safety copy first.

Optional iCloud Drive sync uses a privacy-filtered whole document with last-writer-wins behavior. Smart Assist learning data is not synced.

This is intentionally simpler than a custom account and synchronization service. The app uses the private storage relationship the user already has with the platform and keeps sensitive learning data on the originating Mac.

## The product includes its delivery system

Workspace Organizer is a native app, but the complete product also includes:

- an Astro marketing and changelog site
- signed and notarized application releases
- a 14-day trial and license activation
- Sparkle updates for direct downloads
- Homebrew cask installation and upgrades
- release and appcast automation
- accessibility and browser testing
- privacy-safe diagnostics

The direct download and Homebrew cask install the same complete app. Update ownership follows the install method: Sparkle for direct installs, Homebrew for cask installs.

That detail prevents two update systems from fighting over the same copy.

## Context is more useful than application identity

The central idea behind Workspace Organizer is small:

An application name is not enough information to decide whether a window belongs in the current task.

Once the system recognizes individual windows, it can remember meaningful groups, restore their geometry, switch the scene, and automate transitions without treating every Safari or editor window as interchangeable.

The implementation is native, local-first, and constrained to supported APIs. Those constraints make the product more honest and more durable.

You can [visit Workspace Organizer](https://workspace.santi020k.com/), [browse the source](https://github.com/santi020k/workspace-organizer), or read the condensed [portfolio case study](/portfolio/workspace-organizer/).
