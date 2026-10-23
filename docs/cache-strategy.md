# Cache Strategy

## Goals

- Keep static assets immutable and aggressively cached.
- Keep feeds and sitemaps fresh enough for crawlers.
- Keep HTML pages revalidating frequently while allowing CDN stale-while-revalidate.

## Route Policy

- `/_astro/*` (hashed assets) and `/og/*.webp`: `max-age=31536000, immutable`
- `/fonts/*` (stable filenames): `max-age=0, must-revalidate`; CORS remains enabled for Giscus
- `/feed.xml`, `/feed.json`, `/search-index.json`, and `/sitemap*.xml`: browser revalidation,
  CDN `s-maxage=3600, stale-while-revalidate=86400`
- `/`, trailing-slash pages (`/*/`), and `/*.html`: browser revalidation,
  CDN `s-maxage=3600, stale-while-revalidate=86400`
- `/pdf/cv.pdf`, `/pdf/cv-full.pdf`, `/og/manifest.json`, and `/sw.js`: browser revalidation

`public/_headers` owns deployment cache policy. Static Astro endpoints cannot carry their runtime
response headers into emitted files. Explicit root and trailing-slash patterns cover public page
URLs without applying HTML cache policy to hashed assets. Cloudflare combines headers from every
matching rule, so avoid overlapping Cache-Control values. See the
[Cloudflare header contract](https://developers.cloudflare.com/pages/configuration/headers/).
Verify actual response headers after deployment; local Astro preview does not emulate these rules.

Article JSON-LD, Open Graph, and Twitter metadata share the manifest's content-versioned
image URL. Keep the `?v=` fingerprint when referencing generated artwork: `/og/` is
immutable, so an unversioned URL can retain an older image after the content changes.

## Service worker

The service worker uses network-first for document navigations and for every
page route — any same-origin GET whose path is `/` or ends in `/`, matching
the trailing-slash convention for internal links. This also covers the Astro
ClientRouter, which fetches route HTML through a plain `fetch()` (mode
`"cors"`, not `"navigate"`) to diff and swap the document in place; without
this, an in-page transition could silently swap in a stale cached page. PDF, JSON, XML, and web manifest requests also use network-first, so a cached
resume or search index cannot hide an online update. Other eligible same-origin GET requests
use stale-while-revalidate, except content-hashed `/_astro/` assets, which use cache-first.
An existing hashed response is reused without a fetch, cache rewrite, or eviction scan; a new
URL is fetched and cached independently. Requests with a `Range` header
bypass the worker entirely, including partial downloads of the resume PDFs.
The Cache API cannot store partial responses or produce the requested byte
range from a cached full file.

Static page routes (`/`, trailing-slash paths, and `.html` document navigations) render the same
bytes for every query string; `?q=` and campaign tags only select client-side UI. The worker
fetches the original URL unchanged but stores and reads the response under the query-free URL, so
`/?q=term` and `/?utm_source=…` share one cached copy and search terms never become cache keys.
The cached network response can still retain its original URL, including the query; this is cache
deduplication, not removal of search terms from browser storage. The cache key keeps the request headers for `Vary` matching. JSON, feeds, PDFs, the
web manifest, and assets keep their exact query in the cache key because it can select different
bytes.

If the network fails or takes eight seconds to return response headers, a page or navigation
request falls back to its cached copy, then to the cached `/offline/` document. A cache miss or write
failure never blocks the response — cache storage is treated as an optional
optimization. At the header deadline, the worker keeps waiting for the network only when neither the
requested resource nor, for pages, the offline document is cached. The original request continues in the background and refreshes the cache if it
succeeds after a cached response has been served. The deadline ends when response headers arrive;
it does not interrupt a streaming body or a large download. Network responses stream immediately;
`waitUntil` keeps background cache writes
and trimming alive without holding the response. Non-page resources fall back only to their own cached response; an offline HTML
page is never substituted for JSON, feed, or PDF bytes. Only successful, non-redirected responses
are stored: browsers reject a cached followed redirect for a navigation, so caching one would turn
an offline visit to that URL into a network error instead of the offline document.

The `v4-cache-v3-<fingerprint>` namespace identifies the current recovery shell.
The [build generator](../scripts/js/generate-offline-worker.mjs) creates `dist/sw.js` from the source worker, adding the
current site's bundled JavaScript, CSS, and WOFF2 fonts to the install list.
This includes shared and dynamically imported code without parsing minified
modules or relying on the browser's HTTP cache. Images, source maps, and historical
app assets are excluded. The current list is about 1.4 MB before compression;
installation runs after page load and can reuse HTTP-cached responses.

The fingerprint covers those files, the home and offline documents, and the
worker template, so a changed build installs a new shell even when the handwritten
worker is unchanged. An incomplete asset download prevents activation of the new
worker, preserving the previous worker. The generator fails above 200 code/font
assets to reserve runtime cache capacity instead of silently losing shell assets.
Successful writes trim the oldest entries above 256 responses while retaining
the complete install-time shell, including its scripts, styles, and fonts.
Activation removes previous site cache namespaces and preserves unrelated application storage.

## Build cache

GitHub Actions restores generated OG images together with `.og-cache.json`,
which lets the generator validate each cached output. The cache key includes
the lockfile, artwork, content, renderer scripts, pagination settings, and the
actual variable font. A changed input produces a new cache entry; the generator
still verifies fingerprints after a fallback restore.

### Portable OG fingerprints

The pinned `@santi020k/og@1.2.0` dependency uses
[`patches/@santi020k__og@1.2.0.patch`](../patches/@santi020k__og@1.2.0.patch) to hash source
identities relative to the configured project root. The generator still reads and hashes every
source file and verifies output digests. The website also stores image references in card data
relative to that root; renderer paths and the `collectSpecs` helper still resolve actual local files.

Moving a checkout with its cache and generated images preserves all fingerprints, manifest URLs,
and cache hits. Inputs outside the project keep their absolute identity. The new fingerprint format
requires one regeneration of older cache metadata; subsequent moves do not regenerate cards.

The source fix and regression coverage also live in the OG repository. Remove this patch only after
upgrading to a published release containing that fix and passing `pnpm run test` and
`pnpm run check:og`. The installed-package regression test copies a cache between temporary roots
and verifies hits, stable public URLs, changed sources, and corrupted outputs.

## Why this split

- Static hashed assets should never be re-downloaded unless URLs change. The global
  stylesheet is emitted under `/_astro/` (`build.inlineStylesheets: 'auto'`) rather than
  inlined into every document, so one cached copy serves the whole site instead of
  ~420 KiB riding along inside each of the ~440 pages and every prefetched document.
- Feed/sitemap updates need to propagate quickly for SEO freshness.
- HTML can be served stale briefly while the CDN refreshes in background.
