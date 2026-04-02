import type { APIContext, GetStaticPaths } from 'astro'
import { getCollection } from 'astro:content'
import fs from 'node:fs'
import path from 'node:path'
import satori from 'satori'
import { html } from 'satori-html'

import { siteConfig } from '../../site.config'

import { Resvg } from '@resvg/resvg-js'

const fontRegularPath = path.resolve('./public/fonts/montserrat-variable-font-wght.ttf')
const fontBoldPath = path.resolve('./public/fonts/montserrat-variable-font-wght.ttf')
const fontRegular = fs.readFileSync(fontRegularPath)
const fontBold = fs.readFileSync(fontBoldPath)

export const getStaticPaths = (async () => {
  const posts = await getCollection('post', ({ data }) => !data.draft)

  return posts.map(post => ({
    params: { id: post.id },
    props: {
      title: post.data.title,
      description: post.data.description,
      publishDate: post.data.publishDate
    }
  }))
}) satisfies GetStaticPaths

export const GET = async (context: APIContext) => {
  const { title, description } = context.props as {
    title: string
    description: string
    publishDate: Date
  }

  const markup = html`
    <div
      style="
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        width: 1200px;
        height: 630px;
        background: #0e0c16;
        padding: 64px;
        font-family: 'Montserrat', sans-serif;
      "
    >
      <div style="display: flex; align-items: center; gap: 12px;">
        <span
          style="
            color: #a855f7;
            font-size: 18px;
            font-weight: 700;
            letter-spacing: 0.15em;
            text-transform: uppercase;
          "
        >
          ${siteConfig.author}
        </span>
      </div>

      <div style="display: flex; flex-direction: column; gap: 20px; flex: 1; justify-content: center;">
        <h1
          style="
            color: #f0eeff;
            font-size: ${title.length > 50 ? '44px' : '56px'};
            font-weight: 800;
            line-height: 1.15;
            margin: 0;
            letter-spacing: -0.02em;
            max-width: 880px;
          "
        >
          ${title}
        </h1>

        ${description ?
          `
          <p
            style="
              color: #9e98c0;
              font-size: 22px;
              font-weight: 400;
              line-height: 1.6;
              margin: 0;
              max-width: 820px;
              display: -webkit-box;
              -webkit-line-clamp: 2;
              -webkit-box-orient: vertical;
              overflow: hidden;
            "
          >
            ${description}
          </p>
        ` :
          ''}
      </div>

      <div
        style="
          display: flex;
          align-items: center;
          justify-content: space-between;
          border-top: 1px solid #2d2547;
          padding-top: 24px;
        "
      >
        <span style="color: #6b63a0; font-size: 18px; font-weight: 500;">
          santi020k.me
        </span>
        <span
          style="
            background: #3b1f6e;
            color: #c4a8ff;
            border-radius: 100px;
            padding: 8px 20px;
            font-size: 16px;
            font-weight: 600;
            letter-spacing: 0.05em;
          "
        >
          Blog
        </span>
      </div>
    </div>
  `

  const svg = await satori(markup, {
    width: 1200,
    height: 630,
    fonts: [
      {
        name: 'Montserrat',
        data: fontRegular,
        weight: 400,
        style: 'normal'
      },
      {
        name: 'Montserrat',
        data: fontBold,
        weight: 800,
        style: 'normal'
      }
    ]
  })

  const resvg = new Resvg(svg, { fitTo: { mode: 'width', value: 1200 } })
  const png = resvg.render().asPng()

  return new Response(new Uint8Array(png), {
    headers: {
      'Content-Type': 'image/png',
      'Cache-Control': 'public, max-age=31536000, immutable'
    }
  })
}
