import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { load } from 'js-yaml'
import sharp from 'sharp'

const SCRIPT_PATH = fileURLToPath(import.meta.url)
const ROOT = path.resolve(path.dirname(SCRIPT_PATH), '..', '..')
const PROJECTS_ROOT = path.join(ROOT, 'src', 'content', 'project')
const FONT_PATH = path.join(ROOT, 'public', 'fonts', 'Montserrat-Bold.ttf')

export const IMAGE_VARIANTS = [
  { fileName: 'cover.webp', height: 1000, kind: 'thumbnail', width: 1600 },
  { fileName: 'cover-horizontal.webp', height: 1350, kind: 'hero', width: 2400 },
  { fileName: 'cover-vertical.webp', height: 1600, kind: 'portrait', width: 1200 },
  { fileName: 'cover-background.webp', height: 1350, kind: 'background', width: 2400 }
]

const FALLBACK_ACCENTS = [
  '#8b5cf6',
  '#a855f7',
  '#d946ef',
  '#ec4899',
  '#3b82f6',
  '#06b6d4',
  '#14b8a6',
  '#f59e0b'
]

const DEFAULT_BRAND = {
  secondary: '#b78cff',
  surface: '#10091c'
}

const escapeXml = value => value
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll('\'', '&apos;')

const isRecord = value => typeof value === 'object' && value !== null && !Array.isArray(value)

const hashText = value => {
  let hash = 2166136261

  for (const character of value) {
    hash ^= character.codePointAt(0) ?? 0

    hash = Math.imul(hash, 16777619)
  }

  return hash >>> 0
}

export const getFallbackAccent = slug => FALLBACK_ACCENTS[hashText(slug) % FALLBACK_ACCENTS.length]

const rgbToHex = ({ blue, green, red }) => `#${[red, green, blue]
  .map(channel => channel.toString(16).padStart(2, '0'))
  .join('')}`

const hexToRgb = hex => {
  const match = /^#([\da-f]{2})([\da-f]{2})([\da-f]{2})$/iu.exec(hex)

  if (!match) throw new TypeError(`Invalid accent color: ${hex}`)

  return {
    blue: Number.parseInt(match[3], 16),
    green: Number.parseInt(match[2], 16),
    red: Number.parseInt(match[1], 16)
  }
}

const getRelativeLuminance = color => {
  const channels = [color.red, color.green, color.blue].map(channel => {
    const normalized = channel / 255

    return normalized <= 0.04045 ? normalized / 12.92 : ((normalized + 0.055) / 1.055) ** 2.4
  })

  return (0.2126 * channels[0]) + (0.7152 * channels[1]) + (0.0722 * channels[2])
}

const getContrastRatio = (first, second) => {
  const lighter = Math.max(getRelativeLuminance(first), getRelativeLuminance(second))
  const darker = Math.min(getRelativeLuminance(first), getRelativeLuminance(second))

  return (lighter + 0.05) / (darker + 0.05)
}

const rgbToHsl = ({ blue, green, red }) => {
  const r = red / 255
  const g = green / 255
  const b = blue / 255
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const lightness = (max + min) / 2
  const delta = max - min

  if (delta === 0) return { hue: 0, lightness, saturation: 0 }

  const saturation = delta / (1 - Math.abs((2 * lightness) - 1))
  let hue

  if (max === r) hue = ((g - b) / delta) % 6
  else if (max === g) hue = ((b - r) / delta) + 2
  else hue = ((r - g) / delta) + 4

  hue = ((hue * 60) + 360) % 360

  return { hue, lightness, saturation }
}

const hslToRgb = ({ hue, lightness, saturation }) => {
  const chroma = (1 - Math.abs((2 * lightness) - 1)) * saturation
  const hueSegment = hue / 60
  const secondary = chroma * (1 - Math.abs((hueSegment % 2) - 1))

  const channels = [
    [chroma, secondary, 0],
    [secondary, chroma, 0],
    [0, chroma, secondary],
    [0, secondary, chroma],
    [secondary, 0, chroma],
    [chroma, 0, secondary]
  ][Math.floor(hueSegment) % 6] ?? [0, 0, 0]

  const match = lightness - (chroma / 2)

  return {
    blue: Math.round((channels[2] + match) * 255),
    green: Math.round((channels[1] + match) * 255),
    red: Math.round((channels[0] + match) * 255)
  }
}

