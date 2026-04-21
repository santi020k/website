# Observability Dashboard Checklist

## Weekly KPIs

- Core Web Vitals by route (`/`, `/blog/`, `/portfolio/`, top post pages).
- Top exit pages and bounce-prone landing pages.
- CTA funnel (`resume_download`, `contact_email`, `contact_whatsapp`, `cta_linkedin`).
- Search usage (`site_search_query`, `site_search_result_click`).

## Alert thresholds

- LCP p75 above 2.5s for 2 consecutive days on homepage or blog index.
- CLS p75 above 0.1 for any high-traffic route.
- Conversion event drop (>20% WoW) for key CTAs.

## Instrumentation notes

- Vercel Analytics + Speed Insights are already enabled in production.
- CTA tracking is delegated globally in `src/layouts/Base.astro`.
- Search telemetry is emitted from `src/components/molecules/SiteSearch.astro`.
