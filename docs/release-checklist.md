# Release checklist

One page for the release in flight. The [deployment runbook](deployment.md) explains each step;
evidence from earlier releases lives in [`docs/archive/`](archive/README.md). Record new evidence in the
pull request rather than growing a log here.

## Current release: v5.3.0

`release/v5.3.0` supersedes `release/v5.2.1` and builds on the `v5.2.0` integration
(`#162`). From that branch it carries the `5.2.0` version metadata and changelog,
homepage `<title>` and contact CTA label alignment, refreshed résumé PDFs and
locale-catalog fingerprint tracking, and GitHub Actions workflow dependency updates.

It adds Spanish RSS and JSON feeds, a lighter technologies index, the hashed script
policy in the response header with a separate rule for each archive,
`Strict-Transport-Security` preload and opener-isolation headers, scheduled publishing,
Renovate, catalog dependency updates,
and connected project covers with scroll-driven motion. The historical sites retain
their pinned Lumen versions and compatibility patches. Public URLs stay compatible and
visitors need no migration.

Two minor Changesets and one patch Changeset request v5.3.0 from v5.2.0. The GitHub
Release workflow generates the version bump and changelog after integration into `main`.

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

- [ ] Push `release/v5.3.0` and open its pull request into `main`; close the
  `release/v5.2.1` pull request as superseded.
  The **Quality gate** check covers static checks, the production build, six
  Chromium browser shards and Lighthouse.
- [ ] Run **E2E Matrix (Weekly/Manual)** once for Firefox, WebKit and the mobile projects.
- [ ] Resolve review findings and required checks on the pull request revision.

### Merge and deploy

- [ ] Add the `CLOUDFLARE_DEPLOY_HOOK_URL` repository secret so scheduled publishing can deploy
  due posts (see [deployment](deployment.md)), and install the Renovate GitHub app (see
  [dependency security](dependency-security.md)).
- [ ] Merge once into `main`; Cloudflare Pages deploys it. Follow [reviewed deployment](deployment.md#reviewed-deployment).
- [ ] Merge the **Release** workflow's `chore(release): version website` pull request if one opens,
  then confirm the `v5.3.0` tag and GitHub Release point to the merged version commit.

### After deploy

- [ ] Smoke-check `/`, `/es/`, `/blog/`, an article, `/portfolio/`, a case study, `/projects/`,
  `/travel/`, `/history/`, `/v4/`, `/offline/`, `/sitemap.xml`, `/feed.xml`, `/es/feed.xml` and
  `/llms.txt`.
- [ ] `curl -sI https://santi020k.com/` shows a `content-security-policy` whose `script-src` has
  hashes and no `'unsafe-inline'`; `curl -sI https://santi020k.com/v4/` shows the source policy
  with `'unsafe-inline'`, and `/v4/` menus and theme toggle still work.
- [ ] Responses carry `Strict-Transport-Security`; pages carry one script-policy meta tag and the
  console shows no Content Security Policy violations while navigating, apart from the router's
  empty `data:` module (see [deployment](deployment.md#deployment-target)).
- [ ] Translated Spanish articles and case studies are self-canonical, indexable, and in the
  sitemap; missing translations remain `noindex`. Verify Spanish social cards and search.
- [ ] Delete the merged release branch and prune retired worktree checkouts.
- [ ] If a smoke check fails, follow [rollback](deployment.md#rollback).
