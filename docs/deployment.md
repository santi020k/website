# Deployment Runbook

## Deployment target

- **Host**: [Cloudflare Pages](https://pages.cloudflare.com/) — static asset publishing with global edge cache.
- **Output**: Static site from `pnpm run build` (published under `dist/`).
- **Production domain**: `https://santi020k.com`
- **Redirect**: `www.santi020k.com` → apex `https://santi020k.com` (configure at your DNS or CDN).

Redirects, cache headers, and security headers are versioned in the repo:

- [`public/_redirects`](../public/_redirects) handles canonical domain redirects and retired-route fallbacks.
- [`public/_headers`](../public/_headers) handles cache and security headers.

Cloudflare Pages picks both files up at the edge automatically. The header defaults include:

- **Content-Security-Policy**: locked-down, allows Cloudflare Insights when enabled by Pages.
- **Permissions-Policy**: `camera=(), geolocation=(), microphone=(), payment=(), usb=()`
- **Referrer-Policy**: `strict-origin-when-cross-origin`
- **X-Content-Type-Options**: `nosniff`
- **`/_astro/*`** and **`/fonts/*`** → 1 year `immutable`.
- **`/og/*`** → 1 year `immutable`.
- **`/sw.js`** → `Cache-Control: public, max-age=0, must-revalidate` so service worker updates propagate.
- **HTML / `/feed.xml` / `/feed.json` / `/sitemap*.xml`** → `CDN-Cache-Control: s-maxage=3600, stale-while-revalidate=86400` so the edge stays fresh while keeping browser caches conservative.

Editing those defaults: update [`public/_headers`](../public/_headers) and [`public/_redirects`](../public/_redirects) directly. Do not maintain a separate `vercel.json` — the project no longer targets Vercel.

## Release flow

The site uses GitHub Flow and has one production branch:

1. Create a feature or fix branch from `main`.
2. Open a pull request into `main`. GitHub Actions validates the pull request:
   - Astro Doctor
   - lint, Astro type-check, Markdown/content checks, and spellcheck
   - dependency audit and unit tests
   - production build, stable Chromium E2E, and Lighthouse assertions
   The checks share one path-aware runner and one dependency installation.
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
`Quality gate` status check before merging. Routine changes use feature or fix
branches; the v4 redesign is being consolidated on `release/v4.0.0`. Merge its
reviewed pull request once into `main`, using the same production checks.

Website versions and GitHub Releases are managed with Changesets:

1. Run `pnpm changeset` in a pull request that should produce a release, choose
   the semantic version impact, and commit the generated Markdown file.
2. After one or more changesets reach `main`, the **Release** workflow opens or
   updates a single `chore(release): version website` pull request.
3. Review and merge that pull request. Changesets updates `package.json` and
   `CHANGELOG.md`; the workflow then creates the matching `vX.Y.Z` tag and
   GitHub Release from that exact `main` commit.

Documentation, test, and CI-only pull requests do not need a changeset unless
they should appear in a release. GitHub Releases remain deployment markers, not
a second deployment gate, and the workflow never publishes the private website
package to npm.

CodeQL scans pull requests and also runs monthly or on demand against the
protected default branch. The pull-request jobs stay read-only, and the
dependency audit reuses the quality gate's single dependency installation.

## v4 design candidate

`release/v4.0.0` consolidates the new design and replaces the unpublished 3.12.0
release preparation. Existing source checkouts remain intact until their work is
integrated and their owners finish. Public page URLs and content collections are
retained; no visitor migration is required.

The candidate uses the coordinated Lumen 4.0.0 registry packages. Install the committed
lockfile with the pinned pnpm version, regenerate CV downloads after dependency or design
changes, and run the release gates. `preview:lumen:v4` remains available for future local
library evaluation; never commit its temporary overrides or local tarball paths.

Finished task changes must be committed into `release/v4.0.0` and validated on the
integrated revision. Inspect worktree status and commit ancestry before carrying
forward older edits: already-integrated copies and superseded local preview
overrides must not overwrite the current release. Preserve dirty source checkouts
until their owners finish. Delete a remote source branch only after its intended
work is proven contained in the release and its open pull request is accounted for.

Before the first push or pull request, independently review the complete v4 diff
against `main` and address findings. Publishing remains the existing GitHub
Actions and Cloudflare Pages workflow from the reviewed, merged `main` commit.
Use the rollback procedure below if production smoke checks fail.

## Pre-release local validation

Two tiers, picked by intent:

- `pnpm run verify:fast` — lint, Astro type-check, content checks, unit tests, and a build. Runs on `pre-push` to keep daily pushes fast.
- `pnpm run verify:full` (alias of `ci:verify`) — everything `verify:fast` does, plus coverage, Lighthouse CI, and stable Playwright. Run before manual releases or large changes.
- `pnpm run audit` — audits production and development dependencies at moderate
  severity without a vulnerability allowlist. Any exception must document its
  exact dependency path, exposure boundary, and removal condition.

See [dependency security follow-up](dependency-security.md) for unresolved
upstream findings and their required compatibility checks. Documenting a finding
does not waive the audit gate.

The full Lighthouse audit covers Home, About, Work, Projects, Portfolio, Travel,
Blog, and Accessibility. `pnpm run lighthouse` is the faster homepage smoke audit;
`pnpm run lighthouse:full` repeats the configured route audit three times.
The manual workflow uses read-only permissions and retains diagnostic artifacts.

When another checkout owns Playwright's default preview port, keep that server
running and select an unused port for the gate, for example:

```bash
PW_PREVIEW_PORT=4460 pnpm run ci:verify
```

Astro also allows one preview server per checkout. Stop only your own completed
verification preview before starting the gate; an unrelated active preview must
remain intact. Do not relax server isolation to make the tests run.

Lighthouse CI writes reports beneath its working directory. Keep concurrent audits
in separate checkouts or isolated working directories so one run cannot clear or
mix another run's results.

## Rollback

If a production regression is detected:

1. Promote or redeploy the previous healthy build from your host’s dashboard or pipeline.
2. Alternatively revert the offending commit and redeploy.
3. Re-run smoke checks on the same key routes.
4. Document the cause and follow-up in the incident notes.

## Build-time environment variables (Webmentions)

If the site should receive and display [Webmention.io](https://webmention.io/) mentions, set these in the environment used for **`pnpm run build`** (CI or local). Values match `.env.example`.

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

Both the build and diagnostic script send the API token in the supported
`Authorization` header, keeping it out of request URLs. Target matching follows
[Webmention.io's canonical URL and redirect aliases](https://webmention.io/api#basics),
so an alias may legitimately return a different canonical `wm-target`.

### Testing Webmentions

1. **Unit tests** (mocked HTTP, no secrets): `pnpm run test:webmentions`
2. **Live checks** (reads `.env` for `WEBMENTION_*`; does not print the API key): `pnpm run check:webmentions`  
   Optional target URL: `pnpm run check:webmentions -- https://santi020k.com/blog/your-slug/`
3. **Send a real mention**: publish any public HTML page that contains a normal link to your post URL, then use a sender that POSTs `source` and `target` to your Webmention.io endpoint (many IndieWeb tools do this automatically). [webmention.rocks](https://webmention.rocks/) exercises receivers; for end-to-end, confirm the mention appears on [webmention.io](https://webmention.io/) for your domain, then run **`pnpm run build`** locally (or redeploy) with `WEBMENTION_API_KEY` set — mentions are embedded at build time, not in the browser.

## Notes

- Cache policy details are documented in [`docs/cache-strategy.md`](cache-strategy.md).
- The edge cache and CSP live in [`public/_headers`](../public/_headers); redirects live in [`public/_redirects`](../public/_redirects). Changes there ship with the next deploy.
