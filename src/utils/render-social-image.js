import fs from 'node:fs'
import path from 'node:path'
import satori from 'satori'
import * as satoriHtml from 'satori-html'
import sharp from 'sharp'

import { Resvg } from '@resvg/resvg-js'

/**
 * HSL (hue 0–360, saturation and lightness 0–100) to sRGB 0–255.
 * Matches CSS `hsl()` rounding for values in `src/styles/partials/tokens.css`
 * (`:root` / `[data-theme="light"]`). Keep tuples in sync when tokens change.
 */
const hslToRgb = (h, s, l) => {
  s /= 100
  l /= 100
  const a = s * Math.min(l, 1 - l)
  const f = n => {
    const k = (n + h / 30) % 12
    return Math.round(255 * (l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1)))
  }

  return { r: f(0), g: f(8), b: f(4) }
}

const rgbToHex = ({ r, g, b }) =>
  `#${[r, g, b].map(v => v.toString(16).padStart(2, '0')).join('')}`

/** Light-mode design tokens (same HSL components as tokens.css). */
const LIGHT = {
  themeBg: [268, 20, 98],
  surfaceMuted: [268, 20, 96],
  ink: [268, 10, 20],
  inkSoft: [268, 8, 36],
  inkMuted: [268, 6, 28],
  brand: [267, 77, 42],
  accent: [267, 82, 52],
  glow: [268, 88, 70],
  brandSoft: [267, 52, 94]
}

/** Dark `--surface` — letterboxing for cover `object-fit: contain`. */
const COVER_LETTERBOX_HSL = [277, 20, 14]

const OG_BRAND = hslToRgb(...LIGHT.brand)
const OG_ACCENT = hslToRgb(...LIGHT.accent)
const OG_GLOW = hslToRgb(...LIGHT.glow)
const OG_INK = hslToRgb(...LIGHT.ink)
const OG_INK_SOFT = hslToRgb(...LIGHT.inkSoft)
const OG_INK_MUTED = hslToRgb(...LIGHT.inkMuted)
const OG_THEME_BG = hslToRgb(...LIGHT.themeBg)
const OG_SURFACE_MUTED = hslToRgb(...LIGHT.surfaceMuted)
const OG_BRAND_SOFT = hslToRgb(...LIGHT.brandSoft)
const OG_COVER_PAD = hslToRgb(...COVER_LETTERBOX_HSL)

const HEX_BRAND = rgbToHex(OG_BRAND)
const HEX_ACCENT = rgbToHex(OG_ACCENT)
const HEX_INK = rgbToHex(OG_INK)
const HEX_INK_SOFT = rgbToHex(OG_INK_SOFT)
const HEX_INK_MUTED = rgbToHex(OG_INK_MUTED)
const HEX_THEME_BG = rgbToHex(OG_THEME_BG)
const HEX_SURFACE_MUTED = rgbToHex(OG_SURFACE_MUTED)
const HEX_COVER_PAD = rgbToHex(OG_COVER_PAD)

const ogRgba = ({ r, g, b }, a) => `rgba(${r}, ${g}, ${b}, ${a})`

const fontRegular = fs.readFileSync(path.resolve(process.cwd(), 'public/fonts/Montserrat-Regular.ttf'))
const fontBold = fs.readFileSync(path.resolve(process.cwd(), 'public/fonts/Montserrat-ExtraBold.ttf'))
const logoBase64 = (await sharp(path.resolve(process.cwd(), 'public/logo.webp')).png().toBuffer()).toString('base64')
const logoDataURI = `data:image/png;base64,${logoBase64}`
const COVER_FRAME_WIDTH = 348
const COVER_FRAME_HEIGHT = 220

const escapeHTML = value => value
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll('\'', '&#39;')

/**
 * Adaptive title font size — now that description is gone the title has
 * ~340px of vertical room so we can afford larger sizes at every tier.
 */
const getTitleSize = (title, hasCoverImage = false) => {
  if (hasCoverImage) {
    if (title.length > 90) return 34

    if (title.length > 72) return 40

    if (title.length > 56) return 46

    if (title.length > 38) return 52

    return 58
  }

  if (title.length > 90) return 44

  if (title.length > 72) return 52

  if (title.length > 56) return 60

  if (title.length > 38) return 68

  return 78
}

/**
 * Hard-truncate description to a single line so it never causes overflow,
 * regardless of how long the original value is.
 */
