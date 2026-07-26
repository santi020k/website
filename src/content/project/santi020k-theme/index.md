---
title: "Santi020k Theme"
description: "Built one calm violet theme system for VS Code-compatible editors, Chrome, six terminal formats, Starship, Shiki, websites, and reusable design tokens."
role: "Creator"
startingDate: "28 Apr 2026"
githubUrl: "https://github.com/santi020k/santi020k-theme"
liveDemoUrl: "https://theme.santi020k.com/"
typesId: "personal"
relevanceWeight: 88
impactMetrics: ["Published through the VS Code Marketplace, Open VSX, Chrome Web Store, npm, GitHub Releases, and Homebrew", "Expanded the editor theme to 12 dark, light, high-contrast, bold, and italic variants", "Carried one token system across editors, Chrome, Shiki, six terminal formats, Starship, shell integration, and four product sites"]
technologies: ["Visual Studio Code", "Cursor", "Windsurf", "VSCodium", "VS Code Extension", "Chrome Extension", "Chrome Web Store", "Shiki", "iTerm2", "Ghostty", "Kitty", "WezTerm", "Windows Terminal", "Alacritty", "Starship", "Zsh", "Bash", "Fish", "JavaScript", "Node.js", "Astro", "Lumen UI", "Vitest", "ESLint", "CI-CD", "GitHub Actions", "Open Source", "Developer Experience (DX)", "Developer Documentation", "Accessibility", "Testing", "Design Systems"]
coverImage:
  src: "./cover.webp"
  horizontal: "./cover-horizontal.webp"
  vertical: "./cover-vertical.webp"
  logo: "./logo.webp"
  logoAspect: "square"
  logoSurface: "dark"
  alt: "Santi020k Theme logo on a deep indigo geometric cover with editor UI artwork"
---

## Building one theme family across the developer workspace

I started Santi020k Theme as a focused pair of editor themes for the tools I use every day. It has grown into one theme family for VS Code-compatible editors, Chrome, syntax-highlighted websites, terminals, prompts, and shells. The monorepo now ships 12 editor variants, two Chrome Web Store themes, six terminal formats, three Starship styles, managed shell integration, shared token packages, and four dedicated product sites.

The family shares one calm violet color language while respecting the capabilities of each surface. VS Code and compatible editors receive semantic highlighting and high-contrast variants. Chrome receives declarative, permission-free dark and light mappings. Shiki consumers receive importable syntax themes. Terminals receive generated palette formats and prompts that can follow the system appearance.

### Goals

- **Create a calm workspace** with coordinated dark, light, and high-contrast profiles for long technical sessions.
- **Keep every surface token-driven** so editors, browser chrome, code previews, terminals, prompts, and websites evolve from the same source.
- **Support typography preferences** through base, bold, and italic VS Code variants instead of one fixed syntax treatment.
- **Ship each surface like a product** with focused documentation, previews, validation, packaging, and release automation.

### What I built

- **Twelve VS Code variants** across dark, light, high-contrast dark, and high-contrast light profiles, each with base, bold, and italic syntax options.
- **Dark and light Chrome themes** that map browser surfaces back to named editor tokens and ship without permissions, collected data, or remote code.
- **A terminal product** with dark and light palettes for iTerm2, Ghostty, Kitty, WezTerm, Windows Terminal, and Alacritty.
- **Rich, portable, and minimal Starship presets** plus managed Zsh, Bash, and Fish integration with automatic appearance selection.
- **Shared `@santi020k/theme` and `@santi020k/theme-core` packages** for tokens, assets, metadata, Chrome mappings, Tailwind values, product-site behavior, and importable Shiki themes.
- **Four Astro product sites** for the family hub, VS Code, Chrome, and terminal experiences.
- **Validation and release pipelines** for marketplace metadata, contrast, generated theme files, terminal presets, packaging, and registry publishing.

![Santi020k Theme dark Chrome Web Store preview](chrome-store-preview.webp)

The Chrome work originally lived as its own repository and portfolio project. Moving it beside the editor themes made palette synchronization enforceable: generation reads the editor source, maps each browser role through the shared package, and fails validation when a manifest drifts. Chrome remains independently packaged and published, but it is maintained as one surface of the same system.

![Santi020k Theme in a Chrome incognito window](chrome-incognito.webp)

The terminal edition applies the same system to a surface with different constraints. Its generated dark and light palettes target iTerm2, Ghostty, Kitty, WezTerm, Windows Terminal, and Alacritty, while rich, portable, and minimal Starship presets adapt to different fonts, machines, and information densities.

![Dark and light Santi020k terminal surfaces connected by the shared violet palette](terminal-system-cover.webp)

The `santi020k-terminal` CLI keeps installation and shell changes reviewable. It manages Zsh, Bash, and Fish integration, follows the macOS appearance when requested, preserves explicit overrides, installs terminal colors, backs up changed files, and provides status, repair, migration, import, export, preview, and custom prompt commands. Versioned archives and Homebrew distribution keep the product installable without separating its source of truth from the theme family.

### Results

- **One recognizable workspace language** across editor, browser, terminal, prompt, and documentation.
- **Public distribution** through the Visual Studio Marketplace, Open VSX, Chrome Web Store, npm, GitHub releases, and Homebrew.
- **Repeatable releases** backed by Changesets, generated artifacts, contrast checks, tests, linting, and package validation.
- **Portable theme infrastructure** that can support new tools without copying colors or brand assets by hand.

The editor variants work in VS Code, Cursor, Windsurf, VSCodium, GitHub Codespaces, and other compatible extension hosts. The shared package also exposes dark, light, and high-contrast themes for Shiki, Astro code blocks, and other consumers of VS Code theme JSON.

### Why it matters

Themes look simple from the outside, but a coherent workspace touches hierarchy, contrast, affordance, syntax, prompt density, operating-system appearance, packaging, and long-session comfort. Santi020k Theme treats those decisions as a design system instead of a collection of unrelated color files.

![Santi020k Theme light preview](preview-light.webp)

Explore the [theme family](https://theme.santi020k.com/), install an [editor variant](https://vscode.santi020k.com/), preview the [Chrome themes](https://chrome.santi020k.com/), or configure the [terminal edition](https://terminal.santi020k.com/).
