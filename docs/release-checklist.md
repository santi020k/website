# Release checklist

One page for the release in flight. The [deployment runbook](deployment.md) explains each step;
evidence from earlier releases lives in [`docs/archive/`](archive/README.md). Record new evidence in the
pull request rather than growing a log here.

## Current release: v5.2.0

`release/v5.2.0` carries the published Lumen 5.0.0 upgrade, its named santi020k
theme, and deterministic product-film playback validation. Historical apps retain
Lumen 4.4.0 and their tab-scroll compatibility patch.
The minor Changeset requests 5.2.0 from the published 5.1.0 base. The normal GitHub
Release workflow generates the version bump and changelog after integration into main.
Public URLs stay compatible and visitors need no migration.

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

- [ ] Open `release/v5.2.0` → `main` as a draft. The **Quality gate** check covers static checks,
  six Chromium browser shards and Lighthouse.
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
  console shows no Content Security Policy violations while navigating, apart from the router's
  empty `data:` module (see [deployment](deployment.md#deployment-target)).
- [ ] Spanish shells of English articles answer with `noindex` and stay out of the sitemap.
- [ ] Delete the merged release branch and prune retired worktree checkouts.
- [ ] If a smoke check fails, follow [rollback](deployment.md#rollback).
