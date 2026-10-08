# Website v4 release readiness

Review date: 2026-10-07. Integration target: `release/v4.0.0`.
Production remains the reviewed `main` workflow; this local hardening pass does not
publish the candidate or deploy it.

## Changes

- Upgrade 17 direct dependencies to current compatible stable releases. Keep the
  coordinated Lumen 4.0.0 npm packages and TypeScript 6 compiler API compatibility.
- Remove vulnerable tooling chains, including the final Markdown glob chain,
  and retain the full dependency audit gate. See
  [dependency security](dependency-security.md) for exact versions, patch sources,
  removal conditions, and recovery.
- Preserve sitemap modification dates, validate XML and dates, deduplicate shared
  Theme sources, and safely serialize caller-provided structured data.
- Refresh the visual README using tracked artwork and the local Lumen/profile
  README patterns. Align Lumen setup, contributor guidance, and GitHub forms.
  Refresh the Lumen project overview against installed v4 contracts and remove its
  unverified historical component count.
- Add a footer issue-reporting link and content correction form. Extend full
  Lighthouse checks to eight routes, retain manual diagnostics, and include
  dependency patch changes in CI.
- Restore blog-filter scroll position after destination page initialization;
  retain exact geometry assertions and wait for transition completion in tests.
- Regenerate CV downloads and the OG cache through their documented generators.

## Consolidation and remote cleanup

Every older website worktree HEAD inspected at the start of the pass was an
ancestor of the release. Dirty source checkouts were preserved:

| Source | Disposition |
| --- | --- |
| `43a3`, `99d6`, `c4ae`, `dd07` README copies | Identical; their useful visual and navigation intent is included in the current README. |
| Hero and home-content copies | Integrated navigation is retained, including newer mobile spacing, container queries, and public Lumen hooks. |
| Projects-design copy | Gallery, styles, and tests are integrated; retain the newer structured-data ordering and shared hero styles. Its consumed changeset is reflected in the v4 changelog. |
| Lumen-adoption copy | Temporary local tarball overrides are superseded by the coordinated npm registry packages. |
| Historical `website-lumen-v4` checkout | Only an untracked dependency directory remains; no source change to integrate. |

