---
title: "PostLens"
description: "Built an iPhone-first private visual content studio for selecting strong photos, applying transparent on-device enhancements, composing layouts, and exporting social-ready work."
role: "Creator"
startingDate: "14 Jul 2026"
liveDemoUrl: "https://postlens.santi020k.com/"
typesId: "personal"
draft: true
relevanceWeight: 90
impactMetrics: ["Keeps core photo analysis, scoring, editing, and caption preparation on the iPhone", "Supports reusable formats for Instagram, TikTok, Pinterest, LinkedIn, X, and generic exports", "Ships the app, permission language, StoreKit catalog, landing page, and support hub in English and Spanish"]
technologies: ["Swift", "SwiftUI", "iOS", "PhotoKit", "PhotosPicker", "Vision", "Core Image", "Foundation Models", "Image Playground", "StoreKit", "Astro", "TypeScript", "Privacy Engineering", "Accessibility", "On-device AI", "Image Processing", "Localization", "Testing"]
coverImage:
  src: "./cover.webp"
  horizontal: "./cover-horizontal.webp"
  vertical: "./cover-vertical.webp"
  logo: "./logo.webp"
  logoAspect: "square"
  logoSurface: "dark"
  alt: "Photo frames moving through selection, enhancement, composition, and carousel export stages"
  ogImage: "./cover.webp"
---

## Building a private visual content studio for iPhone

PostLens helps people choose strong photos, improve them with explainable edits, compose social-ready layouts, and export the result. Its workflow is intentionally narrow: **Select → Enhance → Compose → Export**.

Scheduling, connected accounts, analytics, and engagement tracking stay outside the product. That boundary lets the app focus on the creative work while keeping the first version local to the iPhone.

### Goals

- **Make photo selection easier** with useful scoring that does not upload a library to a private server.
- **Keep edits understandable** through measured signals and bounded adjustment recipes.
- **Support real publishing formats** without locking a photo into one destination or crop.
- **Treat privacy, accessibility, and localization as product features** rather than release notes.

### What I built

- **A progressive scored gallery** that prioritizes visible photos, analyzes local assets in battery-aware batches, and reuses a private on-device index.
- **An editing workflow** that measures exposure, contrast, saturation, color balance, clipping, and sharpness before applying predictable looks.
- **A tailored AI look** that searches bounded candidates, validates the result, frames a Vision-guided crop, and drafts an editable grounded caption.
- **Layouts and carousels** for reusable social formats, publishing sets, profile grids, and still-frame video export.
- **Optional Apple integrations** for Foundation Models coaching and per-use Image Playground handoff on supported devices.
- **An Astro landing and support site** in English and Spanish.

### Technical highlights

- **Native stack:** `SwiftUI`, `PhotoKit`, `PhotosPicker`, `Vision`, `Core Image`, `StoreKit`, and Apple system sharing.
- **On-device intelligence:** local scoring, bounded preview re-analysis, subject-aware framing, and caption preparation.
- **Privacy boundaries:** no PostLens upload server, metadata-free saved copies, and explicit disclosure before optional Apple generative workflows.
- **Release quality:** privacy manifests, source-size checks, native tests, SEO checks, and a release preflight.

### Results

- **A complete free single-photo workflow** from library review to format-specific export.
- **Optional supporter features** that add multi-photo and publishing workflows without gating privacy, accessibility, scoring, or core editing.
- **A clear product boundary** that keeps PostLens a visual studio instead of another social account dashboard.

### Why it matters

Creative tools can be helpful without becoming opaque. PostLens combines on-device measurement, predictable adjustments, and optional system intelligence while keeping the user in control of the final image and caption.

[Visit PostLens](https://postlens.santi020k.com/).
