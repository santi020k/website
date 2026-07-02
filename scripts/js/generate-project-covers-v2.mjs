import fs from 'node:fs/promises'
import path from 'node:path'

import sharp from 'sharp'

const PROJECTS_ROOT = path.resolve('src/content/project')
const CONTACT_SHEET_PATH = path.resolve('public/og/portfolio/project-covers-v2-contact.webp')
const WIDTH = 3200
const HEIGHT = 2000

const PROJECTS = [
  {
    slug: 'xgames',
    title: 'X Games',
    eyebrow: 'Sports media platform',
    detail: 'Live events, geo access, programmatic ads',
    accent: '#f31c45',
    accent2: '#f7eee1',
    bg: '#111318',
    fg: '#fff7ed',
    motif: 'broadcast'
  },
  {
    slug: 'datagran',
    title: 'Datagran',
    eyebrow: 'AI martech modernization',
    detail: 'React migration, dashboards, 30% fewer bugs',
    accent: '#06ef7e',
    accent2: '#9cffd0',
    bg: '#111716',
    fg: '#effff7',
    motif: 'analytics'
  },
  {
    slug: 'eslint-config-basic',
    title: 'eslint-config-basic',
    lines: ['eslint-config', 'basic'],
    eyebrow: 'Developer tooling',
    detail: 'Composable lint standards for modern teams',
    accent: '#9b87ff',
    accent2: '#d9d2ff',
    bg: '#151529',
    fg: '#f5f2ff',
    motif: 'tooling'
  },
  {
    slug: 'eslint-config-santi020k',
    title: 'eslint-config-santi020k',
    lines: ['eslint-config', 'santi020k'],
    eyebrow: 'Original lint toolkit',
    detail: 'Reusable React and TypeScript conventions',
    accent: '#c084fc',
    accent2: '#f0dbff',
    bg: '#1a1025',
    fg: '#fff7ff',
    motif: 'rules'
  },
  {
    slug: 'justbit',
    title: 'Justbit.site',
    eyebrow: 'Boutique software studio',
    detail: '10+ launches, SEO, commerce, custom builds',
    accent: '#4bbeb0',
    accent2: '#d7fff7',
    bg: '#0f1f22',
    fg: '#f2fffd',
    motif: 'studio'
  },
  {
    slug: 'nebular',
    title: 'Nebular Technologies',
    eyebrow: 'Full-stack studio work',
    detail: 'Rails, AngularJS, Android, WordPress',
    accent: '#d4d9df',
    accent2: '#8b949e',
    bg: '#181b20',
    fg: '#f7f9fb',
    motif: 'stack'
  },
  {
    slug: 'optic-power',
    title: 'Optic Power',
    eyebrow: 'Senior product engineering',
    detail: 'Gaming, SaaS, APIs, 40% performance gain',
    accent: '#1496b4',
    accent2: '#d9fbff',
    bg: '#f4efe7',
    fg: '#073247',
    motif: 'systems'
  },
  {
    slug: 'pads',
    title: 'PADS',
    eyebrow: 'Location-aware product',
    detail: 'Real estate surfaces and conversion workflows',
    accent: '#ef008c',
    accent2: '#ffc5e4',
    bg: '#1f0d18',
    fg: '#fff5fb',
    motif: 'map'
  },
  {
    slug: 'react-js-colombia',
    title: 'ReactJS Colombia',
    lines: ['ReactJS', 'Colombia'],
    eyebrow: 'Community platform',
    detail: 'Events, learning, public speaking, community',
    accent: '#ffd84a',
    accent2: '#4aa3ff',
    bg: '#071019',
    fg: '#f8fbff',
    motif: 'community'
  },
  {
    slug: 'santi020k-theme',
    title: 'Santi020k Theme',
    lines: ['Santi020k', 'Theme'],
    eyebrow: 'VS Code theme system',
    detail: 'Editor surfaces, syntax, release automation',
    accent: '#8b5cf6',
    accent2: '#c4b5fd',
    bg: '#120c1f',
    fg: '#f7f0ff',
    motif: 'editor'
  },
  {
    slug: 'smith-commerce',
    title: 'Smith Commerce',
    eyebrow: 'Headless commerce rebuild',
    detail: 'Lighthouse 35 to 98, accessibility 100',
    accent: '#ff6b00',
    accent2: '#ffd4b3',
    bg: '#20130b',
    fg: '#fff7ef',
    motif: 'commerce'
  },
  {
    slug: 'tedx-medellin',
    title: 'TEDx Medellin',
    eyebrow: 'Event technology coordination',
    detail: 'WordPress launch, marketing, sold-out rollout',
    accent: '#eb0028',
    accent2: '#ffd2da',
    bg: '#111417',
    fg: '#fff5f6',
    motif: 'stage'
  },
  {
    slug: 'void',
    title: 'Void.GG',
    eyebrow: 'Esports platform leadership',
    detail: 'Realtime systems, 60% faster deployments',
    accent: '#6259ef',
    accent2: '#dcd8ff',
    bg: '#101326',
    fg: '#f6f5ff',
    motif: 'orbit'
  }
]

