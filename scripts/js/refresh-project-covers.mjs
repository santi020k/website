import fs from 'node:fs/promises'
import path from 'node:path'
import sharp from 'sharp'

const PROJECTS_ROOT = path.resolve('src/content/project')
const CANVAS_WIDTH = 3200
const CANVAS_HEIGHT = 2000
const PANEL_WIDTH = 1280
const PANEL_HEIGHT = 1520
const PANEL_X = 1820
const PANEL_Y = 220
const LIGHT_SURFACE = '#f4efe7'
const LIGHT_PANEL = '#ded8cd'
const LIGHT_GRID = 'rgba(17, 17, 17, 0.065)'
const DARK_GRID = 'rgba(255, 255, 255, 0.06)'
const STANDARD_WORDMARK_PLACEMENT = { left: 150, top: 330, width: 1360, height: 540 }
const STANDARD_STACK_PLACEMENT = { left: 190, top: 200, width: 1100, height: 940 }
const STANDARD_BADGE_PLACEMENT = { left: 250, top: 220, width: 1000, height: 920 }
const _FEATURED_WORDMARK_PLACEMENT = { left: 140, top: 330, width: 1500, height: 560 }

const PROJECTS = [
  {
    slug: 'xgames',
    alt: 'X Games vertical logo on a branded red, charcoal, and ivory geometric cover',
    variant: 'light',
    accent: '#f31c45',
    accentDeep: '#a90f2b',
    surface: LIGHT_SURFACE,
    ink: '#101216',
    panel: '#181b20',
    texture: '#ffd1d9',
    logoPath: 'logo.svg',
    logoDensity: 720,
    placement: { left: 360, top: 232, width: 560, height: 620 },
    shadowBlur: 4.5,
    shadowOpacity: 0.08,
    shadowOffsetX: 12,
    shadowOffsetY: 16
  },
  {
    slug: 'datagran',
    alt: 'Datagran logo on a charcoal and neon green geometric cover',
    variant: 'dark',
    accent: '#06ef7e',
    accentDeep: '#049c57',
    surface: '#1f2125',
    ink: '#0d0f12',
    panel: '#13161a',
    texture: '#a6ffd5',
    logoRect: { left: 0, top: 540, width: 3840, height: 1040 },
    backgroundColor: '#3b3b3b',
    threshold: 14,
    placement: { left: 110, top: 330, width: 1500, height: 560 }
  },
  {
    slug: 'eslint-config-basic',
    alt: '@santi020k/eslint-config-basic badge on an indigo and lilac geometric cover',
    variant: 'dark',
    accent: '#9b87ff',
    accentDeep: '#6151d5',
    surface: '#1a1d30',
    ink: '#0d1020',
    panel: '#111426',
    texture: '#d8d1ff',
    logoRect: { left: 1040, top: 250, width: 1760, height: 1500 },
    backgroundColor: '#24273a',
    threshold: 32,
    placement: { ...STANDARD_BADGE_PLACEMENT }
  },
  {
    slug: 'eslint-config-santi020k',
    alt: '@santi020k/eslint-config-santi020k badge on an indigo and violet geometric cover',
    variant: 'dark',
    accent: '#b39dff',
    accentDeep: '#6f61e9',
    surface: '#1b1d32',
    ink: '#0d1020',
    panel: '#101326',
    texture: '#e4dcff',
    logoRect: { left: 1040, top: 250, width: 1760, height: 1500 },
    backgroundColor: '#24273a',
    threshold: 32,
    placement: { ...STANDARD_BADGE_PLACEMENT }
  },
  {
    slug: 'justbit',
    alt: 'Justbit logo on a teal and charcoal geometric cover',
    variant: 'dark',
    accent: '#4bbeb0',
    accentDeep: '#1c8d85',
    surface: '#172429',
    ink: '#0e1518',
    panel: '#122126',
    texture: '#cdf6ef',
    logoRect: { left: 700, top: 300, width: 2500, height: 1500 },
    backgroundColor: '#49bcae',
    threshold: 22,
    placement: { left: 180, top: 210, width: 1100, height: 950 },
    shadowBlur: 5.5,
    shadowOpacity: 0.14
  },
  {
    slug: 'nebular',
    alt: 'Nebular logo on a graphite and silver geometric cover',
    variant: 'dark',
    accent: '#d4d9df',
    accentDeep: '#88919a',
    surface: '#2a2d33',
    ink: '#16181d',
    panel: '#1d2026',
    texture: '#eff2f5',
    logoRect: { left: 930, top: 250, width: 1800, height: 1550 },
    backgroundColor: '#7f8084',
    threshold: 22,
    placement: { left: 160, top: 150, width: 1180, height: 1020 },
    shadowBlur: 5.5,
    shadowOpacity: 0.14
  },
  {
    slug: 'optic-power',
    alt: 'Codepwr logo on a navy, cyan, and ivory geometric cover',
    variant: 'light',
    accent: '#1496b4',
    accentDeep: '#0b627d',
    surface: LIGHT_SURFACE,
    ink: '#0b4264',
    panel: LIGHT_PANEL,
    texture: '#0d6f88',
    logoRect: { left: 500, top: 600, width: 2850, height: 920 },
    backgroundColor: '#fbfbfa',
    threshold: 14,
    placement: { left: 140, top: 330, width: 1400, height: 540 }
  },
  {
    slug: 'pads',
    alt: 'PADS wordmark on a magenta and charcoal geometric cover',
    variant: 'dark',
    accent: '#ef008c',
    accentDeep: '#a10061',
    surface: '#201018',
    ink: '#120914',
    panel: '#170b14',
    texture: '#ffc5e4',
    logoRect: { left: 680, top: 690, width: 2470, height: 920 },
    backgroundColor: '#ef008c',
    threshold: 24,
    placement: { left: 150, top: 340, width: 1280, height: 520 }
  },
  {
    slug: 'react-js-colombia',
    alt: 'ReactJS Colombia logo on a midnight blue geometric cover with yellow and blue accents',
    variant: 'dark',
    accent: '#ffd84a',
    accentDeep: '#1e6cdc',
    surface: '#0b1017',
    ink: '#060a10',
    panel: '#0d141d',
    texture: '#b8ddff',
    logoRect: { left: 1160, top: 280, width: 1500, height: 1060 },
    backgroundColor: '#030507',
    threshold: 26,
    placement: { left: 250, top: 210, width: 1000, height: 920 }
  },
  {
    slug: 'tedx-medellin',
    alt: 'TEDx Medellin wordmark on a red and charcoal geometric cover',
    variant: 'dark',
    accent: '#eb0028',
    accentDeep: '#870017',
    surface: '#111417',
    ink: '#07090c',
    panel: '#0d1014',
    texture: '#ffd2da',
    placement: { left: 92, top: 250, width: 1620, height: 620 },
    customLogoBuilder: 'tedx-medellin'
  },
  {
    slug: 'smith-commerce',
    alt: 'Smith Commerce wordmark on an orange and charcoal geometric cover',
    variant: 'dark',
    accent: '#ff6b00',
    accentDeep: '#d54c00',
    surface: '#23170f',
    ink: '#120b06',
    panel: '#1b120c',
    texture: '#ffd6bd',
    logoRect: { left: 220, top: 640, width: 3400, height: 980 },
    backgroundColor: '#ff6500',
    threshold: 20,
    placement: { left: 340, top: 330, width: 1220, height: 540 }
  },
  {
    slug: 'void',
    alt: 'VOID logo on an indigo and cobalt geometric cover',
    variant: 'dark',
    accent: '#6259ef',
    accentDeep: '#332ea8',
    surface: '#17192e',
    ink: '#0f1121',
    panel: '#111325',
    texture: '#dcd8ff',
    logoRect: { left: 420, top: 460, width: 3000, height: 1180 },
    backgroundColor: '#5d5ae6',
    threshold: 24,
    placement: { left: 150, top: 340, width: 1280, height: 520 }
  }
]

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max)
}

