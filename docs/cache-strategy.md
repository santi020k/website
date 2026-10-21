# Cache Strategy

## Goals

- Keep static assets immutable and aggressively cached.
- Keep feeds and sitemaps fresh enough for crawlers.
- Keep HTML pages revalidating frequently while allowing CDN stale-while-revalidate.

## Route Policy

- `/_astro/*` (hashed assets) and `/og/*`: `max-age=31536000, immutable`
- `/fonts/*` (stable filenames): `max-age=0, must-revalidate`; CORS remains enabled for Giscus
- `/feed.xml`, `/feed.json`, `/search-index.json`, and `/sitemap*.xml`: browser revalidation,
  CDN `s-maxage=3600, stale-while-revalidate=86400`
- `/`, trailing-slash pages (`/*/`), and `/*.html`: browser revalidation,
  CDN `s-maxage=3600, stale-while-revalidate=86400`
- `/pdf/cv.pdf`, `/pdf/cv-full.pdf`, and `/sw.js`: browser revalidation

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
use stale-while-revalidate. Requests with a `Range` header
bypass the worker entirely, including partial downloads of the resume PDFs.
The Cache API cannot store partial responses or produce the requested byte
range from a cached full file.

If the network fails, a page or navigation request falls back to its own
cached copy, then to the cached `/offline/` document. A cache miss or write
failure never blocks the response — cache storage is treated as an optional
optimization. Non-page resources fall back only to their own cached response; an offline HTML
page is never substituted for JSON, feed, or PDF bytes.

The `v4-cache-v2` cache namespace replaces the old unbounded release cache. Successful writes
trim the oldest entries above 256 responses while retaining the small install-time offline shell.
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
