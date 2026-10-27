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

## Quote sleeve follow-up

The approved About recommendation cards from `67f83c68` are integrated through
`fbf55d99`. Quote sleeve places the complete quote before a ruled author footer,
using the existing Lumen Card, Icon and Avatar with two shared shape/shadow tokens.
Reading rows and the LinkedIn destination remain unchanged. No attribution data,
component props or client behavior changed.

All 42 scoped Chromium/WebKit cases passed with retries disabled, covering About
accessibility, profile content, enlarged-text reflow and passive-card behavior.
Additional desktop/mobile checks compared the rendered quotes, names, roles and
relationships exactly against the source data; all four matched. Before-and-after
captures in both themes were reviewed. Zero-warning affected lint, the current
production build and 452-page OG audit passed. Resume PDFs were regenerated for
the shared-token fingerprint and passed their freshness check. The patch note is
folded into 5.0.0 while the published changelog remains unchanged.

## Reading boundary follow-up

The approved article rail boundary from `3d18203c` is integrated through
`77006921`. The sticky contents now share the prose row's boundary, while series
navigation, comments and sharing continue below in the same reading column.
The shared contents component, project rail and mobile chapter opener retain
their existing behavior. Source order keeps keyboard navigation moving from the
contents into the series and from sharing into related writing.

All 70 scoped Chromium/WebKit cases passed with retries disabled: the new reading
boundary suite plus existing post navigation and article closing coverage. These
check series and standalone posts, native fragments, Back navigation, reading
progress, no JavaScript, closing spacing, mobile and enlarged text, and keyboard
order. Matched desktop/mobile captures in both themes were reviewed. Affected
lint passed with zero warnings; the current production build and 452-page OG
audit passed. Resume PDFs were regenerated for the shared-style fingerprint and
passed freshness checks. The patch note is folded into 5.0.0 with published
changelog entries unchanged.

## Navigation review fixes

The v5 review reproduced a browser scroll-anchor adjustment after Astro had
restored an article's saved history position. The fix suspends anchoring across
the document swap and its first paint, then restores normal browser anchoring.
A new swap cancels the preceding cleanup frame. Native transitions, immediate
fallback swaps, reduced motion, fragment navigation and focus recovery retain
their existing behavior.

The regression now checks mobile and desktop Back/Forward navigation with native
and fallback transitions in both motion modes. It verifies the exact position
inside `astro:after-swap` and across subsequent rendered frames, and confirms that
normal anchoring resumes. All 90 production Chromium/WebKit navigation, search
and transition cases passed with one worker and retries disabled.

The deployment runbook now lists all four archives, including `/v4/`, in the
existing `X-Robots-Tag` policy. The complete production build passed: archive
checks covered 1,288 pages and the assembled-page audit covered 1,740 documents
and 8,129 local targets with no errors. Both resume PDFs were regenerated for
the changed layout and stylesheet fingerprint. Changesets folded the fix into
the unpublished 5.0.0 notes without changing published release history.

The source branch's full `pnpm run verify:quality` gate passed: zero-warning lint
and type checks for every app, spelling and content checks, PDF freshness, 907
unit tests and seven motion-browser tests. Integration checks are recorded
separately from this source-branch result.

## Chapter guide follow-up

The approved About Chapter guide from `a27f1a72` is contained through `fc8796b3`.
Four native Lumen links below the profile highlights reach the existing numbered
Collaboration, Context, Principles, and Recommendations sections. Four desktop
columns become full-width rows on narrow containers, without new client code.
The patch note is folded into the unpublished 5.0.0 changelog.

All 12 scoped Chromium/WebKit cases passed with retries disabled, covering the
four keyboard destinations, responsive layouts, and accessibility. An additional
20 checks covered five viewport widths at normal and 200% text, with JavaScript
enabled and disabled. All links retained usable targets and no horizontal
overflow. The temporary no-JavaScript harness needed direct style assignment
instead of waiting on an injected stylesheet event; no application change was
needed. Matched desktop/mobile captures in both themes were reviewed.

## Combined navigation integration gate

