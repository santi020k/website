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

export const discoverProjects = async (projectsRoot = PROJECTS_ROOT) => {
  const entries = await fs.readdir(projectsRoot, { withFileTypes: true })

  const directories = entries
    .filter(entry => entry.isDirectory())
    .map(entry => entry.name)
    .sort()

  return Promise.all(directories.map(async slug => {
    const directory = path.join(projectsRoot, slug)
    const source = await fs.readFile(path.join(directory, 'index.md'), 'utf8')
    const frontmatter = parseFrontmatter(source)
    const title = getString(frontmatter, 'title')
    const description = getString(frontmatter, 'description')
    const coverImage = frontmatter.coverImage

    if (!title || !description || !isRecord(coverImage)) {
      throw new Error(`${slug}: title, description, and coverImage are required`)
    }

    const logoPath = resolveLogoPath(directory, coverImage)

    await fs.access(logoPath)

    const brand = await getBrandPalette(frontmatter, logoPath, slug)

    return {
      accent: brand.primary,
      background: getString(coverImage, 'background'),
      brand,
      description,
      directory,
      logoAspect: getString(coverImage, 'logoAspect') ?? 'square',
      logoPath,
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

  if (type === 'experimental') return 'Experiment'

  return 'Independent project'
}

const getLogoBox = (project, variant) => {
  let box

  if (variant.kind === 'hero') {
    box = { height: 720, left: 840, top: 190, width: 720 }
  } else if (variant.kind === 'portrait') {
    box = { height: 650, left: 220, top: 130, width: 760 }
  } else {
    box = {
      height: Math.round(variant.height * 0.62),
      left: Math.round(variant.width * 0.61),
      top: Math.round(variant.height * 0.16),
      width: Math.round(variant.width * 0.31)
    }
  }

  const paddingRatio = project.logoAspect === 'wide' ? 0.12 : 0.2

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
        <pattern id="grid" width="64" height="64" patternUnits="userSpaceOnUse">
          <path d="M64 0H0V64" fill="none" stroke="#bca9d9" stroke-opacity="0.065" stroke-width="1" />
        </pattern>
        <radialGradient id="accent-glow" cx="72%" cy="28%" r="62%">
          <stop offset="0" stop-color="${project.brand.primary}" stop-opacity="0.33" />
          <stop offset="1" stop-color="${project.brand.primary}" stop-opacity="0" />
        </radialGradient>
        <radialGradient id="brand-glow" cx="12%" cy="88%" r="72%">
          <stop offset="0" stop-color="${project.brand.secondary}" stop-opacity="0.30" />
          <stop offset="1" stop-color="${project.brand.secondary}" stop-opacity="0" />
        </radialGradient>
        <linearGradient id="beam" x1="0" y1="1" x2="1" y2="0">
          <stop offset="0" stop-color="${project.brand.secondary}" stop-opacity="0.42" />
          <stop offset="1" stop-color="${project.brand.primary}" stop-opacity="0.06" />
        </linearGradient>
        <filter id="shadow" x="-30%" y="-30%" width="160%" height="180%">
          <feDropShadow dx="0" dy="24" stdDeviation="32" flood-color="#050208" flood-opacity="0.46" />
        </filter>
      </defs>

      <rect width="100%" height="100%" fill="${project.brand.surface}" />
      <rect width="100%" height="100%" fill="url(#grid)" />
      <rect width="100%" height="100%" fill="url(#accent-glow)" />
      <rect width="100%" height="100%" fill="url(#brand-glow)" />
      <path d="M0 ${variant.height * 0.84} C ${variant.width * 0.24} ${variant.height * 0.66}, ${variant.width * 0.54} ${variant.height * 1.02}, ${variant.width} ${variant.height * 0.68} V ${variant.height} H0Z" fill="url(#beam)" />
      <circle cx="${variant.width * 0.88}" cy="${variant.height * 0.13}" r="${variant.width * 0.18}" fill="none" stroke="${project.brand.primary}" stroke-opacity="0.17" stroke-width="2" />
      <circle cx="${variant.width * 0.88}" cy="${variant.height * 0.13}" r="${variant.width * 0.12}" fill="none" stroke="#f5efff" stroke-opacity="0.08" stroke-width="2" />

      <g filter="url(#shadow)">
        <rect x="${logoBox.left}" y="${logoBox.top}" width="${logoBox.width}" height="${logoBox.height}" rx="${Math.round(42 * scale)}" fill="${getLogoSurface(project)}" fill-opacity="0.88" stroke="#ffffff" stroke-opacity="0.15" stroke-width="2" />
        <rect x="${logoBox.left + 2}" y="${logoBox.top + 2}" width="${logoBox.width - 4}" height="${logoBox.height - 4}" rx="${Math.round(40 * scale)}" fill="none" stroke="${project.brand.primary}" stroke-opacity="0.13" stroke-width="2" />
      </g>

      <text x="${titleX}" y="${eyebrowY}" class="eyebrow project-label">${escapeXml(getTypeLabel(project.type).toUpperCase())}</text>
      ${titleMarkup}
      <text x="${titleX}" y="${roleY}" class="role">${escapeXml(project.role)}</text>
      ${buildTechnologyMarkup(project.technologies, titleX, chipY, chipSize, readableAccent)}
      <text x="${variant.width - Math.round(86 * scale)}" y="${variant.height - Math.round(64 * scale)}" text-anchor="end" class="eyebrow footer-label">SANTI020K / PORTFOLIO</text>
    </svg>
  `
}

const buildSceneDefinitions = project => `
  <defs>
    <pattern id="grid" width="72" height="72" patternUnits="userSpaceOnUse">
      <path d="M72 0H0V72" fill="none" stroke="#c9b8e5" stroke-opacity="0.055" stroke-width="1" />
    </pattern>
    <radialGradient id="accent-glow" cx="50%" cy="42%" r="62%">
      <stop offset="0" stop-color="${project.brand.primary}" stop-opacity="0.42" />
      <stop offset="1" stop-color="${project.brand.primary}" stop-opacity="0" />
    </radialGradient>
    <radialGradient id="brand-glow" cx="18%" cy="74%" r="78%">
      <stop offset="0" stop-color="${project.brand.secondary}" stop-opacity="0.34" />
      <stop offset="1" stop-color="${project.brand.secondary}" stop-opacity="0" />
    </radialGradient>
    <linearGradient id="horizon" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${project.brand.secondary}" stop-opacity="0.34" />
      <stop offset="1" stop-color="${project.brand.primary}" stop-opacity="0.07" />
    </linearGradient>
    <filter id="shadow" x="-35%" y="-35%" width="170%" height="190%">
      <feDropShadow dx="0" dy="34" stdDeviation="42" flood-color="#030106" flood-opacity="0.56" />
    </filter>
    <filter id="soft-glow" x="-100%" y="-100%" width="300%" height="300%">
      <feGaussianBlur stdDeviation="28" />
    </filter>
  </defs>
`

const buildHeroSvg = (project, variant, logoBox, includeLogo = true) => `
  <svg width="${variant.width}" height="${variant.height}" viewBox="0 0 ${variant.width} ${variant.height}" xmlns="http://www.w3.org/2000/svg">
    ${buildSceneDefinitions(project)}

    <rect width="100%" height="100%" fill="${project.brand.surface}" />
    <rect width="100%" height="100%" fill="url(#grid)" />
    <rect width="100%" height="100%" fill="url(#accent-glow)" />
    <rect width="100%" height="100%" fill="url(#brand-glow)" />

    <ellipse cx="1200" cy="515" rx="670" ry="420" fill="none" stroke="${project.brand.primary}" stroke-opacity="0.18" stroke-width="3" />
    <ellipse cx="1200" cy="515" rx="840" ry="525" fill="none" stroke="#ffffff" stroke-opacity="0.055" stroke-width="2" />
    <circle cx="1200" cy="515" r="390" fill="${project.brand.primary}" fill-opacity="0.10" filter="url(#soft-glow)" />

    <g opacity="0.72">
      <rect x="180" y="245" width="390" height="245" rx="34" fill="#ffffff" fill-opacity="0.035" stroke="#ffffff" stroke-opacity="0.10" stroke-width="2" />
      <circle cx="232" cy="300" r="12" fill="${project.brand.primary}" fill-opacity="0.80" />
      <path d="M280 300H480M232 360H500M232 410H420" stroke="#ffffff" stroke-opacity="0.13" stroke-width="16" stroke-linecap="round" />
      <rect x="1850" y="330" width="370" height="210" rx="32" fill="#ffffff" fill-opacity="0.03" stroke="#ffffff" stroke-opacity="0.09" stroke-width="2" />
      <path d="M1910 395H2140M1910 455H2070" stroke="#ffffff" stroke-opacity="0.13" stroke-width="16" stroke-linecap="round" />
      <circle cx="2145" cy="455" r="16" fill="${project.brand.primary}" fill-opacity="0.68" />
    </g>

    <path d="M0 1005 C430 790 760 1135 1200 930 C1610 740 1920 970 2400 690 V1350H0Z" fill="url(#horizon)" />
    <path d="M0 1130 C520 935 790 1220 1240 1040 C1710 850 2040 1060 2400 860" fill="none" stroke="#ffffff" stroke-opacity="0.07" stroke-width="3" />

    ${includeLogo ?
      `
      <g filter="url(#shadow)">
        <rect x="${logoBox.left}" y="${logoBox.top}" width="${logoBox.width}" height="${logoBox.height}" rx="72" fill="${getLogoSurface(project)}" fill-opacity="0.90" stroke="#ffffff" stroke-opacity="0.17" stroke-width="3" />
        <rect x="${logoBox.left + 3}" y="${logoBox.top + 3}" width="${logoBox.width - 6}" height="${logoBox.height - 6}" rx="69" fill="none" stroke="${project.brand.primary}" stroke-opacity="0.18" stroke-width="3" />
      </g>
    ` :
      ''}

    <rect y="1040" width="2400" height="310" fill="#07040d" fill-opacity="0.30" />
  </svg>
`

const buildPortraitSvg = (project, variant, logoBox) => `
  <svg width="${variant.width}" height="${variant.height}" viewBox="0 0 ${variant.width} ${variant.height}" xmlns="http://www.w3.org/2000/svg">
    ${buildSceneDefinitions(project)}

    <rect width="100%" height="100%" fill="${project.brand.surface}" />
    <rect width="100%" height="100%" fill="url(#grid)" />
    <rect width="100%" height="100%" fill="url(#accent-glow)" />
    <rect width="100%" height="100%" fill="url(#brand-glow)" />

    <circle cx="600" cy="450" r="440" fill="none" stroke="${project.brand.primary}" stroke-opacity="0.14" stroke-width="3" />
    <circle cx="600" cy="450" r="350" fill="${project.brand.primary}" fill-opacity="0.10" filter="url(#soft-glow)" />

    <g filter="url(#shadow)">
      <rect x="${logoBox.left}" y="${logoBox.top}" width="${logoBox.width}" height="${logoBox.height}" rx="64" fill="${getLogoSurface(project)}" fill-opacity="0.90" stroke="#ffffff" stroke-opacity="0.17" stroke-width="3" />
      <rect x="${logoBox.left + 3}" y="${logoBox.top + 3}" width="${logoBox.width - 6}" height="${logoBox.height - 6}" rx="61" fill="none" stroke="${project.brand.primary}" stroke-opacity="0.18" stroke-width="3" />
    </g>

    <path d="M600 780V930M330 1110H870M330 1110V1210M600 930V1210M870 1110V1210" fill="none" stroke="${project.brand.primary}" stroke-opacity="0.40" stroke-width="7" stroke-linecap="round" />
    <circle cx="600" cy="930" r="18" fill="${project.brand.primary}" />
    <circle cx="330" cy="1110" r="14" fill="#fbf8ff" fill-opacity="0.62" />
    <circle cx="870" cy="1110" r="14" fill="#fbf8ff" fill-opacity="0.62" />

    <g opacity="0.82">
      <rect x="115" y="1210" width="350" height="230" rx="38" fill="#ffffff" fill-opacity="0.045" stroke="#ffffff" stroke-opacity="0.12" stroke-width="2" />
      <rect x="425" y="1160" width="350" height="270" rx="38" fill="${project.brand.primary}" fill-opacity="0.075" stroke="${project.brand.primary}" stroke-opacity="0.20" stroke-width="2" />
      <rect x="735" y="1210" width="350" height="230" rx="38" fill="#ffffff" fill-opacity="0.045" stroke="#ffffff" stroke-opacity="0.12" stroke-width="2" />
      <path d="M175 1280H390M175 1340H330M485 1240H710M485 1300H665M795 1280H1025M795 1340H960" stroke="#ffffff" stroke-opacity="0.14" stroke-width="15" stroke-linecap="round" />
    </g>

    <path d="M0 1440 C260 1320 470 1530 690 1430 C900 1335 1030 1410 1200 1325 V1600H0Z" fill="url(#horizon)" />
  </svg>
`

export const buildProjectSvg = (project, variant) => {
  const logoBox = getLogoBox(project, variant)

  if (variant.kind === 'background') return buildHeroSvg(project, variant, logoBox, false)

  if (variant.kind === 'hero') return buildHeroSvg(project, variant, logoBox)

  if (variant.kind === 'portrait') return buildPortraitSvg(project, variant, logoBox)

  return buildThumbnailSvg(project, variant, logoBox)
}

const buildLogoComposite = async (project, logoBox) => {
  const width = logoBox.width - (logoBox.padding * 2)
  const height = logoBox.height - (logoBox.padding * 2)

  const input = await sharp(project.logoPath)
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
