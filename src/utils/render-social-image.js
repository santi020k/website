import fs from 'node:fs'
import path from 'node:path'
import satori from 'satori'
import * as satoriHtml from 'satori-html'
import sharp from 'sharp'

import { Resvg } from '@resvg/resvg-js'

// ─── Color utilities ──────────────────────────────────────────────────────────

const hsl = (h, s, l) => {
  s /= 100
  l /= 100
  const c = s * Math.min(l, 1 - l)
  const ch = n => {
    const k = (n + h / 30) % 12
    return Math.round(255 * (l - c * Math.max(Math.min(k - 3, 9 - k, 1), -1)))
  }
  return { r: ch(0), g: ch(8), b: ch(4) }
}

const hex = ({ r, g, b }) => `#${[r, g, b].map(v => v.toString(16).padStart(2, '0')).join('')}`
const rgba = ({ r, g, b }, a) => `rgba(${r}, ${g}, ${b}, ${a})`

// ─── Design tokens ────────────────────────────────────────────────────────────
// Light-mode HSL values — keep in sync with src/styles/global.css @theme.

const T = {
  bg:        hsl(268, 20, 98),
  surface:   hsl(268, 20, 96),
  ink:       hsl(268, 10, 20),
  inkSoft:   hsl(268,  8, 36),
  inkMuted:  hsl(268,  6, 28),
  brand:     hsl(267, 77, 42),
  accent:    hsl(267, 82, 52),
  glow:      hsl(268, 88, 70),
  brandSoft: hsl(267, 52, 94),
  coverPad:  hsl(277, 20, 14), // dark surface for cover letterboxing
}

// ─── Static assets ────────────────────────────────────────────────────────────

const FONTS = [
  {
    name: 'Montserrat',
    data: fs.readFileSync(path.resolve(process.cwd(), 'public/fonts/Montserrat-Regular.ttf')),
    style: 'normal',
    weight: 400,
  },
  {
    name: 'Montserrat',
    data: fs.readFileSync(path.resolve(process.cwd(), 'public/fonts/Montserrat-ExtraBold.ttf')),
    style: 'normal',
    weight: 900,
  },
]

const logoPng = await sharp(path.resolve(process.cwd(), 'public/logos/logo.webp')).png().toBuffer()
const LOGO_DATA_URI = `data:image/png;base64,${logoPng.toString('base64')}`

// ─── Layout constants ─────────────────────────────────────────────────────────

const COVER_W = 348
const COVER_H = 220

// ─── Helpers ──────────────────────────────────────────────────────────────────

const escape = s => s
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&#39;')

const truncate = (text, max) =>
  text.length > max ? `${text.slice(0, max).trimEnd()}…` : text

const titleFontSize = (title, hasCover) => {
  const thresholds = hasCover
    ? [[90, 34], [72, 40], [56, 46], [38, 52]]
    : [[90, 44], [72, 52], [56, 60], [38, 68]]
  return thresholds.find(([len]) => title.length > len)?.[1] ?? (hasCover ? 58 : 78)
}

const loadCoverDataURI = async coverImagePath => {
  if (!coverImagePath || !fs.existsSync(coverImagePath)) return null

  const buf = await sharp(coverImagePath)
    .rotate()
    .resize(COVER_W * 2, COVER_H * 2, { background: hex(T.coverPad), fit: 'contain' })
    .jpeg({ mozjpeg: true, quality: 82 })
    .toBuffer()

  return `data:image/jpeg;base64,${buf.toString('base64')}`
}

// ─── Template sections ────────────────────────────────────────────────────────

const renderHeader = type => `
  <div style="width:100%;display:flex;align-items:center;justify-content:space-between;">
    <div style="display:flex;flex-direction:column;gap:10px;">
      <img src="${LOGO_DATA_URI}" style="display:flex;width:200px;height:32px;" />
      <div style="display:flex;align-items:center;gap:12px;">
        <div style="
          display:flex;width:56px;height:4px;border-radius:999px;
          background:linear-gradient(90deg,${hex(T.brand)} 0%,${hex(T.accent)} 100%);
        "></div>
        <span style="
          display:flex;font-size:18px;font-weight:700;color:${hex(T.inkSoft)};
          letter-spacing:0.1em;text-transform:uppercase;
        ">santi020k.com</span>
      </div>
    </div>
    <div style="
      display:flex;align-items:center;border-radius:999px;padding:14px 24px;
      background:${rgba(T.brand, 0.08)};border:1px solid ${rgba(T.brand, 0.16)};
    ">
      <span style="
        display:flex;font-size:20px;font-weight:800;color:${hex(T.brand)};
        letter-spacing:0.2em;text-transform:uppercase;
      ">${escape(type)}</span>
    </div>
  </div>
`

const renderTitle = (title, size, maxWidth = '1020px') => `
  <h1 style="
    display:flex;margin:0;max-width:${maxWidth};
    font-size:${size}px;font-weight:900;line-height:1.06;
    letter-spacing:-0.04em;color:${hex(T.ink)};
  ">${escape(title)}</h1>
`

