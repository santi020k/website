# Cache Strategy

## Goals

- Keep static assets immutable and aggressively cached.
- Keep feeds and sitemaps fresh enough for crawlers.
- Keep HTML pages revalidating frequently while allowing CDN stale-while-revalidate.

## Route Policy

- `/*.css`, `/fonts/*`, `/og/*.webp`: `max-age=31536000, immutable`
- `/feed.xml`: `s-maxage=1800, stale-while-revalidate=86400`
- `/sitemap-index.xml` and `/sitemap-*.xml`: `s-maxage=3600, stale-while-revalidate=86400`
- `/robots.txt`: `s-maxage=3600, stale-while-revalidate=86400`
- `/manifest.webmanifest`: `s-maxage=86400, stale-while-revalidate=604800`
- App pages (`/(.*)`): browser `must-revalidate`, CDN `s-maxage=3600, stale-while-revalidate=86400`

## Why this split

- Static hashed assets should never be re-downloaded unless URLs change.
- Feed/sitemap updates need to propagate quickly for SEO freshness.
- HTML can be served stale briefly while the CDN refreshes in background.
