# Website v4 release readiness

Review date: 2026-10-07. Integration target: `release/v4.0.0`.
Production remains the reviewed `main` workflow; this local hardening pass does not
publish the candidate or deploy it.

## Changes

- Upgrade 17 direct dependencies to current compatible stable releases. Keep the
  coordinated Lumen 4.0.0 npm packages and TypeScript 6 compiler API compatibility.
- Remove five advisory chains, install the upstream braces nesting mitigation,
  and preserve the remaining registry audit failure. See
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

## Release blocker

`pnpm run audit` still exits with one high-severity `braces` registry advisory,
[registry advisory](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm).
The installed mitigation has behavioral regression coverage, but the published
version remains 3.0.3. No advisory is ignored and no release exception is granted.
Replace the patch with a published fixed version and obtain a passing audit
before recommending production release.

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
including the close-button focus correction. The full Linux Firefox repeat of
the earlier product source with the animation helper fix remains pending; macOS
Firefox visual baselines remain unverified.
