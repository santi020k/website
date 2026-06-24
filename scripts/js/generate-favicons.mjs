import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'

import { staticAssets } from '@santi020k/theme'
import sharp from 'sharp'

const publicDir = new URL('../../public/', import.meta.url)
const publicDirPath = fileURLToPath(publicDir)

const resolveThemeAssetPath = assetPath => fileURLToPath(
  import.meta.resolve(`@santi020k/theme/${assetPath}`)
)

const getPublicAssetPath = pathname => fileURLToPath(new URL(pathname, publicDir))
const markPath = resolveThemeAssetPath(staticAssets['logos/logo-square.webp'])
const markSvgPath = resolveThemeAssetPath('assets/logos/logo-square.svg')
const faviconSourcePath = getPublicAssetPath('favicon-source.webp')
const faviconSvgPath = getPublicAssetPath('favicon.svg')

const renderSourceIcon = async () => sharp(markPath)
  .resize(512, 512, {
    fit: 'fill',
    background: { r: 0, g: 0, b: 0, alpha: 0 }
  })
  .png()
  .toBuffer()

const writeWebp = async (pathname, sourceBuffer, size) => {
  await sharp(sourceBuffer)
    .resize(size, size, { fit: 'cover' })
    .webp({ quality: 92, effort: 4 })
    .toFile(getPublicAssetPath(pathname))
}

/** PNG fallback for environments that ignore WebP for `apple-touch-icon` (older iOS / some auditors). */
const writePng = async (pathname, sourceBuffer, size) => {
  await sharp(sourceBuffer)
    .resize(size, size, { fit: 'cover' })
    .png()
    .toFile(getPublicAssetPath(pathname))
}

const main = async () => {
  const iconsDir = fileURLToPath(new URL('icons/', publicDir))

  await mkdir(publicDirPath, { recursive: true })

  await mkdir(iconsDir, { recursive: true })

  const sourceIcon = await renderSourceIcon()
  const sourceIconWebp = await sharp(sourceIcon).webp({ quality: 92, effort: 4 }).toBuffer()
  const sourceIconSvg = (await readFile(markSvgPath, 'utf8')).trimStart()

  await writeFile(faviconSourcePath, sourceIconWebp)

  await writePng('favicon-16x16.png', sourceIcon, 16)

  await writePng('favicon-32x32.png', sourceIcon, 32)

  await writeWebp('favicon.webp', sourceIcon, 32)

  await writeWebp('apple-touch-icon.webp', sourceIcon, 180)

  await writePng('apple-touch-icon.png', sourceIcon, 180)

  // PWA manifest icons (written to public/icons/)
  await writeWebp('icons/icon-192.webp', sourceIcon, 192)

  await writeWebp('icons/icon-512.webp', sourceIcon, 512)

  await writeFile(faviconSvgPath, sourceIconSvg)
}

main().catch(error => {
  console.error(error)

  process.exitCode = 1
})
