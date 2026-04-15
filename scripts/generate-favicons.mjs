import { mkdir, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const publicDir = new URL('../public/', import.meta.url)
const publicDirPath = fileURLToPath(publicDir)
const squareLogoPath = fileURLToPath(new URL('../public/logo-square.webp', import.meta.url))
const faviconSourcePath = fileURLToPath(new URL('favicon-source.png', publicDir))
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
  // Crop the left side of the wordmark so the favicon uses a readable monogram.
  const monogram = await sharp(squareLogoPath)
    .extract({ left: 30, top: 820, width: 610, height: 1120 })
    .resize(326, 326, {
      fit: 'contain',
      background: { r: 0, g: 0, b: 0, alpha: 0 }
    })
    .png()
    .toBuffer()

  return sharp(iconBackgroundSvg)
    .composite([{ input: monogram, gravity: 'centre' }])
    .png()
    .toBuffer()
}

const writePng = async (pathname, sourceBuffer, size) => {
  await sharp(sourceBuffer)
    .resize(size, size, { fit: 'cover' })
    .png()
    .toFile(fileURLToPath(new URL(pathname, publicDir)))
}

const main = async () => {
  // eslint-disable-next-line security/detect-non-literal-fs-filename
  await mkdir(publicDirPath, { recursive: true })

  const sourceIcon = await renderSourceIcon()
  const sourceIconBase64 = sourceIcon.toString('base64')

  // eslint-disable-next-line security/detect-non-literal-fs-filename
  await writeFile(faviconSourcePath, sourceIcon)

  await writePng('favicon.png', sourceIcon, 32)

  await writePng('apple-touch-icon.png', sourceIcon, 180)

  // eslint-disable-next-line security/detect-non-literal-fs-filename
  await writeFile(
    faviconSvgPath, `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <image href="data:image/png;base64,${sourceIconBase64}" width="512" height="512" />
</svg>
`
  )
}

main().catch(error => {
  console.error(error)

  process.exitCode = 1
})