export const getReadableAccent = (accent, backgroundColor = '#10091c') => {
  const color = hexToRgb(accent)
  const background = hexToRgb(backgroundColor)

  if (getContrastRatio(color, background) >= 4.5) return accent.toLowerCase()

  const { hue, lightness, saturation } = rgbToHsl(color)
  const readableSaturation = Math.max(saturation, 0.52)

  for (let readableLightness = lightness; readableLightness <= 0.9; readableLightness += 0.02) {
    const mixed = hslToRgb({
      hue,
      lightness: readableLightness,
      saturation: readableSaturation
    })

    if (getContrastRatio(mixed, background) >= 4.5) return rgbToHex(mixed)
  }

  return '#fbf8ff'
}

export const selectAccentFromPixels = (pixels, fallback) => {
  const buckets = new Map()

  for (let index = 0; index < pixels.length; index += 4) {
    const red = pixels[index] ?? 0
    const green = pixels[index + 1] ?? 0
    const blue = pixels[index + 2] ?? 0
    const alpha = pixels[index + 3] ?? 0

    if (alpha < 128) continue

    const color = { blue, green, red }
    const { lightness, saturation } = rgbToHsl(color)

    if (lightness < 0.16 || lightness > 0.86 || saturation < 0.28) continue

    const key = [red, green, blue]
      .map(channel => Math.round(channel / 32) * 32)
      .join('-')

    const existing = buckets.get(key) ?? { color, count: 0, score: 0 }
    const centeredLightness = 1 - Math.abs(lightness - 0.55)

    existing.count += 1

    existing.score += saturation * centeredLightness

    buckets.set(key, existing)
  }

  const selected = [...buckets.values()]
    .filter(bucket => bucket.count >= 2)
    .sort((a, b) => b.score - a.score)[0]

  return selected ? rgbToHex(selected.color) : fallback
}

const getLogoAccent = async (logoPath, fallback) => {
  const { data } = await sharp(logoPath)
    .ensureAlpha()
    .resize(72, 72, { fit: 'inside' })
    .raw()
    .toBuffer({ resolveWithObject: true })

  return selectAccentFromPixels(data, fallback)
}

const parseFrontmatter = source => {
  const match = source.match(/^---\r?\n([\s\S]*?)\r?\n---/u)

  if (!match?.[1]) throw new Error('Missing YAML frontmatter')

  const data = load(match[1])

  if (!isRecord(data)) throw new TypeError('Project frontmatter must be an object')

  return data
}

const getString = (record, key) => {
  const value = record[key]

  return typeof value === 'string' ? value : undefined
}

const getStringArray = (record, key) => {
  const value = record[key]

  if (!Array.isArray(value)) return []

  return value.filter(item => typeof item === 'string')
}

const getBrandPalette = async (frontmatter, logoPath, slug) => {
  const configuredBrand = frontmatter.brand
  const extractedPrimary = await getLogoAccent(logoPath, getFallbackAccent(slug))

  if (!isRecord(configuredBrand)) {
    return {
      primary: extractedPrimary,
      secondary: DEFAULT_BRAND.secondary,
      surface: DEFAULT_BRAND.surface
    }
  }

  return {
    primary: getString(configuredBrand, 'primary') ?? extractedPrimary,
    secondary: getString(configuredBrand, 'secondary') ?? DEFAULT_BRAND.secondary,
    surface: getString(configuredBrand, 'surface') ?? DEFAULT_BRAND.surface
  }
}

const resolveLogoPath = (projectDirectory, coverImage) => {
  const configuredLogo = getString(coverImage, 'logo')

  if (!configuredLogo) throw new Error('coverImage.logo is required')

  return path.resolve(projectDirectory, configuredLogo)
}

/** @param {string} logoPath */
const openLogo = async logoPath => {
  const metadata = await sharp(logoPath).metadata()
  const longestSide = Math.max(metadata.width ?? 1, metadata.height ?? 1)
  const density = metadata.format === 'svg' ? Math.round(Math.min(2400, 72 * 1600 / longestSide)) : 72

  return sharp(logoPath, { density })
}

