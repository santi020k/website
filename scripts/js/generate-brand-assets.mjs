import { mkdir } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const brandDir = new URL('../../src/assets/brand/logos/', import.meta.url)
const publicDir = new URL('../../public/', import.meta.url)

const lightWordmarkSvg = Buffer.from(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 504 80" role="img" aria-label="Santi020k">
  <g transform="translate(0, 0)">
    <rect width="80" height="80" rx="18" fill="#6319be" />
    <path d="M 26 28 L 40 40 L 26 52" fill="none" stroke="#FFFFFF" stroke-width="8" stroke-linecap="round" stroke-linejoin="round" />
    <line x1="48" y1="52" x2="62" y2="52" stroke="#FFFFFF" stroke-width="8" stroke-linecap="round" />
  </g>
  <text x="100" y="54" font-family="Montserrat, Inter, sans-serif" font-weight="800" font-size="48" fill="#332e38" letter-spacing="-0.04em">Santi<tspan fill="#6319be" font-weight="600" letter-spacing="-0.02em">020k</tspan></text>
</svg>
`)

const darkWordmarkSvg = Buffer.from(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 504 80" role="img" aria-label="Santi020k">
  <g transform="translate(0, 0)">
    <rect width="80" height="80" rx="18" fill="#945df4" />
    <path d="M 26 28 L 40 40 L 26 52" fill="none" stroke="#110c1d" stroke-width="8" stroke-linecap="round" stroke-linejoin="round" />
    <line x1="48" y1="52" x2="62" y2="52" stroke="#110c1d" stroke-width="8" stroke-linecap="round" />
  </g>
  <text x="100" y="54" font-family="Montserrat, Inter, sans-serif" font-weight="800" font-size="48" fill="#faf9fb" letter-spacing="-0.04em">Santi<tspan fill="#945df4" font-weight="600" letter-spacing="-0.02em">020k</tspan></text>
</svg>
`)

const markSvg = Buffer.from(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128" role="img" aria-label="S2K Mark">
  <rect width="128" height="128" rx="28" fill="#6319be" />
  <path d="M 40 44 L 64 64 L 40 84" fill="none" stroke="#FFFFFF" stroke-width="12" stroke-linecap="round" stroke-linejoin="round" />
  <line x1="74" y1="84" x2="96" y2="84" stroke="#FFFFFF" stroke-width="12" stroke-linecap="round" />
</svg>
`)

const writeWebp = async (pathname, sourceBuffer, width, height) => {
  await sharp(sourceBuffer)
    .resize(width, height, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .webp({ quality: 92, effort: 4 })
    .toFile(fileURLToPath(new URL(pathname, brandDir)))
}

const writePublicWebp = async (pathname, sourceBuffer, width, height) => {
  await sharp(sourceBuffer)
    .resize(width, height, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .webp({ quality: 92, effort: 4 })
    .toFile(fileURLToPath(new URL(pathname, publicDir)))
}

const main = async () => {
  // Ensure directories exist
  await mkdir(fileURLToPath(brandDir), { recursive: true })

  await mkdir(fileURLToPath(new URL('logos/', publicDir)), { recursive: true })

  // Render WebP
  await writeWebp('logo-santi020k.webp', lightWordmarkSvg, 1008, 160) // 2x for retina

  await writeWebp('logo-santi020k-dark.webp', darkWordmarkSvg, 1008, 160)

  // Public square mark for favicons
  await writePublicWebp('logos/logo-square.webp', markSvg, 512, 512)

  console.log('Successfully generated new brand assets.')
}

main().catch(console.error)
