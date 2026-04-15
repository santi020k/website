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

const escapeHTML = value => value
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll('\'', '&#39;')

const getTitleSize = title => {
  if (title.length > 90) return 42

  if (title.length > 72) return 48

  if (title.length > 56) return 54

  if (title.length > 40) return 60

  return 68
}

const getDescriptionSize = description => {
  if (description.length > 165) return 22

  if (description.length > 120) return 25

  return 28
}

/**
 * @param {{
 *   description: string
 *   pathLabel?: string
 *   title: string
 *   type: string
 * }} props
 */
export const renderSocialImage = async ({
  description,
  pathLabel = 'santi020k.me',
  title,
  type
}) => {
  const titleSize = getTitleSize(title)
  const descriptionSize = getDescriptionSize(description)

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
      <div style="
        display: flex;
        position: absolute;
        top: -120px;
        left: -80px;
        width: 360px;
        height: 360px;
        border-radius: 999px;
        background: radial-gradient(circle, rgba(139, 92, 246, 0.24) 0%, rgba(139, 92, 246, 0) 72%);
      "></div>
      <div style="
        display: flex;
        position: absolute;
        right: -80px;
        bottom: -140px;
        width: 400px;
        height: 400px;
        border-radius: 999px;
        background: radial-gradient(circle, rgba(91, 31, 172, 0.18) 0%, rgba(91, 31, 172, 0) 72%);
      "></div>
      <div style="
        display: flex;
        position: absolute;
        top: 30px;
        right: 36px;
        width: 168px;
        height: 168px;
        border-radius: 999px;
        border: 1px solid rgba(91, 31, 172, 0.12);
      "></div>

      <div style="
        width: 100%;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        border-radius: 36px;
        padding: 46px 50px;
        background: linear-gradient(180deg, rgba(255, 255, 255, 0.96) 0%, rgba(249, 245, 252, 0.92) 100%);
        border: 1px solid rgba(91, 31, 172, 0.14);
        box-shadow:
          0 22px 50px rgba(35, 27, 48, 0.08),
          inset 0 1px 0 rgba(255, 255, 255, 0.9);
      ">
        <div style="
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 24px;
        ">
          <div style="
            display: flex;
            align-items: center;
            padding: 16px 22px;
            border-radius: 24px;
            background: rgba(255, 255, 255, 0.88);
            border: 1px solid rgba(91, 31, 172, 0.12);
          ">
            <img
              src="${logoDataURI}"
              style="
                display: flex;
                width: 248px;
                height: 90px;
              "
            />
          </div>

          <div style="
            display: flex;
            align-items: center;
            border-radius: 999px;
            padding: 12px 18px;
            background: rgba(91, 31, 172, 0.08);
            border: 1px solid rgba(91, 31, 172, 0.14);
          ">
            <span style="
              display: flex;
              font-size: 20px;
              font-weight: 800;
              letter-spacing: 0.18em;
              text-transform: uppercase;
              color: #5b1fac;
            ">
              ${escapeHTML(type)}
            </span>
          </div>
        </div>

        <div style="
          display: flex;
          flex-direction: column;
          gap: 24px;
          width: 100%;
          max-width: 860px;
        ">
          <div style="
            display: flex;
            align-items: center;
            gap: 14px;
          ">
            <div style="
              display: flex;
              width: 84px;
              height: 6px;
              border-radius: 999px;
              background: linear-gradient(90deg, #5b1fac 0%, #8b5cf6 100%);
            "></div>
            <span style="
              display: flex;
              font-size: 22px;
              font-weight: 600;
              color: #6a5a7c;
              letter-spacing: 0.08em;
              text-transform: uppercase;
            ">
              santi020k.me
            </span>
          </div>

          <h1 style="
            display: flex;
            margin: 0;
            font-size: ${titleSize}px;
            font-weight: 900;
            line-height: 1.02;
            letter-spacing: -0.05em;
            color: #241b31;
          ">
            ${escapeHTML(title)}
          </h1>

          <p style="
            display: flex;
            margin: 0;
            max-width: 860px;
            font-size: ${descriptionSize}px;
            line-height: 1.4;
            color: #5f516e;
          ">
            ${escapeHTML(description)}
          </p>
        </div>

        <div style="
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: 24px;
          width: 100%;
          padding-top: 28px;
          border-top: 1px solid rgba(91, 31, 172, 0.12);
        ">
          <div style="
            display: flex;
            flex-direction: column;
            gap: 8px;
          ">
            <span style="
              display: flex;
              font-size: 18px;
              font-weight: 800;
              color: #2b2138;
            ">
              Calm systems. Clear delivery.
            </span>
            <span style="
              display: flex;
              max-width: 640px;
              font-size: 18px;
              color: #6a5a7c;
            ">
              Engineering leadership, architecture, automation, and developer experience that scale with the team.
            </span>
          </div>

          <div style="
            display: flex;
            flex-direction: column;
            align-items: flex-end;
            gap: 8px;
          ">
            <span style="
              display: flex;
              font-size: 17px;
              font-weight: 700;
              letter-spacing: 0.16em;
              text-transform: uppercase;
              color: #867494;
            ">
              Social preview
            </span>
            <span style="
              display: flex;
              font-size: 22px;
              font-weight: 800;
              color: #5b1fac;
            ">
              ${escapeHTML(pathLabel)}
            </span>
          </div>
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