/** @param {string} logoPath */
export const getLogoBounds = async logoPath => {
  const logo = await openLogo(logoPath)

  const { data, info } = await logo
    .ensureAlpha()
    .extractChannel('alpha')
    .raw()
    .toBuffer({ resolveWithObject: true })

  let left = info.width
  let top = info.height
  let right = -1
  let bottom = -1

  for (let index = 0; index < data.length; index += 1) {
    // Ignore nearly invisible fringe pixels when measuring the artwork.
    if (data[index] <= 16) continue

    const x = index % info.width
    const y = Math.floor(index / info.width)

    left = Math.min(left, x)

    top = Math.min(top, y)

    right = Math.max(right, x)

    bottom = Math.max(bottom, y)
  }

  if (right < left || bottom < top) throw new Error(`Logo has no visible artwork: ${logoPath}`)

  return { height: bottom - top + 1, left, top, width: right - left + 1 }
}

export const discoverProjects = async (projectsRoot = PROJECTS_ROOT) => {
  const entries = await fs.readdir(projectsRoot, { withFileTypes: true })

  const directories = entries
    .filter(entry => entry.isDirectory())
    .map(entry => entry.name)
    .sort()

  return Promise.all(directories.map(async slug => {
    const directory = path.join(projectsRoot, slug)
    const files = await fs.readdir(directory)
    const entry = files.find(file => /^index\.mdx?$/u.test(file))

    if (!entry) throw new Error(`${slug}: index.md or index.mdx is required`)

    const source = await fs.readFile(path.join(directory, entry), 'utf8')
    const frontmatter = parseFrontmatter(source)
    const title = getString(frontmatter, 'title')
    const description = getString(frontmatter, 'description')
    const coverImage = frontmatter.coverImage

    if (!title || !description || !isRecord(coverImage)) {
      throw new Error(`${slug}: title, description, and coverImage are required`)
    }

    const logoPath = resolveLogoPath(directory, coverImage)
    const logoScale = coverImage.logoScale ?? 1

    if (typeof logoScale !== 'number' || !Number.isFinite(logoScale) || logoScale < 0.75 || logoScale > 1.5) {
      throw new Error(`${slug}: coverImage.logoScale must be between 0.75 and 1.5`)
    }

    await fs.access(logoPath)

    const brand = await getBrandPalette(frontmatter, logoPath, slug)

    return {
      accent: brand.primary,
      background: getString(coverImage, 'background'),
      brand,
      description,
      directory,
      logoAspect: getString(coverImage, 'logoAspect') ?? 'square',
      logoBounds: await getLogoBounds(logoPath),
      logoPath,
      logoScale,
      logoSurface: getString(coverImage, 'logoSurface') ?? 'dark',
      role: getString(frontmatter, 'role') ?? 'Engineering project',
      slug,
      technologies: getStringArray(frontmatter, 'technologies').slice(0, 3),
      title,
      type: getString(frontmatter, 'typesId') ?? 'personal'
    }
  }))
}

export const splitTitle = (title, portrait) => {
  let limit = 20

  if (portrait) limit = 14
  else if (title.includes(' ')) limit = 18

  const words = title.split(/(?=[./@-])|\s+/u).filter(Boolean)
  const lines = []
  let current = ''

  for (const word of words) {
    const separator = current && !/^[./@-]/u.test(word) ? ' ' : ''
    const candidate = `${current}${separator}${word}`

    if (candidate.length > limit && current) {
      lines.push(current)

      current = word
    } else {
      current = candidate
    }
  }

  if (current) lines.push(current)

  return lines.slice(0, portrait ? 3 : 2)
}

const getTypeLabel = type => {
  if (type === 'professional') return 'Selected work'

  if (type === 'community') return 'Community work'

  if (type === 'experimental') return 'Experiment'

  return 'Independent project'
}

const getLogoBox = (project, variant) => {
  let box

  if (variant.kind === 'hero' || variant.kind === 'portrait') {
    // Keep the complete mark inside the center crop used by square portfolio cards.
    const size = Math.min(variant.width, variant.height)
    const scale = project.logoScale ?? 1
    const width = Math.round(size * Math.min(0.92, (project.logoAspect === 'wide' ? 0.92 : 0.58) * scale))
    const height = Math.round(size * Math.min(0.84, (project.logoAspect === 'tall' ? 0.66 : 0.58) * scale))

    return {
      height,
      left: Math.round((variant.width - width) / 2),
      padding: 0,
      top: Math.round((variant.height - height) / 2),
      width
    }
  } else {
    box = {
      height: Math.round(variant.height * 0.62),
      left: Math.round(variant.width * 0.61),
      top: Math.round(variant.height * 0.16),
      width: Math.round(variant.width * 0.31)
    }
  }

  const paddingRatio = project.logoAspect === 'wide' ? 0.06 : 0.08

  return { ...box, padding: Math.round(Math.min(box.width, box.height) * paddingRatio) }
}