The combined Chapter guide and navigation-fix candidate passed the complete
`pnpm run verify:fast` gate: CI-scope tests, spelling, zero-warning lint and type
checks across all apps, Markdown and content checks, PDF freshness, 907 unit
tests, seven motion-browser tests, and all five production builds. The archive
audit passed across 1,288 pages; the assembled-page audit covered 1,740 documents
and 8,129 local targets with no errors. The current-site OG audit covered 452
pages with no errors or warnings.

The generated PDF merge conflicts were resolved by rendering both resumes from
the combined source. Both branches' release-readiness histories are preserved,
and the published 4.0.0 changelog remains byte-identical to the released base.

All 90 merged Chromium/WebKit navigation-recovery, search-navigation, and view-
transition cases passed with one worker and retries disabled. The coverage
includes mobile and desktop, both motion preferences, native and fallback swaps,
exact restored positions across rendered frames, and restored scroll anchoring.

## Session first and Topic context follow-up

The approved Speaking page flow from `b4832786` is contained through `ea33a72f`.
Existing sections now follow Topics, Formats, History, Community, and Booking
after the hero and highlights. The complete cards, text, destinations, and
structured data are preserved; no CSS reordering is used.

The approved related-writing context from `d4c96d62` derives at most two topics
actually shared by the displayed recommendations. It represents both articles,
deduplicates topics in source order, and uses canonical native archive links.
The shared section header accepts a description slot while retaining existing
description props as its fallback. Article ranking, cards, and browse actions
remain unchanged. Both patch notes are folded into 5.0.0.

Scoped integration validation passed with zero-warning affected lint, all 910
unit tests, the current production build, and the 452-page OG audit. All 66
Chromium/WebKit cases passed for Speaking, related-writing headers, fresh
recommendations, and reading boundaries, plus four no-JavaScript shared-header
cases. Every browser run used retries disabled. Matched desktop/mobile captures
in both themes were reviewed; all Speaking card text and link attributes matched
the source baseline. Both resume PDFs were regenerated because the shared content
helper participates in their fingerprint, then passed freshness checks.

The assembled-page audit passed across 1,740 documents and 8,129 local targets
with no errors. Published changelog entries remain unchanged.

The complete workspace gate remains recorded at `16b66665`; these later visual
iterations received scoped integration checks rather than repeating that gate.

## Speaking Evidence captions follow-up

The approved source `a13d3b3d` adds three native source captions to Speaking
statistics: Career timeline, ReactJS Colombia, and Read the articles. The shared
StatCard footer is optional. Existing dynamic experience and post values, card
appearance, and statistics without sources remain intact. The patch note is
folded into 5.0.0 while published changelog entries remain unchanged.

All 54 scoped Chromium/WebKit Speaking and statistics-card cases passed with
retries disabled. The existing reflow matrix now checks source-footer clipping
and verifies that other statistics consumers have no added footer. Additional
checks covered 320, 768, and 1440px at normal and 200% text, with minimum link
targets and visible focus. All three destinations resolve, and keyboard
navigation reaches the Work timeline fragment. Matched desktop/mobile captures
in both themes preserve the exact displayed values.

Affected lint passed with zero warnings, the current production build and
452-page OG audit passed, and resume freshness passed without regeneration.
The complete workspace gate remains recorded at `16b66665`; this focused
iteration received scoped integration validation.

## Speaking Practice captions and outgoing scroll follow-up

Approved source `902d2484` connects all six Speaking topics to relevant native
article or case-study links through Practice captions. Complete topic copy and
format-card markup are preserved. The new keyboard test uses Alt+Tab only for
WebKit on macOS. Both release notes are folded into 5.0.0.

The initial 52-case browser run exposed a failure in the existing Career timeline
link: an unfinished outgoing smooth scroll could move the Work fragment after
Astro restored it. A traced repeat reproduced the failure, and a new exact-position
regression failed before the fix. Navigation now stops the outgoing scroll at
`astro:before-preparation`. Ten diagnostic runs kept the target at the exact
restored position. The regression covers both motion preferences, mobile and
desktop widths, and native and fallback transitions.

All 134 merged Chromium/WebKit Speaking, navigation-recovery, search-navigation,
and view-transition cases passed with one worker and retries disabled. The
initial run also passed all 24 passive-card and tall-reveal cases. Six additional
layout checks covered 320, 768, and 1440px at normal and 200% text, and native
reading navigation passed without JavaScript. Matched desktop/mobile captures
preserved all topic text and exact format markup.