function hexToRgb(hex) {
  const normalized = hex.replace('#', '')

  const value = normalized.length === 3 ?
    normalized.split('').map(part => `${part}${part}`).join('') :
    normalized

  const number = Number.parseInt(value, 16)

  return {
    r: (number >> 16) & 255,
    g: (number >> 8) & 255,
    b: number & 255
  }
}

function rgbToHex({ r, g, b }) {
  return `#${[r, g, b].map(channel => channel.toString(16).padStart(2, '0')).join('')}`
}

function hexToRgba(hex, opacity) {
  const { r, g, b } = hexToRgb(hex)

  return `rgba(${r}, ${g}, ${b}, ${opacity})`
}

function mix(hexA, hexB, ratio) {
  const a = hexToRgb(hexA)
  const b = hexToRgb(hexB)
  const weight = clamp(ratio, 0, 1)

  return rgbToHex({
    r: Math.round(a.r * (1 - weight) + b.r * weight),
    g: Math.round(a.g * (1 - weight) + b.g * weight),
    b: Math.round(a.b * (1 - weight) + b.b * weight)
  })
}

async function ensureBackupFile(originalPath, backupPath) {
  try {
    await fs.access(backupPath)
  } catch {
    await fs.copyFile(originalPath, backupPath)
  }
}

async function readRawImage(inputPathOrBuffer) {
  const image = sharp(inputPathOrBuffer).ensureAlpha()
  const metadata = await image.metadata()
  const raw = await image.raw().toBuffer()

  return {
    width: metadata.width,
    height: metadata.height,
    raw
  }
}

function averageEdgeColor(raw, width, height) {
  const samples = []

  const pushSample = (x, y) => {
    const index = (y * width + x) * 4

    samples.push({
      r: raw[index],
      g: raw[index + 1],
      b: raw[index + 2]
    })
  }

  for (let x = 0; x < width; x += Math.max(1, Math.floor(width / 18))) {
    pushSample(x, 0)

    pushSample(x, height - 1)
  }

  for (let y = 0; y < height; y += Math.max(1, Math.floor(height / 18))) {
    pushSample(0, y)

    pushSample(width - 1, y)
  }

  const totals = samples.reduce((acc, sample) => ({
    r: acc.r + sample.r,
    g: acc.g + sample.g,
    b: acc.b + sample.b
  }), { r: 0, g: 0, b: 0 })

  return {
    r: Math.round(totals.r / samples.length),
    g: Math.round(totals.g / samples.length),
    b: Math.round(totals.b / samples.length)
  }
}

function getBoundingBox(alphaRaw, width, height) {
  let left = width
  let top = height
  let right = 0
  let bottom = 0
  let found = false

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const alpha = alphaRaw[y * width + x]

      if (alpha <= 18) continue

      found = true

      left = Math.min(left, x)

      top = Math.min(top, y)

      right = Math.max(right, x)

      bottom = Math.max(bottom, y)
    }
  }

  if (!found) {
    return {
      left: 0,
      top: 0,
      width,
      height
    }
  }

  const paddingX = Math.round(width * 0.035)
  const paddingY = Math.round(height * 0.035)
  const paddedLeft = clamp(left - paddingX, 0, width - 1)
  const paddedTop = clamp(top - paddingY, 0, height - 1)
  const paddedRight = clamp(right + paddingX, 0, width - 1)
  const paddedBottom = clamp(bottom + paddingY, 0, height - 1)

  return {
    left: paddedLeft,
    top: paddedTop,
    width: paddedRight - paddedLeft + 1,
    height: paddedBottom - paddedTop + 1
  }
}

async function extractLogo(sourcePath, project) {
  const crop = project.logoRect
  const cropped = sharp(sourcePath).extract(crop)
  const png = await cropped.png().toBuffer()
  const { raw, width, height } = await readRawImage(png)
  const background = project.backgroundColor ? hexToRgb(project.backgroundColor) : averageEdgeColor(raw, width, height)
  const alphaRaw = Buffer.alloc(width * height)
  const outputRaw = Buffer.alloc(width * height * 4)
  const threshold = project.threshold ?? 24
  const feather = 44

  for (let index = 0; index < width * height; index += 1) {
    const pixelIndex = index * 4
    const r = raw[pixelIndex]
    const g = raw[pixelIndex + 1]
    const b = raw[pixelIndex + 2]
    const sourceAlpha = raw[pixelIndex + 3]

    const diff = Math.sqrt(
      ((r - background.r) ** 2) +
      ((g - background.g) ** 2) +
      ((b - background.b) ** 2)
    )

    const normalizedAlpha = clamp((diff - threshold) / feather, 0, 1)
    const alpha = Math.round(normalizedAlpha * sourceAlpha)

    outputRaw[pixelIndex] = r

    outputRaw[pixelIndex + 1] = g

    outputRaw[pixelIndex + 2] = b

    outputRaw[pixelIndex + 3] = alpha

    alphaRaw[index] = alpha
  }

  const bounds = getBoundingBox(alphaRaw, width, height)

  const extracted = sharp(outputRaw, { raw: { width, height, channels: 4 } })
    .extract(bounds)

  return finalizeLogoBuffer(await extracted.png().toBuffer())
}