const getLogoSurface = project => project.logoSurface === 'light' ? '#f8f5ff' : project.brand.surface

const buildTechnologyMarkup = (technologies, x, y, fontSize, accent) => technologies
  .map((technology, index) => {
    const width = Math.max(150, (technology.length * fontSize * 0.64) + 58)

    const offset = technologies
      .slice(0, index)
      .reduce((total, item) => total + Math.max(150, (item.length * fontSize * 0.64) + 58) + 18, 0)

    return `
      <g transform="translate(${x + offset} ${y})">
        <rect width="${width}" height="${fontSize * 1.9}" rx="${fontSize}" fill="${accent}" fill-opacity="0.26" stroke="${accent}" stroke-opacity="0.72" />
        <text x="${width / 2}" y="${fontSize * 1.28}" text-anchor="middle" class="chip">${escapeXml(technology)}</text>
      </g>
    `
  })
  .join('')

// A quiet, solid center keeps logos sharp; color and geometry stay at the edges.
const buildSceneSvg = (project, variant) => {
  const { height, width } = variant
  const surface = getLogoSurface(project)
  const line = project.logoSurface === 'light' ? project.brand.surface : project.brand.secondary

  return `
    <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="fold" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="${project.brand.primary}" stop-opacity="0.32" />
          <stop offset="1" stop-color="${project.brand.primary}" stop-opacity="0.08" />
        </linearGradient>
        <linearGradient id="edge" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="${project.brand.primary}" stop-opacity="0.72" />
          <stop offset="1" stop-color="${project.brand.primary}" stop-opacity="0.16" />
        </linearGradient>
      </defs>
      <rect width="100%" height="100%" fill="${surface}" />
      <path d="M${width * 0.88} 0H${width}V${height}H${width * 0.92}L${width * 0.78} ${height * 0.5}Z" fill="url(#fold)" />
      <path d="M${width * 0.94} 0H${width * 0.95}L${width * 0.86} ${height * 0.5}L${width} ${height * 0.82}V${height * 0.9}L${width * 0.84} ${height * 0.5}Z" fill="url(#edge)" />
      <path d="M0 ${height * 0.7}L${width * 0.22} ${height}H0Z" fill="${project.brand.primary}" fill-opacity="0.09" />
      <path d="M0 ${height * 0.66}L${width * 0.26} ${height}" fill="none" stroke="${line}" stroke-opacity="0.18" stroke-width="2" />
    </svg>
  `
}

