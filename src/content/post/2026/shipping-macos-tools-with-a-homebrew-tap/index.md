---
title: "Shipping macOS tools with a personal Homebrew tap"
description: "How I separated product code from distribution metadata and turned signed terminal releases into familiar Homebrew install and upgrade commands."
publishDate: "2026-07-12T15:00:00.000Z"
coverImage:
  alt: "Amber release artifacts moving through a package pipeline from a brew vessel toward a macOS app silhouette"
  src: "./cover.webp"
tags: ["homebrew", "macos", "release-engineering", "developer-experience", "open-source"]
postType: "Case Study"
---

Building a command-line tool and making it pleasant to install are two different jobs.

The source can be tested. The archive can be signed. The release can exist on GitHub. A user still has to discover the right file, download it, put the executable somewhere sensible, install supporting tools, and remember how upgrades work.

For macOS developers, Homebrew already provides a familiar answer.

That is why I created the [Santi020k Homebrew Tap](https://github.com/santi020k/homebrew-tap): a small distribution repository for my developer tools.

Its first formula installs [Santi020k Terminal](https://terminal.santi020k.com/) from the larger [Santi020k Theme](/portfolio/santi020k-theme/) family.

## The install command is part of the product

The user-facing flow is intentionally ordinary:

```bash
brew install santi020k/tap/santi020k-terminal
santi020k-terminal install
```

The formula installs the terminal CLI, color presets, Starship configurations, curated Zsh setup, and the Homebrew dependencies they need.

That is much better than a release page full of manual instructions. It is also easier to support because the installation location, dependencies, and update path follow conventions users already know.

Upgrades fit the same model:

```bash
brew update
brew upgrade santi020k-terminal
santi020k-terminal update
```

A predictable command is a form of documentation.

## The tap should not become a second product repository

The most important design decision is what the tap does not contain.

Product source, tests, release archives, documentation, and version logic live in the Santi020k Theme monorepo. The tap contains only Homebrew packaging metadata.

That keeps ownership clear:

- the product repository builds and validates the release
- the release workflow produces the distributable artifact
- the formula points to that artifact and verifies its checksum
- the tap makes the artifact discoverable through Homebrew

Duplicating source or release logic inside the tap would create two places that can drift. A small distribution repository is easier to audit precisely because it stays small.

## Generated metadata removes release drift

The formula is generated and updated by the terminal release workflow.

This matters because manual packaging steps are easy to forget when the product release itself already feels complete. A version bump can ship while the formula still references an older archive. A checksum can be copied incorrectly. A dependency can change in the product but not in the install path.

Generating the formula from the same release context reduces those mismatches.

The tap is still version-controlled, so each change remains reviewable. Automation prepares the metadata; Git preserves the record.

## Distribution repositories have a narrow security job

A package manager formula connects a user’s machine to a release artifact. That connection should be explicit.

The formula identifies the archive, version, checksum, dependencies, and installation behavior. A user or maintainer can read the entire contract without understanding the internals of the product.

That narrow surface is a strength. It makes the distribution path easier to inspect and limits the amount of code that needs to change for a release.

The product repository remains responsible for the larger trust chain: tests, build validation, release archives, and the behavior of the installed CLI.

## Homebrew also creates an upgrade relationship

Installation gets most of the attention, but upgrades are where a distribution path proves its value.

Once the tool lives in Homebrew, users do not need to remember where the archive came from or how the executable reached their path. `brew upgrade` handles the package layer. The terminal CLI’s update command handles the configuration and assets it owns.

That split mirrors the repository boundary:

- Homebrew manages the installed package.
- The tool manages its own user-facing setup.

Clear ownership makes both flows easier to change later.

## Small infrastructure deserves a portfolio entry

The tap is not a large application. It is a small piece of release engineering.

I still consider it a project because it changes whether another project is usable. Distribution is part of developer experience. A reliable install command, a repeatable upgrade path, and generated packaging metadata remove friction every time someone tries the tool.

The unified [Santi020k Theme case study](/portfolio/santi020k-theme/) covers the terminal product that the formula distributes, and the [tap repository](https://github.com/santi020k/homebrew-tap) contains the current packaging metadata.