Affected zero-warning lint, the current production build, and the 452-page OG
audit passed. Both resume PDFs were regenerated because Base participates in
their fingerprint, then passed freshness checks. Published changelog entries
remain unchanged. The complete workspace gate remains recorded at `16b66665`;
this follow-up received the scoped integration checks above.

## Imported article Code folio follow-up

Approved source `102138ea` renders the three imported accessibility-guide examples
through the shared Code folio pipeline. Literal source, complete filenames,
descriptive region labels, copy feedback, and overflow guidance are preserved.
Imported notation comments stay literal and cue IDs are assigned across the
assembled page. Markdown keeps its existing highlighting options, and the shared
line-number gutter now accommodates two-digit numbers. No dependency or client
controller was added. The patch note is folded into 5.0.0.

All 914 unit tests and 36 scoped Chromium/WebKit code, copy-feedback, tab, and
guide-content cases passed with retries disabled. Four rendered checks covered
mobile and desktop in both themes with exact imported source, complete filenames,
zero accessibility violations, no horizontal page overflow, and no runtime errors.
Before-and-after captures were reviewed. The temporary accessibility harness was
adjusted to use an explicit browser context as required by axe; application code
did not need a repair.

Affected lint passed with zero warnings, the current production build and
452-page OG audit passed, and both resumes were regenerated for the shared prose
stylesheet change before passing freshness checks. Published changelog entries
remain unchanged. The last complete workspace gate remains `16b66665`; navigation
was subsequently validated with 134 cases at `822f788a`.

## Speaking Outcome captions follow-up

Approved source `a4fdca0d`, based on `822f788a`, adds Good fit purpose notes and
native planning links to all four Speaking format cards. Every link reaches the
existing booking brief in the same tab. Complete format text and exact topic
markup are preserved, with no contact launch or automatic format selection. The patch
note is folded into 5.0.0.

All 38 scoped Chromium/WebKit Speaking and tall-reveal cases passed with retries
disabled. Six reflow checks covered 320, 768, and 1440px at normal and 200% text,
retaining usable link targets without clipping or page overflow. Native booking
navigation reached the visible brief without JavaScript. Matched mobile/desktop
captures in both themes were reviewed against the previous complete card copy.

Affected lint passed with zero warnings, the current production build and
452-page OG audit passed, and PDF freshness passed without regeneration. The
cumulative built-page audit passed across 1,740 documents and 8,129 local targets
with zero errors. Published changelog entries remain unchanged. This focused
iteration used scoped checks; the full workspace gate remains `16b66665`.

## Speaking Contact captions follow-up

Approved source `40af504d`, based on `351fbce2`, adds a full-width Message on
WhatsApp action for quick introductions and a quiet Connect on LinkedIn action
for a fuller brief. Both use protected new tabs. The complete prompt, three
session notes, WhatsApp briefing URL, and topic/format markup remain unchanged.
The patch note is folded into 5.0.0.

All 30 scoped Chromium/WebKit Speaking cases passed with retries disabled. Six
reflow checks covered 320, 768, and 1440px at normal and 200% text; both contacts
remained available without JavaScript. Matched mobile/desktop captures in both
themes verified the preserved content and URL, usable targets, and no clipping.

The source's booking-jump test now brings its starting card into view before
keyboard focus. All destination assertions remain intact. Its earlier isolated
offscreen failure was not reproduced in ten integration diagnostics that retained
the original outline and focus assertions and recorded 90 rendered frames per
run. Every run ended with the complete heading visible at 111.625px. No shared
navigation runtime was changed for this iteration.

Affected lint passed with zero warnings, the current production build and
452-page OG audit passed, and PDF freshness passed without regeneration.
Published changelog entries remain unchanged. This follow-up uses scoped checks;
the full workspace gate remains `16b66665`.

## Article Example fold follow-up

Approved source `285a94b2`, based on `351fbce2`, folds standalone article code
longer than 24 lines into a 12-line preview and native disclosure. Trailing blank
lines do not affect the threshold. Copy always retains the complete source;
expanded and preview regions have separate Lumen scroll cues. Preview clones
remove IDs and descriptions to preserve unique fragment targets. Short snippets,
package-manager tabs, and project code retain their existing behavior. No client
controller or dependency was added. The patch note is folded into 5.0.0.

