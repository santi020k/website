# Cache Strategy

## Goals

- Keep static assets immutable and aggressively cached.
- Keep feeds and sitemaps fresh enough for crawlers.
- Keep HTML pages revalidating frequently while allowing CDN stale-while-revalidate.

## Route Policy

- `/_astro/*` (hashed CSS and JS), `/fonts/*`, `/og/*.webp`: `max-age=31536000, immutable`
- `/feed.xml`: `s-maxage=1800, stale-while-revalidate=86400`
- `/sitemap-index.xml` and `/sitemap-*.xml`: `s-maxage=3600, stale-while-revalidate=86400`
- `/robots.txt`: `s-maxage=3600, stale-while-revalidate=86400`
- `/manifest.webmanifest`: `s-maxage=86400, stale-while-revalidate=604800`
- App pages (`/(.*)`): browser `must-revalidate`, CDN `s-maxage=3600, stale-while-revalidate=86400`

## Service worker

The service worker uses network-first for document navigations and for every
page route — any same-origin GET whose path is `/` or ends in `/`, matching
the trailing-slash convention for internal links. This also covers the Astro
ClientRouter, which fetches route HTML through a plain `fetch()` (mode
`"cors"`, not `"navigate"`) to diff and swap the document in place; without
this, an in-page transition could silently swap in a stale cached page. All
other eligible same-origin GET requests (hashed assets, JSON endpoints,
feeds, etc.) use stale-while-revalidate. Requests with a `Range` header
bypass the worker entirely, including partial downloads of the resume PDFs.
The Cache API cannot store partial responses or produce the requested byte
range from a cached full file.

If the network fails, a page or navigation request falls back to its own
cached copy, then to the cached `/offline/` document. A cache miss or write
failure never blocks the response — cache storage is treated as an optional
optimization.

## Build cache

GitHub Actions restores generated OG images together with `.og-cache.json`,
which lets the generator validate each cached output. The cache key includes
the lockfile, artwork, content, renderer scripts, pagination settings, and the
actual variable font. A changed input produces a new cache entry; the generator
still verifies fingerprints after a fallback restore.

## Why this split

- Static hashed assets should never be re-downloaded unless URLs change. The global
  stylesheet is emitted under `/_astro/` (`build.inlineStylesheets: 'auto'`) rather than
  inlined into every document, so one cached copy serves the whole site instead of
  ~420 KiB riding along inside each of the ~440 pages and every prefetched document.
- Feed/sitemap updates need to propagate quickly for SEO freshness.
- HTML can be served stale briefly while the CDN refreshes in background.
