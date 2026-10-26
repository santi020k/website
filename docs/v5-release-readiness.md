# Website v5.0.0 release readiness

## Scope and release target

On October 26, 2026, Santiago selected v5.0.0 for the complete editorial redesign
and requested consolidation of current branches and uncommitted website work.
`release/v5.0.0` is the local integration target. It starts from the fetched
`main` / published v4.0.0 commit `2e8171e9`, includes the complete prepared v4.1
history, and replaces v4.1 as the next release. The
[v4.1 preparation history](v4.1-release-readiness.md) retains earlier qualification
results; they are evidence for their recorded commits, not proof of the final v5
candidate.

Changesets generates 5.0.0 from the released 4.0.0 baseline, retaining every
prepared editorial and reliability note plus the remaining task Changesets.
There is no separately published 4.1.0 release. Public page URLs remain compatible
and no visitor data migration is required. Lumen package versions retain their
own independent versioning.

## Website history

The History timeline now includes V1 through V5. V3 shows release 3.11.0, V4 shows
release 4.0.0, and V5 shows release 5.0.0. V1 and V2 remain curated design eras.
The new `apps/v4` is sourced from the published v4.0.0 commit, not the unpublished
redesign. Its content cutoff, original package version, stored feed data, and
visual composition stay frozen while its dependency catalog stays maintained.
Archive storage is isolated; comments, forms, Webmentions and service workers
remain disabled. `/v4/` is excluded from indexing and has links back to History
and the corresponding current page. The private motion studio uses the same five
eras within its existing 30-second duration.

## Consolidation and validation

The coordinator inventories local branches, detached checkouts, and tracked and
untracked changes before integration. Active article and portfolio chats finish
their current approved changes before the coordinator merges their commits.
Unapproved design comparisons are proposals, not release implementation.
Generated caches and dependency directories are not source changes.

