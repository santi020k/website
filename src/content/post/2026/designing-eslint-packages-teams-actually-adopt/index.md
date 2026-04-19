---
title: "Designing ESLint Packages Teams Actually Adopt"
description: "What separates ESLint configurations that spread across a codebase from ones that get removed after the first sprint."
publishDate: "2026-07-10T15:00:00.000Z"
coverImage:
  alt: "Editorial cover showing layered ESLint packages, configuration modules, and a central validation shield"
  src: "./cover.webp"
tags: ["eslint", "code-quality", "javascript", "typescript", "developer-experience"]
postType: "Deep Dive"
seriesId: "eslint-in-practice"
seriesOrder: 4
---

Most shared ESLint configurations fail the same way.

They ship as a monolith. They turn on every rule that seemed reasonable during setup. The first team that adopts them spends a sprint fixing thousands of violations before they can do anything else. Someone disables a rule. Someone else disables two more. Within a few months the config is a graveyard of inline overrides and the package is quietly forked or abandoned.

That failure mode is not an ESLint problem. It is a package design problem.

## The design constraints that actually matter

A shared ESLint package is a public API. The rules it enables become a contract with every codebase that installs it. That means the same principles that make a good library apply here: stability matters, composability matters, and the cost of adoption has to be lower than the cost of staying on whatever people are using today.

The constraints I keep coming back to:

**Zero-violation baseline on install.** The package should not require a cleanup sprint to adopt. If a team runs the linter for the first time and sees five thousand warnings, the most likely outcome is that someone adds `// eslint-disable-next-line` until things are quiet and never touches the config again. A gradual on-ramp — starting with the rules that catch genuine errors and leaving style enforcement optional — gets real adoption faster.

**Explicit rule categories.** Grouping rules by purpose (correctness, style, imports, accessibility, framework-specific) makes it easier for adopters to understand what they are getting and to disable specific categories when they conflict with existing codebase conventions. A flat list of four hundred rules is opaque. A set of named layers is navigable.

**Sensible defaults, not maximalist defaults.** Every rule that ships enabled should have a clear answer to "why would a competent team want this?" If the answer is "because it is technically possible to enforce it," that is not a good enough reason. Rules that are right for some teams but wrong for others belong in opt-in extensions, not the base.

## Composability over completeness

The most useful shift I made when building [`@santi020k/eslint-config-basic`](https://www.npmjs.com/package/@santi020k/eslint-config-basic) was moving away from a single do-everything config toward a layered system.

The base package handles the rules that apply everywhere: correctness, basic TypeScript safety, import hygiene. Framework-specific rules live in separate packages that extend the base. Team-specific overrides live in the consuming repository.

That structure means a React team and a Node API team can share the same core guarantees without fighting over framework rules. It also means updating a single layer — say, the TypeScript rules — does not require republishing the entire config and forcing every consumer to retest everything at once.

The flat ESLint config format introduced in ESLint 9 makes this significantly easier. Composing named config objects is cleaner than the old `extends` chain, and the explicit structure reduces the amount of implicit behavior that previously made shared configs hard to debug.

## Rule severity is a communication tool

Most teams use `error` and `warn` interchangeably, but they mean different things to the people consuming the output.

`error` should mean: this must not reach production. Something is wrong.

`warn` should mean: this is worth paying attention to, but it is not blocking.

When a shared config sets everything to `error`, teams end up ignoring it — either by disabling rules wholesale or by running the linter without the `--max-warnings` flag so warnings accumulate silently. When only genuine correctness issues are errors and style guidance is warnings, the signal stays usable.

This is especially important for new rules. Adding a new check as a `warn` first, watching the violation rate across real codebases, and promoting it to `error` after verifying the false-positive rate is low is a much better release process than shipping it as a hard error on day one.

## Documentation at the rule level

The single most common question a shared config generates is: "why is this rule on?"

If that question requires opening a GitHub issue or digging through a changelog, adoption slows down. If the answer is in the config itself — via a short comment on rules that might surprise people — teams can evaluate the decision without asking.

Not every rule needs justification. The ones that do are the ones that enforce non-obvious choices: rules that conflict with a common pattern, rules that are off by default in ESLint for historical reasons, or rules that cover edge cases people rarely encounter until they hit them.

## Versioning and deprecation

A shared config that breaks dependent repositories on minor version bumps will be pinned at an old version and never updated. That defeats the purpose.

The versioning contract I keep:

- **Patch**: bug fixes, documentation updates, minor config corrections that do not change violation counts
- **Minor**: new rules added as `warn`, new opt-in extensions
- **Major**: new rules promoted to `error`, default behavior changes, rule removals

Communicating deprecation in advance — adding a `warn` before removing a rule, or publishing a migration guide before a major bump — keeps the contract honest and gives teams time to adapt.

## The adoption flywheel

A well-designed ESLint package creates its own adoption momentum. Teams that can install it, see green output on existing code, and incrementally enable stricter rules will actually use it. Teams that hit a wall of violations on day one will not.

That flywheel is worth designing for explicitly. The goal is not a config that enforces every rule you believe in from the first install. The goal is a config that earns trust through zero-friction adoption and then compounds value over time as teams add more layers.

If you are maintaining a shared config for a team or open source audience, the [migration guide I wrote for moving from ESLint 8](/blog/migrate-eslint-8-or-less-to-eslint-9/) is a useful starting point for the new flat config structure that makes composable packages much easier to build.