All 13 affected unit tests and all 42 Chromium/WebKit disclosure, imported-code,
copy-feedback, scroll-cue, and guide-content cases passed with retries disabled.
Eight rendered checks covered collapsed and expanded states at mobile and desktop
widths in both themes, with no accessibility violations, page overflow, or runtime
errors. Matched before-and-after captures were reviewed. Independent print checks
confirmed that all 27 lines of the closed Markdown example were painted in both
browsers, while the summary and duplicate preview remained hidden. WebKit's native
visibility check and the rendered image agree, unlike Playwright's closed-details
visibility heuristic.

Affected lint passed with zero warnings. The current production build started with
content-cache cleanup and passed the 452-page OG audit. Both resume PDFs were
regenerated for the shared prose stylesheet change and passed freshness checks.
Published changelog entries remain unchanged. This iteration received scoped
checks; the complete workspace gate remains recorded at `16b66665`.

## Related article Reading rows follow-up

The approved `44106dd9` reuses `PostsGallery` with its existing chapter layout
for article recommendations, without sequence labels. Topic context, article
selection, complete card text, metadata, and native destinations remain intact.
The change adds no shared CSS or component. Its patch note is folded into 5.0.0.

All 22 scoped Chromium/WebKit fresh-recommendation and related-writing-header
cases passed with retries disabled. Sixteen additional rendered cases covered
320, 390, 768, and 1440px in both themes at normal and 200% text. Exact article
text and URLs matched the previous layout, with no sequence labels, clipping,
horizontal overflow, or runtime errors. Matched desktop/mobile captures were
reviewed. Affected lint passed with zero warnings, the current production build
and 452-page OG audit passed, and PDF freshness passed without regeneration.
The complete workspace gate remains recorded at `16b66665`; this visual
iteration received scoped integration validation.

## Speaking Brief first follow-up

Approved source `c80bc99b`, based on `abff330f`, leads the hero with one native
Plan a session link to the booking heading. A quiet caption explains that the
brief comes before choosing WhatsApp or LinkedIn. The complete headline,
description, traits, speaker profile, and booking markup remain unchanged.
The patch note is folded into 5.0.0; no client controller was added.

All 30 Chromium/WebKit behavior and accessibility cases passed with retries
disabled, including both motion preferences, keyboard activation, preserved
document identity, and the next focus target in the booking card. Six reflow
checks covered 320, 768, and 1440px at normal and 200% text. The native fragment
and both contact choices also worked with JavaScript disabled. Four matched
mobile/desktop captures in both themes verified unchanged content and no page
overflow.

The two initial desktop screenshot comparisons detected obsolete hero actions
and an earlier navigation layout. The approved current rendering was reviewed,
and all four desktop/mobile browser references were regenerated. The snapshot
test now checks the new hero action and waits for visible animations before
capture. Chromium, desktop WebKit, and Mobile Chrome comparisons are supported by
reviewed captures. Mobile Safari also rendered the correct invitation in an
independent native browser capture, but its automated comparison accepted an old
reference during a negative control. Its reported pass is not counted as reliable
visual regression evidence; the manually reviewed capture is the evidence for
that viewport. No product behavior was changed to accommodate this test limitation.

Affected lint passed with zero warnings. The current production build, 452-page
OG audit, archive assembly, and PDF freshness check passed without regenerating
the PDFs. Published changelog entries remain unchanged. This iteration uses
scoped checks; the complete workspace gate remains recorded at `16b66665`.

## Speaking Chapter guide follow-up

Approved source `9f366a47`, based on `70738ea3`, adds a native Chapter guide below
the statistics. Topics, Formats, History, and Community link to their section
headers; Community is included only when its section exists. The guide uses Lumen
links with visible keyboard focus and becomes full-width rows on narrow screens.
Existing community and booking fragments remain intact. The patch note is folded
into 5.0.0; no client controller or shared component was added.

All 36 scoped Chromium/WebKit Speaking cases passed with retries disabled,
including keyboard navigation to each chapter with both motion preferences and
preserved document identity. Six reflow checks covered 320, 768, and 1440px at
normal and 200% text, with sequential focus and usable targets. All four chapter
links also worked without JavaScript.

