---
title: "Santi020k Terminal Theme"
description: "Built a coordinated terminal system with dark and light palettes for six terminal families, three Starship styles, managed shell integration, and a release-ready CLI."
role: "Creator"
startingDate: "13 Jul 2026"
githubUrl: "https://github.com/santi020k/santi020k-theme"
liveDemoUrl: "https://terminal.santi020k.com/"
typesId: "personal"
impactMetrics: ["Generates coordinated palettes for iTerm2, Ghostty, Kitty, WezTerm, Windows Terminal, and Alacritty", "Ships rich, portable, and minimal Starship presets in dark and light", "Provides managed Zsh, Bash, and Fish integration with install, repair, migration, and configuration tooling"]
technologies: ["iTerm2", "Ghostty", "Kitty", "WezTerm", "Windows Terminal", "Alacritty", "Starship", "Zsh", "Bash", "Fish", "JavaScript", "Node.js", "Homebrew", "Shell Scripting", "Theme Design", "Design Systems", "CI-CD", "GitHub Actions", "Open Source", "Developer Experience (DX)", "Accessibility", "Testing"]
coverImage:
  src: "./cover.webp"
  alt: "Dark and light terminal surfaces connected by a violet palette ribbon and coordinated prompt segments"
  ogImage: "./cover.webp"
---

## Extending the Santi020k palette into the terminal

Santi020k Terminal Theme brings the calm violet language of [Santi020k Theme](/portfolio/santi020k-theme/) into terminal colors, command prompts, and shell configuration. It combines generated dark and light palettes with rich, portable, and minimal Starship presets.

The project goes beyond a pair of color files. It includes a CLI, managed shell integration, automatic appearance selection, validation, Homebrew distribution, and a dedicated product site.

### Goals

- **Keep the terminal visually connected** to the editor and browser without forcing every tool into the same color mapping.
- **Support different prompt densities** through rich icon, portable label, and minimal presets.
- **Follow system appearance** while preserving an explicit dark or light override.
- **Make configuration reviewable and repairable** instead of replacing a user's shell files without context.

### What I built

- **Generated dark and light palettes** for iTerm2, Ghostty, Kitty, WezTerm, Windows Terminal, and Alacritty.
- **Six Starship configurations** covering rich, portable, and minimal styles in both appearances.
- **Managed Zsh, Bash, and Fish integration** with automatic macOS appearance selection and explicit overrides.
- **A `santi020k-terminal` CLI** for installation, preset selection, color installation, health checks, repair, migrations, status, previews, configuration export/import, and custom prompt builds.
- **A Homebrew release path** that packages versioned archives and updates the shared `santi020k/tap` formula.
- **A focused documentation site** at [terminal.santi020k.com](https://terminal.santi020k.com/) with previews and install guidance.

### Technical highlights

- **Token generation:** terminal colors and prompt metadata are produced from the shared theme system rather than hand-edited output files.
- **Safe configuration:** managed files live under `~/.config/santi020k-terminal`, preserve the rest of `.zshrc`, and can be applied repeatedly.
- **Appearance support:** shell helpers select matching dark or light Starship configurations from the macOS appearance.
- **Validation:** the build parses every TOML file, checks generated assets and website downloads for drift, and renders smoke prompts when Starship is available.
- **Distribution:** Homebrew owns the formula and dependencies while the explicit install command keeps shell changes reviewable.

### Results

- **One terminal identity across six applications** instead of a separate palette for every emulator.
- **A prompt system that adapts** to icon availability, portability needs, and preferred information density.
- **A maintainable release path** where presets, CLI behavior, documentation, archives, and formula metadata move together.

### Why it matters

The terminal is one of the longest-lived surfaces in a developer's day. A useful theme needs more than attractive colors: it needs legible contrast, predictable prompts, reversible configuration, and a way to stay consistent across machines and terminal applications.

[Explore Santi020k Terminal](https://terminal.santi020k.com/) or [read the source in the Theme monorepo](https://github.com/santi020k/santi020k-theme).
