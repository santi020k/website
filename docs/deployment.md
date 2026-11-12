# Deployment Runbook

## Deployment target

- **Host**: [Cloudflare Pages](https://pages.cloudflare.com/) — static asset publishing with global edge cache.
- **Output**: Static site from `pnpm run build` (published under `dist/`).
- **Production domain**: `https://santi020k.com`
- **Redirect**: `www.santi020k.com` → apex `https://santi020k.com` (configure at your DNS or CDN).

Redirects, cache headers, and security headers are versioned in the repo:

- [`public/_redirects`](../public/_redirects) defines retired-route and historical technology aliases.
  The build combines these with current technology labels in `dist/_redirects`.
- [`public/_headers`](../public/_headers) handles cache and security headers.

Cloudflare Pages picks both files up at the edge automatically. The header defaults include:

- **Content-Security-Policy**: allows the configured Giscus, Webmention, Buttondown, and optional Cloudflare Web Analytics integrations. The analytics beacon is emitted only in production with `CLOUDFLARE_WEB_ANALYTICS_TOKEN` set at build time.
  [`public/_headers`](../public/_headers) lists `'unsafe-inline'` for scripts only as the source
  policy for the archived sites (`/v1/`–`/v4/`), which use inline event handlers. After
  `astro build`, [`scripts/js/apply-script-policy.mjs`](../scripts/js/apply-script-policy.mjs)
  hashes every inline script of the current site and writes the same `script-src` (the header's
  script origins plus those hashes, without `'unsafe-inline'`) in two places: one
  `<meta http-equiv="Content-Security-Policy">` per page and the `/*` rule of `dist/_headers`.
  Archive assembly then gives each `/vN/*` rule `! Content-Security-Policy` followed by the source
  policy, so archived pages keep working. Cloudflare ignores `_headers` lines over 2,000
  characters; the build fails before the policy line grows past that. Only
  hashed inline scripts run. Every page gets the same list because `<ClientRouter />` swaps pages into
  the first document; when the next page carries a different policy (a new deployment or an
  archive), the router loads it as a full document instead. The build fails if a current page uses
  an inline event handler or a `javascript:` URL, which no hash can allow.
  After a swap, Astro's router appends an empty `data:application/javascript,` module to wait for
  inline module scripts. Neither policy allows `data:` scripts, so the console reports that one
  blocked load when the last new module script on the page is inline, as on `/blog/`. The module is
  empty and the router treats its error like a load, so pages keep working.
- **Permissions-Policy**: `camera=(), geolocation=(), microphone=(), payment=(), usb=()`
- **Referrer-Policy**: `strict-origin-when-cross-origin`
- **Strict-Transport-Security**: `max-age=31536000; includeSubDomains; preload`, so browsers keep
  using HTTPS for a year on `santi020k.com` and every subdomain. On November 12, 2026 the project
  hosts in the cross-site sitemap all redirected HTTP to HTTPS. Every future `*.santi020k.com`
  host must serve HTTPS from its first day. The header only makes the domain eligible: submit it
  at <https://hstspreload.org/> to enter browser preload lists, which is slow to undo.
- **Cross-Origin-Opener-Policy**: `same-origin`, so pages opened from the site get no handle on it.
- **X-Content-Type-Options**: `nosniff`
- **`/_astro/*`** → 1 year `immutable`.
- **`/v1/_astro/*` through `/v4/_astro/*`** → 1 year `immutable`, added by archive assembly.
- **`/fonts/*`** and **`/og/manifest.json`** → browser revalidation.
- **`/og/*.webp`** → 1 year `immutable`.
- **`/sw.js`** → `Cache-Control: public, max-age=0, must-revalidate` so service worker updates propagate.
- **HTML / `/feed.xml` / `/feed.json` / `/sitemap*.xml`** → `CDN-Cache-Control: s-maxage=3600, stale-while-revalidate=86400` so the edge stays fresh while keeping browser caches conservative.

Editing those defaults: update [`public/_headers`](../public/_headers) and [`public/_redirects`](../public/_redirects) directly. Do not maintain a separate `vercel.json` — the project no longer targets Vercel.

### Redirect validation and canonical hosts

The redirect generator places all exact paths before wildcard and placeholder rules,
preserving order within each group. Cloudflare treats every rule after the first
dynamic rule as dynamic, even when its path is exact. The generator fails on more
than 2,000 static or 100 dynamic rules, overlong lines, duplicate sources, invalid
rules, or missing local destinations. This prevents a successful build from
silently losing later redirects at the edge. See the
[Cloudflare Pages redirect limits](https://developers.cloudflare.com/pages/configuration/redirects/).

Withdrawn project and article URLs redirect permanently to the current `/projects/`
and `/blog/` indexes. Their exact aliases include both trailing-slash forms and
the removed v3 archive paths. Retired identifiers remain only where needed for
redirect compatibility and validation, without restoring withdrawn content.

Domain and protocol redirects belong in Cloudflare zone rules; Pages `_redirects`
does not support an absolute source URL. For the `santi020k.com` zone:

- Keep HTTPS enforcement enabled for the apex.
- Route `www.santi020k.com` through a proxied DNS record and configure a Single
  Redirect matching `http.host eq "www.santi020k.com"`.
- Use a dynamic destination `concat("https://santi020k.com", http.request.uri.path)`,
  status **301**, and **Preserve query string**. Apply it to both HTTP and HTTPS.
- Verify the apex is excluded from the rule to avoid a redirect loop. Keep the
  previous DNS record and rule configuration available for rollback.

DNS and zone-rule edits require separate production authorization. After an
authorized deployment or host change, check the status and `Location` header for
`https://www.santi020k.com/about/?source=redirect-check`, the HTTP equivalent,
`/technologies/GCP/`, `/technologies/React.js/`, `/technologies/React/`, and
`/technologies/CI/CD/`. Each should reach its current HTTPS canonical page without
a 404 or a loop. Local Astro preview does not execute Cloudflare's redirect file.

## Release flow

### Future-dated content

`publishDate` is evaluated during the static build. Reaching that date does not
change the deployed site by itself, and this repository does not configure a
scheduled production rebuild. A future-dated post becomes eligible for the next
authorized deployment after its publication time; it is not a publishing timer.
Plan that deployment through the release flow below, then verify the article,
its feed entry, and sitemap entry in production. Adding automatic deployment
triggers or shared deploy-hook secrets requires separate authorization.

### Reviewed deployment

The site uses GitHub Flow and has one production branch:

1. Create a feature or fix branch from the active release branch. Use `main` for standalone work.
2. Integrate finished work into the release branch and open its pull request into `main`.
   GitHub Actions validates the pull request:
   - Astro Doctor
   - lint, Astro type-check, Markdown/content checks, and spellcheck
   - dependency audit and unit tests
   - production build, stable Chromium E2E, and Lighthouse assertions
   Path filters select the required jobs. The browser and Lighthouse jobs reuse the production build.
3. Merge the approved pull request once. Cloudflare Pages deploys `main`;
   GitHub Actions does not repeat the pull-request suite after the merge.
4. Confirm the Cloudflare Pages production deployment completed successfully.
5. Smoke-check key routes in production:
   - `/`
   - `/blog/`
   - `/portfolio/`
   - `/projects/`
   - `/travel/`
   - `/sitemap.xml`
   - `/feed.xml`
   - `/offline/`

Protect `main` in the GitHub repository settings. Require a pull request and the
`Quality gate` status check before merging. The
[release checklist](release-checklist.md) names the active branch and the checks
required for its pull request.

Website versions and GitHub Releases are managed with Changesets:

1. Run `pnpm changeset` in a pull request that should produce a release, choose
   the semantic version impact, and commit the generated Markdown file.
2. After one or more changesets reach `main`, the **Release** workflow opens or
   updates a single `chore(release): version website` pull request.
3. Review and merge that pull request. Changesets updates `package.json` and
   `CHANGELOG.md`; the workflow then creates the matching `vX.Y.Z` tag and
   GitHub Release from that exact `main` commit.

The pinned Changesets action takes its authentication token through the `github-token`
input, including the existing `CHANGESETS_TOKEN` fallback. It supplies that token to the
version script itself; a separate `GITHUB_TOKEN` environment override can conflict with
its input. With the default token, GitHub creates release pull-request checks in an
approval-required state; a repository writer must choose **Approve workflows to run**.
The existing custom-token path can start these checks without that approval. See
[GitHub token workflow behavior](https://docs.github.com/en/actions/concepts/security/github_token#when-github_token-triggers-workflow-runs).

The release concurrency group preserves the active run but uses GitHub's default single
pending slot. A newer push can replace a pending version-bump run. If that happens, or
if a release run fails, rerun the original **Release** run for the merged version-bump
commit after resolving the cause.
That preserves its original before/after version comparison and tag provenance. A fresh
manual dispatch only processes pending Changesets; it does not recreate the skipped
push-based version detection. Never move an existing version tag to a later commit.
See the [Changesets token input](https://github.com/changesets/action/tree/ae32849d5ba541f9ae29e40e22a623bc13562f51#inputs)
and [GitHub concurrency policy](https://docs.github.com/en/actions/how-tos/write-workflows/choose-when-workflows-run/control-workflow-concurrency).

Documentation, test, and CI-only pull requests do not need a changeset unless
they should appear in a release. GitHub Releases remain deployment markers, not
a second deployment gate, and the workflow never publishes the private website
package to npm.

CodeQL scans pull requests and also runs monthly or on demand against the
protected default branch. The pull-request jobs stay read-only, and the
dependency audit reuses the static job's dependency installation.

CI runs for pull requests into `main` and `release/**`. The static job runs the
selected checks while the build job produces the site in parallel and uploads `dist/`
as a one-day artifact. Six stable Chromium shards and the Lighthouse job reuse that
build, so each job stays well inside its timeout. `Quality gate` reports their combined
result: it fails when any selected job fails or is cancelled and passes when a
documentation-only change skips the build-dependent jobs. Keep `Quality gate` as
the required status check.

**E2E Matrix (Weekly/Manual)** runs every browser project in six shards each
Monday against the default branch. Dispatch it manually to check another branch.
Unlike the pull request suite, which runs in Google Chrome, its Chromium projects use
Playwright's own Chromium build. Each shard has a 60-minute job limit to leave room for
browser dependency installation, with a 40-minute limit on the test step.

## Current release integration

`release/v5.2.1` builds on v5.2.0. The current site uses published Lumen 5 packages
and the santi020k theme. The historical sites retain their pinned Lumen versions,
including Lumen 4.4.0 where applicable. Install from the committed lockfile using
Node 24 and the pnpm version in `package.json`. Regenerate social cards and résumé
downloads when their inputs change.

Commit finished work into the active release branch and validate the integrated
revision. Check worktree status, commit ancestry and the resulting behavior before
bringing over older changes. Preserve source checkouts until their owners finish.
Delete a remote source branch only after confirming its intended work is in the
release and accounting for any open pull request.

Before the first push or pull request, independently review the complete release
diff against `main` and address findings. Publishing follows the GitHub
Actions and Cloudflare Pages workflow from the reviewed, merged `main` commit.
Use the rollback procedure below if production smoke checks fail.

## Pre-release local validation

- `pnpm run verify:fast` — lint, Astro type-check, content checks, unit tests, and a build. Runs on `pre-push` to keep daily pushes fast.
- `pnpm run ci:verify` — runs `verify:full`, including coverage, the production
  build, Lighthouse CI and stable Chromium. Run on the final release revision.
- `pnpm run audit` — audits production and development dependencies at moderate
  severity without a vulnerability allowlist. Any exception must document its
  exact dependency path, exposure boundary, and removal condition.

CI builds the tracked OG images and `.og-cache.json` from the checkout. Its build caches retain Astro
image transformations and the Playwright browser (see [build cache](cache-strategy.md#build-cache)).

See [dependency security follow-up](dependency-security.md) for unresolved
upstream findings and their required compatibility checks. Documenting a finding
does not waive the audit gate.

The built-page audit resolves local references using the first matching redirect before any
built file, matching [Cloudflare Pages redirect precedence](https://developers.cloudflare.com/pages/configuration/redirects/).
It checks redirect destinations and their fragments even when an old file still exists at the
source URL. Status-200 proxy rules check only their immediate local target, without following
another redirect rule.
Malformed path encoding is reported as a missing target without aborting the remaining audit.
Fragment checks try literal IDs before forgiving percent decoding, preserving valid percent signs
and Unicode fragments while still reporting missing destinations.

The full Lighthouse audit covers Home, About, Work, Projects, Portfolio, the Smith Commerce case
study, Travel, Blog, a long article with code, and Accessibility. It runs each route three times on
mobile settings and asserts on the best run: performance 0.90 or higher, largest contentful paint
under 4 seconds, total blocking time under 350 ms, layout shift under 0.1, and fewer than 4,000 DOM
elements (`dom-size-insight`).
`pnpm run lighthouse` is the faster homepage smoke audit with the same thresholds;
`pnpm run lighthouse:full` runs the full configuration.
The manual workflow uses read-only permissions and retains diagnostic artifacts.

When another checkout owns Playwright's default preview port, keep that server
running and select an unused port for the gate, for example:

```bash
PW_PREVIEW_PORT=4460 pnpm run ci:verify
```

For local cross-browser checks against the same build, use the Playwright matrix:

```bash
CI=1 SKIP_BUILD=1 pnpm exec playwright test --project=firefox --project=webkit \
  --project='Mobile Chrome' --project='Mobile Safari' --reporter=line
```

Astro also allows one preview server per checkout. Stop only your own completed
verification preview before starting the gate; an unrelated active preview must
remain intact. Do not relax server isolation to make the tests run.

Lighthouse CI writes reports beneath its working directory. Keep concurrent audits
in separate checkouts or isolated working directories so one run cannot clear or
mix another run's results.

## Rollback

If a production regression is detected:

1. Promote the previous healthy Cloudflare Pages production deployment. For a
   regression in v5.2.1, use the verified v5.2.0 deployment.
2. Re-run the release smoke checks against the restored deployment.
3. Prepare a revert or fix through a reviewed pull request and validate the
   resulting production deployment. Preserve any published version tag and use a
   new version for the corrected release.
4. Document the cause and follow-up in the incident notes.

## Build-time environment variables (Webmentions)

If the site should receive and display [Webmention.io](https://webmention.io/) mentions, set these in the environment used for **`pnpm run build`** (CI or local). Values match `.env.example`.

Mention avatars retain explicit dimensions and load lazily in the browser. Their external hosts
are deliberately excluded from build-time image optimization so an unavailable avatar cannot
fail the site build. Editorial images remain local and optimized through Astro.

| Variable | Type | Purpose |
| --- | --- | --- |
| `WEBMENTION_API_KEY` | **Secret** | Token from the Webmention.io dashboard. Build fetches `mentions.jf2` for each post. |
| `WEBMENTION_URL` | Public | `rel="webmention"` target (e.g. `https://webmention.io/santi020k.com/webmention`). |
| `WEBMENTION_PINGBACK` | Public | Optional. `rel="pingback"` URL if you want legacy pingback (e.g. `https://webmention.io/santi020k.com/xmlrpc`). |

The dashboard “Mentions Feed” (HTML/Atom) URLs are for feed readers, not for this build.

The build validates each public mention before rendering it. Malformed fields
fall back to anonymous authors or empty text; links and avatar sources accept
only absolute HTTP or HTTPS URLs. Private mentions and entries without a usable
source URL are omitted. Avatars have fixed dimensions, so rendering does not
need to fetch their dimensions from third-party hosts.

An author name made only of whitespace, C0/C1 control characters, and Unicode
default-ignorable code points (such as zero-width spaces, soft hyphens, directional
marks, or variation selectors) is treated as missing, so the mention falls back
to an anonymous author instead of a blank, unnamed link. Any other character
keeps the trimmed name exactly as sent, including invisible characters inside
it. This is a code-point check, not a rendering check: a name that uses
characters the reader's fonts draw as blank can still render empty.

Initials and reply cutoffs respect complete user-perceived characters. Placeholder avatar initials
take the first full grapheme of the name, and reply text is trimmed and capped
at 2,000 UTF-16 code units, cut back to the nearest complete grapheme without
an ellipsis. Valid mention dates accepted by the content-date parser
(ISO calendar dates, `D Mon YYYY`, and ISO timestamps) resolve to the same
instant in every build timezone: timestamps without a zone are read as UTC, and
explicit offsets keep their instant. Values it does not accept retain the runtime
`Date` fallback, including loose formats such as RFC 2822, as before.

The build reads every page of the feed (`per-page=1000`, pages `0` through
`total-pages - 1`, newest first) so like and reply counts include the public
mentions returned across pages. The API defaults to 20 rows per page. Rows repeated across
pages because a mention arrived mid-walk are dropped by `wm-id`. The whole load
per post, including response bodies, has a 12-second deadline and is bounded to 10 pages
(10,000 mentions). If any page fails, times out, reports inconsistent `paging`,
or the feed exceeds that bound, the post renders no mentions instead of a
partial list with misleading totals; the next build tries again.
The diagnostic command checks only the first page and labels its counts accordingly.
The API does not provide a snapshot across requests: a deletion during pagination
can shift rows between pages, so subsequent builds refresh the result.

Both the build and diagnostic script send the API token in the supported
`Authorization` header, keeping it out of request URLs. Target matching follows
[Webmention.io's canonical URL and redirect aliases](https://webmention.io/api#basics),
so an alias may legitimately return a different canonical `wm-target`.

### Testing Webmentions

1. **Unit tests** (mocked HTTP, no secrets): `pnpm run test:webmentions`
2. **Live checks** (reads `.env` for `WEBMENTION_*`; does not print the API key): `pnpm run check:webmentions`  
   Optional target URL: `pnpm run check:webmentions -- https://santi020k.com/blog/your-slug/`
   Supply at most one absolute HTTP(S) URL without credentials. The normalized URL
   is shared by discovery and API queries. Invalid targets fail
   before configuration is loaded or requests are sent; omitting the target checks the default post.
3. **Send a real mention**: publish any public HTML page that contains a normal link to your post URL, then use a sender that POSTs `source` and `target` to your Webmention.io endpoint (many IndieWeb tools do this automatically). [webmention.rocks](https://webmention.rocks/) exercises receivers; for end-to-end, confirm the mention appears on [webmention.io](https://webmention.io/) for your domain, then run **`pnpm run build`** locally (or redeploy) with `WEBMENTION_API_KEY` set — mentions are embedded at build time, not in the browser.

## Notes

- Cache policy details are documented in [`docs/cache-strategy.md`](cache-strategy.md).
- The edge cache and CSP live in [`public/_headers`](../public/_headers); redirects live in [`public/_redirects`](../public/_redirects). Changes there ship with the next deploy.

## Historical versions

The existing `pnpm run build` command now assembles the current website and the
four archive apps into `dist/`. Keep the output directory at `dist`; archives
are static subdirectories. Preserve the generated `_headers`: `/v1`, `/v2`,
`/v3`, and `/v4` and their descendants carry `X-Robots-Tag: noindex, follow`. Do not add
robots.txt exclusions for these paths. See [website history](website-history.md).
