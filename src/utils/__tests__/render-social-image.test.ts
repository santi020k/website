import path from 'node:path'
import sharp from 'sharp'
import { describe, expect, it } from 'vitest'

import { renderSocialImage } from '../render-social-image.js'

describe('renderSocialImage', () => {
  it('changes the generated card when a cover image is provided', async () => {
    const baseImage = await renderSocialImage({
      description: 'A practical write-up about resilient delivery systems and engineering standards.',
      title: 'AI Coding Is Probabilistic. Your Delivery Process Should Not Be.',
      type: 'Blog Post'
    })
    const coverImage = await renderSocialImage({
      coverImagePath: path.join(
        process.cwd(), 'src', 'content', 'post', '2026', 'ai-coding-is-probabilistic-your-delivery-process-should-not-be', 'cover.webp'
      ),
      description: 'A practical write-up about resilient delivery systems and engineering standards.',
      title: 'AI Coding Is Probabilistic. Your Delivery Process Should Not Be.',
      type: 'Blog Post'
    })

    const metadata = await sharp(coverImage).metadata()

    expect(baseImage.equals(coverImage)).toBe(false)
    expect(metadata.width).toBe(1200)
    expect(metadata.height).toBe(630)
  }, 15000)
})