async function finalizeLogoBuffer(buffer) {
  const prepared = sharp(buffer).ensureAlpha()
  const metadata = await prepared.metadata()
  const finalizedBuffer = await prepared.png().toBuffer()
  const alpha = await sharp(finalizedBuffer).ensureAlpha().extractChannel(3).png().toBuffer()

  return {
    buffer: finalizedBuffer,
    alpha,
    width: metadata.width,
    height: metadata.height
  }
}

async function loadLogoAsset(sourcePath, density = 720) {
  const rendered = await sharp(sourcePath, { density }).ensureAlpha().png().toBuffer()

  return finalizeLogoBuffer(rendered)
}

async function buildSmithCommerceWordmark() {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="5200" height="760" viewBox="0 0 5200 760">
      <rect width="100%" height="100%" fill="transparent" />
      <text
        x="220"
        y="520"
        fill="#ffffff"
        font-family="Montserrat, Avenir Next, Segoe UI, Arial, sans-serif"
        font-size="410"
        font-weight="800"
      >Smith Commerce</text>
    </svg>
  `

  return finalizeLogoBuffer(await sharp(Buffer.from(svg)).png().toBuffer())
}

async function buildTedxMedellinWordmark() {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="4600" height="980" viewBox="0 0 4600 980">
      <rect width="100%" height="100%" fill="transparent" />
      <text
        x="180"
        y="496"
        fill="#EB0028"
        font-family="Arial, Helvetica, sans-serif"
        font-size="560"
        font-weight="900"
        letter-spacing="-0.08em"
      >TED</text>
      <text
        x="1320"
        y="360"
        fill="#EB0028"
        font-family="Arial, Helvetica, sans-serif"
        font-size="320"
        font-weight="800"
        letter-spacing="-0.06em"
      >x</text>
      <path
        d="M 1448 416 H 2580"
        fill="none"
        stroke="#EB0028"
        stroke-linecap="round"
        stroke-width="36"
      />
      <text
        x="214"
        y="794"
        fill="#FFFFFF"
        font-family="Arial, Helvetica, sans-serif"
        font-size="318"
        font-weight="700"
        letter-spacing="-0.04em"
      >Medellin</text>
    </svg>
  `

  return finalizeLogoBuffer(await sharp(Buffer.from(svg)).png().toBuffer())
}

async function buildCustomLogo(builderName) {
  switch (builderName) {
    case 'tedx-medellin':
      return buildTedxMedellinWordmark()

    default:
      throw new Error(`Unknown custom logo builder: ${builderName}`)
  }
}

async function scaleAlpha(alphaBuffer, width, height, opacity) {
  const alphaRaw = await sharp(alphaBuffer).raw().toBuffer()
  const scaledRaw = Buffer.alloc(alphaRaw.length)

  for (let index = 0; index < alphaRaw.length; index += 1) {
    scaledRaw[index] = Math.round(alphaRaw[index] * opacity)
  }

  return sharp(scaledRaw, { raw: { width, height, channels: 1 } }).png().toBuffer()
}

async function createMaskedFill({ alpha, width, height, color, opacity = 1 }) {
  const scaledAlpha = await scaleAlpha(alpha, width, height, opacity)
  const rgb = hexToRgb(color)

  return sharp({
    create: {
      width,
      height,
      channels: 3,
      background: rgb
    }
  }).joinChannel(scaledAlpha).png().toBuffer()
}

function getLogoPlacement({ logoWidth, logoHeight }) {
  const ratio = logoWidth / logoHeight

  if (ratio > 3.2) {
    return STANDARD_WORDMARK_PLACEMENT
  }

  if (ratio > 1.3) {
    return STANDARD_STACK_PLACEMENT
  }

  return STANDARD_BADGE_PLACEMENT
}

async function buildLogoLayers(logo, project) {
  const placement = project.placement ?? getLogoPlacement({
    logoWidth: logo.width,
    logoHeight: logo.height
  })

  const fitScale = Math.min(
    placement.width / logo.width, placement.height / logo.height
  )

  const mainWidth = Math.round(logo.width * fitScale)
  const mainHeight = Math.round(logo.height * fitScale)
  const mainLeft = placement.left + Math.round((placement.width - mainWidth) / 2)
  const mainTop = placement.top + Math.round((placement.height - mainHeight) / 2)
  const shadowColor = project.variant === 'light' ? '#10283c' : '#000000'
  const shadowOpacity = project.shadowOpacity ?? (project.variant === 'light' ? 0.08 : 0.18)
  const shadowBlur = project.shadowBlur ?? 7
  const shadowOffsetX = project.shadowOffsetX ?? 18
  const shadowOffsetY = project.shadowOffsetY ?? 22

  const shadow = await createMaskedFill({
    alpha: logo.alpha,
    width: logo.width,
    height: logo.height,
    color: shadowColor,
    opacity: shadowOpacity
  })

  const shadowBuffer = await sharp(shadow)
    .resize({ width: mainWidth, height: mainHeight })
    .blur(shadowBlur)
    .png()
    .toBuffer()

  const mainBuffer = await sharp(logo.buffer)
    .resize({ width: mainWidth, height: mainHeight })
    .png()
    .toBuffer()

  return {
    shadowBuffer,
    mainBuffer,
    shadowLeft: mainLeft + shadowOffsetX,
    shadowTop: mainTop + shadowOffsetY,
    mainLeft,
    mainTop
  }
}

function panelCard({ x, y, width, height, radius = 30, fill, stroke = 'none', strokeWidth = 0, opacity = 1 }) {
  return `<rect x="${x}" y="${y}" width="${width}" height="${height}" rx="${radius}" fill="${fill}" stroke="${stroke}" stroke-width="${strokeWidth}" opacity="${opacity}" />`
}

function panelWindow({ x, y, width, height, palette }) {
  return `
    <g>
      ${panelCard({
        x,
        y,
        width,
        height,
        radius: 36,
        fill: palette.fill,
        stroke: palette.strokeSoft,
        strokeWidth: 6
      })}
      <circle cx="${x + 44}" cy="${y + 44}" r="10" fill="${palette.accentStrong}" />
      <circle cx="${x + 80}" cy="${y + 44}" r="10" fill="${palette.strokeSoft}" />
      <circle cx="${x + 116}" cy="${y + 44}" r="10" fill="${palette.strokeSoft}" />
      <path d="M ${x} ${y + 86} H ${x + width}" stroke="${palette.strokeSoft}" stroke-width="6" />
    </g>
  `
}