const buildThumbnailSvg = (project, variant, logoBox) => {
  const scale = variant.width / 1600
  const readableAccent = getReadableAccent(project.brand.primary, project.brand.surface)
  const readableFooterAccent = getReadableAccent(project.brand.primary, project.brand.surface)
  const titleX = Math.round(112 * scale)
  const titleY = Math.round(470 * scale)
  const titleSize = Math.round(92 * scale)
  const titleLines = splitTitle(project.title, false)
  const lineHeight = titleSize * 1.04

  const titleMarkup = titleLines.map((line, index) => `
    <text x="${titleX}" y="${titleY + (index * lineHeight)}" class="title">${escapeXml(line)}</text>
  `).join('')

  const eyebrowY = Math.round(365 * scale)
  const roleY = titleY + (titleLines.length * lineHeight) + (46 * scale)
  const chipY = roleY + (72 * scale)
  const chipSize = Math.round(25 * scale)
  const fontUrl = new URL(`file://${FONT_PATH}`).href

  return `
    <svg width="${variant.width}" height="${variant.height}" viewBox="0 0 ${variant.width} ${variant.height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <style>
          @font-face { font-family: 'Project Montserrat'; src: url('${fontUrl}'); font-weight: 700; }
          text { font-family: 'Project Montserrat', Montserrat, Arial, sans-serif; }
          .eyebrow { fill: ${project.brand.primary}; font-size: ${Math.round(25 * scale)}px; font-weight: 700; letter-spacing: 0.17em; }
          .title { fill: #fbf8ff; font-size: ${titleSize}px; font-weight: 700; letter-spacing: -0.045em; }
          .role { fill: #c9bfd8; font-size: ${Math.round(30 * scale)}px; font-weight: 700; }
          .chip { fill: #ece5f7; font-size: ${chipSize}px; font-weight: 700; }
          .project-label { fill: ${readableAccent}; }
          .footer-label { fill: ${readableFooterAccent}; paint-order: stroke; stroke: ${project.brand.surface}; stroke-opacity: 0.72; stroke-width: 2px; }
        </style>
      </defs>

      ${buildSceneSvg({ ...project, logoSurface: 'dark' }, variant)}
      ${project.logoSurface === 'light' ?
        `
        <rect x="${logoBox.left}" y="${logoBox.top}" width="${logoBox.width}" height="${logoBox.height}" rx="${Math.round(24 * scale)}" fill="${getLogoSurface(project)}" />
      ` :
        ''}

      <text x="${titleX}" y="${eyebrowY}" class="eyebrow project-label">${escapeXml(getTypeLabel(project.type).toUpperCase())}</text>
      ${titleMarkup}
      <text x="${titleX}" y="${roleY}" class="role">${escapeXml(project.role)}</text>
      ${buildTechnologyMarkup(project.technologies, titleX, chipY, chipSize, readableAccent)}
      <text x="${variant.width - Math.round(86 * scale)}" y="${variant.height - Math.round(64 * scale)}" text-anchor="end" class="eyebrow footer-label">SANTI020K / PORTFOLIO</text>
    </svg>
  `
}

export const buildProjectSvg = (project, variant) => variant.kind === 'thumbnail' ?
  buildThumbnailSvg(project, variant, getLogoBox(project, variant)) :
  buildSceneSvg(project, variant)

const buildLogoComposite = async (project, logoBox) => {
  const width = logoBox.width - (logoBox.padding * 2)
  const height = logoBox.height - (logoBox.padding * 2)
  const logo = await openLogo(project.logoPath)

  const input = await logo
    .extract(project.logoBounds)
    .resize(width, height, {
      background: { alpha: 0, b: 0, g: 0, r: 0 },
      fit: 'contain',
      withoutEnlargement: false
    })
    .png()
    .toBuffer()

  return {
    input,
    left: logoBox.left + logoBox.padding,
    top: logoBox.top + logoBox.padding
  }
}

export const renderProjectImage = async (project, variant) => {
  const logoBox = getLogoBox(project, variant)
  const background = Buffer.from(buildProjectSvg(project, variant))
  const outputPath = path.join(project.directory, variant.fileName)

  const image = variant.kind === 'background' ?
    sharp(background) :
    sharp(background).composite([await buildLogoComposite(project, logoBox)])

  await image
    .webp({ effort: 6, quality: 90, smartSubsample: true })
    .toFile(outputPath)

  return outputPath
}

export const getProjectImageVariants = project => IMAGE_VARIANTS
  .filter(variant => variant.kind !== 'background' || project.background)

/**
 * @param {{ projectsRoot?: string, slugs?: string[] }} [options]
 */
export const generateProjectImages = async ({ projectsRoot = PROJECTS_ROOT, slugs = [] } = {}) => {
  const projects = await discoverProjects(projectsRoot)
  const unknownSlugs = slugs.filter(slug => !projects.some(project => project.slug === slug))

  if (unknownSlugs.length > 0) {
    throw new Error(`Unknown project slug(s): ${unknownSlugs.join(', ')}`)
  }

  const selected = slugs.length > 0 ?
    projects.filter(project => slugs.includes(project.slug)) :
    projects

  const outputs = []

  for (const project of selected) {
    for (const variant of getProjectImageVariants(project)) {
      outputs.push(await renderProjectImage(project, variant))
    }
  }

  return outputs
}

const main = async () => {
  const slugs = process.argv.slice(2).filter(argument => argument !== '--')
  const outputs = await generateProjectImages({ slugs })

  for (const output of outputs) console.log(`generated ${path.relative(ROOT, output)}`)
}

if (process.argv[1] && path.resolve(process.argv[1]) === SCRIPT_PATH) await main()
