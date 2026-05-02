---
title: "Santi020k Chrome Theme"
description: "Designed and published a Chrome browser theme that maps every surface to a named VS Code token from the Santi020k dark palette — deep violet, muted lavender, zero approximations."
rol: "Creator"
startingDate: "1 May 2026"
githubUrl: "https://github.com/santi020k/santi020k-chrome-theme"
liveDemoUrl: "https://chrome.santi020k.com/"
typesId: "personal"
impactMetrics: [
  "Every Chrome surface maps to a named VS Code token — no guesswork, no approximations",
  "Zero permissions required — ships as declarative JSON with no attack surface",
  "Incognito windows use a deeper frame variant for visual distinction"
]
technologies: [
  "Chrome Extension", "JavaScript", "CSS", "HTML", "Node.js", "Vite", "pnpm",
  "GitHub Actions", "Open Source", "Theme Design", "Design Systems", "Browser Extension",
  "Developer Experience (DX)", "Accessibility"
]
coverImage:
  src: "./cover.webp"
  alt: "Santi020k Chrome Theme — dark New Tab page with deep violet surfaces and muted lavender accents"
---

## Browser chrome as calm as your editor

Santi020k Chrome Theme extends the Santi020k design system from VS Code to the browser. Every color maps directly to a named VS Code token — toolbar, tabs, New Tab page, omnibox, incognito frame — so both tools stay in sync without approximations or manual adjustments.

### Goals

- **Unified visual environment**: bring the same deep violet and muted lavender palette from the editor into the browser, eliminating the visual context-switch between tools.
- **Token-level precision**: each Chrome surface traces back to a specific VS Code token, ensuring colors update in lockstep across both extensions.
- **Zero attack surface**: themes ship as declarative JSON with no permissions and no remote code — fully auditable in under a minute.

### What I built

- **A Chrome Manifest V3 theme** covering the frame, toolbar, tab strip, active/inactive tabs, New Tab page, omnibox, and incognito variant.
- **Color sync scripts** that pull token values directly from the VS Code theme source, keeping both extensions consistent across releases.
- **Validation tooling** that checks manifest structure, color contrast, and packaging readiness before every release.
- **A packaging pipeline** that produces a zip ready for the Chrome Web Store submission from a single command.
- **A documentation site** at [chrome.santi020k.com](https://chrome.santi020k.com/) with install instructions, color decisions, and developer notes.

### Results

- **Consistent design system** spanning VS Code and Chrome with a single source of truth for all color decisions.
- **Auditable and privacy-respecting** — no permissions requested, no data collected, fully open source.
- **Repeatable release workflow** backed by validation scripts, automated packaging, and Changesets versioning.

### Why it matters

A theme that only covers the editor leaves a visual seam every time you switch to the browser. This project closes that gap by treating Chrome as a first-class surface in the same design system — same tokens, same discipline, same calm palette.