const truncateDescription = (text, max = 105) => text.length > max ? `${text.slice(0, max).trimEnd()}…` : text

const getCoverImageDataURI = async coverImagePath => {
  if (!coverImagePath) return undefined

  if (!fs.existsSync(coverImagePath)) return undefined

  const coverBase64 = (await sharp(coverImagePath)
    .rotate()
    .resize(COVER_FRAME_WIDTH * 2, COVER_FRAME_HEIGHT * 2, {
      background: HEX_COVER_PAD,
      fit: 'contain'
    })
    .jpeg({
      mozjpeg: true,
      quality: 82
    })
    .toBuffer()).toString('base64')

  return `data:image/jpeg;base64,${coverBase64}`
}

/**
 * @param {{\
 *   description: string
 *   coverImagePath?: string
 *   pathLabel?: string
 *   title: string
 *   type: string
 * }} props
 */
export const renderSocialImage = async ({
  coverImagePath,
  description,
  title,
  type
}) => {
  const coverImageDataURI = await getCoverImageDataURI(coverImagePath)
  const hasCoverImage = Boolean(coverImageDataURI)
  const titleSize = getTitleSize(title, hasCoverImage)
  const shortDescription = truncateDescription(description, hasCoverImage ? 88 : 105)

  const bodyMarkup = hasCoverImage ?
    `
      <div style="
        display: flex;
        align-items: center;
        gap: 34px;
        width: 100%;
        margin: 36px 0 30px;
      ">
        <div style="
          display: flex;
          flex: 1;
          flex-direction: column;
          justify-content: center;
          gap: 22px;
          min-width: 0;
        ">
          <div style="
            display: flex;
            width: 140px;
            height: 10px;
            border-radius: 999px;
            background: linear-gradient(90deg, ${ogRgba(OG_BRAND, 0.16)} 0%, ${ogRgba(OG_GLOW, 0.02)} 100%);
          "></div>
          <h1 style="
            display: flex;
            margin: 0;
            max-width: 660px;
            font-size: ${titleSize}px;
            font-weight: 900;
            line-height: 1.06;
            letter-spacing: -0.04em;
            color: ${HEX_INK};
          ">
            ${escapeHTML(title)}
          </h1>
        </div>

        <div style="
          display: flex;
          width: ${COVER_FRAME_WIDTH}px;
          height: ${COVER_FRAME_HEIGHT}px;
          flex-shrink: 0;
          border-radius: 30px;
          padding: 10px;
          background: linear-gradient(145deg, ${ogRgba(OG_BRAND, 0.24)} 0%, ${ogRgba(OG_GLOW, 0.08)} 100%);
          box-shadow: 0 24px 54px ${ogRgba(OG_INK, 0.16)};
        ">
          <div style="
            display: flex;
            position: relative;
            width: 100%;
            height: 100%;
            overflow: hidden;
            border-radius: 22px;
            background: ${HEX_COVER_PAD};
          ">
            <img
              src="${coverImageDataURI}"
              style="
                display: flex;
                width: 100%;
                height: 100%;
                object-fit: contain;
                object-position: center;
              "
            />
          </div>
        </div>
      </div>
    ` :
    `
      <div style="
        display: flex;
        flex-direction: column;
        gap: 0;
        width: 100%;
        max-width: 1020px;
      ">
        <h1 style="
          display: flex;
          margin: 0;
          font-size: ${titleSize}px;
          font-weight: 900;
          line-height: 1.06;
          letter-spacing: -0.04em;
          color: ${HEX_INK};
        ">
          ${escapeHTML(title)}
        </h1>
      </div>
    `

  const markupHtml = `
    <div style="
      width: 1200px;
      height: 630px;
      display: flex;
      position: relative;
      overflow: hidden;
      padding: 34px;
      background:
        linear-gradient(90deg, ${ogRgba(OG_BRAND, 0.05)} 1px, transparent 1px),
        linear-gradient(${ogRgba(OG_BRAND, 0.05)} 1px, transparent 1px),
        linear-gradient(180deg, ${HEX_THEME_BG} 0%, ${HEX_SURFACE_MUTED} 100%);
      background-size: 96px 96px, 96px 96px, cover;
      color: ${HEX_INK};
      font-family: 'Montserrat', sans-serif;
    ">
      <!-- Decorative blobs -->
      <div style="
        display: flex;
        position: absolute;
        top: -120px;
        left: -80px;
        width: 400px;
        height: 400px;
        border-radius: 999px;
        background: radial-gradient(circle, ${ogRgba(OG_GLOW, 0.22)} 0%, ${ogRgba(OG_GLOW, 0)} 70%);
      "></div>
      <div style="
        display: flex;
        position: absolute;
        right: -60px;
        bottom: -120px;
        width: 420px;
        height: 420px;
        border-radius: 999px;
        background: radial-gradient(circle, ${ogRgba(OG_BRAND, 0.16)} 0%, ${ogRgba(OG_BRAND, 0)} 70%);
      "></div>

      <!-- Card -->
      <div style="
        width: 100%;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        border-radius: 36px;
        padding: 50px 56px;
        background: linear-gradient(180deg, rgba(255, 255, 255, 0.97) 0%, ${ogRgba(OG_BRAND_SOFT, 0.94)} 100%);
        border: 1px solid ${ogRgba(OG_BRAND, 0.14)};
        box-shadow:
          0 22px 50px ${ogRgba(OG_INK, 0.08)},
          inset 0 1px 0 rgba(255, 255, 255, 0.9);
      ">

        <!-- Header: logo left, type badge right -->
        <div style="
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: space-between;
        ">
          <!-- Logo + domain -->
          <div style="display: flex; flex-direction: column; gap: 10px;">
            <img
              src="${logoDataURI}"
              style="display: flex; width: 200px; height: 32px;"
            />
            <div style="display: flex; align-items: center; gap: 12px;">
              <div style="
                display: flex;
                width: 56px;
                height: 4px;
                border-radius: 999px;
                background: linear-gradient(90deg, ${HEX_BRAND} 0%, ${HEX_ACCENT} 100%);
              "></div>
              <span style="
                display: flex;
                font-size: 18px;
                font-weight: 700;
                color: ${HEX_INK_SOFT};
                letter-spacing: 0.1em;
                text-transform: uppercase;
              ">
                santi020k.com
              </span>
            </div>
          </div>

          <!-- Type badge -->
          <div style="
            display: flex;
            align-items: center;
            border-radius: 999px;
            padding: 14px 24px;
            background: ${ogRgba(OG_BRAND, 0.08)};
            border: 1px solid ${ogRgba(OG_BRAND, 0.16)};
          ">
            <span style="
              display: flex;
              font-size: 20px;
              font-weight: 800;
              letter-spacing: 0.2em;
              text-transform: uppercase;
              color: ${HEX_BRAND};
            ">
              ${escapeHTML(type)}
            </span>
          </div>
        </div>

        <!-- Hero title / optional cover panel -->
        ${bodyMarkup}

        <!-- Footer: single-line description + author attribution -->
        <div style="
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 32px;
          width: 100%;
          padding-top: 22px;
          border-top: 1px solid ${ogRgba(OG_BRAND, 0.1)};
        ">
          <span style="
            display: flex;
            flex: 1;
            font-size: 22px;
            font-weight: 400;
            color: ${HEX_INK_SOFT};
            line-height: 1;
            max-width: ${hasCoverImage ? 640 : 860}px;
          ">
            ${escapeHTML(shortDescription)}
          </span>
          <span style="
            display: flex;
            font-size: 18px;
            font-weight: 700;
            color: ${HEX_INK_MUTED};
            white-space: nowrap;
            letter-spacing: 0.04em;
          ">
            Santiago Molina
          </span>
        </div>

      </div>
    </div>
  `.trim()

  const markup = /** @type {Parameters<typeof satori>[0]} */ (satoriHtml.html(markupHtml))

  const svg = await satori(markup, {
    width: 1200,
    height: 630,
    fonts: [
      {
        name: 'Montserrat',
        data: fontRegular,
        style: 'normal',
        weight: 400
      },
      {
        name: 'Montserrat',
        data: fontBold,
        style: 'normal',
        weight: 900
      }
    ]
  })

  const resvg = new Resvg(svg, {
    fitTo: {
      mode: 'width',
      value: 1200
    }
  })

  const pngBuffer = resvg.render().asPng()

  // effort: 0 is ~3x faster than the default (4) with negligible quality difference.
  return await sharp(pngBuffer).webp({ quality: 80, effort: 0 }).toBuffer()
}