function buildPanelPalette(project) {
  const light = project.variant === 'light'

  return {
    stroke: light ? hexToRgba(project.ink, 0.78) : 'rgba(255, 255, 255, 0.82)',
    strokeSoft: light ? hexToRgba(project.ink, 0.22) : 'rgba(255, 255, 255, 0.16)',
    fill: light ? 'rgba(255, 255, 255, 0.42)' : 'rgba(255, 255, 255, 0.08)',
    fillSoft: light ? 'rgba(255, 255, 255, 0.22)' : 'rgba(255, 255, 255, 0.04)',
    accent: hexToRgba(project.accent, light ? 0.34 : 0.28),
    accentStrong: hexToRgba(project.accent, light ? 0.92 : 0.72),
    accentDeep: hexToRgba(project.accentDeep, light ? 0.56 : 0.46),
    glow: hexToRgba(project.texture, light ? 0.28 : 0.18),
    shadow: light ? 'rgba(12, 18, 24, 0.12)' : 'rgba(0, 0, 0, 0.22)'
  }
}

function buildPanelArtworkMarkup(project, palette) {
  switch (project.slug) {
    case 'xgames':
      return `
        <circle cx="982" cy="248" r="174" fill="${palette.glow}" />
        ${panelWindow({ x: 116, y: 156, width: 724, height: 260, palette })}
        <path d="M 198 248 H 484" stroke="${palette.stroke}" stroke-width="18" stroke-linecap="round" />
        <path d="M 198 312 H 642" stroke="${palette.strokeSoft}" stroke-width="18" stroke-linecap="round" />
        <path d="M 198 376 H 562" stroke="${palette.strokeSoft}" stroke-width="18" stroke-linecap="round" />
        ${panelCard({ x: 678, y: 224, width: 122, height: 58, radius: 22, fill: palette.accent, stroke: palette.strokeSoft, strokeWidth: 4 })}
        <circle cx="718" cy="253" r="10" fill="${palette.fill}" />
        <path d="M 744 253 H 776" stroke="${palette.fill}" stroke-width="12" stroke-linecap="round" />
        ${panelCard({ x: 874, y: 184, width: 246, height: 138, radius: 32, fill: palette.fill, stroke: palette.strokeSoft, strokeWidth: 6 })}
        <circle cx="948" cy="252" r="28" fill="none" stroke="${palette.accentStrong}" stroke-width="12" />
        <path d="M 948 224 V 252 L 974 270" fill="none" stroke="${palette.stroke}" stroke-width="12" stroke-linecap="round" stroke-linejoin="round" />
        <path d="M 1002 236 H 1064" stroke="${palette.stroke}" stroke-width="16" stroke-linecap="round" />
        <path d="M 1002 282 H 1042" stroke="${palette.strokeSoft}" stroke-width="16" stroke-linecap="round" />
        <path d="M 150 1194 C 214 994, 312 850, 456 756 H 820 C 958 844, 1060 992, 1130 1194" fill="${palette.fillSoft}" stroke="${palette.strokeSoft}" stroke-width="8" stroke-linejoin="round" opacity="0.84" />
        <path d="M 170 1188 C 234 1008, 324 880, 444 802" fill="none" stroke="${palette.stroke}" stroke-width="20" stroke-linecap="round" />
        <path d="M 832 802 C 956 882, 1048 1010, 1110 1188" fill="none" stroke="${palette.stroke}" stroke-width="20" stroke-linecap="round" />
        <path d="M 232 766 H 448" stroke="${palette.strokeSoft}" stroke-width="14" stroke-linecap="round" />
        <path d="M 832 766 H 1048" stroke="${palette.strokeSoft}" stroke-width="14" stroke-linecap="round" />
        <path d="M 302 1020 H 514 L 690 860 H 938" fill="none" stroke="${palette.accentStrong}" stroke-width="18" stroke-linecap="round" stroke-linejoin="round" />
        <circle cx="692" cy="566" r="24" fill="${palette.fill}" />
        <path d="M 690 594 L 656 702 L 752 770" fill="none" stroke="${palette.accentStrong}" stroke-width="18" stroke-linecap="round" stroke-linejoin="round" />
        <path d="M 692 626 L 782 674 L 874 604" fill="none" stroke="${palette.fill}" stroke-width="18" stroke-linecap="round" stroke-linejoin="round" />
        <path d="M 654 704 L 586 806" fill="none" stroke="${palette.stroke}" stroke-width="18" stroke-linecap="round" />
        <path d="M 752 770 L 838 796" fill="none" stroke="${palette.accentStrong}" stroke-width="18" stroke-linecap="round" />
        <path d="M 528 818 C 624 788, 734 790, 844 824" fill="none" stroke="${palette.stroke}" stroke-width="18" stroke-linecap="round" />
        <circle cx="584" cy="806" r="16" fill="${palette.accentStrong}" />
        <circle cx="838" cy="796" r="16" fill="${palette.accentStrong}" />
        ${panelCard({ x: 168, y: 622, width: 304, height: 164, radius: 30, fill: palette.fill, stroke: palette.strokeSoft, strokeWidth: 6 })}
        <path d="M 236 686 H 410" stroke="${palette.stroke}" stroke-width="16" stroke-linecap="round" />
        <path d="M 236 742 H 350" stroke="${palette.accentStrong}" stroke-width="16" stroke-linecap="round" />
        <circle cx="436" cy="704" r="28" fill="${palette.accent}" />
        <path d="M 412 700 L 428 716 L 462 682" fill="none" stroke="${palette.fill}" stroke-width="10" stroke-linecap="round" stroke-linejoin="round" />
        <path d="M 188 1302 C 336 1208, 482 1162, 638 1178 C 792 1190, 914 1260, 1056 1368" fill="none" stroke="${palette.accentDeep}" stroke-width="18" stroke-linecap="round" />
        <circle cx="302" cy="444" r="188" fill="${palette.glow}" />
      `

    case 'datagran':
      return `
        ${panelWindow({ x: 88, y: 156, width: 760, height: 470, palette })}
        ${panelCard({ x: 158, y: 290, width: 112, height: 206, radius: 24, fill: palette.accent })}
        ${panelCard({ x: 306, y: 238, width: 112, height: 258, radius: 24, fill: palette.fillSoft, stroke: palette.strokeSoft, strokeWidth: 4 })}
        ${panelCard({ x: 454, y: 188, width: 112, height: 308, radius: 24, fill: palette.accentDeep })}
        ${panelCard({ x: 602, y: 338, width: 112, height: 158, radius: 24, fill: palette.fillSoft, stroke: palette.strokeSoft, strokeWidth: 4 })}
        ${panelCard({ x: 608, y: 740, width: 500, height: 300, radius: 34, fill: palette.fill, stroke: palette.strokeSoft, strokeWidth: 6 })}
        <path d="M 150 960 C 290 790, 430 1060, 590 880 S 910 760, 1070 860" fill="none" stroke="${palette.accentStrong}" stroke-width="22" stroke-linecap="round" stroke-linejoin="round" />
        <circle cx="152" cy="958" r="18" fill="${palette.accentStrong}" />
        <circle cx="364" cy="916" r="18" fill="${palette.accentStrong}" />
        <circle cx="590" cy="880" r="18" fill="${palette.accentStrong}" />
        <circle cx="824" cy="800" r="18" fill="${palette.accentStrong}" />
        <circle cx="1070" cy="860" r="18" fill="${palette.accentStrong}" />
        <circle cx="980" cy="360" r="118" fill="${palette.glow}" />
        <circle cx="980" cy="360" r="82" fill="none" stroke="${palette.stroke}" stroke-width="12" />
        <circle cx="1102" cy="514" r="22" fill="${palette.accentStrong}" />
        <path d="M 1030 426 L 1090 486 L 1182 332" fill="none" stroke="${palette.stroke}" stroke-width="16" stroke-linecap="round" stroke-linejoin="round" />
      `

    case 'eslint-config-basic':
      return `
        ${panelWindow({ x: 88, y: 176, width: 720, height: 520, palette })}
        <path d="M 162 350 H 494" stroke="${palette.stroke}" stroke-width="18" stroke-linecap="round" />
        <path d="M 162 426 H 606" stroke="${palette.strokeSoft}" stroke-width="18" stroke-linecap="round" />
        <path d="M 162 502 H 548" stroke="${palette.strokeSoft}" stroke-width="18" stroke-linecap="round" />
        <path d="M 162 578 H 420" stroke="${palette.strokeSoft}" stroke-width="18" stroke-linecap="round" />
        ${panelCard({ x: 786, y: 646, width: 336, height: 336, radius: 168, fill: palette.accent, stroke: palette.strokeSoft, strokeWidth: 8 })}
        <path d="M 870 818 L 944 892 L 1054 750" fill="none" stroke="${palette.stroke}" stroke-width="22" stroke-linecap="round" stroke-linejoin="round" />
        ${panelCard({ x: 208, y: 822, width: 420, height: 250, radius: 32, fill: palette.fill, stroke: palette.strokeSoft, strokeWidth: 6 })}
        <path d="M 286 920 H 544" stroke="${palette.accentStrong}" stroke-width="18" stroke-linecap="round" />
        <path d="M 286 988 H 520" stroke="${palette.stroke}" stroke-width="18" stroke-linecap="round" />
        <path d="M 286 1056 H 466" stroke="${palette.strokeSoft}" stroke-width="18" stroke-linecap="round" />
        <path d="M 110 1208 C 318 1048, 610 1096, 848 1202" fill="none" stroke="${palette.accentDeep}" stroke-width="18" stroke-linecap="round" />
      `

    case 'eslint-config-santi020k':
      return `
        ${panelWindow({ x: 116, y: 170, width: 620, height: 420, palette })}
        ${panelCard({ x: 758, y: 214, width: 298, height: 268, radius: 36, fill: palette.fill, stroke: palette.strokeSoft, strokeWidth: 6 })}
        ${panelCard({ x: 230, y: 664, width: 844, height: 430, radius: 40, fill: palette.fillSoft, stroke: palette.strokeSoft, strokeWidth: 6 })}
        <path d="M 242 360 H 522" stroke="${palette.stroke}" stroke-width="18" stroke-linecap="round" />
        <path d="M 242 430 H 468" stroke="${palette.strokeSoft}" stroke-width="18" stroke-linecap="round" />
        <path d="M 242 500 H 568" stroke="${palette.strokeSoft}" stroke-width="18" stroke-linecap="round" />
        <rect x="832" y="300" width="152" height="98" rx="24" fill="${palette.accent}" />
        <path d="M 908 270 V 300" stroke="${palette.stroke}" stroke-width="18" stroke-linecap="round" />
        <path d="M 352 790 L 476 904 L 610 790" fill="none" stroke="${palette.accentStrong}" stroke-width="18" stroke-linecap="round" stroke-linejoin="round" />
        <path d="M 704 824 L 786 906 L 908 744" fill="none" stroke="${palette.stroke}" stroke-width="18" stroke-linecap="round" stroke-linejoin="round" />
        <circle cx="458" cy="1200" r="148" fill="${palette.glow}" />
        <circle cx="458" cy="1200" r="100" fill="none" stroke="${palette.strokeSoft}" stroke-width="12" />
        <circle cx="848" cy="1180" r="180" fill="${palette.accentDeep}" opacity="0.42" />
      `

    case 'justbit':
      return `
        ${panelWindow({ x: 126, y: 184, width: 820, height: 470, palette })}
        ${panelCard({ x: 492, y: 742, width: 520, height: 320, radius: 38, fill: palette.fill, stroke: palette.strokeSoft, strokeWidth: 6 })}
        <path d="M 224 434 H 764" stroke="${palette.stroke}" stroke-width="18" stroke-linecap="round" />
        <path d="M 224 512 H 650" stroke="${palette.strokeSoft}" stroke-width="18" stroke-linecap="round" />
        <path d="M 224 590 H 560" stroke="${palette.strokeSoft}" stroke-width="18" stroke-linecap="round" />
        <path d="M 266 1064 C 470 932, 660 782, 884 544" fill="none" stroke="${palette.accentStrong}" stroke-width="24" stroke-linecap="round" />
        <path d="M 846 552 L 952 520 L 924 628" fill="none" stroke="${palette.accentStrong}" stroke-width="22" stroke-linecap="round" stroke-linejoin="round" />
        <path d="M 716 852 L 830 784 L 872 654 L 934 710 L 884 842 L 762 910 Z" fill="${palette.accent}" stroke="${palette.strokeSoft}" stroke-width="8" />
        <circle cx="300" cy="1090" r="150" fill="${palette.glow}" />
      `

    case 'nebular':
      return `
        ${panelCard({ x: 132, y: 274, width: 768, height: 520, radius: 42, fill: palette.fill, stroke: palette.strokeSoft, strokeWidth: 6 })}
        <rect x="206" y="356" width="620" height="350" rx="26" fill="${palette.fillSoft}" stroke="${palette.strokeSoft}" stroke-width="6" />
        <path d="M 294 846 H 742" stroke="${palette.strokeSoft}" stroke-width="22" stroke-linecap="round" />
        ${panelCard({ x: 824, y: 654, width: 214, height: 392, radius: 40, fill: palette.fill, stroke: palette.strokeSoft, strokeWidth: 6 })}
        <path d="M 548 516 C 636 438, 760 430, 846 490" fill="none" stroke="${palette.accentStrong}" stroke-width="18" stroke-linecap="round" />
        <path d="M 392 534 C 486 444, 620 430, 732 468" fill="none" stroke="${palette.accentDeep}" stroke-width="18" stroke-linecap="round" />
        <path d="M 286 1100 L 456 994 L 626 1100 L 456 1206 Z" fill="${palette.accent}" stroke="${palette.strokeSoft}" stroke-width="8" />
        <path d="M 456 1206 V 1380 L 626 1284 V 1100" fill="none" stroke="${palette.strokeSoft}" stroke-width="8" stroke-linejoin="round" />
      `

    case 'optic-power':
      return `
        ${panelCard({ x: 132, y: 238, width: 288, height: 356, radius: 38, fill: palette.fill, stroke: palette.strokeSoft, strokeWidth: 6 })}
        ${panelCard({ x: 496, y: 160, width: 288, height: 434, radius: 38, fill: palette.fill, stroke: palette.strokeSoft, strokeWidth: 6 })}
        ${panelCard({ x: 860, y: 286, width: 288, height: 308, radius: 38, fill: palette.fill, stroke: palette.strokeSoft, strokeWidth: 6 })}
        <path d="M 260 694 C 430 594, 622 540, 846 452" fill="none" stroke="${palette.accentStrong}" stroke-width="20" stroke-linecap="round" />
        <path d="M 838 448 L 960 398 L 922 520" fill="none" stroke="${palette.accentStrong}" stroke-width="20" stroke-linecap="round" stroke-linejoin="round" />
        <path d="M 678 750 L 600 928 H 714 L 632 1156" fill="none" stroke="${palette.accentDeep}" stroke-width="26" stroke-linecap="round" stroke-linejoin="round" />
        <circle cx="404" cy="1144" r="170" fill="${palette.glow}" />
        <path d="M 214 934 H 568" stroke="${palette.stroke}" stroke-width="18" stroke-linecap="round" />
        <path d="M 214 1006 H 520" stroke="${palette.strokeSoft}" stroke-width="18" stroke-linecap="round" />
        <path d="M 214 1078 H 456" stroke="${palette.strokeSoft}" stroke-width="18" stroke-linecap="round" />
      `

    case 'pads':
      return `
        <path d="M 164 1200 V 632 L 426 438 V 1200" fill="${palette.fill}" stroke="${palette.strokeSoft}" stroke-width="8" />
        <path d="M 446 1200 V 512 L 740 282 V 1200" fill="${palette.fillSoft}" stroke="${palette.strokeSoft}" stroke-width="8" />
        <path d="M 766 1200 V 708 L 1018 514 V 1200" fill="${palette.fill}" stroke="${palette.strokeSoft}" stroke-width="8" />
        <path d="M 940 260 C 1040 260, 1118 338, 1118 436 C 1118 570, 940 760, 940 760 C 940 760, 762 570, 762 436 C 762 338, 840 260, 940 260 Z" fill="${palette.accent}" />
        <circle cx="940" cy="426" r="66" fill="${palette.fill}" />
        <path d="M 164 1332 H 1098" stroke="${palette.strokeSoft}" stroke-width="10" stroke-linecap="round" />
        <path d="M 226 980 H 360" stroke="${palette.strokeSoft}" stroke-width="12" stroke-linecap="round" />
        <path d="M 226 1068 H 360" stroke="${palette.strokeSoft}" stroke-width="12" stroke-linecap="round" />
        <path d="M 500 790 H 652" stroke="${palette.strokeSoft}" stroke-width="12" stroke-linecap="round" />
        <path d="M 500 878 H 652" stroke="${palette.strokeSoft}" stroke-width="12" stroke-linecap="round" />
      `

    case 'react-js-colombia':
      return `
        <circle cx="652" cy="382" r="188" fill="${palette.glow}" />
        <circle cx="652" cy="382" r="112" fill="none" stroke="${palette.stroke}" stroke-width="14" />
        <ellipse cx="652" cy="382" rx="224" ry="88" fill="none" stroke="${palette.stroke}" stroke-width="14" />
        <ellipse cx="652" cy="382" rx="224" ry="88" transform="rotate(60 652 382)" fill="none" stroke="${palette.stroke}" stroke-width="14" />
        <ellipse cx="652" cy="382" rx="224" ry="88" transform="rotate(120 652 382)" fill="none" stroke="${palette.stroke}" stroke-width="14" />
        <circle cx="652" cy="382" r="24" fill="${palette.accentStrong}" />
        <path d="M 144 1150 C 286 934, 1018 934, 1140 1150" fill="none" stroke="${palette.accentStrong}" stroke-width="18" stroke-linecap="round" />
        <path d="M 120 1210 C 330 1028, 980 1028, 1162 1210" fill="none" stroke="${palette.strokeSoft}" stroke-width="18" stroke-linecap="round" />
        <circle cx="266" cy="1186" r="18" fill="${palette.fill}" />
        <circle cx="356" cy="1132" r="20" fill="${palette.fill}" />
        <circle cx="458" cy="1178" r="22" fill="${palette.fill}" />
        <circle cx="584" cy="1118" r="20" fill="${palette.fill}" />
        <circle cx="720" cy="1180" r="22" fill="${palette.fill}" />
        <circle cx="836" cy="1128" r="20" fill="${palette.fill}" />
        <circle cx="950" cy="1186" r="18" fill="${palette.fill}" />
        ${panelCard({ x: 262, y: 688, width: 780, height: 178, radius: 28, fill: palette.fill, stroke: palette.strokeSoft, strokeWidth: 6 })}
        <path d="M 330 772 H 960" stroke="${palette.strokeSoft}" stroke-width="18" stroke-linecap="round" />
      `

    case 'tedx-medellin':
      return `
        ${panelWindow({ x: 112, y: 170, width: 724, height: 278, palette })}
        <path d="M 190 270 H 580" stroke="${palette.stroke}" stroke-width="18" stroke-linecap="round" />
        <path d="M 190 344 H 448" stroke="${palette.strokeSoft}" stroke-width="18" stroke-linecap="round" />
        <path d="M 190 418 H 676" stroke="${palette.strokeSoft}" stroke-width="18" stroke-linecap="round" />
        ${panelCard({ x: 242, y: 566, width: 612, height: 420, radius: 38, fill: palette.fill, stroke: palette.strokeSoft, strokeWidth: 6 })}
        <path d="M 548 642 C 646 716, 710 830, 710 964 V 1012 H 386 V 964 C 386 830, 450 716, 548 642 Z" fill="${palette.fillSoft}" stroke="${palette.strokeSoft}" stroke-width="8" />
        <path d="M 386 1012 H 710" stroke="${palette.accentStrong}" stroke-width="18" stroke-linecap="round" />
        <path d="M 450 1120 C 510 1074, 590 1074, 648 1120" fill="none" stroke="${palette.accentStrong}" stroke-width="18" stroke-linecap="round" />
        <path d="M 520 1208 C 566 1246, 596 1306, 596 1380 V 1452" fill="none" stroke="${palette.stroke}" stroke-width="16" stroke-linecap="round" />
        <circle cx="596" cy="1380" r="24" fill="${palette.accentStrong}" />
        <path d="M 596 1438 L 562 1506 H 630 Z" fill="${palette.stroke}" />
        ${panelCard({ x: 184, y: 1186, width: 248, height: 122, radius: 24, fill: palette.fillSoft, stroke: palette.strokeSoft, strokeWidth: 6 })}
        <path d="M 236 1248 H 364" stroke="${palette.stroke}" stroke-width="16" stroke-linecap="round" />
        ${panelCard({ x: 820, y: 1194, width: 202, height: 146, radius: 26, fill: palette.fillSoft, stroke: palette.strokeSoft, strokeWidth: 6 })}
        <path d="M 872 1248 H 970" stroke="${palette.accentStrong}" stroke-width="16" stroke-linecap="round" />
        <path d="M 872 1302 H 938" stroke="${palette.strokeSoft}" stroke-width="16" stroke-linecap="round" />
        <circle cx="232" cy="1480" r="18" fill="${palette.fill}" />
        <circle cx="326" cy="1454" r="18" fill="${palette.fill}" />
        <circle cx="424" cy="1488" r="18" fill="${palette.fill}" />
        <circle cx="526" cy="1458" r="18" fill="${palette.fill}" />
        <circle cx="628" cy="1488" r="18" fill="${palette.fill}" />
        <circle cx="730" cy="1454" r="18" fill="${palette.fill}" />
        <circle cx="828" cy="1482" r="18" fill="${palette.fill}" />
      `

    case 'smith-commerce':
      return `
        ${panelWindow({ x: 84, y: 166, width: 800, height: 492, palette })}
        ${panelCard({ x: 176, y: 312, width: 178, height: 206, radius: 28, fill: palette.fillSoft, stroke: palette.strokeSoft, strokeWidth: 4 })}
        ${panelCard({ x: 394, y: 312, width: 178, height: 206, radius: 28, fill: palette.accent, stroke: palette.strokeSoft, strokeWidth: 4 })}
        ${panelCard({ x: 612, y: 312, width: 178, height: 206, radius: 28, fill: palette.fillSoft, stroke: palette.strokeSoft, strokeWidth: 4 })}
        <path d="M 240 842 H 762" stroke="${palette.accentStrong}" stroke-width="22" stroke-linecap="round" />
        <path d="M 880 850 H 1052 L 1020 1070 H 914 Z" fill="${palette.fill}" stroke="${palette.strokeSoft}" stroke-width="8" stroke-linejoin="round" />
        <path d="M 920 850 V 790 C 920 730, 970 688, 1018 688 C 1066 688, 1116 730, 1116 790 V 850" fill="none" stroke="${palette.stroke}" stroke-width="14" stroke-linecap="round" />
        <path d="M 300 1008 C 486 928, 662 864, 846 794" fill="none" stroke="${palette.accentDeep}" stroke-width="18" stroke-linecap="round" />
        ${panelCard({ x: 208, y: 1110, width: 164, height: 134, radius: 24, fill: palette.fillSoft, stroke: palette.strokeSoft, strokeWidth: 4 })}
        ${panelCard({ x: 408, y: 1160, width: 164, height: 134, radius: 24, fill: palette.fillSoft, stroke: palette.strokeSoft, strokeWidth: 4 })}
      `

    case 'void':
      return `
        <path d="M 560 324 H 744 L 826 510 C 826 760, 736 932, 652 988 C 568 932, 478 760, 478 510 Z" fill="${palette.fill}" stroke="${palette.strokeSoft}" stroke-width="10" stroke-linejoin="round" />
        <path d="M 560 324 H 744 L 700 220 H 604 Z" fill="${palette.accent}" stroke="${palette.strokeSoft}" stroke-width="10" stroke-linejoin="round" />
        <path d="M 486 500 H 356 C 322 500, 300 526, 300 558 C 300 616, 348 672, 454 690" fill="none" stroke="${palette.stroke}" stroke-width="14" stroke-linecap="round" stroke-linejoin="round" />
        <path d="M 818 500 H 948 C 982 500, 1004 526, 1004 558 C 1004 616, 956 672, 850 690" fill="none" stroke="${palette.stroke}" stroke-width="14" stroke-linecap="round" stroke-linejoin="round" />
        <path d="M 298 1100 C 458 936, 846 936, 1008 1100" fill="none" stroke="${palette.accentStrong}" stroke-width="18" stroke-linecap="round" />
        <path d="M 236 1200 C 446 1014, 874 1014, 1070 1200" fill="none" stroke="${palette.strokeSoft}" stroke-width="18" stroke-linecap="round" />
        <path d="M 174 1302 C 430 1098, 894 1098, 1132 1302" fill="none" stroke="${palette.strokeSoft}" stroke-width="18" stroke-linecap="round" />
        <circle cx="652" cy="742" r="168" fill="${palette.glow}" />
      `

    default:
      return `
        <circle cx="960" cy="330" r="220" fill="${palette.glow}" />
        ${panelCard({ x: 180, y: 230, width: 660, height: 410, radius: 40, fill: palette.fill, stroke: palette.strokeSoft, strokeWidth: 6 })}
        ${panelCard({ x: 420, y: 760, width: 520, height: 320, radius: 38, fill: palette.fillSoft, stroke: palette.strokeSoft, strokeWidth: 6 })}
      `
  }
}

