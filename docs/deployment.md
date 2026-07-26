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
   - production build
   - stable E2E
   - Lighthouse CI
3. Merge the approved pull request once. Cloudflare Pages deploys `main`;
   GitHub Actions does not repeat the pull-request suite after the merge.
4. Confirm the Cloudflare Pages production deployment completed successfully.
5. Smoke-check key routes in production:
   - `/`
   - `/blog/`
   - `/portfolio/`
   - `/feed.xml`
   - `/offline/`

Protect `main` in the GitHub repository settings. Require a pull request and the
`Validate and build`, `E2E Tests (Stable Required)`, `Lighthouse CI`, and
`Astro Doctor` status checks before merging. Do not create a `release/*` branch
or merge the same change a second time.

GitHub Releases are optional deployment markers, not a second deployment gate.
To publish one, run the **Release** workflow from `main`, enter a semantic
version tag such as `v4.0.0`, and select whether it is a pre-release. The
workflow tags the already-deployed `main` commit and generates release notes.
It does not install dependencies, rebuild the site, create a branch, or make
another commit.

CodeQL runs weekly and on demand instead of rebuilding its database after every
merge. The dependency audit remains part of every pull request and reuses the
main CI dependency installation.

## Pre-release local validation

Two tiers, picked by intent:

- `pnpm run verify:fast` — lint, Astro type-check, content checks, unit tests, and a build. Runs on `pre-push` to keep daily pushes fast.
- `pnpm run verify:full` (alias of `ci:verify`) — everything `verify:fast` does, plus coverage, Lighthouse CI, and stable Playwright. Run before manual releases or large changes.
- `pnpm run audit` — audits at moderate severity while accepting
  `CVE-2026-14257` for legacy developer-only glob consumers. Those commands use
  repository-controlled patterns, and forcing the patched major currently
  breaks ESLint.

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

### Testing Webmentions

1. **Unit tests** (mocked HTTP, no secrets): `pnpm run test:webmentions`
2. **Live checks** (reads `.env` for `WEBMENTION_*`; does not print the API key): `pnpm run check:webmentions`  
   Optional target URL: `pnpm run check:webmentions -- https://santi020k.com/blog/your-slug/`
3. **Send a real mention**: publish any public HTML page that contains a normal link to your post URL, then use a sender that POSTs `source` and `target` to your Webmention.io endpoint (many IndieWeb tools do this automatically). [webmention.rocks](https://webmention.rocks/) exercises receivers; for end-to-end, confirm the mention appears on [webmention.io](https://webmention.io/) for your domain, then run **`pnpm run build`** locally (or redeploy) with `WEBMENTION_API_KEY` set — mentions are embedded at build time, not in the browser.

## Notes

- Cache policy details are documented in [`docs/cache-strategy.md`](cache-strategy.md).
- The edge cache and CSP live in [`public/_headers`](../public/_headers); redirects live in [`public/_redirects`](../public/_redirects). Changes there ship with the next deploy.
