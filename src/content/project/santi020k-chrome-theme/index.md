---
title: "Santi020k Chrome Theme"
description: "Designed, packaged, and published a Chrome Web Store theme that brings the Santi020k VS Code palette into browser chrome with token-mapped surfaces and zero permissions."
role: "Creator"
startingDate: "1 May 2026"
githubUrl: "https://github.com/santi020k/santi020k-chrome-theme"
liveDemoUrl: "https://chrome.santi020k.com"
typesId: "personal"
impactMetrics: [
  "Published on the Chrome Web Store as Santi020k Theme",
  "Zero permissions required — ships as declarative JSON with no attack surface",
  "Every Chrome surface maps to a named VS Code token — no guesswork, no approximations"
]
technologies: [
  "Chrome Extension", "Chrome Web Store", "Manifest V3", "JavaScript", "CSS", "HTML", "Node.js", "Vite", "pnpm",
  "GitHub Actions", "Open Source", "Theme Design", "Design Systems", "Browser Extension",
  "Developer Experience (DX)", "Accessibility"
]
coverImage:
  src: "./cover.webp"
  horizontal: "./cover-horizontal.webp"
  vertical: "./cover-vertical.webp"
  logo: "./logo.webp"
  logoAspect: "square"
  logoSurface: "light"
  alt: "Santi020k Chrome Theme logo on a deep violet geometric cover with browser UI artwork"
---

## Publishing my browser theme to the Chrome Web Store

Santi020k Chrome Theme is the browser companion to my [Santi020k VS Code Theme](/portfolio/santi020k-theme/). It brings the same deep violet surfaces, muted lavender text, and violet accents into Chrome, then packages that design as a real published theme on the [Chrome Web Store](https://chromewebstore.google.com/detail/santi020k-theme/cljcifjjgolaplmemjcnjhkjfoneadgj).

![Santi020k Chrome Theme logo and Web Store marquee artwork](store-marquee-banner.webp)

### Goals

- **Unified visual environment**: bring the same deep violet and muted lavender palette from the editor into the browser.
- **Token-level precision**: each Chrome surface traces back to a specific VS Code token, ensuring colors update in lockstep across both extensions.
- **Chrome Web Store readiness**: ship complete listing copy, screenshots, privacy policy, packaging scripts, and a repeatable validation path.
- **Zero attack surface**: themes ship as declarative JSON with no permissions and no remote code.

![Santi020k Chrome Theme extension icon](icon.webp)

### What I built

- **A Chrome Manifest V3 theme** covering the frame, toolbar, tab strip, active/inactive tabs, New Tab page, omnibox, and incognito variant.
- **Color sync scripts** that pull token values directly from the VS Code theme source, keeping both extensions consistent across releases.
- **Validation tooling** that checks manifest structure, color contrast, and packaging readiness before every release.
- **A packaging pipeline** that produces a Chrome Web Store-ready zip from a single command.
- **Store listing assets** including screenshots, promo tiles, privacy documentation, and English listing copy.

![Chrome Web Store listing preview for Santi020k Theme](store-main.webp)

![Chrome Web Store promotional tile for Santi020k Theme](store-promo-tile.webp)

![Santi020k Chrome Theme adaptive browser artwork](adaptive-assets.webp)

### Results

- **Published Chrome Web Store theme** under the Santi020k Theme listing, with a public install path for Chrome users.
- **Auditable and privacy-respecting** — no permissions requested, no data collected, fully open source.
- **Repeatable release workflow** backed by validation scripts, automated packaging, and Changesets versioning.

![Santi020k Theme incognito window preview](store-incognito.webp)

### Why it matters

A theme that only covers the editor still leaves the browser feeling unrelated to the rest of the workspace. This project treats Chrome as a first-class surface in the same design system: same tokens, same release discipline, same calm palette.

![Santi020k Theme New Tab page preview](store-new-tab.webp)

![Santi020k Chrome Theme new tab background artwork](new-tab-background.webp)
