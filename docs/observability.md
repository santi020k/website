# Observability Dashboard Checklist

## Weekly KPIs

Measure using your hosting or CDN metrics (requests, errors), plus Lab data from Lighthouse CI in CI:

- Core Web Vitals by route (`/`, `/blog/`, `/portfolio/`, top post pages) — see Lighthouse artifacts or host RUM if you add it later.
- Top exit pages and bounce-prone landing pages (if your analytics tool exposes them).
- Any custom conversion goals you instrument later (contact clicks, newsletter signups, etc.).

## Alert thresholds

- LCP p75 above 2.5s for 2 consecutive days on homepage or blog index (from Lighthouse trend or RUM).
- CLS p75 above 0.1 for any high-traffic route.
- HTTP 5xx rate or cache poisoning signals from the CDN.

## Instrumentation notes

- Production builds do not ship a first-party analytics SDK by default. Lab performance coverage comes from **`pnpm run lighthouse`** / CI.
- If you add analytics or error reporting later, document the vendor and events beside this file.
