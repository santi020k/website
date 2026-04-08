---
title: "Continuous Integration and Deployment for Next.js Projects"
description: "A practical CI/CD setup for Next.js projects using GitHub Actions so linting, tests, and builds become part of the delivery process instead of an afterthought."
publishDate: "2024-04-18T17:12:00.000Z"
tags: ["ci/cd", "github-actions", "nextjs", "react", "deployment"]
coverImage:
  alt: "Neon illustration of a CI/CD pipeline flowing through commit, test, build, and deployment stages"
  src: "./continuous-integration-and-deployment-for-next-js-projects-cover.png"
postType: "Guide"
---

[Read the Previous Post: Testing React Components with Vitest and React Testing Library](https://santi020k.me/blog/testing-react-components-with-vitest-and-react-testing-library/)

After adding tests to the project, the next logical step is making sure they run automatically. Otherwise, the test suite becomes optional, and optional quality checks are eventually ignored in busy teams.

That is why I like CI/CD from the beginning of a project, even when the product is still small. It creates a delivery habit early: every change should prove that it can be linted, tested, and built before anyone trusts it.

For Next.js projects in particular, this matters a lot because frontend issues tend to show up in several places at once:

- linting problems
- type issues
- broken builds
- environment variable mistakes
- deployment differences between local and production

A good CI/CD pipeline catches these earlier and reduces the amount of debugging that happens after merge.

## CI and CD are not the same thing

I prefer to separate both concepts clearly.

- **Continuous Integration** verifies that the code is healthy.
- **Continuous Deployment** publishes verified code to an environment.

Many teams mix both ideas into a single workflow and then wonder why the pipeline becomes hard to reason about. I prefer a simpler mental model:

1. validate every pull request
2. deploy only what has already passed validation

That keeps the process easier to maintain.

## What should CI validate?

For a Next.js project, I usually want CI to validate at least these items:

- install dependencies cleanly
- run linting
- run unit tests
- build the application

If the project already has E2E tests, those can be added too, but I do not recommend making the first pipeline too heavy. It is better to start with the most valuable checks and grow carefully.

## A practical GitHub Actions workflow

Create the file `.github/workflows/ci.yml`:

```yaml title=".github/workflows/ci.yml"
name: CI

on:
  pull_request:
  push:
    branches:
      - main

jobs:
  verify:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm

      - name: Install dependencies
        run: npm ci

      - name: Run lint
        run: npm run lint

      - name: Run tests
        run: npm run test

      - name: Build project
        run: npm run build
```

This is not the most complex workflow in the world, and that is fine. In my experience, many pipelines become unnecessarily complicated because teams try to optimize everything before the workflow proves its value.

A good first version should be clear, predictable, and easy for the whole team to understand.

## Why I include the build step

Some teams stop at linting and unit tests. I do not.

For Next.js, the build step often catches problems that linting and unit tests do not:

- incorrect imports
- server/client boundary mistakes
- invalid environment assumptions
- route build failures
- static generation issues

If the application cannot build in CI, I do not want to discover that after merge or during deployment.

## Deployment options

For deployment, I usually prefer one of these approaches:

### 1. Vercel Git integration

This is the easiest option for many Next.js projects. Push to the repository, let Vercel build the preview, and promote to production after merge.

It is simple, and simplicity is valuable.

### 2. Explicit deployment in GitHub Actions

If you need more control, you can deploy after the verification job succeeds. For example:

```yaml title=".github/workflows/deploy.yml"
name: Deploy

on:
  push:
    branches:
      - main

jobs:
  deploy:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm

      - name: Install dependencies
        run: npm ci

      - name: Build project
        run: npm run build

      - name: Deploy to Vercel
        run: npx vercel --prod --token=${{ secrets.VERCEL_TOKEN }}
```

If you go this route, keep secrets and environment variables organized from the beginning. Deployment pipelines become fragile very quickly when secret management is inconsistent.

## Keep quality standards strict

One thing I do not recommend is allowing the pipeline to pass with warnings that the team already decided matter.

If a check is important enough to exist, I prefer being honest about it. Either:

- it matters and should fail the pipeline
- or it does not matter and should not be there

That is the same reason I try to avoid weak defaults in frontend code. Ambiguous standards create ambiguous ownership.

## Suggested scripts in `package.json`

Your project scripts should support the pipeline directly:

```json title="package.json"
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "eslint . --max-warnings=0",
    "test": "vitest run"
  }
}
```

I prefer `--max-warnings=0` in CI-sensitive projects because it forces teams to be explicit about what they tolerate. Otherwise warnings tend to accumulate until nobody trusts the signal anymore.

## CI/CD is also a team communication tool

This part is often underestimated.

A good pipeline does more than validate code. It communicates expectations to the team:

- this project must build
- this project must pass tests
- this project must respect lint rules
- this project is releasable from the main branch

When those rules are encoded clearly in automation, the project becomes easier to scale.

## Conclusions

- CI validates quality continuously, while CD handles delivery.
- For Next.js projects, linting, tests, and builds should be part of the minimum pipeline.
- A simple GitHub Actions workflow is often enough to create strong delivery habits.
- The build step is especially valuable in Next.js because it catches issues that unit tests may miss.
- Pipelines should reflect real standards, not vague intentions.

[Next Post: Authentication and Authorization in Next.js Applications with Supabase](https://santi020k.me/blog/authentication-and-authorization-in-next-js-applications-with-supabase/)
