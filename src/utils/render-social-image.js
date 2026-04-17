import fs from 'node:fs'
import path from 'node:path'
import satori from 'satori'
import * as satoriHtml from 'satori-html'
import sharp from 'sharp'

import { Resvg } from '@resvg/resvg-js'

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
      background: '#140f1e',
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
            background: linear-gradient(90deg, rgba(91, 31, 172, 0.16) 0%, rgba(139, 92, 246, 0.02) 100%);
          "></div>
          <h1 style="
            display: flex;
            margin: 0;
            max-width: 660px;
            font-size: ${titleSize}px;
            font-weight: 900;
            line-height: 1.06;
            letter-spacing: -0.04em;
            color: #1a1228;
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
          background: linear-gradient(145deg, rgba(91, 31, 172, 0.24) 0%, rgba(139, 92, 246, 0.08) 100%);
          box-shadow: 0 24px 54px rgba(35, 27, 48, 0.16);
        ">
          <div style="
            display: flex;
            position: relative;
            width: 100%;
            height: 100%;
            overflow: hidden;
            border-radius: 22px;
            background: #140f1e;
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
          color: #1a1228;
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
        linear-gradient(90deg, rgba(91, 31, 172, 0.05) 1px, transparent 1px),
        linear-gradient(rgba(91, 31, 172, 0.05) 1px, transparent 1px),
        linear-gradient(180deg, #fbf9fd 0%, #f4effb 100%);
      background-size: 96px 96px, 96px 96px, cover;
      color: #231b30;
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
        background: radial-gradient(circle, rgba(139, 92, 246, 0.22) 0%, rgba(139, 92, 246, 0) 70%);
      "></div>
      <div style="
        display: flex;
        position: absolute;
        right: -60px;
        bottom: -120px;
        width: 420px;
        height: 420px;
        border-radius: 999px;
        background: radial-gradient(circle, rgba(91, 31, 172, 0.16) 0%, rgba(91, 31, 172, 0) 70%);
      "></div>

      <!-- Card -->
      <div style="
        width: 100%;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        border-radius: 36px;
        padding: 50px 56px;
        background: linear-gradient(180deg, rgba(255, 255, 255, 0.97) 0%, rgba(249, 245, 252, 0.94) 100%);
        border: 1px solid rgba(91, 31, 172, 0.14);
        box-shadow:
          0 22px 50px rgba(35, 27, 48, 0.08),
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
              style="display: flex; width: 200px; height: 72px;"
            />
            <div style="display: flex; align-items: center; gap: 12px;">
              <div style="
                display: flex;
                width: 56px;
                height: 4px;
                border-radius: 999px;
                background: linear-gradient(90deg, #5b1fac 0%, #8b5cf6 100%);
              "></div>
              <span style="
                display: flex;
                font-size: 18px;
                font-weight: 700;
                color: #6a5a7c;
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
            background: rgba(91, 31, 172, 0.08);
            border: 1px solid rgba(91, 31, 172, 0.16);
          ">
            <span style="
              display: flex;
              font-size: 20px;
              font-weight: 800;
              letter-spacing: 0.2em;
              text-transform: uppercase;
              color: #5b1fac;
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
          border-top: 1px solid rgba(91, 31, 172, 0.10);
        ">
          <span style="
            display: flex;
            flex: 1;
            font-size: 22px;
            font-weight: 400;
            color: #6a5a7c;
            line-height: 1;
            max-width: ${hasCoverImage ? 640 : 860}px;
          ">
            ${escapeHTML(shortDescription)}
          </span>
          <span style="
            display: flex;
            font-size: 18px;
            font-weight: 700;
            color: #9b84b0;
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