function escapeHtml(value) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
}

function rgba(hex, opacity) {
  const normalized = hex.replace('#', '')
  const number = Number.parseInt(normalized, 16)
  const r = (number >> 16) & 255
  const g = (number >> 8) & 255
  const b = number & 255

  return `rgba(${r}, ${g}, ${b}, ${opacity})`
}

function splitTitle(title) {
  if (title.length < 19) return [title]

  const words = title.split(/(?=[.-])|\s+/u).filter(Boolean)
  const lines = []
  let current = ''

  for (const word of words) {
    const next = `${current}${current ? ' ' : ''}${word}`.trim()

    if (next.length > 18 && current) {
      lines.push(current)

      current = word
    } else {
      current = next
    }
  }

  if (current) lines.push(current)

  return lines.slice(0, 3)
}

function titleMarkup(project) {
  const lines = project.lines ?? splitTitle(project.title)
  const size = lines.length > 2 ? 168 : lines.length > 1 ? 190 : 230
  const lineHeight = size * 1.04
  const startY = lines.length > 2 ? 750 : lines.length > 1 ? 790 : 860

  return lines.map((line, index) => `
    <text
      x="230"
      y="${startY + (index * lineHeight)}"
      fill="${project.fg}"
      font-family="Montserrat, Avenir Next, Arial, sans-serif"
      font-size="${size}"
      font-weight="800"
    >${escapeHtml(line)}</text>
  `).join('')
}

function chromeWindow(x, y, width, height, project, opacity = 0.76) {
  return `
    <g opacity="${opacity}">
      <rect x="${x}" y="${y}" width="${width}" height="${height}" rx="36" fill="${rgba(project.fg, 0.08)}" stroke="${rgba(project.fg, 0.18)}" stroke-width="5" />
      <circle cx="${x + 48}" cy="${y + 48}" r="11" fill="${project.accent}" />
      <circle cx="${x + 88}" cy="${y + 48}" r="11" fill="${rgba(project.fg, 0.26)}" />
      <circle cx="${x + 128}" cy="${y + 48}" r="11" fill="${rgba(project.fg, 0.18)}" />
      <path d="M ${x} ${y + 90} H ${x + width}" stroke="${rgba(project.fg, 0.14)}" stroke-width="5" />
    </g>
  `
}