Four matched mobile/desktop captures in both themes preserved the hero,
statistics, cards, timeline, community, and booking markup. The comparison removes
only temporary reveal-binding attributes, revealed-state classes, and stagger
indices; their asynchronous initialization caused an initial comparison mismatch
without changing authored content. This correction affects the capture harness
only.

Affected lint passed with zero warnings. The production build, 452-page OG audit,
archive assembly, and PDF freshness checks passed. The cumulative built-page
audit passed across 1,740 documents and 8,129 local targets with zero errors.
Published changelog entries remain unchanged. This iteration uses affected checks;
the complete workspace gate remains recorded at `16b66665`.

## Article Checklist ledger follow-up

Approved source `8cad698e`, based on `abff330f`, reuses the project ledger composer
for labeled article lists inside checklist sections. Every transformed item must
have a bold label and an explanation. Ordinary lists, plain or mixed checklists,
nested lists, and component content keep their existing composition. Native list
numbering, authored punctuation, links, code, paragraphs, and project behavior
remain intact. The patch note is folded into 5.0.0; no runtime was added.

All 19 affected unit tests and 46 Chromium/WebKit article and project cases passed
with retries disabled. The browser checks cover narrow and wide layouts, both
themes, normal and 200% text, native semantics, keyboard focus, and no-JavaScript
content. Four matched mobile/desktop captures in both themes passed scoped
accessibility scans with no violations or horizontal overflow and were reviewed
against the preceding rendering.

Affected lint passed with zero warnings. The production build started with
content-cache cleanup, passed its 452-page OG audit, and assembled all four
archives. Both resume PDFs were regenerated for the shared prose stylesheet and
passed freshness checks. Published changelog entries remain unchanged. This
iteration uses scoped checks; the full workspace gate remains `16b66665`.

## Runtime reliability follow-up

Source `0ac266c9` bounds comments initialization to fifteen seconds, exposes the
existing GitHub recovery link on failure, and allows a late widget to recover.
Navigation clears pending deadlines and ignores events from abandoned articles.
Header and footer links distinguish the exact current page from its parent
section while retaining visible active markers in both themes and forced colors.

The shared post loader rejects duplicate published URLs with every conflicting
entry ID. Remote sitemap requests delay retries for temporary failures and fail
immediately on permanent HTTP errors while preserving the original error context.
The patch note is folded into unpublished 5.0.0 and the resume PDFs are regenerated
from the combined release sources.

Regression coverage includes delayed and silent widgets, repeated initialization
deadlines, article navigation, keyboard access, enlarged text, both browser
engines, both themes, content filtering, and bounded network retries. The local
integration refreshes the complete workspace gate without publishing the release.

## Speaking Resource captions follow-up

Approved source `0b1f73a4`, based on `3d0f6bb5`, clarifies the available resources
in each Speaking history entry. Event / View record, Slides / Open deck, and
Recording / Watch talk use public Lumen links with protected new tabs and visible
keyboard focus. Equal desktop columns become ruled rows on narrow screens. Entries
without public resources retain only their topics. The patch note is folded into
5.0.0; no client controller or dependency was added.

All six scoped Chromium/WebKit history, resource, and accessibility cases passed
with retries disabled. Six reflow and keyboard checks covered 320, 768, and 1440px
at normal and 200% text. All ten resource links retained their exact destinations,
labels, and protected new tabs without JavaScript. Four matched mobile/desktop
captures in both themes preserved all eight session bodies, dates, evidence,
topics, and resource URLs, without horizontal overflow.

Affected lint passed with zero warnings. The production build, 452-page OG audit,
archive assembly, and PDF freshness check passed without regenerating the PDFs.
Published changelog entries remain unchanged. The complete workspace gate was
refreshed by the preceding reliability integration at `3d0f6bb5`, with 958 unit
tests, 126 browser checks, and seven motion checks recorded in its validation
report. This visual follow-up uses the affected checks above.

## Footer Sculpted lift follow-up

Approved source `c580a6da`, based on `391733d0`, adds Sculpted lift feedback to
the existing footer invitation. The WhatsApp tile and its backing sheet move
independently; the email link gains an accent underline. Keyboard focus receives
the same feedback, and reduced motion keeps the links and arrows stationary.
Content, destinations, protected new tabs, and resting layout remain intact.
The patch note is folded into 5.0.0.

