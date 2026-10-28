# Observability Dashboard Checklist

## Weekly KPIs

Use the Search Console Domain property, Cloudflare host-filtered traffic, and
Lighthouse CI reports. Keep private analytics exports outside the repository.

- In Search Console, filter pages to `https://santi020k.com/` when evaluating this
  website; the Domain property also includes every project subdomain. Compare
  equal periods using finalized data, excluding the latest three Pacific days.
- Track clicks, impressions, CTR, and position by landing page and query. Filtered
  reports can omit data, and query/page totals are not necessarily additive.
- Review indexing reasons and submitted sitemap status. Prioritize 404 URLs with
  an exact replacement. Redirect and alternate-canonical exclusions are often
  intentional; do not redirect unrelated missing pages to the homepage.
- In Cloudflare, filter **Host equals santi020k.com** before comparing request
  counts, status codes, and cache hit ratio. Edge requests include bots and assets,
  so request totals and cache hit ratio do not directly measure human engagement
  or Core Web Vitals.
- Keep Lighthouse mobile results for `/`, `/blog/`, `/portfolio/`, `/travel/`, and
  important landing pages. Compare the same device profile, routes, and build
  conditions over multiple runs.

## Alert thresholds

- Real-user LCP p75 above 2.5s or CLS p75 above 0.1, when Search Console or an
  already-authorized RUM source provides sufficient field data. “No data” is not
  a passing result or a zero value.
- Lighthouse regressions against the repository's CI assertions. Lab measurements
  are synthetic runs, not daily real-user percentiles.
- HTTP 5xx rate or cache poisoning signals from the CDN.

## Instrumentation notes

- Cloudflare provides aggregate traffic and performance metrics at the hosting
  layer. Production builds optionally load Cloudflare Web Analytics when the public
  `CLOUDFLARE_WEB_ANALYTICS_TOKEN` is configured; leaving it unset ships no beacon.
  The beacon reports page views and performance, including client-side navigation.
  A WhatsApp handoff or retry is not proof of a sent message or a new contact.
- Lab performance coverage comes from **`pnpm run lighthouse`** / CI.
- Changes to analytics or error reporting require explicit authorization and
  corresponding privacy, environment-schema, and CSP updates.
