# Deployment Runbook

## Deployment Target

- Platform: Vercel
- Production domain: `https://santi020k.com`
- Redirect: `www.santi020k.com` to apex domain (configured in `vercel.json`)

## Release Flow

1. Merge approved pull request into `main`.
2. Verify GitHub Actions CI passes:
   - lint/check/spellcheck
   - unit tests
   - build
   - stable E2E
   - Lighthouse CI
3. Confirm Vercel production deployment is successful.
4. Smoke-check key routes in production:
   - `/`
   - `/blog/`
   - `/portfolio/`
   - `/feed.xml`
   - `/offline/`

## Pre-release Local Validation

Run before large changes or manual releases:

- `pnpm run ci:verify`

## Rollback

If a production regression is detected:

1. Open the Vercel project dashboard.
2. Promote the previous healthy deployment, or revert the offending commit and redeploy.
3. Re-run smoke checks on the same key routes.
4. Document the cause and follow-up in the incident notes.

## Vercel environment variables (Webmention)

If the site should receive and display [Webmention.io](https://webmention.io/) mentions, set these in the Vercel project (Settings → Environment Variables). Values match `.env.example`.

| Variable | Environments | Type | Purpose |
| --- | --- | --- | --- |
| `WEBMENTION_API_KEY` | Production, Preview (optional: Development) | **Secret** | Token from the Webmention.io dashboard. Build fetches `mentions.jf2` for each post. |
| `WEBMENTION_URL` | All | Public | `rel="webmention"` target (e.g. `https://webmention.io/santi020k.com/webmention`). |
| `WEBMENTION_PINGBACK` | All | Public | Optional. `rel="pingback"` URL if you want legacy pingback (e.g. `https://webmention.io/santi020k.com/xmlrpc`). |

The dashboard “Mentions Feed” (HTML/Atom) URLs are for feed readers, not for Vercel or this build.

### Testing Webmentions

1. **Unit tests** (mocked HTTP, no secrets): `pnpm run test:webmentions`
2. **Live checks** (reads `.env` for `WEBMENTION_*`; does not print the API key): `pnpm run check:webmentions`  
   Optional target URL: `pnpm run check:webmentions -- https://santi020k.com/blog/your-slug/`
3. **Send a real mention**: publish any public HTML page that contains a normal link to your post URL, then use a sender that POSTs `source` and `target` to your Webmention.io endpoint (many IndieWeb tools do this automatically). [webmention.rocks](https://webmention.rocks/) exercises receivers; for end-to-end, confirm the mention appears on [webmention.io](https://webmention.io/) for your domain, then run **`pnpm run build`** locally (or redeploy) with `WEBMENTION_API_KEY` set — mentions are embedded at build time, not in the browser.

## Notes

- Caching and security headers are defined in `vercel.json`.
- Cache policy details are documented in `docs/cache-strategy.md`.