function buildPanelArtworkSvg(project) {
  const palette = buildPanelPalette(project)

  return `
    <svg width="${PANEL_WIDTH}" height="${PANEL_HEIGHT}" viewBox="0 0 ${PANEL_WIDTH} ${PANEL_HEIGHT}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="panel-wash" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="${palette.fillSoft}" />
          <stop offset="100%" stop-color="rgba(255,255,255,0)" />
        </linearGradient>
        <radialGradient id="spotlight" cx="72%" cy="24%" r="54%">
          <stop offset="0%" stop-color="${palette.glow}" />
          <stop offset="100%" stop-color="rgba(255,255,255,0)" />
        </radialGradient>
      </defs>

      <rect width="${PANEL_WIDTH}" height="${PANEL_HEIGHT}" fill="url(#panel-wash)" />
      <circle cx="964" cy="282" r="360" fill="url(#spotlight)" />
      <path d="M 0 1280 L 388 870 L 1280 1520 H 0 Z" fill="${palette.accentDeep}" opacity="0.14" />
      <path d="M 832 0 H 1280 V 390 L 1032 310 Z" fill="${palette.shadow}" opacity="0.85" />
      ${buildPanelArtworkMarkup(project, palette)}
    </svg>
  `
}

async function buildTextureLayer(project) {
  const textureBuffer = await sharp(Buffer.from(buildPanelArtworkSvg(project)))
    .png()
    .toBuffer()

  return {
    textureBuffer,
    textureLeft: PANEL_X,
    textureTop: PANEL_Y
  }
}

