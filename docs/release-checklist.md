# Release checklist

One page for the release in flight. The [deployment runbook](deployment.md) explains each step;
evidence from earlier releases lives in [`docs/archive/`](archive/README.md). Record new evidence in the
pull request rather than growing a log here.

## Current release: v5.2.0

`release/v5.2.0` upgrades the current site to Lumen 5 and its named santi020k
theme. It adds translated Spanish articles and case studies, country notebooks,
and improvements to product-film playback, image zoom and pan, and archive
navigation. The historical sites retain their pinned Lumen versions and
compatibility patches. Public URLs stay compatible and visitors need no migration.

The minor Changesets request v5.2.0 from v5.1.0. The GitHub Release workflow
generates the version bump and changelog after integration into `main`.

### Before the pull request

- [ ] The branch contains `origin/main` (`git merge-base --is-ancestor origin/main HEAD`).
- [ ] `pnpm run ci:verify` passes on the final revision, including static checks,
  coverage, the assembled production build, Lighthouse budgets and stable Chromium.
- [ ] `pnpm run audit` passes at moderate severity and above.
- [ ] Firefox, WebKit and the mobile Playwright projects pass against the same build.
- [ ] Changed social cards were regenerated with `pnpm run generate:og` on macOS, and the refreshed
  `.og-cache.json` is committed.
- [ ] Résumé PDFs are current (`pnpm run check:cv`); run `pnpm run generate:cv` after UI changes.
- [ ] A fresh independent reviewer has inspected the complete diff against `main`
  and the findings have been addressed before the first push.

### Pull request

- [ ] Push `release/v5.2.0` and open its draft pull request into `main`.
  The **Quality gate** check covers static checks, the production build, six
  Chromium browser shards and Lighthouse.
- [ ] Run **E2E Matrix (Weekly/Manual)** once for Firefox, WebKit and the mobile projects.
- [ ] Resolve review findings and required checks on the pull request revision.

### Merge and deploy

- [ ] Merge once into `main`; Cloudflare Pages deploys it. Follow [reviewed deployment](deployment.md#reviewed-deployment).
- [ ] Merge the **Release** workflow's `chore(release): version website` pull request if one opens,
  then confirm the `v5.2.0` tag and GitHub Release point to the merged version commit.

### After deploy

- [ ] Smoke-check `/`, `/es/`, `/blog/`, an article, `/portfolio/`, a case study, `/projects/`,
  `/travel/`, `/history/`, `/v4/`, `/offline/`, `/sitemap.xml`, `/feed.xml` and `/llms.txt`.
- [ ] Responses carry `Strict-Transport-Security`; pages carry one script-policy meta tag and the
  console shows no Content Security Policy violations while navigating, apart from the router's
  empty `data:` module (see [deployment](deployment.md#deployment-target)).
- [ ] Translated Spanish articles and case studies are self-canonical, indexable, and in the
  sitemap; missing translations remain `noindex`. Verify Spanish social cards and search.
- [ ] Delete the merged release branch and prune retired worktree checkouts.
- [ ] If a smoke check fails, follow [rollback](deployment.md#rollback).
