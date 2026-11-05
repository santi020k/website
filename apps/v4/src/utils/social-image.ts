import { getRouteManifestImage, type OgRouteManifest } from '@santi020k/og'

const defaultSiteURL = 'https://santi020k.com/'
const trimOuterSlashes = (value: string) => value.replace(/^\/+|\/+$/g, '')

/** Safely decodes a URI component, returning the original string on failure. */
const safeDecodeURIComponent = (value: string) => {
  try {
    return decodeURIComponent(value)
  } catch {
    return value
  }
}

/**
 * Converts a URL pathname into a flat, filesystem-safe slug for OG images.
 *
 * Encoding strategy (must survive as a static filename on strict static hosts):
 *  1. Decode each segment first (handles already-encoded paths like `/technologies/C%23/`)
 *     to avoid double-encoding.
 *  2. Re-encode with `encodeURIComponent` to cover special chars (`+`, `#`, spaces, …).
 *  3. Replace every `%` with `~` because `%` is often rejected in generated asset filenames.
 *  4. Join segments with `--` so `/blog/my-post/` → `blog--my-post`.
 *
 * Example: `/technologies/C++/` → `technologies--C~2B~2B`
 */
export const getSocialImageSlug = (pathname: string) => trimOuterSlashes(pathname)
  .split('/')
  .filter(Boolean)
  .map(segment => encodeURIComponent(safeDecodeURIComponent(segment)).replaceAll('%', '~'))
  .join('--')

/**
 * Returns the relative path to the pre-generated OG image for `pathname`.
 */
export const getSocialImagePath = (pathname: string) => {
  const slug = getSocialImageSlug(pathname)

  return `/og/pages/${slug || 'index'}.webp`
}

/**
 * Resolves the full absolute URL of the OG image for the given pathname.
 * Accepts an optional `overridePath` for pages that supply a custom image.
 */
export const getSocialImageURL = (
  pathname: string,
  baseURL: string | URL | undefined,
  overridePath?: string,
  manifest?: OgRouteManifest
) => {
  const base = baseURL ?? defaultSiteURL
  const image = manifest ? getRouteManifestImage(manifest, pathname) : undefined
  const overrideURL = overridePath ? new URL(overridePath, base) : undefined
  const generatedURL = image?.url ? new URL(image.url, base) : undefined
  const alias = manifest ? getRouteManifestImage(manifest, pathname, { primary: false }) : undefined

  const isGeneratedOverride = overrideURL ?
    [image, alias].some(candidate => {
      if (!candidate?.url) return false

      const candidateURL = new URL(candidate.url, base)

      return candidateURL.origin === overrideURL.origin && candidateURL.pathname === overrideURL.pathname
    }) :
    false

  // Explicit custom artwork wins. Generated overrides (including legacy aliases)
  // use the route's current primary image and its content fingerprint.
  if (overrideURL && !isGeneratedOverride) return overrideURL.href

  return generatedURL?.href ?? new URL(overridePath ?? getSocialImagePath(pathname), base).href
}
