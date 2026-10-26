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
without JavaScript all organization cards remain visible. Imagery comparisons
remain proposals and do not change the release candidate's images.

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
