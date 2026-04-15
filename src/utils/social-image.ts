const defaultSiteURL = 'https://santi020k.me/'
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
 * Encoding strategy (must survive as a static filename on Vercel):
 *  1. Decode each segment first (handles already-encoded paths like `/technologies/C%23/`)
 *     to avoid double-encoding.
 *  2. Re-encode with `encodeURIComponent` to cover special chars (`+`, `#`, spaces, …).
 *  3. Replace every `%` with `~` because `%` is not valid in Vercel output filenames.
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
 * Falls back to `/default.webp` for the root path.
 */
export const getSocialImagePath = (pathname: string) => {
  const slug = getSocialImageSlug(pathname)

  return slug ? `/og/pages/${slug}.webp` : '/default.webp'
}

/**
 * Resolves the full absolute URL of the OG image for the given pathname.
 * Accepts an optional `overridePath` for pages that supply a custom image.
 */
export const getSocialImageURL = (
  pathname: string,
  baseURL: string | URL | undefined,
  overridePath?: string
) => new URL(overridePath ?? getSocialImagePath(pathname), baseURL ?? defaultSiteURL).href
