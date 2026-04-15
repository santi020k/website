---
title: "Why I Moved My ESLint Library to @santi020k/eslint-config-basic"
description: "Why I deprecated @santi020k/eslint-config-santi020k in favor of a composable monorepo with clearer packages, better docs, and stronger DX."
publishDate: "2026-04-01T18:30:00.000Z"
coverImage:
  alt: "Editorial cover showing a single ESLint config evolving into a modular package system with docs and framework nodes"
  src: "./why-i-moved-my-eslint-library-to-eslint-config-basic-cover.webp"
tags: ["eslint", "flat-config", "developer-experience", "open-source", "typescript"]
postType: "Case Study"
seriesId: "eslint-in-practice"
seriesOrder: 3
---

Version 1.0 of [`@santi020k/eslint-config-basic`](https://www.npmjs.com/package/@santi020k/eslint-config-basic) is out, and with that release I am officially moving on from [`@santi020k/eslint-config-santi020k`](https://www.npmjs.com/package/@santi020k/eslint-config-santi020k).

This is not a cosmetic rename.

It is a structural change in how I want the library to grow, how I want teams to consume it, and how I want the documentation to support real adoption.

The older package helped me validate the core idea: strong linting defaults reduce review noise, catch bad patterns early, and make quality more repeatable across projects. I still believe that. But the package architecture was no longer the best shape for where the work was going.

## What the old package got right

[`@santi020k/eslint-config-santi020k`](https://www.npmjs.com/package/@santi020k/eslint-config-santi020k) started from a practical need. I wanted a reusable flat-config setup I could carry across JavaScript and TypeScript projects without rebuilding the same lint rules every time.

That package did useful work for me and for the teams around it:

- It turned a personal linting baseline into a reusable package
- It made ESLint 9 flat config easier to adopt
- It created one place for rules, optionals, and automation-minded defaults
- It helped standardize the kind of review feedback I kept repeating manually

It also gave me a clear signal that the problem was real. Teams do not just need more lint rules. They need a setup that is easier to adopt, easier to understand, and easier to evolve without accidental complexity.

That older package was an important step in that direction. It just was not the final shape.

If you want the earlier context around that library, [Boosting Code Quality and Efficiency with My ESLint Configuration Library](/blog/boosting-code-quality-and-efficiency-with-my-eslint-configuration-library/) captures the motivation behind the first version of the idea.

## Why I did not want to keep stretching the old package

At some point, a package can keep shipping features while still becoming harder to reason about.

That was the tension I wanted to fix.

The old library revolved around a single package and a single main export. It could support more than one scenario, but the architecture still concentrated too much responsibility in one place:

- Framework-specific behavior
- Optional integrations
- Public API decisions
- Config composition
- Documentation burden

That works for a while. Then the package starts carrying more implicit coupling than I want.

I did not want the library to keep growing as a bigger monolith with more flags, more special cases, and more "just trust that this option does the right thing" behavior.

I wanted clearer boundaries.

I wanted a base package that application teams could install quickly, but I also wanted the internal structure to match the real problem space:

- Core rules and runtime behavior
- Framework-specific packages
- Optional tooling
- Docs
- Playgrounds
- Tests

That is the point where evolving the old package felt less honest than replacing it with a better shape.

## What changed in `@santi020k/eslint-config-basic`

The new library is built as a monorepo, and that matters.

Instead of asking one package to pretend it is everything, the repo now separates responsibilities on purpose:

- `@santi020k/eslint-config-basic` is the main public entry point
- `core` owns the runtime-aware base config and shared internals
- `optionals` owns the integrations for testing, formats, tools, and extensions
- Framework packages stay explicit for React, Next.js, Astro, Vue, Svelte, Solid, Angular, NestJS, Expo, Qwik, and Remix
- The repo also includes docs, playgrounds, and tests so the examples stay close to working code

That structure makes the library easier to maintain, but more importantly it makes the mental model better for users.

The public message becomes clearer:

- Start with the base package
- Add framework packages only when your project needs them
- Enable optional tooling deliberately
- Keep the final config explicit even when the library can auto-detect common signals

That is the kind of clarity I want from tooling.

## The API is more deliberate now

The older package used configuration arrays like `ConfigOption.React` and `ConfigOption.Ts` plus optional flags layered on top.

That worked, but I wanted the new API to map more directly to how teams actually think about their stack.

The new package favors a more composable model:

- Base config through `eslintConfig()`
- `typescript: true` when TypeScript is present
- Explicit framework imports when the project needs them
- Grouped optionals for libraries, testing, formats, tools, and extensions
- Strict mode when the team wants warnings promoted to errors

This is the kind of before-and-after I had in mind.

Old package:

```js title="eslint.config.js"
import {
  ConfigOption,
  OptionalOption,
  eslintConfig
} from '@santi020k/eslint-config-santi020k'

export default [
  ...eslintConfig({
    config: [ConfigOption.React, ConfigOption.Ts],
    optionals: [OptionalOption.Tailwind, OptionalOption.Vitest]
  })
]
```

New package:

```js title="eslint.config.js"
import { eslintConfig, Library, Testing } from '@santi020k/eslint-config-basic'
import react from '@santi020k/eslint-config-react'

export default eslintConfig({
  typescript: true,
  frameworks: {
    react
  },
  libraries: [Library.Tailwind],
  testing: [Testing.Vitest]
})
```

I prefer this second shape because the moving parts are more obvious. The package layout and the configuration model now reinforce each other instead of fighting each other.

## The docs are now part of the product

Another big reason for the change is documentation.

I did not want the docs to remain something secondary that users had to infer from source files, npm README examples, or guesswork.

That is why the new library ships with a dedicated docs site at [eslint.santi020k.com](https://eslint.santi020k.com/).

I wanted the docs to answer the real adoption questions:

- What should I install first?
- When do I need a framework package?
- How do optional integrations fit together?
- What belongs in the base package versus `core` or `optionals`?
- How do I migrate without turning lint setup into a side project?

That docs-first move is part of the library change, not a separate nice-to-have.

If the goal is better developer experience, then docs are not decoration. They are part of the runtime experience of adoption.

## DX and stability matter more than cleverness

One of the ideas behind the new package is that strong linting should feel easier to adopt, not harder.

That is why `@santi020k/eslint-config-basic` focuses on practical DX decisions:

- A composable flat-config API
- Better separation between framework packages and optional tooling
- Auto-detection for common project signals
- A built-in CLI for scaffolding and updates
- Documentation, playgrounds, and tests tied more closely to the implementation

I also wanted the package positioning to reflect what it really is becoming: a toolkit for real JavaScript and TypeScript teams, not just a personal preset with a growing list of exceptions.

If you have read [Migrate ESLint 8 or Less to ESLint 9](/blog/migrate-eslint-8-or-less-to-eslint-9/), this is the same philosophy pushed further. I do not want teams inheriting lint behavior by accident. I want them composing it on purpose.

## Why the old package is deprecated

I would rather be direct about this than quietly leave people on an old path.

The old package is deprecated because I do not want users building new adoption around a library architecture I am intentionally moving away from.

Deprecation here is not a rejection of the earlier work. It is a way of protecting users from ambiguity.

If I believe the better path is:

- Clearer package boundaries
- A stronger docs experience
- Better composition
- More room for framework growth
- A more maintainable public API

then I should say that clearly and make the migration path obvious.

That is what I am doing with `@santi020k/eslint-config-basic`.

## Who should move now

If you are already using `@santi020k/eslint-config-santi020k`, I recommend planning the move.

You should care especially if:

- You want a cleaner long-term API surface
- Your team works across more than one framework or app type
- You want docs and examples that are easier to follow
- You prefer explicit framework packages over a single package that keeps expanding internally
- You are standardizing modern flat-config workflows across several repositories

If you are starting fresh, I would not start with the deprecated package at all. I would go directly to [`@santi020k/eslint-config-basic`](https://www.npmjs.com/package/@santi020k/eslint-config-basic) and use the docs at [eslint.santi020k.com](https://eslint.santi020k.com/) as the canonical guide.

## What I want this library to become

The goal is not just "more features."

The goal is a more trustworthy ESLint ecosystem around a clear base package.

I want this library to become the kind of tooling I like to adopt myself:

- Explicit
- Composable
- Documented
- Scalable across real stacks
- Opinionated enough to reduce noise
- Flexible enough to stay useful outside a single project shape

That is why this move happened.

The old package proved the idea. The new one gives it the architecture it needed.

## Conclusion

I moved from `@santi020k/eslint-config-santi020k` to `@santi020k/eslint-config-basic` because I wanted the library to scale with more honesty.

Not just more rules. Not just more frameworks. A better structure.

Version 1.0 marks the point where I want the package story to be simpler for users and stronger for long-term maintenance. If you are already on the old package, migrate when you can. If you are evaluating the library today, start with the new one.

The best tooling does not just enforce standards. It makes the right setup easier to understand and easier to keep.
