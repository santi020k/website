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

Final integration commits, validation results, and the reveal experiment decision
are recorded here after the combined candidate is checked.

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

The v4 archive's desktop-resize focus repair reuses the established v3 archive
implementation, and its 404 canonical URL points to the generated `404.html`.
The previously withdrawn branching-strategy draft and preview remain withdrawn
in the new archive too.
