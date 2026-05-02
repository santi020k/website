import { mkdir } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const bannersDir = new URL('../../src/assets/banners/', import.meta.url)

const WIDTH = 1584
const HEIGHT = 396

const renderBanner1 = () => Buffer.from(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${WIDTH} ${HEIGHT}">
  <defs>
    <pattern id="grid1" width="40" height="40" patternUnits="userSpaceOnUse">
      <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255,255,255,0.03)" stroke-width="1"/>
    </pattern>
  </defs>
  <rect width="${WIDTH}" height="${HEIGHT}" fill="#110c1d" />
  <rect width="${WIDTH}" height="${HEIGHT}" fill="url(#grid1)" />

  <g transform="translate(64, 140)">
    <!-- Logo Mark -->
    <rect width="116" height="116" rx="26" fill="#5a0fdb" />
    <path d="M 38 40 L 58 58 L 38 76" fill="none" stroke="#110c1d" stroke-width="12" stroke-linecap="round" stroke-linejoin="round" />
    <line x1="70" y1="76" x2="90" y2="76" stroke="#110c1d" stroke-width="12" stroke-linecap="round" />
  </g>

  <!-- Wordmark -->
  <text x="210" y="222" font-family="Montserrat, Inter, sans-serif" font-weight="800" font-size="72" fill="#faf9fb" letter-spacing="-0.04em">Santi<tspan fill="#5a0fdb" font-weight="600" letter-spacing="-0.02em">020k</tspan></text>

  <!-- Subtitle -->
  <text x="215" y="270" font-family="Montserrat, Inter, sans-serif" font-weight="500" font-size="28" fill="#a49eb0" letter-spacing="-0.01em">Tech Lead · Full-Stack Architect · DX</text>
</svg>
`)

const renderBanner2 = () => Buffer.from(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${WIDTH} ${HEIGHT}">
  <defs>
    <pattern id="grid2" width="40" height="40" patternUnits="userSpaceOnUse">
      <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(99,25,190,0.06)" stroke-width="1"/>
    </pattern>
  </defs>
  <rect width="${WIDTH}" height="${HEIGHT}" fill="#faf9fb" />
  <rect width="${WIDTH}" height="${HEIGHT}" fill="url(#grid2)" />

  <g transform="translate(${WIDTH / 2 - 252}, 140)">
    <!-- Logo Mark -->
    <rect width="116" height="116" rx="26" fill="#5a0fdb" />
    <path d="M 38 40 L 58 58 L 38 76" fill="none" stroke="#FFFFFF" stroke-width="12" stroke-linecap="round" stroke-linejoin="round" />
    <line x1="70" y1="76" x2="90" y2="76" stroke="#FFFFFF" stroke-width="12" stroke-linecap="round" />
  </g>

  <!-- Wordmark -->
  <text x="${WIDTH / 2 - 100}" y="222" font-family="Montserrat, Inter, sans-serif" font-weight="800" font-size="72" fill="#332e38" letter-spacing="-0.04em">Santi<tspan fill="#5a0fdb" font-weight="600" letter-spacing="-0.02em">020k</tspan></text>
</svg>
`)