Dependabot PR [#156](https://github.com/santi020k/website/pull/156) and its remote
branch were closed and deleted after Git ancestry confirmed its entire commit
was already contained in the release. A fresh fetch showed only remote `main`
and no open pull requests. No source worktree was removed or overwritten.

## Independent review

A fresh read-only reviewer inspected the release and current hardening changes.
Its sole actionable finding was that patch-only changes could skip CI. The
`patches/*` matcher now triggers the full quality gate, and the reviewer rechecked
that fix. A follow-up review of the footer link, browser regression assertions,
and changelog found no additional actionable issues.

## Dependency audit gate

The former high-severity `braces` blocker is removed from the dependency graph.
ESLint 3.6 removed its chain; the final migration replaces markdownlint-cli2 with
the same markdownlint engine and Node's native file discovery. The 115-file scope
and existing rules are unchanged. `pnpm run audit` passes with no known findings;
no advisory is ignored and no exception is granted. See
[dependency security](dependency-security.md) for details and recovery.

The qualification sections below record earlier revisions and their blockers.
They remain historical evidence; final release readiness depends on the latest
pushed head, required checks, and review disposition.

## Signature frame follow-up

The navigation now joins the Home, About, Work, Projects, and Blog landing heroes
through a shared raised identity tab. Travel, reading pages, archives, and the
scrolled header retain the solid dock. Mobile navigation and search share
the frame, backdrop blur, coordinated opening and closing, and reduced-motion
behavior. Search keeps keyboard focus inside while its index loads.

The complete Chrome suite passed 277 tests. The final navigation, search, and hero
checks passed 147 tests across Chrome, WebKit, and Mobile Safari, including both
themes, enlarged text, short viewports, keyboard focus, and reduced motion.

The landing-page extension passed all 332 Chrome tests. Its 55 additional checks
cover joined surfaces, both themes, narrow screens, enlarged text, accessibility,
page transitions, and the routes that retain the dock. Navigation, search, and
landing checks passed 177 of 178 tests across WebKit and Mobile Safari. The one
failure exposed a test timing race when reopening the menu during its exit
animation. Capturing the closing state and reopening in the same browser task
preserves every assertion; nine repeated checks then passed across Chrome,
WebKit, and Mobile Safari. About and Blog visual baselines were refreshed and
reviewed in all four supported snapshot projects below.

The Chrome, WebKit, Mobile Chrome, and Mobile Safari visual baselines were
regenerated and reviewed for this design. The six existing Firefox macOS
baselines are preserved: Playwright's Firefox launcher exits before page load
with `Could not find profile folder`, including with a separate temporary
directory. Repair that launcher, refresh its baselines, and rerun its checks
before claiming macOS Firefox baseline verification. Linux Firefox coverage is
recorded separately below.

## Verification

- Frozen dependency installation passed with Node 24.21.0 and pnpm 11.25.0.
- The canonical full gate passed spelling, zero-warning ESLint, Markdown and
  content linting, CV freshness, and Astro checking: 245 files, zero errors,
  warnings, or hints.
  An extra direct Markdown lint of `CHANGELOG.md` reported 13 historical MD024
  duplicate Changeset section headings. Preserve the standard generated history;
  the existing canonical Markdown scope excludes that file and passes unchanged.
- Coverage passed all 392 unit tests in 36 files, with 95.28% statement coverage.
- The production build generated 449 pages. Its SEO audit reported zero errors
  and zero warnings.
- The combined sitemap contains 1,306 unique URLs, including 439 website URLs.
  Optional Difftale and Workspace Organizer sources were unavailable and skipped;
  required sources succeeded.
- `pnpm audit --prod --audit-level=low` passed with no known vulnerabilities.
  The full audit fails only on the unpublished braces fix described above.
- Rendered verification covered the footer in light and dark themes at 375 and
  1,440 pixels, the README artwork, and the refreshed Lumen project at mobile and
  desktop widths. Screenshots remain temporary evidence outside the repository.
- The initial full Chromium browser suite passed 267 tests with one retry. A
  subsequent no-retry repeat exposed a real reverse-navigation scroll bug.
  Moving restoration from `astro:after-swap` to `astro:page-load` passed all
  20 repeated transition tests without retries. Assertions retain their numeric
  tolerance, poll asynchronous restoration, and wait for Astro's completed
  transition instead of a fixed delay. Independent review found no weakened
  behavior checks.
- The final no-retry full suite passed 266 tests and timed out in the existing
  light-theme mobile-menu accessibility test while Lighthouse was also running.
  The blog transition regression passed in that full suite. The timeout is
  retained in the record rather than presented as a passing full invocation.
  After Lighthouse finished, all 24 repeated mobile-menu layout and accessibility
  tests passed without retries or any test timeout/configuration changes.
- The isolated Lighthouse run passed assertions across eight routes and 24 runs.
  Accessibility, best practices, and SEO scored 100 throughout. Performance
  ranged from 86 to 93: home scored 86–89 and travel 87–88, below the aspirational 90
  target but above the unchanged 85 release gate. Retain these routes in future
  performance work rather than reducing coverage or lowering assertions.

The `pnpm run ci:verify` wrapper reached the browser stage but exited because an
existing preview occupied its startup environment. Astro 7 permits one preview
per checkout, even when ports differ. After stopping this task's own preview,
the remaining browser stage was rerun on port 4460. Other task previews were
preserved. Lighthouse was also rerun in an isolated report directory after a
concurrent audit reused the default directory; its route set and assertions were
unchanged. The wrapper exit is recorded rather than described as a passing run.

## Final local branch consolidation

The pending dependency cleanup, page integrity audit, search validation, and
service-worker and offline listener fixes are committed as `6decead9`. The
`feature/landing-signature-frames` commit `4d9d397e` is integrated into
`release/v4.0.0`. Changelog conflicts retain both sets of changes; both CV files
and their source metadata are regenerated from the combined source.

The combined state passed spelling, zero-warning lint, strict Astro checks,
Markdown and content checks, CV freshness, all 410 unit tests in 37 files,
coverage, build, SEO and page integrity audits, and Lighthouse assertions across
all eight routes and 24 runs. The complete stable Chromium suite passed all
341 tests without retries, including the new search recovery, offline lifecycle,
service-worker freshness, landing frame, and screenshot checks.

The `PW_PREVIEW_PORT=45868 pnpm run ci:verify` wrapper completed through Lighthouse
but exited when another chat's preview held Astro's per-checkout lock. After that
chat stopped its preview, the unchanged remaining browser stage passed with
`PW_PREVIEW_PORT=45868 pnpm run test:e2e:ci:stable`. This records a completed set of
checks, rather than a passing full wrapper invocation.

The full dependency audit still reports the one high-severity braces advisory
above. Production publication remains blocked. No push, pull request, remote
merge, or deployment follows from this local consolidation. Older dirty README
and Projects worktree copies remain preserved: their useful changes are already
included or superseded by the current release.

## Final interaction and page review

The release now includes `2e703285` (theme persistence and carousel keyboard
focus), `7622d2fa` (responsive image source auditing), and `c3a2327d` (readable
project labels in dark galleries), consolidated at `45bb54bc`. The page review
covered all 449 generated pages at 320, 375, 768, and 1,440 pixels in both themes,
with 898 mobile and desktop captures. Representative responsive Chrome and
WebKit checks passed after the contrast correction. The interaction checks
passed 95 Chromium and four focused WebKit tests; the combined quality gate
passed 416 unit tests.

Firefox qualification uses an isolated Ubuntu ARM64 VM, Node 24.21.0, and the
same Playwright 1.63.0 tests, timeouts, assertions, one worker, and zero retries.
The production build was transferred with SHA-256 verification. The first run
passed 333 tests and failed three: the temporary Python server lacked HTTP byte
range support, and two dark travel accessibility scans waited indefinitely for
Firefox transitions inside the closed notebook. These failures remain recorded.
The verification server now serves byte ranges without changing the PDF test.
Commit `48fb6e58` excludes unrendered animation targets from the accessibility
helper's wait, retains visible finite-animation waits and every axe assertion,
and adds regressions for both cases. All 22 focused Firefox and Chromium checks
passed without retries.

## Pre-push qualification

Commit `63e34b87` fixes a reproduced Safari focus regression: explicitly closing
the travel details panel now returns focus to the map even when Safari did not
focus the clicked button. Escape and country selection preserve their contextual
focus behavior. The existing regression passed nine times across Chromium,
WebKit, and Mobile Safari without retries. All 44 affected Chromium and WebKit
checks passed against that source, including the accessibility helper, service
worker PDF handling, and travel interactions.

A fresh independent read-only review inspected the full candidate against
`origin/main`, the pending documentation, and the travel focus fix. It reported
no new actionable findings and retained the known braces audit blocker. The
final-source focused Linux Firefox checks passed all 22 tests without retries,
including the close-button focus correction. The earlier full repeat passed
337 tests and failed one because a trace file was missing: overlapping harness
runs shared Playwright's output directory. This failed invocation is retained.

The final isolated Linux Firefox run passed all 338 tests on `63e34b87` and its
exact committed tests, with zero retries, failures, flaky tests, or skips.
It used one worker, unchanged repository timeouts, Firefox 155.0, Playwright
1.63.0, and Node 24.21.0 on Ubuntu ARM64. The transferred build's SHA-256 was
`e8cbf0eaa52c29d5f9805ea82257f35bc19a6b78606b6a25dbcff3684862fffc`.
Separate output storage and no overlapping runs resolved the harness collision.
Sixteen representative mobile/desktop and light/dark Firefox layout captures
reported no page errors, overflow, broken images, or theme mismatches.
The unchanged test helper does not declare macOS screenshot tests on Linux;
macOS Firefox visual baselines remain unverified.

## Pull request checks

Draft pull request [#157](https://github.com/santi020k/website/pull/157) contains
the pushed release. GitHub's quality checks passed lint, strict Astro checking,
documentation and content checks, CV freshness, and all 416 unit tests before
the required audit stopped on the retained braces advisory. CodeQL and the PR
title checks passed. The Cloudflare branch preview deployed successfully.
This preview is separate from the production release workflow. Codex review
was requested; the audit exception decision remains pending.

## OG and ESLint library adoption

The release uses published OG 1.2.0, ESLint Basic 3.6.0, Astro adapter 3.1.5,
and Formats, Libraries, Testing, and Tools adapters 3.1.4. Their updated graph
retains Node 24, ESLint 10, and TypeScript 6 compatibility. Satori 0.36.0 is the
renderer dependency selected by OG's tested release; the catalog and lockfile
retain that version rather than upgrading it independently.

OG's preset v6 regenerates the social cards with the site's existing colors,
Montserrat font, artwork, and logo surfaces. Generation enables `cacheBust` on
the route manifest. The shared metadata head selects the generated primary URL,
including its content fingerprint, for Open Graph and Twitter images. Existing
project-image aliases resolve to the current primary image. Explicit custom
artwork and utility-page fallback images remain supported. The manifest is
validated during build without unsafe JSON casts.

ESLint uses `defineConfig` with `testingFiles.playwright` for the site's
`tests/**/*.spec.ts` location. The library now owns Playwright/Testing Library
coexistence, replacing the local detection workaround and applying the shared
Playwright rules to the browser suite. Runtime validation and required rendered
values replace conditional test assertions without removing behavior checks.

The full registry audit retains one high-severity braces advisory through
Markdown tooling; the ESLint adapter chains no longer appear. The existing
braces patch and regression tests remain necessary. Roll back this adoption by
reverting its source, workspace, lockfile, generated OG assets, and CV artifacts
together, then reinstalling the frozen lockfile. No production release or remote
update is authorized by this local adoption.

Local adoption verification passed zero-warning lint, strict Astro checking,
the production build, generated OG and CV freshness, documentation and content
checks, all 423 unit tests with coverage, and all 367 Chromium tests with zero
retries. The unit coverage run used one worker to avoid host contention without
changing assertions, timeouts, or coverage thresholds. Browser coverage includes
metadata, generated image responses, visual snapshots, accessibility, responsive
layouts, and navigation. Firefox, WebKit, and Lighthouse were not rerun for this
adoption. Production dependencies have no known audit vulnerabilities; the full
tooling audit remains blocked by the retained braces advisory above.

## README and Codex review follow-up

The repository overview now follows the product-first structure of the sibling
Lumen and GitHub profile READMEs: visitor routes, project artwork, shared tooling
boundaries, reproducible setup, and focused verification commands.

Both findings from the Codex review of `add4e214` are addressed:

- CV freshness includes the render year used by the résumé experience count.
  Regression tests prove year rollover invalidates the fingerprint and dates
  within one year preserve it. Both PDFs were regenerated from the current source.
- Webmention normalization accepts legacy `content.value` after modern `content.text`.
  Tests cover modern precedence, blank or malformed text, legacy replies, and
  blank or malformed legacy values.

The 28 focused regression tests and `pnpm run verify:fast` pass: 431 unit tests
in 38 files, zero-warning lint and Astro diagnostics, documentation/content/CV
checks, production build, and zero-error SEO and page-integrity audits.
A fresh independent read-only review of
all release changes against `origin/main` and these fixes found no additional
actionable issues. The reviewer retained the dependency audit as a release blocker;
this is not an approved exception. Final remote checks and review disposition must
refer to the pushed PR head before recommending release.

## Markdown tooling release follow-up

The user approved removal of the last vulnerable glob-tooling chain. The
`lint:md` command now runs `scripts/js/lint-markdown.mjs`; the configuration is
renamed to `markdownlint.config.json` with unchanged patterns and rules. CI treats
changes to that configuration as build-affecting. The obsolete braces patch,
whitespace exemption, CLI dependency, and CLI-only overrides are removed.

The migration's before/after discovery sets match exactly: 115 Markdown files.
Five focused tooling/security tests pass, and the full development dependency
audit reports no known vulnerabilities. A frozen install and peer checks pass.
`pnpm run verify:full` passes with 433 tests in 39 files, coverage above all
existing thresholds, zero lint/type diagnostics, a production build, SEO and
page-integrity audits, 24 Lighthouse runs across eight routes, and all 367
Chromium tests with no retries used. A fresh independent read-only release
review found no actionable issues. Required remote checks and Codex review must
complete against the pushed revision before recommending release.

## Final CV and service-worker review follow-up

The CV fingerprint now includes the imported date formatter, other local render
dependencies, and the canonical and served variable fonts with their generator.
Five fixture mutation cases prove these changes invalidate freshness. Both PDFs
were regenerated from the current source. The service-worker namespace is
`santi020k-static-v4.0.0`; activation removes prior site caches and preserves
unrelated caches.

The Codex download finding referred to a local wrapper that the résumé does not
use. Its direct Lumen import already forwards `download`; browser verification
now checks that both links complete downloads with the expected filenames while
keeping the résumé route open. No wrapper change was needed.

`pnpm run verify:fast` passes with 438 tests in 39 files and zero lint or Astro
diagnostics. All 46 affected Chromium checks pass with zero retries, including
cache retirement, PDF downloads, external links, SEO, and Lumen interactions.
The full dependency audit remains clean. Final independent read-only review
identified the font-input omission; that finding was fixed and rechecked with
no further actionable finding. Remote CI and Codex review must still qualify
the final pushed revision before release.

## Release completeness audit

A fresh fetch and inventory checked both local branches, both remote branches,
all six registered Git checkouts, eight preserved stashes, and open pull requests.
Every branch and worktree HEAD is contained in the release. The primary checkout
and the other source checkouts have no pending source edits; the old Lumen
checkout retains only an untracked dependency symlink. PR #157 is the only open
website pull request.

The stash contents are retained for recovery, with these release dispositions:

- Stashes 0–2 contain earlier blog gallery, project palette/cover, editorial
  artwork, profile, terms, and related tests. Their behavior is integrated or
  superseded by the current sculpted layouts, 12-post archive, current artwork,
  contrast fixes, and stricter types. Do not reapply the obsolete layouts.
- Stashes 3–4 contain the earlier Lumen and OG migration. Published Lumen 4 and
  OG 1.2 contracts, generated manifests, metadata, and regression checks supersede
  those dependency snapshots and generated artifacts.
- Stash 5 contains the missed label-color quoting. Restore its quoting so YAML
  keeps all six-digit colors as strings; an unquoted `5319e7` parses as a number.
- Stashes 6–7 duplicate older identity and Lumen styling work. Current components,
  tokens, search controls, focus treatment, and contrast fixes supersede them.

No stash, worktree file, or historical branch was discarded by this audit.
