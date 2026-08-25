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
  { fileName: 'cover.webp', height: 1000, kind: 'landscape', width: 1600 },
  { fileName: 'cover-horizontal.webp', height: 1350, kind: 'landscape', width: 2400 },
  { fileName: 'cover-vertical.webp', height: 1600, kind: 'portrait', width: 1200 }
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

const rgbToHsl = ({ blue, green, red }) => {
  const r = red / 255
  const g = green / 255
  const b = blue / 255
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const lightness = (max + min) / 2
  const delta = max - min

  if (delta === 0) return { lightness, saturation: 0 }

  const saturation = delta / (1 - Math.abs((2 * lightness) - 1))

  return { lightness, saturation }
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

    return {
      accent: await getLogoAccent(logoPath, getFallbackAccent(slug)),
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

const splitTitle = (title, portrait) => {
  const limit = portrait ? 14 : 20
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
  const portrait = variant.kind === 'portrait'

  const box = portrait ?
    { height: 580, left: 120, top: 150, width: 960 } :
    {
      height: Math.round(variant.height * 0.62),
      left: Math.round(variant.width * 0.61),
      top: Math.round(variant.height * 0.16),
      width: Math.round(variant.width * 0.31)
    }

  const paddingRatio = project.logoAspect === 'wide' ? 0.12 : 0.2

  return { ...box, padding: Math.round(Math.min(box.width, box.height) * paddingRatio) }
}

const getLogoSurface = project => project.logoSurface === 'light' ? '#f8f5ff' : '#0d0815'

const buildTechnologyMarkup = (technologies, x, y, fontSize, accent) => technologies
  .map((technology, index) => {
    const width = Math.max(150, (technology.length * fontSize * 0.64) + 58)

    const offset = technologies
      .slice(0, index)
      .reduce((total, item) => total + Math.max(150, (item.length * fontSize * 0.64) + 58) + 18, 0)

    return `
      <g transform="translate(${x + offset} ${y})">
        <rect width="${width}" height="${fontSize * 1.9}" rx="${fontSize}" fill="${accent}" fill-opacity="0.12" stroke="${accent}" stroke-opacity="0.34" />
        <text x="${width / 2}" y="${fontSize * 1.28}" text-anchor="middle" class="chip">${escapeXml(technology)}</text>
      </g>
    `
  })
  .join('')

const buildBackgroundSvg = (project, variant, logoBox) => {
  const portrait = variant.kind === 'portrait'
  const scale = variant.width / (portrait ? 1200 : 1600)
  const titleX = portrait ? 92 : Math.round(112 * scale)
  const titleY = portrait ? 965 : Math.round(470 * scale)
  const titleSize = portrait ? 88 : Math.round(92 * scale)
  const titleLines = splitTitle(project.title, portrait)
  const lineHeight = titleSize * 1.04

  const titleMarkup = titleLines.map((line, index) => `
    <text x="${titleX}" y="${titleY + (index * lineHeight)}" class="title">${escapeXml(line)}</text>
  `).join('')

  const eyebrowY = portrait ? 875 : Math.round(365 * scale)
  const roleY = titleY + (titleLines.length * lineHeight) + (portrait ? 56 : 46 * scale)
  const chipY = roleY + (portrait ? 78 : 72 * scale)
  const chipSize = portrait ? 25 : Math.round(25 * scale)
  const fontUrl = new URL(`file://${FONT_PATH}`).href

  return `
    <svg width="${variant.width}" height="${variant.height}" viewBox="0 0 ${variant.width} ${variant.height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <style>
          @font-face { font-family: 'Project Montserrat'; src: url('${fontUrl}'); font-weight: 700; }
          text { font-family: 'Project Montserrat', Montserrat, Arial, sans-serif; }
          .eyebrow { fill: ${project.accent}; font-size: ${portrait ? 25 : Math.round(25 * scale)}px; font-weight: 700; letter-spacing: 0.17em; }
          .title { fill: #fbf8ff; font-size: ${titleSize}px; font-weight: 700; letter-spacing: -0.045em; }
          .role { fill: #c9bfd8; font-size: ${portrait ? 31 : Math.round(30 * scale)}px; font-weight: 700; }
          .chip { fill: #ece5f7; font-size: ${chipSize}px; font-weight: 700; }
        </style>
        <pattern id="grid" width="64" height="64" patternUnits="userSpaceOnUse">
          <path d="M64 0H0V64" fill="none" stroke="#bca9d9" stroke-opacity="0.065" stroke-width="1" />
        </pattern>
        <radialGradient id="accent-glow" cx="72%" cy="28%" r="62%">
          <stop offset="0" stop-color="${project.accent}" stop-opacity="0.33" />
          <stop offset="1" stop-color="${project.accent}" stop-opacity="0" />
        </radialGradient>
        <radialGradient id="brand-glow" cx="12%" cy="88%" r="72%">
          <stop offset="0" stop-color="#8747ff" stop-opacity="0.30" />
          <stop offset="1" stop-color="#8747ff" stop-opacity="0" />
        </radialGradient>
        <linearGradient id="beam" x1="0" y1="1" x2="1" y2="0">
          <stop offset="0" stop-color="#8747ff" stop-opacity="0.42" />
          <stop offset="1" stop-color="${project.accent}" stop-opacity="0.06" />
        </linearGradient>
        <filter id="shadow" x="-30%" y="-30%" width="160%" height="180%">
          <feDropShadow dx="0" dy="24" stdDeviation="32" flood-color="#050208" flood-opacity="0.46" />
        </filter>
      </defs>

      <rect width="100%" height="100%" fill="#10091c" />
      <rect width="100%" height="100%" fill="url(#grid)" />
      <rect width="100%" height="100%" fill="url(#accent-glow)" />
      <rect width="100%" height="100%" fill="url(#brand-glow)" />
      <path d="M0 ${variant.height * 0.84} C ${variant.width * 0.24} ${variant.height * 0.66}, ${variant.width * 0.54} ${variant.height * 1.02}, ${variant.width} ${variant.height * 0.68} V ${variant.height} H0Z" fill="url(#beam)" />
      <circle cx="${variant.width * 0.88}" cy="${variant.height * 0.13}" r="${variant.width * 0.18}" fill="none" stroke="${project.accent}" stroke-opacity="0.17" stroke-width="2" />
      <circle cx="${variant.width * 0.88}" cy="${variant.height * 0.13}" r="${variant.width * 0.12}" fill="none" stroke="#f5efff" stroke-opacity="0.08" stroke-width="2" />

      <g filter="url(#shadow)">
        <rect x="${logoBox.left}" y="${logoBox.top}" width="${logoBox.width}" height="${logoBox.height}" rx="${portrait ? 62 : Math.round(42 * scale)}" fill="${getLogoSurface(project)}" fill-opacity="0.88" stroke="#ffffff" stroke-opacity="0.15" stroke-width="2" />
        <rect x="${logoBox.left + 2}" y="${logoBox.top + 2}" width="${logoBox.width - 4}" height="${logoBox.height - 4}" rx="${portrait ? 60 : Math.round(40 * scale)}" fill="none" stroke="${project.accent}" stroke-opacity="0.13" stroke-width="2" />
      </g>

      <text x="${titleX}" y="${eyebrowY}" class="eyebrow">${escapeXml(getTypeLabel(project.type).toUpperCase())}</text>
      ${titleMarkup}
      <text x="${titleX}" y="${roleY}" class="role">${escapeXml(project.role)}</text>
      ${buildTechnologyMarkup(project.technologies, titleX, chipY, chipSize, project.accent)}
      <text x="${variant.width - (portrait ? 92 : Math.round(86 * scale))}" y="${variant.height - (portrait ? 74 : Math.round(64 * scale))}" text-anchor="end" class="eyebrow">SANTI020K / PORTFOLIO</text>
    </svg>
  `
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
  const background = Buffer.from(buildBackgroundSvg(project, variant, logoBox))
  const logo = await buildLogoComposite(project, logoBox)
  const outputPath = path.join(project.directory, variant.fileName)

  await sharp(background)
    .composite([logo])
    .webp({ effort: 6, quality: 90, smartSubsample: true })
    .toFile(outputPath)

  return outputPath
}

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
    for (const variant of IMAGE_VARIANTS) {
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
