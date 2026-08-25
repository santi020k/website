---
title: "Astro Doctor: A Health Check for Astro Codebases"
description: "Why I built Astro Doctor: a CLI, ESLint plugin, editor extension, GitHub Action, and agent skill system for catching Astro anti-patterns early."
publishDate: "2026-06-22T00:00:00.000Z"
coverImage:
  alt: "A diagnostic lens scanning connected code modules and reporting performance, accessibility, and workflow health"
  src: "./cover.webp"
tags: ["astro", "developer-experience", "performance", "accessibility", "open-source"]
postType: "Case Study"
---

Astro gives you a strong default: static HTML first, JavaScript only when you ask for it.

That default is one of the reasons I like building content-heavy sites with Astro. It is also the reason Astro codebases need different guardrails than a React, Next.js, or Vue app. The mistakes that hurt an Astro project are often not syntax errors. They are small choices that quietly work against the framework.

A `client:load` that should have been `client:visible`. A raw `<img>` where Astro's `<Image>` component would have protected layout and output size. A `set:html` block that looked harmless during a fast implementation. A missing `lang` attribute. A few public environment variables with names that look a little too secret.

None of those things necessarily stop the build.

They still matter.

That is why I built [`@santi020k/astro-doctor`](https://github.com/santi020k/astro-doctor): a deterministic health check for Astro projects that catches performance, accessibility, security, and best-practice issues before they reach production.

## The problem is not whether the code compiles

The Astro compiler is good at telling you whether your project can build. That is not the same as telling you whether the project still matches the architectural promises you chose Astro for.

Astro makes it easy to stay static. It also makes it easy to opt into client-side behavior when a component needs it. That flexibility is the point, but it means a codebase can drift in ways that are valid and still expensive.

The biggest risk is not one dramatic mistake. It is accumulation.

- A few eager islands become a heavier startup path.
- A few unoptimized images become layout shift and slower pages.
- A few accessibility omissions become patterns the team keeps repeating.
- A few risky escape hatches become normal instead of exceptional.

I wanted a tool that made that drift visible while the change was still small.

## What Astro Doctor checks

Astro Doctor is built around Astro-specific rules and project audits. The first release focuses on the categories I care about most when reviewing Astro work.

Performance checks look for patterns like overusing `client:load`, skipping Astro's image pipeline, missing dimensions for public or remote images, and adding blocking scripts.

Accessibility checks catch missing `alt` attributes, missing `lang` attributes, and client-only islands that do not provide fallback content.

Security checks warn on unsafe-looking `set:html` usage and `PUBLIC_` environment variable names that appear to expose secrets.

Best-practice checks keep Astro code idiomatic: `class:list` instead of string-built class names, `import.meta.env` instead of `process.env`, and Content Collections instead of untyped glob-based content loading.

The point is not to replace code review. The point is to remove the repetitive part of review so humans can spend more time on behavior, architecture, and product judgment.

That is the same reason I keep investing in linting and delivery guardrails across my other tooling. I wrote more about that broader philosophy in [AI Coding Is Probabilistic. Your Delivery Process Should Not Be.](/blog/ai-coding-is-probabilistic-your-delivery-process-should-not-be/).

## The CLI is the fastest feedback loop

The simplest way to use Astro Doctor is to run it directly in an Astro project:

```bash
pnpm dlx @santi020k/astro-doctor@latest
```

It scans the project, prints diagnostics, and returns a health score from 0 to 100 with a letter grade.

That score is intentionally practical. It is not trying to turn software quality into a fake absolute number. It is a quick way to see whether the project is clean, drifting, or in need of attention. In CI, that same score can become a threshold when a team wants to protect a baseline.

The CLI also supports focused workflows:

```bash
pnpm dlx @santi020k/astro-doctor@latest --preset ci
pnpm dlx @santi020k/astro-doctor@latest --category performance
pnpm dlx @santi020k/astro-doctor@latest --json ./astro-doctor-report.json
pnpm dlx @santi020k/astro-doctor@latest why src/pages/index.astro:12
```

That last command matters more than it looks. If a tool only says "wrong," people eventually route around it. I want Astro Doctor to explain why a finding matters so the rule teaches the codebase instead of just blocking it.

## Editor feedback keeps the fix close to the mistake

I also built an official VS Code and Cursor extension.

That extension brings the same diagnostics into the editor, with live feedback, hover explanations, quick fixes, status updates, and a health sidebar. The goal is simple: catch the issue before it turns into a commit, a pull request, or a CI failure.

There is also an ESLint plugin, [`@santi020k/eslint-plugin-astro-doctor`](https://www.npmjs.com/package/@santi020k/eslint-plugin-astro-doctor), for teams that already use ESLint as the main editor and CI integration point.

That split is deliberate:

- Use the extension when you want the best local editing experience.
- Use the ESLint plugin when your team already standardizes through ESLint.
- Use the CLI when you want a direct scan, report, or automation entry point.

Different teams have different workflows. The rule engine should still be the same.

## CI should report the new problem, not the whole backlog

One thing I care about a lot with new quality tooling is adoption.

If a tool enters a mature codebase and immediately dumps every historical issue into a pull request, the team usually ignores it. That is understandable. Nobody wants a small feature PR to become a surprise cleanup project.

The Astro Doctor GitHub Action is built around that reality. In pull requests, it can scan only the relevant changed files and post a sticky summary comment with the issues introduced by the change.

The minimal setup looks like this:

```yaml
- uses: santi020k/astro-doctor@v1
```

From there, teams can choose whether to fail on errors, warnings, or score thresholds.

That diff-first path makes the tool useful even when a project has legacy debt. You can start by protecting the current baseline, then raise the standard over time.

## Agent skills are part of the product

Astro Doctor also includes installable skills for coding agents.

That may sound like a secondary feature, but it is one of the reasons I wanted this tool to exist.

AI coding assistants are now part of the workflow for many teams. They can write useful code quickly, but they also repeat common patterns from the public web. In Astro projects, that can mean treating Astro like a generic component framework, hydrating too eagerly, skipping content collections, or missing small accessibility details.

After running a scan, you can install agent guidance into the repository:

```bash
pnpm dlx @santi020k/astro-doctor@latest install
```

The installed skills teach agents the same standards Astro Doctor enforces. That closes the loop: the scanner catches problems after they appear, and the skills reduce how often those problems are generated in the first place.

For me, that is where developer tooling is going. Not just lint after the fact. Teach the workflow before the change is made.

## What I borrowed from react-doctor

Astro Doctor is directly inspired by [react-doctor](https://github.com/millionco/react-doctor) from Million Software.

I liked the shape of that project immediately: deterministic framework diagnostics, a CLI-first workflow, a health score, CI comments, and agent skills that turn findings into reusable guidance.

Astro needed a version of that idea with Astro-specific judgment.

The mistakes are different. The performance model is different. The framework strengths are different. So the rules had to be about Astro's actual failure modes, not a generic "frontend best practices" list.

## What I want this to become

The first release is intentionally focused. It covers the Astro patterns I most want to catch in real projects: hydration choices, image handling, accessibility basics, environment variable usage, raw HTML, content loading, and idiomatic class composition.

The next useful version of the tool is not simply "more rules." It is better explanations, stronger quick fixes, clearer docs, and adoption paths that fit small personal sites as well as larger teams.

I want Astro Doctor to be the tool you can run before asking, "Did I accidentally make this Astro site less Astro?"

That is the whole idea.

You can try it today:

```bash
pnpm dlx @santi020k/astro-doctor@latest
```

The source code and docs live in the [Astro Doctor GitHub repository](https://github.com/santi020k/astro-doctor), and the documentation site is at [doctor.santi020k.com](https://doctor.santi020k.com/).