function buildBaseSvg(project) {
  const surfaceGlow = project.variant === 'light' ? 'rgba(255,255,255,0.65)' : 'rgba(255,255,255,0.08)'
  const surfaceGlowSoft = project.variant === 'light' ? 'rgba(255,255,255,0)' : 'rgba(255,255,255,0)'
  const gridColor = project.variant === 'light' ? LIGHT_GRID : DARK_GRID
  const panelOverlay = project.variant === 'light' ? 'rgba(8, 15, 22, 0.92)' : 'rgba(4, 6, 10, 0.84)'
  const panelShadow = project.variant === 'light' ? 'rgba(5, 10, 16, 0.1)' : 'rgba(0, 0, 0, 0.24)'
  const ghostFill = project.variant === 'light' ? 'rgba(17,17,17,0.07)' : 'rgba(255,255,255,0.08)'
  const leftGlow = project.variant === 'light' ? `${project.accent}20` : `${project.accent}26`
  const accentBand = mix(project.accent, '#ffffff', project.variant === 'light' ? 0.1 : 0.02)
  const panelBorder = mix(project.panel, '#ffffff', project.variant === 'light' ? 0.14 : 0.09)

  return `
    <svg width="${CANVAS_WIDTH}" height="${CANVAS_HEIGHT}" viewBox="0 0 ${CANVAS_WIDTH} ${CANVAS_HEIGHT}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <pattern id="grid" width="64" height="64" patternUnits="userSpaceOnUse">
          <path d="M 64 0 L 0 0 0 64" fill="none" stroke="${gridColor}" stroke-width="1" />
        </pattern>
        <radialGradient id="logo-glow" cx="30%" cy="42%" r="48%">
          <stop offset="0%" stop-color="${leftGlow}" />
          <stop offset="100%" stop-color="${surfaceGlowSoft}" />
        </radialGradient>
        <linearGradient id="surface-gradient" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="${project.surface}" />
          <stop offset="100%" stop-color="${mix(project.surface, project.ink, project.variant === 'light' ? 0.06 : 0.12)}" />
        </linearGradient>
        <linearGradient id="panel-gradient" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="${project.panel}" />
          <stop offset="100%" stop-color="${mix(project.panel, project.ink, 0.18)}" />
        </linearGradient>
      </defs>

      <rect width="${CANVAS_WIDTH}" height="${CANVAS_HEIGHT}" fill="url(#surface-gradient)" />
      <rect width="${CANVAS_WIDTH}" height="${CANVAS_HEIGHT}" fill="url(#grid)" />
      <circle cx="900" cy="760" r="720" fill="url(#logo-glow)" />
      <path d="M 260 56 H 1540 L 1326 360 H 150 Z" fill="${ghostFill}" />
      <path d="M 1880 0 H 3200 V 420 H 2280 Z" fill="${project.ink}" />
      <path d="M 0 1370 L 1760 2000 H 0 Z" fill="${accentBand}" />
      <path d="M 0 2000 V 1470 L 820 1080 L 1810 2000 Z" fill="${project.accentDeep}" opacity="${project.variant === 'light' ? '0.38' : '0.48'}" />

      <rect x="1820" y="220" width="1280" height="1520" rx="0" fill="url(#panel-gradient)" />
      <rect x="1818" y="220" width="4" height="1520" fill="${panelBorder}" />
      <path d="M 1820 220 H 3200 V 990 L 2770 910 L 2350 700 Z" fill="${panelOverlay}" />
      <path d="M 1820 1740 H 3200 V 1510 L 2860 1570 L 2400 1740 Z" fill="${panelShadow}" />
      <path d="M 0 1115 L 635 2000 H 0 Z" fill="rgba(255,255,255,0.06)" />
      <rect width="${CANVAS_WIDTH}" height="${CANVAS_HEIGHT}" fill="${surfaceGlow}" opacity="${project.variant === 'light' ? '0.08' : '0'}" />
    </svg>
  `
}

