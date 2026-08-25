---
title: "quality"
description: "Built a fast, predictable code-quality CLI and GitHub Action that detects and coordinates native analyzers across Rust, Swift, Android, Kotlin, JavaScript, and Astro repositories."
role: "Creator"
startingDate: "21 Aug 2026"
githubUrl: "https://github.com/santi020k/quality"
liveDemoUrl: "https://quality-cli.santi020k.chatgpt.site/"
typesId: "personal"
relevanceWeight: 75
impactMetrics: [
  "Coordinates 13 native analyzers across Rust, Swift, Android, Kotlin, JavaScript, TypeScript, and Astro",
  "Supports changed-file runs, repository baselines, external adapters, concurrent execution, and cross-repository audits",
  "Ships native binaries and a GitHub Action with annotations, job summaries, checksum verification, and SARIF output"
  ]
technologies: [
  "Rust", "TypeScript", "Node.js", "Astro", "GitHub Actions", "SARIF", "ESLint", "Prettier", "Clippy",
  "SwiftLint", "SwiftFormat", "Android Lint", "detekt", "ktlint", "CSpell", "Knip", "Actionlint",
  "Developer Experience (DX)", "CI/CD", "Monorepo", "Turborepo", "pnpm", "Open Source"
  ]
coverImage:
  src: "./cover.webp"
  horizontal: "./cover-horizontal.webp"
  vertical: "./cover-vertical.webp"
  logo: "./logo.png"
  logoAspect: "square"
  logoSurface: "dark"
  alt: "Quality CLI dashboard summarizing checks across a polyglot repository"
  ogImage: "./cover.webp"
---

<!-- cspell:words Clippy detekt ktlint SARIF -->

## One quality workflow for polyglot repositories

I built `quality` for repositories where “run the checks” stops being a simple instruction.

A modern product may contain Rust services, a Swift application, Android modules, TypeScript packages, and an Astro site. Each ecosystem already has good analyzers. The missing layer is a predictable way to detect them, run them together, normalize the results, and explain what a repository expects.

`quality` is that layer. It coordinates native tools rather than replacing them.

### Goals

- **Preserve ecosystem expertise** by invoking the analyzers teams already trust.
- **Give every repository one memorable workflow** for checking, formatting, fixing, diagnosing, and adopting policy.
- **Make gradual adoption practical** with explicit configuration and baselines for existing findings.
- **Use the same policy locally and in CI** with structured output for people, agents, and GitHub.

### What I built

- **A native Rust CLI** with `init`, `doctor`, `check`, `format`, `fix`, `baseline`, `repositories`, `instructions`, `completions`, and CI-generation commands.
- **Thirteen built-in adapters** covering Cargo fmt, Clippy, SwiftLint, SwiftFormat, Android Lint, detekt, ktlint, ESLint, Astro Check, Prettier, CSpell, Knip, and Actionlint.
- **Repository task discovery** that preserves canonical package scripts and monorepo-specific type-check or validation semantics.
- **Changed-file execution** that sends relevant paths to file-capable tools while escalating configuration changes to full checks.
- **Baseline support** that records existing diagnostics and fails only for new regressions without hiding missing tools or analyzer crashes.
- **A GitHub Action** with verified downloads, pull-request annotations, job summaries, SARIF reports, and configurable failure thresholds.

### Technical highlights

- **Concurrent execution:** independent checks run together by default, with `--fail-fast` available when the first failure matters more than a complete report.
- **Normalized diagnostics:** pretty, JSON, SARIF, and GitHub output formats turn different analyzer conventions into one result model.
- **Custom adapters:** teams can add organization-specific tools with explicit commands, file modes, extensions, configuration files, and parsers.
- **Cross-repository operations:** audit a folder of repositories, preview missing policy, and apply configuration from one command surface.
- **Portable releases:** checksum-verified binaries target macOS, Linux, and Windows, alongside the versioned GitHub Action.

### Results

- **One entry point for polyglot quality checks** while each ecosystem keeps its strongest analyzer.
- **Faster feedback** through concurrent and changed-file-aware execution.
- **Incremental enforcement** that lets established repositories block new regressions before paying down every old finding.
- **Consistent evidence in pull requests** through annotations, summaries, SARIF, and explicit exit behavior.

### Why it matters

Quality policy becomes fragile when it lives in tribal knowledge, a collection of unrelated scripts, or a CI file nobody runs locally. It becomes heavy when a wrapper tries to reimplement every analyzer.

`quality` takes a narrower path: detect repository intent, resolve native tools reproducibly, run them efficiently, and make their results understandable everywhere the work happens.

[Read the quality documentation](https://quality-cli.santi020k.chatgpt.site/) or [explore the source on GitHub](https://github.com/santi020k/quality).