Integration adds a transparent 4px extension to preserve the original right and
bottom hit areas during the 3px lift, including the 1px border. Both browsers
reproduced missed edge hits without the fix and retained hover for 90 frames with
it. The regression test covers both original edges. All 16 affected Chromium and
WebKit footer cases passed; two initial Chromium accessibility scans timed out
during concurrent validation and passed unchanged on a serial rerun in 5.6s.
No-JavaScript destinations and keyboard focus passed in both engines. Eight matched
mobile/desktop rest and hover captures in both themes preserved content, links,
and resting geometry without overflow; representative pairs were visually reviewed.

Affected zero-warning lint, the production build, 452-page OG audit, archive
assembly, and regenerated PDF freshness checks passed. Published changelog entries
remain unchanged. The installed Chrome application timed out launching, so these
checks used the already-installed Playwright Chromium 153 and WebKit. The complete
workspace gate remains `3d0f6bb5`; this interaction follow-up uses scoped checks.

## Article Natural headings follow-up

Approved source `1817b206`, based on `391733d0`, removes the decorative heading
rule below 32rem of article prose width and uses manual hyphenation. Ordinary
words now remain whole where space allows; emergency wrapping still accommodates
long tokens. Desktop typography and its trailing rule remain intact, as do authored
text, fragments, native contents navigation, and the existing 44px copy controls.
Code example headers retain their existing design. The patch note is folded into
5.0.0; no controller or dependency was added.

All 32 affected Chromium/WebKit heading and section-reference cases passed with
retries disabled, including normal and enlarged text, both themes, clipboard
success and failure, page transitions, formatted headings, MDX, and no-JavaScript
navigation. Twelve rendered checks covered both engines at 320, 390, and 1440px in
both themes, with no scoped accessibility violations or horizontal overflow.
Matched mobile and desktop heading captures were reviewed against the preceding
release; the desktop rendering is retained and mobile words no longer split merely
to reserve room for the decorative rule.

Affected zero-warning lint and documentation spelling passed. The production
build, 452-page OG audit, archive assembly, and regenerated PDF freshness checks
passed. Published changelog entries remain unchanged. The preceding footer
integration also passed the canonical current-site lint command; the latest full
workspace gate remains `3d0f6bb5`.

## Article Fold return follow-up

Approved source `163c529d`, based on `1817b206`, adds a Lumen Button and Icon at
the bottom of expanded long article examples. It shares the existing scroll-cue
footer, closes only its own native disclosure, and immediately returns focus and
the viewport to the original summary below the sticky header. Initialization is
idempotent on Astro navigation. Native disclosure remains available without
JavaScript; the enhanced footer is hidden in print. Original headers, complete
source copying, and 12-line previews are preserved. The patch note is folded into
5.0.0; no dependency was added.

All 36 affected Chromium/WebKit fold, imported-code, and scroll-cue cases passed
with retries disabled. They cover both motion preferences, keyboard focus return,
independent disclosures, repeated initialization, enlarged text, clipboard success
and failure, navigation, no-JavaScript behavior, and complete print output.
Four matched mobile/desktop captures in both themes passed scoped accessibility
scans with no violations or horizontal overflow. Code headers, source content,
and copy values matched the preceding release across all four article examples;
representative before/after captures were visually reviewed.

Affected zero-warning lint, documentation spelling, the production build,
452-page OG audit, archive assembly, and PDF freshness check passed. No PDF
regeneration was needed. Published changelog entries remain unchanged. This
follow-up uses affected checks; the latest full workspace gate remains `3d0f6bb5`.

## Blog Reading paths follow-up

Approved source `05f84625`, based on `d17f76af`, organizes the Blog opening around
the primary writing action and two captioned native Lumen links for topics and
series. Collection-derived counts remain visible. Supporting links form equal
columns and stack below 26rem of intro width, with visible keyboard focus and
reduced-motion support. The headline, description, latest feature, three routes,
feed, and subsequent archive pages retain their existing content and behavior.
The patch note is folded into 5.0.0; no controller or dependency was added.

