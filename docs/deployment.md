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

## Notes

- Caching and security headers are defined in `vercel.json`.
- Cache policy details are documented in `docs/cache-strategy.md`.
