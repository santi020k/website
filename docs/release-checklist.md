# Release checklist

One page for the release in flight. The [deployment runbook](deployment.md) explains each step;
evidence from earlier releases lives in [`docs/archive/`](archive/README.md). Record new evidence in the
pull request rather than growing a log here.

## Current release: v5.0.0

`release/v5.0.0` carries the editorial redesign, the Spanish site, and all prepared v4.1 work.
Changesets has already generated the 5.0.0 changelog; changesets added afterwards ship in the next
version. Public URLs stay compatible and visitors need no migration.

### Before the pull request

- [ ] The branch is pushed and contains `origin/main` (`git merge-base --is-ancestor origin/main HEAD`).
- [ ] `pnpm run verify:fast` passes: spelling, zero-warning lint for the site, archives and motion
  studio, type checks, Markdown/content/CV checks, unit tests, and the assembled build with its
  SEO, page and archive audits.
- [ ] `SKIP_BUILD=1 pnpm run test:e2e:ci:stable` passes against that build.
- [ ] `pnpm run lighthouse:full` meets the budgets in `.lighthouserc.json`.
- [ ] Changed social cards were regenerated with `pnpm run generate:og` on macOS, and the refreshed
  `.og-cache.json` is committed.
- [ ] Résumé PDFs are current (`pnpm run check:cv`); run `pnpm run generate:cv` after UI changes.

### Pull request

- [ ] Open `release/v5.0.0` → `main` as a draft. The **Quality gate** check covers static checks,
  four Chromium browser shards and Lighthouse.
- [ ] Run **E2E Matrix (Weekly/Manual)** once for Firefox, WebKit and the mobile projects.
- [ ] Review the complete diff against `main` before marking the pull request ready.

### Merge and deploy

- [ ] Merge once into `main`; Cloudflare Pages deploys it. Follow [reviewed deployment](deployment.md#reviewed-deployment).
- [ ] Merge the **Release** workflow's `chore(release): version website` pull request if one opens,
  then confirm the `vX.Y.Z` tag and GitHub Release.

### After deploy

- [ ] Smoke-check `/`, `/es/`, `/blog/`, an article, `/portfolio/`, a case study, `/projects/`,
  `/travel/`, `/history/`, `/v4/`, `/offline/`, `/sitemap.xml`, `/feed.xml` and `/llms.txt`.
- [ ] Responses carry `Strict-Transport-Security`; pages carry one script-policy meta tag and the
  console shows no Content Security Policy violations while navigating.
- [ ] Spanish shells of English articles answer with `noindex` and stay out of the sitemap.
- [ ] Close superseded pull requests (Dependabot #158), delete merged branches, and prune stale worktree checkouts.
- [ ] If a smoke check fails, follow [rollback](deployment.md#rollback).
