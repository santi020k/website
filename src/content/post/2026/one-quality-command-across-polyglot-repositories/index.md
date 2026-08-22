---
title: "One quality command across polyglot repositories"
description: "How I built a native CLI that coordinates existing analyzers across Rust, Swift, Android, Kotlin, JavaScript, and Astro without flattening their ecosystem-specific strengths."
publishDate: "2026-08-21T15:00:00.000Z"
coverImage:
  alt: "Quality CLI dashboard summarizing checks across a polyglot repository"
  src: "./cover.png"
tags: ["rust", "code-quality", "developer-experience", "ci-cd", "tooling"]
postType: "Deep Dive"
---

<!-- cspell:words Clippy detekt ktlint SARIF -->

“Run the quality checks” sounds like one task until a repository contains more than one ecosystem.

A Rust service wants Cargo fmt and Clippy. An iOS application has SwiftLint and SwiftFormat. Android brings Gradle, Android Lint, detekt, and ktlint. A TypeScript package may need ESLint, Prettier, and Knip. An Astro site adds its own type-aware check.

None of those tools is the problem. Most are very good at their job.

The problem is the layer around them: detecting what a repository intends to use, resolving the right executable, running independent checks efficiently, preserving monorepo semantics, and presenting one result that works locally and in CI.

I built [`quality`](https://quality-cli.santi020k.chatgpt.site/) to provide that layer.

## Coordination is better than replacement

Reimplementing ecosystem analyzers would make `quality` broader and less trustworthy at the same time.

Clippy understands Rust. Android Lint understands Android projects. ESLint understands the JavaScript and TypeScript rule ecosystem. Their native output and configuration models contain years of specialized work.

`quality` coordinates those tools instead of competing with them.

Its built-in adapters cover Cargo fmt, Clippy, SwiftLint, SwiftFormat, Android Lint, detekt, ktlint, ESLint, Astro Check, Prettier, CSpell, Knip, and Actionlint. Repository-local executables are used where that is conventional. Explicit overrides cover teams with custom paths or wrappers.

The CLI then normalizes execution and diagnostics into pretty terminal output, JSON, SARIF, or GitHub workflow commands.

One command does not mean one analyzer. It means one dependable contract around the analyzers a repository already trusts.

## Initialization should detect intent, not guess policy

The presence of a `.ts` file does not mean a project has chosen ESLint. A Swift file does not prove the team wants SwiftFormat.

`quality init` enables an analyzer only when the repository shows intent through configuration, dependencies, or package scripts. It can preview the generated policy with `--dry-run`, and it writes an explicit `quality.yml` instead of hiding the decision in automatic behavior.

Composite repository gates need special care.

If a project already defines `verify`, `validate`, `check`, or another canonical script, initialization can preserve it as a repository task. That avoids running a raw analyzer beside a monorepo pipeline that already owns caching, workspace selection, or generated-code steps. A root type-check script receives similar treatment when no larger gate exists.

The tool detects enough to help, then records the result in configuration a maintainer can review.

## Changed-file checks need ecosystem awareness

Passing every changed path to every tool is not a safe optimization.

Some analyzers accept individual files. Others understand only a project. A change to a rule file can affect source files that were not edited. A deleted source path cannot be passed to a command, but it may still require a full check.

`quality check --changed` classifies those cases.

File-capable tools receive relevant changed paths. Project analyzers continue to run at project scope when their ecosystem changes. Configuration additions, edits, or deletions promote the corresponding analyzer to a full run. Deleted files can trigger a project check without becoming invalid command arguments.

The goal is not to do the least work possible. It is to skip work only when the remaining result still means something.

## Baselines make adoption incremental

An established repository may contain hundreds of findings. Requiring every issue to be fixed before a tool can enter CI turns adoption into a rewrite project.

`quality baseline create` records the current diagnostics so future checks can suppress matching findings and fail on new regressions. Fingerprints exclude line and column numbers, which keeps ordinary code movement from creating noise. Duplicate counts remain significant, so copying an existing problem still introduces a failure.

Some failures are intentionally impossible to baseline. A missing required analyzer, a crash, or an unstructured execution error is evidence that the check did not run correctly. Treating that as known debt would create a false green build.

Baselines are a bridge from current reality to stronger enforcement, not a way to hide broken infrastructure.

## CI should preserve the same evidence

The `quality` GitHub Action installs a versioned native binary, verifies its checksum, and runs the same configuration used locally.

It can emit inline pull-request annotations, write a job summary, and produce SARIF for GitHub code scanning. Reporting and failure thresholds are separate, so a team can decide which findings are visible and which ones block a merge.

The CLI can also generate a GitHub Actions workflow from an explicit installation command. It derives relevant package-manager and toolchain setup from repository files while refusing to invent an installation source.

That last constraint reflects the larger design: automation should reduce repetitive decisions without making invisible ones on the team's behalf.

## The command surface extends beyond one repository

Quality work often becomes a portfolio problem.

The `repositories audit` and `repositories apply` commands inspect a folder of projects, report where policy is missing, and configure repositories that need it. `doctor` explains which tools are enabled, installed, or absent. `instructions` produces repository guidance for coding agents, and native shell completions make the CLI easier to use interactively.

Custom adapters cover tools that do not belong in the built-in catalog. A team can define the command, extensions, configuration files, working directory, file mode, and parser while keeping changed-file filtering, baselines, normalized output, and concurrency.

## One policy, many native tools

The useful abstraction is not a universal analyzer. It is a consistent way to answer four questions:

1. What does this repository intend to run?
2. Can those tools be resolved reproducibly?
3. Which checks are necessary for this change?
4. How should their results affect a person, an agent, or CI?

`quality` answers those questions while leaving language-specific analysis where it belongs.

You can [read the documentation](https://quality-cli.santi020k.chatgpt.site/), [view the source](https://github.com/santi020k/quality), or see the shorter [portfolio case study](/portfolio/quality/).
