import type { APIRoute } from 'astro'
import { getCollection } from 'astro:content'
import fs from 'node:fs'
import path from 'node:path'
import satori from 'satori'
import * as satoriHtml from 'satori-html'

import { Resvg } from '@resvg/resvg-js'

export const getStaticPaths = async () => {
  const posts = await getCollection('post')
  const projects = await getCollection('project')

  const postPaths = posts.map(post => ({
    params: { slug: `blog/${post.id}` },
    props: {
      description: post.data.description,
      title: post.data.title,
      type: 'Blog Post'
    }
  }))

  const projectPaths = projects.map(project => ({
    params: { slug: `portfolio/${project.id}` },
    props: {
      description: project.data.description,
      title: project.data.title,
      type: 'Project'
    }
  }))

  return [...postPaths, ...projectPaths]
}

interface OGProps {
  description: string
  title: string
  type: string
}

export const GET: APIRoute<OGProps> = async ({ props }) => {
  const { description, title, type } = props
  // Load fonts from public directory
  const fontRegular = fs.readFileSync(path.resolve('./public/fonts/Montserrat-Regular.ttf'))
  const fontBold = fs.readFileSync(path.resolve('./public/fonts/Montserrat-ExtraBold.ttf'))

  // template matching the site's dark theme
  const markupHtml = `
    <div style="height: 630px; width: 1200px; display: flex; flex-direction: column; 
    align-items: flex-start; justify-content: center; background-color: #17121d; 
    color: #e9e5f1; font-family: 'Montserrat', sans-serif; position: relative;">
      <!-- Subtle Brand Gradients -->
      <div style="display: flex; position: absolute; top: -100px; left: -100px; width: 500px; height: 500px; 
      background: radial-gradient(circle, rgba(168, 85, 247, 0.12) 0%, transparent 70%); border-radius: 100%;"></div>
      <div style="display: flex; position: absolute; bottom: -100px; right: -100px; width: 400px; height: 400px; 
      background: radial-gradient(circle, rgba(99, 102, 241, 0.1) 0%, transparent 70%); border-radius: 100%;"></div>

      <div style="padding: 0 80px; display: flex; flex-direction: column; width: 100%;">
        <!-- Content Type Badge -->
        <div style="display: flex; align-items: center; margin-bottom: 32px;">
          <div style="display: flex; height: 28px; width: 4px; background-color: #a855f7; margin-right: 16px; 
          border-radius: 2px;"></div>
          <span style="font-size: 22px; font-weight: 800; text-transform: uppercase; 
          letter-spacing: 0.15em; color: #a855f7;">
            ${type}
          </span>
        </div>

        <!-- Main Title -->
        <h1 style="font-size: 82px; font-weight: 900; line-height: 1.1; margin: 0 0 32px 0; 
        color: #ffffff; letter-spacing: -0.02em;">
          ${title}
        </h1>

        <!-- Description -->
        <p style="font-size: 32px; color: #9a91a0; line-height: 1.4; margin: 0; max-width: 900px; display: flex;">
          ${description}
        </p>

        <!-- Footer / Branding -->
        <div style="display: flex; align-items: center; margin-top: 64px; width: 100%; 
        border-top: 1px solid rgba(168, 85, 247, 0.15); padding-top: 40px;">
          <div style="display: flex; flex-direction: column;">
            <span style="font-size: 28px; font-weight: 800; color: #ffffff; letter-spacing: -0.01em;">
              Santiago Molina
            </span>
            <span style="font-size: 20px; color: #a855f7; font-weight: 600; margin-top: 4px;">
              Engineering Leader · santi.codes
            </span>
          </div>
        </div>
      </div>

      <!-- Brand Bottom Bar -->
      <div style="display: flex; position: absolute; bottom: 0; left: 0; width: 100%; height: 8px; 
      background: linear-gradient(90deg, #a855f7, #6366f1);"></div>
    </div>
  `.trim()

  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const markup = satoriHtml.html(markupHtml) as unknown as Parameters<typeof satori>[0]

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
        weight: 900,
        style: 'normal'
      }
    ]
  })

  const resvg = new Resvg(svg, {
    fitTo: {
      mode: 'width',
      value: 1200
    }
  })

  const pngData = resvg.render()
  const pngBuffer = pngData.asPng()
  const body = new Uint8Array(pngBuffer)

  return new Response(body, {
    headers: {
      'Cache-Control': 'public, max-age=31536000, immutable',
      'Content-Type': 'image/png'
    },
    status: 200
  })
}
