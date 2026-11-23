# Release checklist

One page for the release in flight. The [deployment runbook](deployment.md) explains each step;
evidence from earlier releases lives in [`docs/archive/`](archive/README.md). Record new evidence in the
pull request rather than growing a log here.

## Current release: v5.4.0

Published v5.3.0 is the base. `release/v5.4.0` adopts published Quality v2,
committed-source shadow impact plans, and archive caching with explicit clock,
runtime and Git-history inputs. Full release, security and deployment gates remain.
The minor Changeset has been consumed with `pnpm run version-packages`; package
metadata and the generated changelog now declare v5.4.0. The GitHub Release
workflow creates the tag and release from the merged `main` commit.

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

- [ ] Push the completed `release/v5.4.0` revision and open its pull request into `main`.
  The **Quality gate** check covers static checks, the production build, six
  Chromium browser shards and Lighthouse.
- [ ] Run **E2E Matrix (Weekly/Manual)** once for Firefox, WebKit and the mobile projects.
- [ ] Resolve review findings and required checks on the pull request revision.

### Merge and deploy

- [ ] Record the current healthy Cloudflare production deployment ID and its source
  commit before merging, so v5.4.0 can be rolled back without moving published tags.

- [ ] Add the `CLOUDFLARE_DEPLOY_HOOK_URL` repository secret so scheduled publishing can deploy
  due posts (see [deployment](deployment.md)), and install the Renovate GitHub app (see
  [dependency security](dependency-security.md)).
- [ ] Merge once into `main`; Cloudflare Pages deploys it. Follow [reviewed deployment](deployment.md#reviewed-deployment).
- [ ] Merge the **Release** workflow's `chore(release): version website` pull request if one opens,
  then confirm the `v5.4.0` tag and GitHub Release point to the merged version commit.

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
