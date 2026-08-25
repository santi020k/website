import sharp from 'sharp'

const preparedImages = new Map()

/**
 * Normalize local artwork to a PNG data URL that the preset's nested SVG image
 * element renders consistently. The 2x visual-slot size keeps raster output crisp.
 */
export const prepareOgImage = filePath => {
  const cached = preparedImages.get(filePath)

  if (cached) return cached

  const prepared = sharp(filePath)
    .resize(700, 704, { fit: 'cover', position: 'centre' })
    .png({ adaptiveFiltering: true, compressionLevel: 9 })
    .toBuffer()
    .then(buffer => `data:image/png;base64,${buffer.toString('base64')}`)

  preparedImages.set(filePath, prepared)

  return prepared
}
