import sharp from 'sharp'

const preparedImages = new Map()
const preparedLogos = new Map()

const LOGO_SURFACES = {
  dark: '#0f172a',
  light: '#f8fafc',
  neutral: '#e2e8f0'
}

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

/**
 * Place a project logo on a quiet, square surface so the preset can display it
 * without cropping, stretching, or nesting a second content card in the OG.
 */
export const prepareOgLogo = (filePath, surface = 'dark') => {
  const background = LOGO_SURFACES[surface] ?? LOGO_SURFACES.dark
  const cacheKey = `${filePath}:${background}`
  const cached = preparedLogos.get(cacheKey)

  if (cached) return cached

  const prepared = sharp(filePath)
    .resize(500, 500, { fit: 'inside', withoutEnlargement: false })
    .png({ adaptiveFiltering: true, compressionLevel: 9 })
    .toBuffer()
    .then(logo => sharp({
      create: {
        background,
        channels: 4,
        height: 704,
        width: 700
      }
    })
      .composite([{ input: logo, gravity: 'centre' }])
      .png({ adaptiveFiltering: true, compressionLevel: 9 })
      .toBuffer())
    .then(buffer => `data:image/png;base64,${buffer.toString('base64')}`)

  preparedLogos.set(cacheKey, prepared)

  return prepared
}
