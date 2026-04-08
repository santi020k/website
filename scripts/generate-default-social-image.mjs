import path from 'node:path'
import sharp from 'sharp'

import { renderSocialImage } from '../src/utils/render-social-image.js'

const outputPath = path.resolve(process.cwd(), 'public/default.webp')

const image = await renderSocialImage({
  description: 'Engineering Leader & Full-Stack Architect with 12+ years of experience building resilient systems and scaling technical teams.',
  pathLabel: '/',
  title: 'Engineering Leader & Full-Stack Architect',
  type: 'Homepage'
})

await sharp(image)
  .webp({ quality: 92 })
  .toFile(outputPath)

console.log(`Generated ${outputPath}`)
