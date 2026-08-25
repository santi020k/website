---
title: "Difftale"
description: "Built a VS Code Git companion for editable Conventional Commit drafts, pull request composition, file history navigation, and explicit commit and push workflows."
role: "Creator"
startingDate: "24 Jul 2026"
githubUrl: "https://github.com/santi020k/difftale"
typesId: "personal"
draft: true
relevanceWeight: 45
impactMetrics: ["Generates up to five editable commit drafts with a deterministic local fallback", "Follows file history across Git renames without filling the editor with tabs", "Keeps staging, committing, pushing, and pull request creation explicit"]
technologies: ["VS Code Extension", "TypeScript", "Node.js", "Git", "GitHub CLI", "VS Code Language Model API", "Conventional Commits", "Turborepo", "pnpm", "Vitest", "esbuild", "Developer Experience (DX)", "AI-assisted Development", "Open Source"]
coverImage:
  src: "./cover.webp"
  horizontal: "./cover-horizontal.webp"
  vertical: "./cover-vertical.webp"
  logo: "./logo.svg"
  logoAspect: "square"
  logoSurface: "light"
  alt: "Luminous Git branches flowing into commit and pull request panels above layered file revisions"
  ogImage: "./cover.webp"
---

## Keeping AI-assisted Git workflows explicit

Difftale adds a focused layer to VS Code's Git experience. It helps developers compose Conventional Commits, prepare pull request drafts, move through a file's history, and run commits and pushes with the real hook output visible.

It is not a replacement for Source Control or a full Git client. The project targets a handful of repeated tasks where better context and carefully bounded generation can save time without hiding meaningful actions.

### Goals

- **Generate useful drafts, not irreversible actions** so every AI result remains editable and every Git mutation remains explicit.
- **Keep repository rules visible** by validating Conventional Commit structure before a message can be used.
- **Make history navigation feel native** by reusing preview editors and following renamed files.
- **Show the real workflow** including Git and hook output instead of simulating success.

### What I built

- **A commit composer** that generates one to five alternatives from staged changes through the VS Code Language Model API.
- **A deterministic fallback** for situations where a language model is unavailable or the developer prefers manual composition.
- **A pull request composer** that works from the current branch's commits and diff, saves drafts per repository and branch, and uses the local GitHub CLI only after confirmation.
- **File revision navigation** with older/newer shortcuts, direct history selection, working-tree comparison, and rename tracking.
- **Explicit commit and push commands** with streamed Git and Husky-compatible hook output.

### Technical highlights

- **Core package:** repository parsing, history traversal, commit formatting, and validation remain independent of VS Code.
- **Extension package:** views, commands, model consent, editor navigation, Git execution, and workspace state.
- **Safety model:** Difftale never stages, restores, rewrites, commits, pushes, or creates a pull request without a direct action.
- **Testing workflow:** a disposable Git sandbox exercises renames, branches, hooks, remotes, and mixed working-tree states.

### Results

- **Faster commit and PR preparation** without turning generation into automation theater.
- **Less context switching** when reviewing how the current file reached its present state.
- **Clearer trust boundaries** around source sent to a model and actions performed on a repository.

### Why it matters

AI is most useful in developer tools when it improves the draft and leaves judgment with the developer. Difftale applies that idea to the moments between finished code and a reviewable change.

[Explore Difftale on GitHub](https://github.com/santi020k/difftale).
