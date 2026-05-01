# Deployment Runbook

## Deployment target

- **Output**: Static site from `pnpm run build` (published under `dist/`).
- **Production domain**: `https://santi020k.com`
- **Redirect**: `www.santi020k.com` → apex `https://santi020k.com` (configure at your DNS or CDN).

Apply caching and security headers per [`docs/cache-strategy.md`](cache-strategy.md). Typical additions at the edge:

- **Content-Security-Policy**: `default-src 'self'; base-uri 'self'; connect-src 'self'; font-src 'self' data:; frame-ancestors 'none'; img-src 'self' data: blob: https:; manifest-src 'self'; object-src 'none'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; worker-src 'self'`
- **Permissions-Policy**: `camera=(), geolocation=(), microphone=(), payment=(), usb=()`
- **Referrer-Policy**: `strict-origin-when-cross-origin`
- **X-Content-Type-Options**: `nosniff`

`/sw.js` should use `Cache-Control: public, max-age=0, must-revalidate` so service worker updates propagate.

## Release flow

1. Merge approved pull request into `main`.
2. Verify GitHub Actions CI passes:
   - lint/check/spellcheck
   - unit tests
   - build
   - stable E2E
   - Lighthouse CI
3. Confirm production deployment from your hosting provider finished successfully.
4. Smoke-check key routes in production:
   - `/`
   - `/blog/`
   - `/portfolio/`
   - `/feed.xml`
   - `/offline/`

## Pre-release local validation

Run before large changes or manual releases:

- `pnpm run ci:verify`

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
