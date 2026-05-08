import fs from 'node:fs'
import path from 'node:path'
import satori from 'satori'
import * as satoriHtml from 'satori-html'
import sharp from 'sharp'

import { Resvg } from '@resvg/resvg-js'

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

// Load wallpaper background (resize once at startup, keep as PNG for data URI)
const wallpaperBuf = await sharp(
  path.resolve(process.cwd(), 'src/assets/wallpapers/wallpaper-3-desktop.webp'),
)
  .resize(1200, 630, { fit: 'cover' })
  .png()
  .toBuffer()
const WALLPAPER_DATA_URI = `data:image/png;base64,${wallpaperBuf.toString('base64')}`

// Dark-mode logo (white/light text on dark background)
const logoBuf = await sharp(
  path.resolve(process.cwd(), 'src/assets/brand/logos/logo-santi020k-dark.webp'),
)
  .resize(220, 36, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
  .png()
  .toBuffer()
const LOGO_DATA_URI = `data:image/png;base64,${logoBuf.toString('base64')}`

// Decorative square mark for text-only cards
const iconBuf = await sharp(
  path.resolve(process.cwd(), 'public/logos/logo-square.webp'),
)
  .resize(260, 260, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
  .png()
  .toBuffer()
const ICON_DATA_URI = `data:image/png;base64,${iconBuf.toString('base64')}`

// ─── Layout constants ─────────────────────────────────────────────────────────

const COVER_W = 400
const COVER_H = 252
const DARK_BG = '#110c1d' // fallback background under wallpaper

// ─── Helpers ──────────────────────────────────────────────────────────────────

const escape = s =>
  s
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')

const titleFontSize = (title, hasCover) => {
  const thresholds = hasCover ?
    [[90, 38], [72, 46], [56, 54], [38, 62]] :
    [[90, 52], [72, 62], [56, 72], [38, 82]]

  return thresholds.find(([len]) => title.length > len)?.[1] ?? (hasCover ? 70 : 92)
}

const loadCoverDataURI = async coverImagePath => {
  // eslint-disable-next-line security/detect-non-literal-fs-filename
  if (!coverImagePath || !fs.existsSync(coverImagePath)) return null

  const buf = await sharp(coverImagePath)
    .rotate()
    .resize(COVER_W * 2, COVER_H * 2, { background: { r: 20, g: 14, b: 36 }, fit: 'contain' })
    .jpeg({ mozjpeg: true, quality: 84 })
    .toBuffer()

  return `data:image/jpeg;base64,${buf.toString('base64')}`
}

// ─── Dark-mode template sections ──────────────────────────────────────────────
// NOTE: Satori requires `display:flex` on every container div.

/**
 * Top header: logo on left, type badge on right.
 */
const renderHeader = type => `
  <div style="display:flex;align-items:center;justify-content:space-between;width:100%;">
    <div style="display:flex;flex-direction:column;gap:8px;">
      <img src="${LOGO_DATA_URI}" style="display:flex;width:220px;height:36px;object-fit:contain;object-position:left center;" />
      <div style="display:flex;align-items:center;gap:10px;">
        <div style="display:flex;width:48px;height:3px;border-radius:999px;background:linear-gradient(90deg,#5a0fdb 0%,#4a0fc7 100%);"></div>
        <span style="display:flex;font-size:16px;font-weight:700;color:rgba(255,255,255,0.55);letter-spacing:0.12em;text-transform:uppercase;">santi020k.com</span>
      </div>
    </div>
    <div style="display:flex;align-items:center;padding:12px 22px;border-radius:999px;background:#5a0fdb;">
      <span style="display:flex;font-size:18px;font-weight:800;color:#ffffff;letter-spacing:0.18em;text-transform:uppercase;">${escape(type)}</span>
    </div>
  </div>
`

/**
 * Title rendered as a bold white heading.
 */
const renderTitle = (title, size, maxWidth = '100%') => `
  <h1 style="display:flex;margin:0;max-width:${maxWidth};font-size:${size}px;font-weight:900;line-height:1.06;letter-spacing:-0.03em;color:#ffffff;">${escape(title)}</h1>
`

/**
 * Body section: two variants — with a cover image (left title / right image) or text-only (title + faded icon).
 * No footer, so the body fills all remaining vertical space.
 */
const renderBody = (title, size, coverUri) =>
  coverUri ?
    `
  <div style="display:flex;align-items:center;gap:56px;width:100%;flex:1;">
    <div style="display:flex;flex:1;flex-direction:column;justify-content:center;gap:22px;min-width:0;">
      <div style="display:flex;width:120px;height:4px;border-radius:999px;background:linear-gradient(90deg,#5a0fdb 0%,#8f5af7 100%);"></div>
      ${renderTitle(title, size, '540px')}
    </div>
    <div style="display:flex;width:${COVER_W}px;height:${COVER_H}px;flex-shrink:0;border-radius:22px;padding:8px;background:linear-gradient(145deg,rgba(90,15,219,0.30) 0%,rgba(74,15,199,0.12) 100%);border:1px solid rgba(255,255,255,0.14);">
      <div style="display:flex;width:100%;height:100%;border-radius:16px;overflow:hidden;background:#110c1d;border:2px solid rgba(255,255,255,0.08);">
        <img src="${coverUri}" style="display:flex;width:100%;height:100%;object-fit:contain;object-position:center;" />
      </div>
    </div>
  </div>
` :
    `
  <div style="display:flex;align-items:center;flex:1;gap:40px;width:100%;">
    <div style="display:flex;flex-direction:column;gap:22px;flex:1;min-width:0;">
      <div style="display:flex;width:120px;height:4px;border-radius:999px;background:linear-gradient(90deg,#5a0fdb 0%,#4a0fc7 100%);"></div>
      ${renderTitle(title, size, '860px')}
    </div>
    <div style="display:flex;width:240px;height:240px;flex-shrink:0;opacity:0.12;">
      <img src="${ICON_DATA_URI}" style="display:flex;width:240px;height:240px;object-fit:contain;" />
    </div>
  </div>
`

/**
 * Outer canvas: wallpaper background + dark overlay + content.
 * Satori does not support CSS background-image, so we layer images manually.
 * No footer — header + body fill the full 630px height.
 */
const renderCanvas = (header, body) => `
  <div style="display:flex;width:1200px;height:630px;background-color:${DARK_BG};font-family:'Montserrat',sans-serif;">
    <div style="display:flex;position:absolute;top:0;left:0;width:1200px;height:630px;">
      <img src="${WALLPAPER_DATA_URI}" style="display:flex;width:1200px;height:630px;object-fit:cover;" />
    </div>
    <div style="display:flex;position:absolute;top:0;left:0;width:1200px;height:630px;background:rgba(17,12,29,0.75);"></div>
    <div style="display:flex;position:relative;width:100%;height:100%;flex-direction:column;padding:52px 64px;">
      ${header}
      ${body}
    </div>
  </div>
`

// ─── Main export ──────────────────────────────────────────────────────────────

/**
 * @param {{ coverImagePath?: string, description: string, title: string, type: string }} props
 * @returns {Promise<Buffer>}
 */
export const renderSocialImage = async ({ coverImagePath, title, type }) => {
  const coverUri = await loadCoverDataURI(coverImagePath)
  const hasCover = Boolean(coverUri)
  const size = titleFontSize(title, hasCover)

  const html = renderCanvas(
    renderHeader(type),
    renderBody(title, size, coverUri),
  ).trim()

  const markup = /** @type {Parameters<typeof satori>[0]} */ (satoriHtml.html(html))
  const svg = await satori(markup, { width: 1200, height: 630, fonts: FONTS })
  // effort: 0 is ~3× faster with negligible quality difference
  const png = new Resvg(svg, { fitTo: { mode: 'width', value: 1200 } }).render().asPng()

  return sharp(png).webp({ quality: 80, effort: 0 }).toBuffer()
}