The initial October 26 consolidation at `0711988b` inventoried 60 named local
branches and 23 checkouts. Every
named branch tip is contained in v5 except the deliberately preserved reveal
experiment below. The two active source checkouts are clean after their handoffs.
The old Lumen checkout retains only its untracked dependency symlink. Three older
detached snapshots and eight historical stashes retain the published-v4
reconciliation recorded in [the v4 audit](v4-release-readiness.md#release-completeness-audit).
Their obsolete layouts and dependency snapshots are preserved, not reapplied.

The combined candidate includes:

- The complete v4.1 preparation at `ac7e77f2` and logo/content-date fixes merged at
  `2981827a`.
- V4 preservation, v5 metadata, History and motion updates in `43dd7ecc`.
- Portfolio evidence `5a595279`, About profile links `d2538da8`, and About practice
  links `ffc34480`.
- Article references `8cddc493`, single series continuation `a71a2a84`, and the
  closing series connection `a365642f`.

Both source chats were told to base further approved work on `release/v5.0.0`.
Unapproved comparison mockups remain outside the release. The final Changesets
pass includes these integrations in 5.0.0 while preserving the published 4.0.0
and earlier changelog byte for byte. OG fingerprints and both resume PDFs were
regenerated with the repository generators.

Baseline validation for `0711988b`:

- `pnpm run verify:fast` passed: CI-scope tests, spelling, zero-warning lint for
  the current site, all four archives and motion studio, type checks with no
  errors/warnings/hints, Markdown and content lint, PDF freshness, 900 unit tests,
  seven motion browser tests, and the complete production build.
- The assembled audit passed for 1,740 documents and 8,156 local targets. Archive
  SEO, navigation, and assets passed across 1,288 archived pages. Current-site OG
  validation passed for 452 pages with no errors or warnings.
- The Chromium/WebKit integration matrix covered History, all archives, About,
  portfolio evidence, article references, series navigation, reveal behavior,
  and view transitions: 413 of 414 cases passed initially. One WebKit case exposed
  a one-millisecond `performance.timeOrigin` comparison difference. The two
  same-document navigation assertions now compare the original Document directly;
  both cases then passed five repetitions in each browser (20 passes), retaining
  the reload and duplicate-handler regression checks.
- `pnpm run lighthouse` passed the configured homepage performance, accessibility,
  best-practices, SEO, and interaction/layout assertions.
- History and v4 were inspected at 390px and 1440px in both themes, with no
  horizontal overflow. Captures include the existing History before the change
  and the finished five-era timeline. Browser cases also cover enlarged text,
  keyboard navigation, script-free navigation, and accessibility checks.

The existing v3 large-chunk build advisory remains unchanged. The optional
Workspace Organizer sitemap source was unavailable and omitted by the established
fallback; the complete local page audit still passed.

## Publication and recovery

This task prepares and integrates locally. Pushes, pull requests, remote merges,
version tags, GitHub Releases, and deployments require separate authorization.
Before the first push, perform the required independent whole-release review
against `main`, resolve findings, and run the release gates. Open the release PR
from `release/v5.0.0` to `main`; GitHub Actions creates the tag and release from
the reviewed merged commit. Cloudflare deploys that commit through the existing
pipeline. Smoke-check current routes, `/history/`, `/v1/` through `/v4/`, archive
search and exit links, themes, and both resume downloads.

No production data migration is required. Recover by promoting the previous
healthy Cloudflare deployment or applying a reviewed revert, then repeat smoke
checks. Preserve the published v4.0.0 tag and never move a published version tag.

## Reveal experiment reassessment

The preserved `fix/reveal-threshold-cleanup` commit `8b4abbb4` was reconsidered
for v5 at Santiago's request. A native Chromium comparison of the installed
runtime and the exact experimental observer change showed a section configured
for a 0.75 threshold revealing at only 0.12 visibility with the experiment,
while the existing runtime retained the requested delay. Santiago selected the
best option without adverse behavior changes. V5 therefore retains the explicit
zero thresholds for tall groups and the existing regression coverage; the
experimental global runtime change stays excluded and preserved for reference.

The v4 archive's menu, search, desktop-resize and back-to-top focus repairs reuse
the established v3 archive behavior. Its 404 canonical URL points to the generated
`404.html`.
The previously withdrawn branching-strategy draft and preview remain withdrawn
in the new archive too.

## Fresh recommendations follow-up

The approved `fix/article-fresh-recommendations` commit `aebdb771` is contained
through local merge `26a13bed`. Related writing excludes article destinations
already rendered by Reference ledger or Series connection before applying the
existing shared-tag/date ranking and two-card limit. It matches local paths and
declared canonical URLs while ignoring query strings and fragments. Drafts,
scheduled posts and unrelated fallback remain excluded. The approved card design
is unchanged, with no new dependency or client script.

Its patch Changeset is folded into the still-unpublished 5.0.0 notes; package
version remains 5.0.0 and the published changelog remains unchanged. Resume PDFs
were regenerated because the shared content helper participates in their source
fingerprint, then their freshness check passed.

Scoped integration validation passed: 37 focused unit tests, zero-warning ESLint
for affected files, and `check:current` with no errors, warnings or hints. The
current-site production build and OG audit passed for 452 pages. An initial
incremental build retained the prior article compiler metadata; the repository's
normal cache cleanup before the current-site build refreshed it without a source
change.
The article-reference and fresh-recommendation suites then passed 20 cases across
Chromium and WebKit with retries disabled, including native keyboard navigation
and HTML without JavaScript. The existing archives were reassembled from their
unchanged builds. Full release gates remain reserved for final publication.

## Named organization index follow-up

The approved `feature/about-organization-index` commit `bc8f20bc` is contained
through local merge `3a53e415`. Nine named Lumen buttons replace the previous/next
arrows, expose the selected organization, and keep the corresponding case study
visible across layout changes. Native Tab, Enter and Space remain usable;
without JavaScript all organization cards remain visible. This step kept the
existing images; the later approved Contour backdrop is recorded below.

The new note is folded into 5.0.0 while preserving the published changelog.
Resume PDFs were regenerated because the shared About stylesheet participates
in their source fingerprint; the freshness check passed.

Scoped integration validation passed: zero-warning ESLint, `check:current` with
no errors, warnings or hints, and the current-site production build and OG audit
for 452 pages. The About and named-index suites passed 32 Chromium/WebKit cases.
Three older browser suites were updated to use named selectors while retaining
their keyboard, resize, client-navigation, logo and enlarged-text coverage;
all 34 affected cases passed. After simplifying a test's keyboard traversal to
reuse its existing helper, its 24 responsive cases passed again with retries
disabled. The original whole-release gate remains recorded above at `0711988b`.

## Connected History caption follow-up

The approved `fix/history-today-caption` commit `51f02860` is contained through
local merge `7a60da68`. The current preview and caption share one bordered frame;
a compact V5 label aligns with the existing branded Today pill. The full image,
native figure semantics and responsive wrapping remain, without new JavaScript.
Its Changeset is folded into 5.0.0 and leaves published notes unchanged.

Scoped integration validation passed: zero-warning affected lint, a current-site
type check with no diagnostics, the current-site production build, the 452-page
OG audit and PDF freshness. Twenty production Chromium/WebKit cases passed with
retries disabled, covering History, first-paint styles, 320px to 1440px layouts,
both themes, enlarged text, keyboard access, accessibility and script-free links.
Matching before/after captures at 390px and 1440px in both themes confirmed the
joined frame and no horizontal overflow. The unchanged archive builds were
reassembled into the local preview. No external release action was taken.

## Series close and Contour backdrop follow-up

The approved latest-chapter treatment `435e0949` is contained through merge
`cf721046`. It uses the existing series component for a closing heading, linked
series title and compact previous-chapter row. First and middle chapters retain
their continuation layout. A single-chapter series has no invitation to an earlier
chapter. The expandable chapter index and overview remain native and accessible.
Eleven series unit tests and 52 Chromium/WebKit series cases passed on the merged
branch, with zero-warning affected lint and a clean current-site production build.

The approved About Contour backdrop `8bf2b48b` is contained through merge
`cdbb42e1`. Static CSS contours use each project's existing colors behind its
optimized logo. The ReactJS Colombia mark has an explicit light surface. Named
index behavior and case-study destinations remain intact; no client script was
added. The About/index and organization reflow suites passed 56 Chromium/WebKit
cases, including all nine logos, keyboard focus, responsive resizing, both themes,
enlarged text and script-free access. Mobile and desktop captures were reviewed.

Both notes are folded into 5.0.0. The combined current-site type check had no
errors, warnings or hints; affected lint, production build and the 452-page OG
audit passed. Resume PDFs were regenerated for the updated profile/token source
fingerprint and their freshness check passed. Full release gates remain reserved
for final publication, with the original baseline qualification recorded above.

## Homepage integration follow-up

The completed homepage work in `99c38862`, updated with earlier v5 work at
`74d84698`, is included in this consolidation. Home now owns one opening and
closing spacing rhythm. Shared section introductions respond to their reading
width and keep whole words at enlarged text sizes. Cards, content order and native
destinations remain unchanged. The source branch's refreshed mobile and WebKit
visual references are included.

Release-note conflicts retain both sets of completed work. Resume artifacts were
regenerated from the combined source instead of choosing either branch's generated
files. The screenshot generator refreshed V5's History capture; all archived
captures remained byte-identical.

The merged homepage suite initially passed 110 of 112 cases across Chromium,
WebKit, Mobile Chrome and Mobile Safari. Two mobile failures came from a test
scrolling only the first statistic into view before expecting all four viewport-
triggered counters to finish. The test now visits and checks each statistic,
then verifies that all values remain complete. All four browser profiles passed
three repetitions of that case, with retries disabled. Animation behavior was
preserved. Affected lint, the production build, OG freshness and PDF freshness
passed. Source-branch full-gate evidence remains attached to its own recorded
revision and is not represented as a new whole-release run.

## Practice captions follow-up

The approved `feature/about-practice-captions` commit `6f4894bb` is contained
through local merge `e200faf5`. All six About engineering principles link to
related published writing through native Lumen links. The optional caption renders
only for the editorial appearance; the shared default DX-page cards retain their
existing presentation. A regression assertion verifies that DX cards have no
practice captions. The new release note is folded into 5.0.0 while preserving
the published changelog.

Scoped merged validation passed: zero-warning affected lint, a current-site type
check across 478 files with no errors, warnings or hints, and 62 Chromium/WebKit
cases with retries disabled. Coverage includes all six published destinations,
keyboard navigation, the default DX headings and absent captions, passive-card
behavior, both themes and enlarged-text layouts. The current-site production
build and 452-page OG audit passed; unchanged archives were reassembled.
Resume PDFs were regenerated for the profile and stylesheet fingerprint and
passed their freshness check. Matched mobile and desktop captures were reviewed.

## Reading rows follow-up

The approved About recommendations layout is integrated from `84d6b4e1`
through `d88005ca`. All four testimonials now use full-width reading rows.
Their quotations, authors, roles, relationships, order and LinkedIn action are
unchanged, and the shared testimonial component retains its existing contract.
The patch note is folded into 5.0.0 without changing the published changelog.

Scoped merged validation passed: zero-warning affected lint, 30 Chromium/WebKit
checks with retries disabled, the current-site production build and the 452-page
OG audit. The browser checks cover profile content, About reflow in both themes
with enlarged text, and accessibility. Desktop and mobile captures were reviewed.
Unchanged archives were reassembled; resume PDFs were regenerated for the
stylesheet fingerprint and passed the freshness check.

## Discussion fold follow-up

The approved article discussion is integrated from `1590a9f9` through `1e40c26d`.
Lumen Collapsible opens the existing comments widget on activation or a direct
comment link. Closing retains the same iframe. The GitHub fallback, no-script
guidance, theme updates, loading status and polite error handling remain available.

Merged WebKit coverage found a real navigation race: mounting during Astro's
after-swap event allowed its script runner to execute the client again.
Initialization now waits for the public page-load event. The regression checks
require one client script, one iframe, a cleared loading status and one request
per visited discussion. Keyboard coverage follows the repository's macOS WebKit
convention and tabs from the summary through the GitHub and sharing controls.

The patch note is folded into 5.0.0, preserving published changelog entries.

Scoped validation covers 96 Chromium/WebKit cases. The final runtime run passed
94; two remaining keyboard setup cases were corrected without weakening focus
assertions, and all 18 colophon cases passed on the final targeted rerun. The
320px, 200-percent WebKit cases also passed six repeat runs. Coverage includes
fragment navigation, delayed widgets, theme changes, stale events, blocked-client
recovery, no JavaScript, sharing and accessibility in both themes. Affected lint
passed with zero warnings. The current-site type check reported no diagnostics
across 478 files, and the final production build and 452-page OG audit passed.
The existing resume artifacts passed freshness checks; no regeneration was needed.
Matched desktop and mobile captures were reviewed.

## Full homepage composition follow-up

The approved homepage composition from `6c959f3e` is integrated after `4a2f4247`.
All eight projects, seven articles, complete descriptions and section order are
preserved. The impact measures use an open strip, supporting projects have quieter
identities, writing uses distinct image-and-copy rows, and community uses one
surface. Page length is not a design constraint. Section and footer spacing now
use the same available-width rule, including tablet layouts.

The source branch passed its complete verification gate, including 907 unit tests
and 48 focused browser cases. Merged validation is scoped to the changed surfaces,
following the requested iteration workflow. Generated resume conflicts were
resolved by rendering both PDFs from the combined source, then checking freshness.
All ten History captures were regenerated: only the two v5 images changed; the
eight v1-v4 captures remain byte-identical. The final production build includes
those assets and passed its 452-page OG audit. The assembled-site audit passed
across 1,740 documents and 8,129 local targets.

All 100 merged Chromium/WebKit homepage cases passed with retries disabled, plus
two mobile-browser counter checks. Coverage includes content preservation, native
destinations, keyboard use, shared spacing, statistics and enlarged-text layouts.
Affected lint passed with zero warnings. Matched full-page desktop and mobile
captures in both themes were reviewed.
