---
title: "Sharding 2,973 Playwright Tests Behind One Quality Gate"
description: "How I restructured CI for a static Astro site: one production build, six browser shards, Lighthouse from the same artifact, and a single check that summarizes them."
publishDate: "2027-01-19T15:00:00.000Z"
draft: true
coverImage:
  alt: "Placeholder cover: a graphite panel with a single violet band, pending final artwork"
  src: "./cover.webp"
tags: ["testing", "e2e", "ci-cd", "playwright", "developer-experience"]
postType: "Deep Dive"
---

The CI for this site used to be one job. It installed dependencies, ran the checks, built the site, and ran Playwright on a single worker with a 30-minute timeout.

That held up at 41 spec files. The v5 redesign brought the suite to 239 spec files and 2,973 tests, and one worker inside one timeout stopped being an option.

This is the structure I moved to, and why each piece is there.

## Build once, test the artifact

The production build is the slow part. It assembles the current site and four archived versions, and a full run takes about 22 minutes.

So the build runs once, and its output becomes an artifact:

```yaml
- name: Upload the production build
  uses: actions/upload-artifact@v7
  with:
    name: production-build
    path: dist/
    if-no-files-found: error
    include-hidden-files: true
    retention-days: 1
```

Every later job downloads `dist/` and tests those exact files. No shard rebuilds the site, and no two jobs can test slightly different output.

Static checks run beside the build, not before it. Lint, type checks, unit tests, and the dependency audit do not need `dist/`, so there is no reason to make the build wait for them.

## Six shards of the same suite

The browser job is a matrix of six, and each one runs a slice of the suite:

```yaml
browser:
  name: Browser tests (${{ matrix.shard }}/6)
  needs: build
  strategy:
    fail-fast: false
    matrix:
      shard: [1, 2, 3, 4, 5, 6]
  steps:
    # check out, install, download the build
    - name: Run stable browser tests
      run: pnpm run test:e2e:ci:stable --shard=${{ matrix.shard }}/6
```

Two settings matter here.

`fail-fast: false` lets every shard finish. With the default, the first failure cancels the other five and you fix one problem per push. I would rather see all of them at once.

Each shard uploads its Playwright report and traces only when it fails. A green run stores nothing.

The Playwright browser is cached by lockfile hash. On a cache hit, the job installs only the system dependencies, which is much faster than downloading Chromium six times.

## Pull requests run Chromium, the calendar runs the rest

Running five browser projects on every pull request would multiply the matrix by five. Most pull requests do not need that.

Pull requests run Chromium. A separate workflow runs Firefox, WebKit, and the two mobile projects every Monday and on demand, also in six shards per project. Before this change, that matrix had no schedule at all, which meant Firefox and WebKit ran only when I remembered.

The weekly run still finds things. Engine differences are a different class of bug from the ones a pull request introduces, and a weekly cadence fits how often they appear.

## One job that answers "can this merge?"

Splitting CI creates a new problem. A pull request now reports many checks, and the list changes whenever I rename a job or change the shard count.

The last job exists only to summarize the others:

```yaml
quality:
  name: Quality gate
  needs: [static, build, browser, lighthouse]
  if: always()
```

It reads each result and fails unless every job succeeded or was skipped on purpose. Static checks and the build must always succeed. `if: always()` is the important line: without it, a failed dependency skips the gate, and a skipped check can read as "not required".

With this job, branch protection needs one check, and its name never changes.

## Not every change needs the build

A typo fix in the README should not spend 22 minutes building archives.

A small script classifies the changed paths before anything expensive starts. A change that only touches documentation runs the documentation checks. Anything else, and every release branch, gets the full pipeline. The build and browser jobs read that result and skip themselves when it says so.

The script fails open. If it cannot compute the difference, it chooses the full run.

## Smaller things that added up

- **Partial clone.** The repository carries a lot of binary history. `filter: blob:none` fetches commits without downloading every old screenshot.
- **Cancel superseded runs.** A new push to the same pull request cancels the run in progress.
- **Release branches count.** Pull requests into `release/**` run the same pipeline as pull requests into `main`. The old trigger only named `main`, so a long-lived release branch had no CI of its own.
- **A different time zone in the build.** The build job runs with `TZ: Asia/Tokyo` and the unit tests run with my local zone. Date bugs show up when the two disagree.

## What moving tests off one worker exposed

Sharding did not make the suite pass. It made the suite honest.

When v5 first ran in this pipeline, 60 browser checks in 15 spec files still described earlier iterations of the design, and two more were racy. All of them had to be brought in line with what actually shipped before the gate turned green.

## What I would change next

Every pull request still runs all 2,973 tests. That is thorough and slow.

The next step is a smoke tier: a small set selected by the changed paths for ordinary pull requests, with the full suite kept for release branches and the weekly run. The structure above makes that a change to one job.

If you are starting from a single CI job, do it in this order: build once and share the artifact, shard the browser tests, then add the gate. Each step is useful alone, and the gate is what lets you keep changing the other two.