async function renderProjectCover(project) {
  const directory = path.join(PROJECTS_ROOT, project.slug)
  const coverPath = path.join(directory, 'cover.webp')
  const backupPath = path.join(directory, 'cover-old.webp')
  const logoPath = project.logoPath ? path.join(directory, project.logoPath) : null

  if (!logoPath && !project.customLogoBuilder && !project.useCustomWordmark) {
    await ensureBackupFile(coverPath, backupPath)
  }

  const logo = logoPath ?
    await loadLogoAsset(logoPath, project.logoDensity) :
    project.customLogoBuilder ?
    await buildCustomLogo(project.customLogoBuilder) :
    project.useCustomWordmark ?
      await buildSmithCommerceWordmark() :
      await extractLogo(backupPath, project)

  const baseSvg = Buffer.from(buildBaseSvg(project))
  const { textureBuffer, textureLeft, textureTop } = await buildTextureLayer(project)
  const { shadowBuffer, mainBuffer, shadowLeft, shadowTop, mainLeft, mainTop } = await buildLogoLayers(logo, project)

  const image = sharp({
    create: {
      width: CANVAS_WIDTH,
      height: CANVAS_HEIGHT,
      channels: 4,
      background: hexToRgb(project.surface)
    }
  })

  await image
    .composite([
      { input: baseSvg },
      { input: textureBuffer, left: textureLeft, top: textureTop },
      { input: shadowBuffer, left: shadowLeft, top: shadowTop },
      { input: mainBuffer, left: mainLeft, top: mainTop }
    ])
    .webp({ quality: 92 })
    .toFile(coverPath)
}

const requestedSlugs = process.argv.slice(2)
const selectedProjects = requestedSlugs.length > 0 ?
  PROJECTS.filter(project => requestedSlugs.includes(project.slug)) :
  PROJECTS

const missingSlugs = requestedSlugs.filter(slug => !PROJECTS.some(project => project.slug === slug))

if (missingSlugs.length > 0) {
  throw new Error(`Unknown project slug(s): ${missingSlugs.join(', ')}`)
}

for (const project of selectedProjects) {
  await renderProjectCover(project)

  console.log(`refreshed ${project.slug}`)
}