All 16 affected Chromium/WebKit cases passed with retries disabled. Coverage
includes native keyboard navigation, no-JavaScript routes, 320/390/768/1440px
layouts at normal and 200% text, reduced motion, the latest-preview/feed contract,
and full-page light/dark accessibility scans. Eight matched responsive/theme
captures preserved the exact headline, description, latest feature markup, and
destinations; only generated Astro style identifiers were normalized for markup
comparison. Representative mobile/desktop pairs were visually reviewed. The
desktop feed screenshots were byte-identical before and after the change.

Affected zero-warning lint, documentation spelling, the production build,
452-page OG audit, archive assembly, and PDF freshness check passed without PDF
regeneration. Published changelog entries remain unchanged. This follow-up uses
affected checks; the latest full workspace gate remains `3d0f6bb5`.

## Article Copy recovery follow-up

Approved source `c1c67a85`, based on `d17f76af`, listens to Lumen's existing public
copy-error and copy-success events for standalone article Code folios. Failed
copying exposes a persistent Lumen Select code action. That explicit action opens
folded examples, focuses their complete code region, and uses native Range
selection without line numbers or the duplicate preview. A successful retry
removes recovery; manual selection does not claim clipboard success. Code tabs,
projects, native no-JavaScript reading, and complete print output retain their
existing behavior. The failure label also gains a semantic danger/ink color mix
to correct its contrast. The patch note is folded into 5.0.0.

All 48 affected Chromium/WebKit recovery, copying, and fold cases passed with
retries disabled. Coverage includes missing and denied clipboard access, persistent
guidance after timed feedback resets, successful retries, short/folded/imported
source selection, keyboard focus, repeated initialization, both themes, enlarged
text at 320/1440px, print, and no-JavaScript behavior. Four matched mobile/desktop
failure states in both themes passed scoped accessibility scans with no violations
or horizontal overflow. Headers, complete source, and copy values matched the
preceding release across all four article examples. Representative before/after
captures were visually reviewed.

Affected zero-warning lint, documentation spelling, the production build,
452-page OG audit, archive assembly, and regenerated PDF freshness checks passed.
Published changelog entries remain unchanged. This follow-up uses affected checks;
the latest full workspace gate remains `3d0f6bb5`.

## Blog Topic guide follow-up

Approved source `0ad5ed06`, based on `0c181f39`, adds a Browse by topic caption and
collection-derived catalog link to the Blog and topic archive chooser. Readable
presentation labels retain the original slug destinations. Inactive tags gain a
soft accent wash, filled count compartment, underline, and lower shadow on hover
or keyboard focus. Their hit areas remain stationary; selected tags retain their
existing colors. Reduced motion disables transitions. Other shared SculptedTag
consumers and the existing focus/scroll restoration controller are unchanged.
The patch note is folded into 5.0.0.

All 17 affected tag utility tests passed. All 36 scoped Chromium/WebKit cases
passed with retries disabled, covering stable hover edges, equivalent keyboard
feedback, accessibility while hovered, reduced motion, 320–1440px layouts at
normal and 200% text, native no-JavaScript links, current-page semantics, and
focus/scroll restoration. The latter includes six rapid-navigation lifecycle
checks that exercise cancellation and repeated destinations.

Eight matched rest/hover captures across mobile/desktop and both themes preserved
hero content, article markup, filter order, raw URLs, counts, and current states.
Representative before/after pairs were visually reviewed. Affected zero-warning
lint, documentation spelling, the production build, 452-page OG audit, archive
assembly, and PDF freshness check passed without PDF regeneration. Published
changelog entries remain unchanged. This follow-up uses affected checks; the
latest full workspace gate remains `3d0f6bb5`.

## Article Print edition follow-up

Approved source `b34b82b4`, based on `17948214`, adds article-only print styles.
The paper layout retains the title, description, author, dates, prose,
illustrations, complete examples, and canonical source link. Code folios keep
their editor frame, filename, light syntax colors, blank lines, and source line
numbers while wrapping long lines. Web controls and decorative covers are hidden
in print; screen behavior and source/clipboard text are preserved. Other page
types retain their existing print styles. The patch note is folded into 5.0.0.