function motifMarkup(project) {
  const soft = rgba(project.fg, 0.14)
  const softer = rgba(project.fg, 0.08)
  const accent = project.accent

  switch (project.motif) {
    case 'analytics':
      return `
        ${chromeWindow(1850, 390, 990, 560, project)}
        <rect x="1980" y="720" width="104" height="190" rx="24" fill="${accent}" />
        <rect x="2130" y="610" width="104" height="300" rx="24" fill="${soft}" />
        <rect x="2280" y="520" width="104" height="390" rx="24" fill="${accent}" opacity="0.72" />
        <rect x="2430" y="680" width="104" height="230" rx="24" fill="${soft}" />
        <path d="M 1860 1320 C 2060 1030, 2260 1450, 2480 1140 S 2860 980, 3040 1120" fill="none" stroke="${accent}" stroke-width="30" stroke-linecap="round" />
      `

    case 'tooling':

    case 'rules':
      return `
        ${chromeWindow(1820, 360, 1040, 620, project)}
        <path d="M 1980 610 H 2560" stroke="${soft}" stroke-width="28" stroke-linecap="round" />
        <path d="M 1980 720 H 2700" stroke="${soft}" stroke-width="28" stroke-linecap="round" />
        <path d="M 1980 830 H 2380" stroke="${soft}" stroke-width="28" stroke-linecap="round" />
        <circle cx="2760" cy="1240" r="230" fill="${rgba(accent, 0.22)}" stroke="${rgba(project.fg, 0.22)}" stroke-width="8" />
        <path d="M 2650 1240 L 2730 1320 L 2880 1120" fill="none" stroke="${accent}" stroke-width="34" stroke-linecap="round" stroke-linejoin="round" />
      `

    case 'broadcast':
      return `
        ${chromeWindow(1800, 320, 1040, 420, project)}
        <rect x="1960" y="480" width="520" height="150" rx="32" fill="${rgba(accent, 0.18)}" stroke="${rgba(project.fg, 0.18)}" stroke-width="5" />
        <circle cx="2030" cy="555" r="22" fill="${accent}" />
        <path d="M 2090 555 H 2410" stroke="${project.fg}" stroke-width="24" stroke-linecap="round" opacity="0.78" />
        <path d="M 1870 1430 C 2040 1130, 2540 1130, 2860 1430" fill="none" stroke="${accent}" stroke-width="26" stroke-linecap="round" />
        <path d="M 2040 1270 L 2220 960 L 2380 1280 L 2580 860" fill="none" stroke="${soft}" stroke-width="24" stroke-linecap="round" stroke-linejoin="round" />
      `

    case 'studio':
      return `
        ${chromeWindow(1820, 360, 1040, 540, project)}
        <path d="M 1900 1280 C 2160 1060, 2380 900, 2720 520" fill="none" stroke="${accent}" stroke-width="34" stroke-linecap="round" />
        <path d="M 2650 528 L 2840 450 L 2780 650" fill="none" stroke="${accent}" stroke-width="28" stroke-linecap="round" stroke-linejoin="round" />
        <rect x="2000" y="1040" width="370" height="250" rx="36" fill="${softer}" stroke="${soft}" stroke-width="5" />
        <rect x="2400" y="830" width="370" height="250" rx="36" fill="${rgba(accent, 0.14)}" stroke="${soft}" stroke-width="5" />
      `

    case 'stack':
      return `
        <rect x="1920" y="430" width="720" height="440" rx="44" fill="${softer}" stroke="${soft}" stroke-width="6" />
        <rect x="2040" y="550" width="720" height="440" rx="44" fill="${rgba(accent, 0.1)}" stroke="${soft}" stroke-width="6" />
        <rect x="2160" y="670" width="720" height="440" rx="44" fill="${softer}" stroke="${soft}" stroke-width="6" />
        <path d="M 1960 1310 L 2220 1150 L 2480 1310 L 2220 1470 Z" fill="${rgba(accent, 0.28)}" stroke="${soft}" stroke-width="8" />
      `

    case 'systems':
      return `
        <circle cx="2320" cy="900" r="330" fill="${rgba(accent, 0.14)}" stroke="${rgba(project.fg, 0.24)}" stroke-width="8" />
        <circle cx="2320" cy="900" r="120" fill="${rgba(project.bg, 0.52)}" stroke="${accent}" stroke-width="12" />
        <circle cx="1920" cy="610" r="92" fill="${rgba(accent, 0.3)}" />
        <circle cx="2780" cy="660" r="92" fill="${softer}" stroke="${soft}" stroke-width="6" />
        <circle cx="2740" cy="1260" r="92" fill="${rgba(accent, 0.22)}" />
        <circle cx="1940" cy="1260" r="92" fill="${softer}" stroke="${soft}" stroke-width="6" />
        <path d="M 1990 660 L 2200 830 M 2440 830 L 2700 700 M 2430 990 L 2680 1220 M 2190 990 L 2000 1220" stroke="${soft}" stroke-width="18" stroke-linecap="round" />
      `

    case 'map':
      return `
        <path d="M 1840 1510 V 660 L 2180 420 V 1510" fill="${softer}" stroke="${soft}" stroke-width="8" />
        <path d="M 2200 1510 V 520 L 2560 300 V 1510" fill="${rgba(accent, 0.13)}" stroke="${soft}" stroke-width="8" />
        <path d="M 2580 1510 V 760 L 2920 540 V 1510" fill="${softer}" stroke="${soft}" stroke-width="8" />
        <path d="M 2680 430 C 2820 430, 2930 540, 2930 680 C 2930 870, 2680 1120, 2680 1120 C 2680 1120, 2430 870, 2430 680 C 2430 540, 2540 430, 2680 430 Z" fill="${accent}" />
        <circle cx="2680" cy="670" r="82" fill="${project.bg}" opacity="0.72" />
      `

    case 'community':
      return `
        <circle cx="2580" cy="720" r="250" fill="${rgba(project.accent2, 0.18)}" />
        <ellipse cx="2580" cy="720" rx="390" ry="136" fill="none" stroke="${project.fg}" stroke-width="16" opacity="0.72" />
        <ellipse cx="2580" cy="720" rx="390" ry="136" transform="rotate(60 2580 720)" fill="none" stroke="${project.fg}" stroke-width="16" opacity="0.72" />
        <ellipse cx="2580" cy="720" rx="390" ry="136" transform="rotate(120 2580 720)" fill="none" stroke="${project.fg}" stroke-width="16" opacity="0.72" />
        <circle cx="2580" cy="720" r="42" fill="${accent}" />
        <path d="M 1820 1430 C 2100 1180, 2700 1180, 3000 1430" fill="none" stroke="${accent}" stroke-width="28" stroke-linecap="round" />
        <path d="M 1900 1540 C 2160 1370, 2640 1370, 2920 1540" fill="none" stroke="${soft}" stroke-width="24" stroke-linecap="round" />
      `

    case 'editor':
      return `
        ${chromeWindow(1780, 300, 1140, 1050, project)}
        <path d="M 1900 520 H 2240" stroke="${soft}" stroke-width="24" stroke-linecap="round" />
        <path d="M 1900 610 H 2140" stroke="${rgba(project.accent2, 0.7)}" stroke-width="24" stroke-linecap="round" />
        <path d="M 1900 700 H 2520" stroke="${soft}" stroke-width="24" stroke-linecap="round" />
        <path d="M 1900 790 H 2380" stroke="${rgba(accent, 0.78)}" stroke-width="24" stroke-linecap="round" />
        <path d="M 1900 880 H 2680" stroke="${soft}" stroke-width="24" stroke-linecap="round" />
        <path d="M 1900 970 H 2300" stroke="${rgba(project.accent2, 0.7)}" stroke-width="24" stroke-linecap="round" />
      `

    case 'commerce':
      return `
        ${chromeWindow(1780, 330, 1120, 560, project)}
        <rect x="1950" y="560" width="200" height="230" rx="32" fill="${softer}" stroke="${soft}" stroke-width="6" />
        <rect x="2220" y="560" width="200" height="230" rx="32" fill="${rgba(accent, 0.36)}" stroke="${soft}" stroke-width="6" />
        <rect x="2490" y="560" width="200" height="230" rx="32" fill="${softer}" stroke="${soft}" stroke-width="6" />
        <path d="M 1900 1280 H 2740 L 2670 1550 H 2020 Z" fill="${softer}" stroke="${soft}" stroke-width="10" stroke-linejoin="round" />
        <circle cx="2110" cy="1600" r="62" fill="${accent}" />
        <circle cx="2590" cy="1600" r="62" fill="${accent}" />
        <path d="M 1940 1160 H 2780" stroke="${accent}" stroke-width="32" stroke-linecap="round" />
      `

    case 'stage':
      return `
        <path d="M 1840 1330 C 2050 1030, 2640 1030, 2920 1330 V 1520 H 1840 Z" fill="${softer}" stroke="${soft}" stroke-width="8" />
        <path d="M 1840 1330 H 2920" stroke="${accent}" stroke-width="28" stroke-linecap="round" />
        <circle cx="2380" cy="620" r="250" fill="${rgba(accent, 0.14)}" />
        <path d="M 2180 520 H 2580" stroke="${project.fg}" stroke-width="30" stroke-linecap="round" opacity="0.72" />
        <path d="M 2080 640 H 2680" stroke="${soft}" stroke-width="24" stroke-linecap="round" />
        <path d="M 2280 760 H 2480" stroke="${accent}" stroke-width="24" stroke-linecap="round" />
        <circle cx="2020" cy="1520" r="24" fill="${soft}" />
        <circle cx="2160" cy="1480" r="24" fill="${soft}" />
        <circle cx="2300" cy="1520" r="24" fill="${soft}" />
        <circle cx="2440" cy="1480" r="24" fill="${soft}" />
        <circle cx="2580" cy="1520" r="24" fill="${soft}" />
        <circle cx="2720" cy="1480" r="24" fill="${soft}" />
      `

    case 'orbit':
      return `
        <path d="M 2320 360 H 2600 L 2730 660 C 2730 1020, 2580 1260, 2460 1360 C 2340 1260, 2190 1020, 2190 660 Z" fill="${softer}" stroke="${soft}" stroke-width="10" />
        <path d="M 2320 360 H 2600 L 2530 210 H 2390 Z" fill="${rgba(accent, 0.42)}" stroke="${soft}" stroke-width="10" />
        <path d="M 1900 780 C 2100 640, 2840 640, 3020 780" fill="none" stroke="${project.fg}" stroke-width="20" stroke-linecap="round" opacity="0.78" />
        <path d="M 1880 1480 C 2100 1240, 2840 1240, 3040 1480" fill="none" stroke="${accent}" stroke-width="28" stroke-linecap="round" />
        <path d="M 1800 1620 C 2100 1370, 2860 1370, 3140 1620" fill="none" stroke="${soft}" stroke-width="22" stroke-linecap="round" />
      `

    default:
      return `<circle cx="2400" cy="900" r="520" fill="${rgba(accent, 0.18)}" />`
  }
}