const renderBanner3 = () => Buffer.from(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${WIDTH} ${HEIGHT}">
  <defs>
    <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#4a0fc7" />
      <stop offset="50%" stop-color="#5a0fdb" />
      <stop offset="100%" stop-color="#8f5af7" />
    </linearGradient>
    <pattern id="dots" width="20" height="20" patternUnits="userSpaceOnUse">
      <circle cx="2" cy="2" r="1.5" fill="rgba(255,255,255,0.15)"/>
    </pattern>
  </defs>
  <rect width="${WIDTH}" height="${HEIGHT}" fill="url(#grad1)" />
  <rect width="${WIDTH}" height="${HEIGHT}" fill="url(#dots)" />

  <g transform="translate(${WIDTH / 2 - 252}, 100)">
    <!-- Logo Mark - Glassmorphic -->
    <rect width="116" height="116" rx="26" fill="rgba(255,255,255,0.15)" stroke="rgba(255,255,255,0.4)" stroke-width="2" />
    <path d="M 38 40 L 58 58 L 38 76" fill="none" stroke="#FFFFFF" stroke-width="12" stroke-linecap="round" stroke-linejoin="round" />
    <line x1="70" y1="76" x2="90" y2="76" stroke="#FFFFFF" stroke-width="12" stroke-linecap="round" />
  </g>

  <!-- Wordmark -->
  <text x="${WIDTH / 2 - 100}" y="182" font-family="Montserrat, Inter, sans-serif" font-weight="800" font-size="72" fill="#FFFFFF" letter-spacing="-0.04em">Santiago Molina</text>
  <text x="${WIDTH / 2 - 95}" y="230" font-family="Montserrat, Inter, sans-serif" font-weight="500" font-size="28" fill="rgba(255,255,255,0.85)" letter-spacing="-0.01em">Engineering Leader &amp; Full-Stack Architect</text>
</svg>
`)

const renderBanner4 = () => Buffer.from(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${WIDTH} ${HEIGHT}">
  <rect width="${WIDTH}" height="${HEIGHT}" fill="#110c1d" />

  <!-- Abstract geometric shapes -->
  <circle cx="1400" cy="50" r="300" fill="#5a0fdb" opacity="0.1" filter="blur(60px)"/>
  <circle cx="200" cy="350" r="250" fill="#5a0fdb" opacity="0.15" filter="blur(50px)"/>

  <g transform="translate(${WIDTH - 200}, ${HEIGHT / 2 - 60})">
    <rect width="120" height="120" rx="30" fill="none" stroke="#5a0fdb" stroke-width="4" stroke-dasharray="12 12" />
    <rect width="80" height="80" x="20" y="20" rx="20" fill="#5a0fdb" opacity="0.2" />
    <path d="M 44 48 L 60 60 L 44 72" fill="none" stroke="#5a0fdb" stroke-width="8" stroke-linecap="round" stroke-linejoin="round" />
    <line x1="68" y1="72" x2="82" y2="72" stroke="#5a0fdb" stroke-width="8" stroke-linecap="round" />
  </g>

  <!-- Wordmark -->
  <text x="80" y="200" font-family="Montserrat, Inter, sans-serif" font-weight="800" font-size="64" fill="#faf9fb" letter-spacing="-0.04em">SANTIAGO MOLINA</text>
  <text x="82" y="246" font-family="Montserrat, Inter, sans-serif" font-weight="500" font-size="28" fill="#5a0fdb" letter-spacing="0.1em">CALM SYSTEMS. CLEAR DELIVERY.</text>
</svg>
`)

const renderBanner5 = () => Buffer.from(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${WIDTH} ${HEIGHT}">
  <rect width="${WIDTH}" height="${HEIGHT}" fill="#110c1d" />

  <!-- Big fully visible icon on the right -->
  <g transform="translate(1100, 48) scale(2.4)">
    <rect width="128" height="128" rx="28" fill="#5a0fdb" />
    <path d="M 40 44 L 64 64 L 40 84" fill="none" stroke="#FFFFFF" stroke-width="12" stroke-linecap="round" stroke-linejoin="round" />
    <line x1="74" y1="84" x2="96" y2="84" stroke="#FFFFFF" stroke-width="12" stroke-linecap="round" />
  </g>

  <!-- Wordmark -->
  <text x="140" y="222" font-family="Montserrat, Inter, sans-serif" font-weight="800" font-size="72" fill="#faf9fb" letter-spacing="-0.04em">Santi<tspan fill="#5a0fdb" font-weight="600" letter-spacing="-0.02em">020k</tspan></text>
</svg>
`)

const writeWebp = async (pathname, sourceBuffer) => {
  await sharp(sourceBuffer)
    .resize(WIDTH, HEIGHT)
    .webp({ quality: 92, effort: 4 })
    .toFile(fileURLToPath(new URL(pathname, bannersDir)))
}

const main = async () => {
  await mkdir(fileURLToPath(bannersDir), { recursive: true })

  await writeWebp('banner-1.webp', renderBanner1())
  await writeWebp('banner-2.webp', renderBanner2())
  await writeWebp('banner-3.webp', renderBanner3())
  await writeWebp('banner-4.webp', renderBanner4())
  await writeWebp('banner-5.webp', renderBanner5())

  console.log('Successfully generated 5 new brand banners in src/assets/banners.')
}

main().catch(console.error)
