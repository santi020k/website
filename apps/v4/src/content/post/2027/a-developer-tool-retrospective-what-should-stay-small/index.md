---
title: "A Developer Tool Retrospective: What Should Stay Small?"
description: "Revisiting Santi020k Theme's expansion from editor to terminal: the shared source, the boundaries that changed, and what I would review next."
publishDate: "2027-07-06T14:00:00.000Z"
draft: true
coverImage:
  alt: "A compact lilac core branches into three differently shaped off-white frames with matching violet insets"
  src: "./cover.webp"
tags: ["developer-tools", "retrospective", "design-systems", "open-source", "maintenance"]
postType: "Case Study"
---

Santi020k Theme began as a VS Code extension. It later grew to include browser and terminal surfaces, shared tokens, generated assets, and separate distribution paths.

I documented that expansion in [the editor-to-terminal article](/blog/expanding-santi020k-theme-to-the-terminal/). Looking back at it raises a different question from the original implementation story: when a small developer tool grows, which parts should remain small?

This review focuses on the choices behind that expansion: how to share design decisions, preserve separate products, and keep installation behavior understandable.

## Keep the source of a shared decision small

The palette is a shared decision. The file format used by each application is a translation of that decision.

The terminal project generates outputs for several terminal families instead of treating each theme file as a separately maintained design. That gives a palette change one source to review while preserving the different formats consumers need.

This is the part of the design I would keep: a small source with explicit mappings.

The mapping still needs care. An editor selection, a terminal cursor, and a prompt segment have different jobs. Reusing a color value does not automatically establish that it works in each context. Generated output needs to be reviewed where people use it.

## Let ownership change when dependencies change

The Chrome theme began in a separate repository. I later moved it into the Theme monorepo as its palette, assets, and release coordination became closely connected to the shared system.

That changed source ownership. It did not turn the browser extension, editor extension, and terminal package into one installation artifact.

This distinction matters in a retrospective. “We consolidated the repositories” is only a description of a move. The more useful question is whether that move puts changes, validation, and release coordination near the source they depend on.

A separate product can share a repository and still preserve its own users, package format, installation instructions, and release needs.

## Review installation as part of the product

A theme may appear low risk because its visible result is mostly color. A tool that edits shell configuration crosses a more consequential boundary.

The terminal work includes managed configuration, backups for changed files, a dry-run path, and health and repair commands. Those features make the installation behavior easy to inspect and recover from.

They also create maintenance obligations. An installer needs to handle existing configuration, repeat runs, and later changes. A successful first installation says little about what happens when someone switches presets or upgrades months later.

For a tool in this position, I would review the installation lifecycle alongside the visual result. The screenshot proves only one part of the experience.

## Treat generated files as outputs worth checking

Generation reduces repeated editing. It also gives one mistake a path into several outputs at once.

The documented Theme workflow checks generated assets for drift, parses terminal configuration, and can render prompt smoke checks when the required tool is available. These checks connect the shared source to concrete outputs.

The review question is whether the checks cover the promises the documentation makes. If a command requires a particular installed tool, its absence should remain visible in the evidence. If a download is generated, it should correspond to the source being released.

That gives a retrospective something more useful than counting generated files: it shows which relationships are verified and which still need observation.

## Make the next step answer a maintenance question

For the next review of a developer tool, I would choose a question such as:

- Can a new user identify the correct installation path?
- Can an existing user preview and recover from a configuration change?
- Can a maintainer trace a published artifact back to its source?
- Does a new consumer need a different mapping, or a genuinely different shared contract?

The Theme expansion is a useful reminder that growth does not require enlarging every abstraction. The shared source can stay focused while each consumer receives a deliberate implementation and its own evidence.

For the concrete architecture behind this retrospective, read the [Santi020k Theme case study](/portfolio/santi020k-theme/).