All 42 affected Chromium/WebKit print, fold, and copy cases passed with retries
disabled. Coverage includes both themes, complete folded/imported examples,
source and clipboard preservation, selected package-manager commands, tables,
no-JavaScript output, an open illustration viewer, and restoration of screen
controls. Two additional browser diagnostics verified that an open site search
does not print and that real client navigation to Work removes article-specific
print behavior without a document reload.

All nine pages of an actual A4 PDF were visually reviewed. Rendered pages and
extracted text were identical between light- and dark-theme exports. Matched
mobile captures in both themes and the desktop light capture were pixel-identical
to the preceding release after waiting for paint. The initial desktop dark
baseline had captured the cover before it loaded; a fresh fully loaded capture
was visually reviewed, with differences confined to that image region. No
production fix was required by these checks.

Affected zero-warning lint, documentation spelling, the production build,
452-page OG audit, archive assembly, and regenerated PDF freshness checks passed.
Published changelog entries remain unchanged. This follow-up uses affected checks;
the latest full workspace gate remains `3d0f6bb5`.

## Smooth arrow exchange integration

Approved source `dd079e8d` includes `f3627c15` and combines the selected 480ms
arrow exchange with the preceding v5 release. Two decorative Lumen icons move
on one track inside the existing arrow footprint. Hover and keyboard focus keep
labels and button geometry stationary; touch hover and reduced motion remain
still. Existing directions, destinations, surfaces, and focus outlines remain.

On the combined tree, all 52 affected Chromium/WebKit arrow, print, fold, and
copy cases passed without retries. Four matched homepage captures across mobile,
desktop, and both themes were pixel-identical at rest; representative pairs were
visually reviewed. The source branch separately passed its full workspace gate
with 966 unit tests, seven motion checks, and all build/page audits.

Affected zero-warning lint, production build, 452-page OG audit, archive assembly,
and regenerated PDF freshness passed here. Changelog conflicts retain both print
and arrow notes; generated PDF conflicts were resolved by regeneration from the
combined source. Published notes remain unchanged.

## Keyboard navigation and archive boundary integration

Ready source `57f800ba` includes `6d511824`. Cross-page fragments preserve their
native sequential focus starting point; ordinary navigation and missing or
malformed fragments retain the main-content fallback. The user-approved search
shortcut is now Control/Command+K, with matching visible and accessible labels.
Bare slash remains available to the page. Modal image viewers keep their shortcut
boundary. Detailed article/case-study routes join the full Lighthouse config,
and deployment documentation clarifies build-time publication eligibility.

Archive finalization marks absolute same-origin exits for full document loads
and adds immutable caching only to content-hashed archive assets. Audits and
regression tests enforce both boundaries. The source review reproduced document
reuse; it did not reproduce the hypothesized final-theme corruption or runtime
exception. Frozen archive source files and all package versions remain unchanged.

The combined tree passed `pnpm run lint:current` with zero warnings,
`VITEST_MAX_WORKERS=2 pnpm test` with 984 tests, and `pnpm run check:current`
with zero errors, warnings, or hints. The canonical `pnpm run build` rebuilt all
five apps: the OG audit covered 452 pages, archive checks covered 1,288 pages,
and the built-page audit covered 1,740 documents and 8,131 local targets with
zero errors. Generated PDF conflicts were resolved by regeneration, and
`pnpm run check:cv` passed. All five resume PDF pages rendered identically to
the preceding release. Both pending Changesets are folded into unpublished
5.0.0; published changelog entries remain unchanged.

All 610 selected Chromium/WebKit cases passed with two workers and retries
disabled. They cover fragment and history navigation, modifier shortcuts, search
recovery/caching, modal viewers, header accessibility/reflow, home interactions
and snapshots, view transitions, archive keyboard/reflow/exit behavior, and the
integrated arrow, print, fold, and copy changes. Two additional print diagnostics
also passed after the search label change. No tests were excluded from the
selected files.

Four matched homepage captures preserved mobile pixels exactly. Desktop
differences were confined to the expected search hint and navigation spacing;
the rendered result was reviewed. The nine-page article PDF was refreshed for
its imported search examples. Only the two updated shortcut-label lines changed
in the page raster comparison; those pages were reviewed, and both theme
exports retained identical text. This integration uses affected validation on
top of the independently recorded source workspace gates.