function coverSvg(project) {
  const light = project.bg === '#f4efe7'
  const wash = light ? 'rgba(255,255,255,0.68)' : 'rgba(255,255,255,0.06)'
  const line = light ? 'rgba(7,50,71,0.1)' : 'rgba(255,255,255,0.08)'

  return `
    <svg width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <pattern id="grid" width="96" height="96" patternUnits="userSpaceOnUse">
          <path d="M 96 0 L 0 0 0 96" fill="none" stroke="${line}" stroke-width="1" />
        </pattern>
        <radialGradient id="glow" cx="26%" cy="40%" r="58%">
          <stop offset="0%" stop-color="${rgba(project.accent, light ? 0.2 : 0.32)}" />
          <stop offset="100%" stop-color="${rgba(project.bg, 0)}" />
        </radialGradient>
        <radialGradient id="rightGlow" cx="78%" cy="36%" r="48%">
          <stop offset="0%" stop-color="${rgba(project.accent2, light ? 0.34 : 0.2)}" />
          <stop offset="100%" stop-color="${rgba(project.bg, 0)}" />
        </radialGradient>
      </defs>

      <rect width="${WIDTH}" height="${HEIGHT}" fill="${project.bg}" />
      <rect width="${WIDTH}" height="${HEIGHT}" fill="url(#grid)" />
      <rect width="${WIDTH}" height="${HEIGHT}" fill="url(#glow)" />
      <rect width="${WIDTH}" height="${HEIGHT}" fill="url(#rightGlow)" />

      <path d="M 0 1480 L 1320 2000 H 0 Z" fill="${rgba(project.accent, light ? 0.42 : 0.3)}" />
      <path d="M 830 2000 L 3200 2000 L 3200 1420 C 2740 1660 2260 1590 1840 1390 C 1380 1170 1070 1220 830 2000 Z" fill="${rgba(project.accent2, light ? 0.36 : 0.12)}" />
      <path d="M 2220 0 H 3200 V 430 L 2650 340 Z" fill="${rgba(project.fg, light ? 0.16 : 0.08)}" />
      <path d="M 180 150 H 1450 L 1290 390 H 60 Z" fill="${wash}" opacity="${light ? '0.42' : '0.52'}" />

      <text
        x="230"
        y="400"
        fill="${project.accent}"
        font-family="Montserrat, Avenir Next, Arial, sans-serif"
        font-size="58"
        font-weight="800"
      >${escapeHtml(project.eyebrow.toUpperCase())}</text>

      ${titleMarkup(project)}

      <text
        x="236"
        y="1340"
        fill="${rgba(project.fg, light ? 0.78 : 0.72)}"
        font-family="Montserrat, Avenir Next, Arial, sans-serif"
        font-size="66"
        font-weight="600"
      >${escapeHtml(project.detail)}</text>

      <rect x="230" y="1500" width="580" height="8" rx="4" fill="${project.accent}" />
      <rect x="850" y="1500" width="210" height="8" rx="4" fill="${rgba(project.fg, light ? 0.32 : 0.18)}" />

      ${motifMarkup(project)}
    </svg>
  `
}

