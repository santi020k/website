const defaultSiteURL = 'https://santi020k.me/'
const trimOuterSlashes = (value: string) => value.replace(/^\/+|\/+$/g, '')

const safeDecodeURIComponent = (value: string) => {
  try {
    return decodeURIComponent(value)
  } catch {
    return value
  }
}

export const getSocialImageSlug = (pathname: string) => trimOuterSlashes(pathname)
  .split('/')
  .filter(Boolean)
  .map(segment => encodeURIComponent(safeDecodeURIComponent(segment)).replaceAll('%', '~'))
  .join('--')

export const getSocialImagePath = (pathname: string) => {
  const slug = getSocialImageSlug(pathname)

  return slug ? `/og/pages/${slug}.png` : '/default.webp'
}

export const getSocialImageURL = (
  pathname: string,
  baseURL: string | URL | undefined,
  overridePath?: string
) => new URL(overridePath ?? getSocialImagePath(pathname), baseURL ?? defaultSiteURL).href
