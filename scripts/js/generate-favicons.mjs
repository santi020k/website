import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const publicDir = new URL('../../public/', import.meta.url)
const publicDirPath = fileURLToPath(publicDir)
const markPath = fileURLToPath(new URL('../../public/logos/logo-square.webp', import.meta.url))
const markSvgPath = fileURLToPath(
  new URL('../../src/assets/brand/logos/logo-square.svg', import.meta.url)
)
const faviconSourcePath = fileURLToPath(new URL('favicon-source.webp', publicDir))
const faviconSvgPath = fileURLToPath(new URL('favicon.svg', publicDir))

const renderSourceIcon = async () => {
  return sharp(markPath)
    .resize(512, 512, {
      fit: 'fill',
      background: { r: 0, g: 0, b: 0, alpha: 0 }
    })
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
  const sourceIconSvg = await readFile(markSvgPath, 'utf8')

  // eslint-disable-next-line security/detect-non-literal-fs-filename
  await writeFile(faviconSourcePath, sourceIconWebp)

  await writePng('favicon-16x16.png', sourceIcon, 16)

  await writePng('favicon-32x32.png', sourceIcon, 32)

  await writeWebp('favicon.webp', sourceIcon, 32)

  await writeWebp('apple-touch-icon.webp', sourceIcon, 180)

  await writePng('apple-touch-icon.png', sourceIcon, 180)

  // PWA manifest icons (written to public/icons/)
  await writeWebp('icons/icon-192.webp', sourceIcon, 192)

  await writeWebp('icons/icon-512.webp', sourceIcon, 512)

  // eslint-disable-next-line security/detect-non-literal-fs-filename
  await writeFile(faviconSvgPath, sourceIconSvg)
}

main().catch(error => {
  console.error(error)

  process.exitCode = 1
})