async function renderCover(project) {
  const outPath = path.join(PROJECTS_ROOT, project.slug, 'cover-v2.webp')

  await sharp(Buffer.from(coverSvg(project)))
    .webp({ quality: 94 })
    .toFile(outPath)

  return outPath
}

async function renderContactSheet() {
  await fs.mkdir(path.dirname(CONTACT_SHEET_PATH), { recursive: true })

  const thumbs = await Promise.all(PROJECTS.map(async project => {
    const file = path.join(PROJECTS_ROOT, project.slug, 'cover-v2.webp')
    const image = await sharp(file).resize(480, 300, { fit: 'cover' }).webp().toBuffer()

    const label = await sharp(Buffer.from(`
      <svg width="480" height="52" xmlns="http://www.w3.org/2000/svg">
        <rect width="480" height="52" fill="#111318" />
        <text x="18" y="34" font-family="Arial, sans-serif" font-size="24" font-weight="700" fill="#fff">${escapeHtml(project.slug)}</text>
      </svg>
    `)).png().toBuffer()

    return sharp({
      create: {
        width: 480,
        height: 352,
        channels: 4,
        background: '#ffffff'
      }
    })
      .composite([
        { input: image, left: 0, top: 0 },
        { input: label, left: 0, top: 300 }
      ])
      .png()
      .toBuffer()
  }))

  const cols = 3
  const gap = 28
  const rows = Math.ceil(thumbs.length / cols)
  const sheetWidth = (cols * 480) + ((cols - 1) * gap)
  const sheetHeight = (rows * 352) + ((rows - 1) * gap)

  await sharp({
    create: {
      width: sheetWidth,
      height: sheetHeight,
      channels: 4,
      background: '#f3f4f6'
    }
  })
    .composite(thumbs.map((input, index) => ({
      input,
      left: (index % cols) * (480 + gap),
      top: Math.floor(index / cols) * (352 + gap)
    })))
    .webp({ quality: 92 })
    .toFile(CONTACT_SHEET_PATH)
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
  const outPath = await renderCover(project)

  console.log(`generated ${path.relative(process.cwd(), outPath)}`)
}

if (requestedSlugs.length === 0) {
  await renderContactSheet()

  console.log(`generated ${path.relative(process.cwd(), CONTACT_SHEET_PATH)}`)
}
