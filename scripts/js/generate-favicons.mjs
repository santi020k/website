import { mkdir, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const publicDir = new URL('../../public/', import.meta.url)
const publicDirPath = fileURLToPath(publicDir)
const wordmarkPath = fileURLToPath(new URL('../../public/logos/logo-square.webp', import.meta.url))
const faviconSourcePath = fileURLToPath(new URL('favicon-source.webp', publicDir))
const faviconSvgPath = fileURLToPath(new URL('favicon.svg', publicDir))

const iconBackgroundSvg = Buffer.from(`
  <svg width="512" height="512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="icon-gradient" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#1c0d32" />
        <stop offset="100%" stop-color="#09040f" />
      </linearGradient>
    </defs>
    <rect width="512" height="512" rx="118" fill="url(#icon-gradient)" />
    <rect
      x="12"
      y="12"
      width="488"
      height="488"
      rx="106"
      fill="none"
      stroke="rgba(255,255,255,0.08)"
      stroke-width="2"
    />
  </svg>
`)

const renderSourceIcon = async () => {
  // Use the full S2K wordmark so the favicon feels like the brand, not a crop fragment.
  const wordmark = await sharp(wordmarkPath)
    .trim()
    .resize(320, 320, {
      fit: 'contain',
      background: { r: 0, g: 0, b: 0, alpha: 0 }
    })
    .png()
    .toBuffer()

  return sharp(iconBackgroundSvg)
    .composite([{ input: wordmark, gravity: 'centre' }])
    .png()
    .toBuffer()
}

const writeWebp = async (pathname, sourceBuffer, size) => {
  await sharp(sourceBuffer)
    .resize(size, size, { fit: 'cover' })
    .webp({ quality: 92, effort: 4 })
    .toFile(fileURLToPath(new URL(pathname, publicDir)))
}

/** PNG fallback for environments that ignore WebP for `apple-touch-icon` (older iOS / some auditors). */
const writePng = async (pathname, sourceBuffer, size) => {
  await sharp(sourceBuffer)
    .resize(size, size, { fit: 'cover' })
    .png()
    .toFile(fileURLToPath(new URL(pathname, publicDir)))
}

const main = async () => {
  const iconsDir = fileURLToPath(new URL('icons/', publicDir))

  // eslint-disable-next-line security/detect-non-literal-fs-filename
  await mkdir(publicDirPath, { recursive: true })

  // eslint-disable-next-line security/detect-non-literal-fs-filename
  await mkdir(iconsDir, { recursive: true })

  const sourceIcon = await renderSourceIcon()
  const sourceIconWebp = await sharp(sourceIcon).webp({ quality: 92, effort: 4 }).toBuffer()
  const sourceIconWebpBase64 = sourceIconWebp.toString('base64')

  // eslint-disable-next-line security/detect-non-literal-fs-filename
  await writeFile(faviconSourcePath, sourceIconWebp)

  await writeWebp('favicon.webp', sourceIcon, 32)

  await writeWebp('apple-touch-icon.webp', sourceIcon, 180)

  await writePng('apple-touch-icon.png', sourceIcon, 180)

  // PWA manifest icons (written to public/icons/)
  await writeWebp('icons/icon-192.webp', sourceIcon, 192)

  await writeWebp('icons/icon-512.webp', sourceIcon, 512)

  // eslint-disable-next-line security/detect-non-literal-fs-filename
  await writeFile(
    faviconSvgPath, `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <image href="data:image/webp;base64,${sourceIconWebpBase64}" width="512" height="512" />
</svg>
`
  )
}

main().catch(error => {
  console.error(error)

  process.exitCode = 1
})
