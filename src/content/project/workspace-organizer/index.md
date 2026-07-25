---
title: "Workspace Organizer"
description: "Built a native macOS app that groups individual windows into focused spaces, restores layouts, switches contexts, and keeps workspace data private."
role: "Creator"
startingDate: "13 Jul 2026"
githubUrl: "https://github.com/santi020k/workspace-organizer"
liveDemoUrl: "https://workspace.santi020k.com/"
typesId: "personal"
impactMetrics: ["Organizes individual windows instead of forcing every window from one application into the same context", "Restores adaptive layouts across changing display arrangements", "Supports menu-bar, keyboard, Shortcuts, URL scheme, and privacy-safe CLI workflows"]
technologies: ["Swift", "SwiftUI", "AppKit", "macOS", "Accessibility API", "Apple Shortcuts", "App Intents", "iCloud Drive", "Sparkle", "Astro", "TypeScript", "Cloudflare Workers", "Lemon Squeezy", "Homebrew", "Privacy Engineering", "Accessibility", "Testing", "CI-CD"]
coverImage:
  src: "./cover.webp"
  alt: "Scattered desktop windows flowing into three orderly, color-coded workspace clusters"
  ogImage: "./cover.webp"
---

## Organizing contexts at the window level

Workspace Organizer is a native macOS app for grouping individual application windows into focused spaces inside named workspaces. A workspace can represent Personal, Work, or a specific project, while spaces such as Browser, Code, and AI keep the right windows together.

The window-level distinction is the core idea. A Safari window for personal browsing should not have to travel with a Safari window used for client work simply because both belong to the same application.

### Goals

- **Organize individual windows** without relying on private macOS Spaces APIs.
- **Restore the scene, not only the app list** with display-aware positions and sizes.
- **Make switching fast** from the app, menu bar, keyboard, trackpad, Shortcuts, URLs, or a CLI.
- **Keep sensitive context local** by avoiding window titles and URLs in diagnostics and sync.

### What I built

- **A native SwiftUI and AppKit application** that discovers standard windows through the public macOS Accessibility API.
- **Nested workspaces and spaces** with assignments, saved layouts, launch items, reordering, duplication, and configurable shortcuts.
- **Smart Assist** for explainable local assignment suggestions, editable organize plans, learning from accepted choices, and undo.
- **Adaptive layout restoration** across display changes, with safeguards for overlapping fallback layouts.
- **Automation surfaces** through App Intents, Apple Shortcuts, a validated URL scheme, schedules, display events, and a privacy-safe CLI.
- **Commercial delivery** with a trial, licensing, signed and notarized releases, Sparkle updates, Homebrew installation, and an Astro product site.

### Technical highlights

- **Supported platform APIs:** Accessibility, AppKit, SwiftUI, App Intents, iCloud Drive, and public browser automation where available.
- **Context switching:** application hiding, window raising, layout restoration, display scoping, and per-context navigation.
- **Privacy:** local-first workspace data, filtered export and sync, privacy-safe diagnostics, and no stored full window titles or URLs.
- **Distribution:** signed app bundles, Sparkle appcasts, Homebrew casks, Lemon Squeezy licensing, and Cloudflare-hosted marketing.

### Results

- **A window-level alternative** to app-level task switching.
- **Multiple ways to resume context** without making one interaction model mandatory.
- **A complete independent product pipeline** from native app and tests through licensing, updates, documentation, and distribution.

### Why it matters

Modern work happens across many windows from the same few applications. Workspace Organizer treats context as the unit that matters, then rebuilds that context without using private system APIs or uploading the details of what you are working on.

[Visit Workspace Organizer](https://workspace.santi020k.com/) or [see the source on GitHub](https://github.com/santi020k/workspace-organizer).