const renderBody = (title, size, coverUri) => coverUri ? `
  <div style="display:flex;align-items:center;gap:34px;width:100%;margin:36px 0 30px;">
    <div style="display:flex;flex:1;flex-direction:column;justify-content:center;gap:22px;min-width:0;">
      <div style="
        display:flex;width:140px;height:10px;border-radius:999px;
        background:linear-gradient(90deg,${rgba(T.brand, 0.16)} 0%,${rgba(T.glow, 0.02)} 100%);
      "></div>
      ${renderTitle(title, size, '660px')}
    </div>
    <div style="
      display:flex;width:${COVER_W}px;height:${COVER_H}px;flex-shrink:0;
      border-radius:30px;padding:10px;
      background:linear-gradient(145deg,${rgba(T.brand, 0.24)} 0%,${rgba(T.glow, 0.08)} 100%);
      box-shadow:0 24px 54px ${rgba(T.ink, 0.16)};
    ">
      <div style="
        display:flex;position:relative;width:100%;height:100%;
        overflow:hidden;border-radius:22px;background:${hex(T.coverPad)};
      ">
        <img src="${coverUri}" style="display:flex;width:100%;height:100%;object-fit:contain;object-position:center;" />
      </div>
    </div>
  </div>
` : `
  <div style="display:flex;flex-direction:column;width:100%;max-width:1020px;">
    ${renderTitle(title, size)}
  </div>
`

const renderFooter = (description, hasCover) => `
  <div style="
    display:flex;align-items:center;justify-content:space-between;
    gap:32px;width:100%;padding-top:22px;
    border-top:1px solid ${rgba(T.brand, 0.1)};
  ">
    <span style="
      display:flex;flex:1;font-size:22px;font-weight:400;color:${hex(T.inkSoft)};
      line-height:1;max-width:${hasCover ? 640 : 860}px;
    ">${escape(description)}</span>
    <span style="
      display:flex;font-size:18px;font-weight:700;color:${hex(T.inkMuted)};
      white-space:nowrap;letter-spacing:0.04em;
    ">Santiago Molina</span>
  </div>
`

const renderCanvas = (header, body, footer) => `
  <div style="
    width:1200px;height:630px;display:flex;position:relative;overflow:hidden;padding:34px;
    background:
      linear-gradient(90deg,${rgba(T.brand, 0.05)} 1px,transparent 1px),
      linear-gradient(${rgba(T.brand, 0.05)} 1px,transparent 1px),
      linear-gradient(180deg,${hex(T.bg)} 0%,${hex(T.surface)} 100%);
    background-size:96px 96px,96px 96px,cover;
    color:${hex(T.ink)};font-family:'Montserrat',sans-serif;
  ">
    <div style="display:flex;position:absolute;top:-120px;left:-80px;width:400px;height:400px;border-radius:999px;background:radial-gradient(circle,${rgba(T.glow, 0.22)} 0%,${rgba(T.glow, 0)} 70%);"></div>
    <div style="display:flex;position:absolute;right:-60px;bottom:-120px;width:420px;height:420px;border-radius:999px;background:radial-gradient(circle,${rgba(T.brand, 0.16)} 0%,${rgba(T.brand, 0)} 70%);"></div>
    <div style="
      width:100%;display:flex;flex-direction:column;justify-content:space-between;
      border-radius:36px;padding:50px 56px;
      background:linear-gradient(180deg,rgba(255,255,255,0.97) 0%,${rgba(T.brandSoft, 0.94)} 100%);
      border:1px solid ${rgba(T.brand, 0.14)};
      box-shadow:0 22px 50px ${rgba(T.ink, 0.08)},inset 0 1px 0 rgba(255,255,255,0.9);
    ">
      ${header}
      ${body}
      ${footer}
    </div>
  </div>
`

// ─── Main export ──────────────────────────────────────────────────────────────

/**
 * @param {{ coverImagePath?: string, description: string, title: string, type: string }} props
 * @returns {Promise<Buffer>}
 */
export const renderSocialImage = async ({ coverImagePath, description, title, type }) => {
  const coverUri = await loadCoverDataURI(coverImagePath)
  const hasCover = Boolean(coverUri)
  const size = titleFontSize(title, hasCover)
  const desc = truncate(description, hasCover ? 88 : 105)

  const html = renderCanvas(
    renderHeader(type),
    renderBody(title, size, coverUri),
    renderFooter(desc, hasCover),
  ).trim()

  const markup = /** @type {Parameters<typeof satori>[0]} */ (satoriHtml.html(html))
  const svg = await satori(markup, { width: 1200, height: 630, fonts: FONTS })
  // effort: 0 is ~3x faster than the default with negligible quality difference
  const png = new Resvg(svg, { fitTo: { mode: 'width', value: 1200 } }).render().asPng()
  return sharp(png).webp({ quality: 80, effort: 0 }).toBuffer()
}
