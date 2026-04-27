import { mkdir } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const wallpapersDir = new URL('../../src/assets/wallpapers/', import.meta.url)

const renderDesktop1 = () => Buffer.from(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 3840 2160">
  <rect width="3840" height="2160" fill="#1b141f" />
  
  <g transform="translate(1820, 980)">
    <!-- Logo Mark -->
    <rect width="200" height="200" rx="46" fill="#1b141f" stroke="#6319be" stroke-width="4" />
    <path d="M 64 68 L 100 100 L 64 132" fill="none" stroke="#6319be" stroke-width="16" stroke-linecap="round" stroke-linejoin="round" />
    <line x1="120" y1="132" x2="152" y2="132" stroke="#6319be" stroke-width="16" stroke-linecap="round" />
  </g>
</svg>
`)

const renderMobile1 = () => Buffer.from(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1170 2532">
  <rect width="1170" height="2532" fill="#1b141f" />
  <g transform="translate(485, 1166)">
    <rect width="200" height="200" rx="46" fill="#1b141f" stroke="#6319be" stroke-width="4" />
    <path d="M 64 68 L 100 100 L 64 132" fill="none" stroke="#6319be" stroke-width="16" stroke-linecap="round" stroke-linejoin="round" />
    <line x1="120" y1="132" x2="152" y2="132" stroke="#6319be" stroke-width="16" stroke-linecap="round" />
  </g>
</svg>
`)

const renderDesktop2 = () => Buffer.from(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 3840 2160">
  <defs>
    <linearGradient id="grad2" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#4a0f9b" />
      <stop offset="50%" stop-color="#6319be" />
      <stop offset="100%" stop-color="#ae6ff6" />
    </linearGradient>
    <pattern id="grid" width="120" height="120" patternUnits="userSpaceOnUse">
      <path d="M 120 0 L 0 0 0 120" fill="none" stroke="rgba(255,255,255,0.05)" stroke-width="2"/>
    </pattern>
  </defs>
  <rect width="3840" height="2160" fill="url(#grad2)" />
  <rect width="3840" height="2160" fill="url(#grid)" />
  
  <g transform="translate(1820, 980)">
    <!-- Logo Mark -->
    <rect width="200" height="200" rx="46" fill="rgba(255,255,255,0.15)" stroke="rgba(255,255,255,0.3)" stroke-width="4" />
    <path d="M 64 68 L 100 100 L 64 132" fill="none" stroke="#FFFFFF" stroke-width="16" stroke-linecap="round" stroke-linejoin="round" />
    <line x1="120" y1="132" x2="152" y2="132" stroke="#FFFFFF" stroke-width="16" stroke-linecap="round" />
  </g>
</svg>
`)

const renderMobile2 = () => Buffer.from(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1170 2532">
  <defs>
    <linearGradient id="grad2m" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#4a0f9b" />
      <stop offset="50%" stop-color="#6319be" />
      <stop offset="100%" stop-color="#ae6ff6" />
    </linearGradient>
    <pattern id="gridm" width="80" height="80" patternUnits="userSpaceOnUse">
      <path d="M 80 0 L 0 0 0 80" fill="none" stroke="rgba(255,255,255,0.05)" stroke-width="2"/>
    </pattern>
  </defs>
  <rect width="1170" height="2532" fill="url(#grad2m)" />
  <rect width="1170" height="2532" fill="url(#gridm)" />
  
  <g transform="translate(485, 1166)">
    <!-- Logo Mark -->
    <rect width="200" height="200" rx="46" fill="rgba(255,255,255,0.15)" stroke="rgba(255,255,255,0.3)" stroke-width="4" />
    <path d="M 64 68 L 100 100 L 64 132" fill="none" stroke="#FFFFFF" stroke-width="16" stroke-linecap="round" stroke-linejoin="round" />
    <line x1="120" y1="132" x2="152" y2="132" stroke="#FFFFFF" stroke-width="16" stroke-linecap="round" />
  </g>
</svg>
`)


const renderDesktop3 = () => Buffer.from(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 3840 2160">
  <defs>
    <pattern id="grid3" width="80" height="80" patternUnits="userSpaceOnUse">
      <path d="M 80 0 L 0 0 0 80" fill="none" stroke="rgba(175,85,231,0.07)" stroke-width="2"/>
    </pattern>
  </defs>
  <rect width="3840" height="2160" fill="#1b141f" />
  <rect width="3840" height="2160" fill="url(#grid3)" />
  
  <g transform="translate(2000, 300) scale(10)">
    <rect width="200" height="200" rx="46" fill="none" stroke="#6319be" stroke-width="1" stroke-dasharray="8 8" opacity="0.3"/>
    <path d="M 64 68 L 100 100 L 64 132" fill="none" stroke="#af55e7" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" opacity="0.1" />
    <line x1="120" y1="132" x2="152" y2="132" stroke="#af55e7" stroke-width="4" stroke-linecap="round" opacity="0.1" />
  </g>
</svg>
`)

const renderMobile3 = () => Buffer.from(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1170 2532">
  <defs>
    <pattern id="grid3m" width="40" height="40" patternUnits="userSpaceOnUse">
      <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(175,85,231,0.07)" stroke-width="2"/>
    </pattern>
  </defs>
  <rect width="1170" height="2532" fill="#1b141f" />
  <rect width="1170" height="2532" fill="url(#grid3m)" />
  
  <g transform="translate(-500, 500) scale(8)">
    <rect width="200" height="200" rx="46" fill="none" stroke="#6319be" stroke-width="1" stroke-dasharray="8 8" opacity="0.3"/>
    <path d="M 64 68 L 100 100 L 64 132" fill="none" stroke="#af55e7" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" opacity="0.1" />
    <line x1="120" y1="132" x2="152" y2="132" stroke="#af55e7" stroke-width="4" stroke-linecap="round" opacity="0.1" />
  </g>
</svg>
`)

const writeWebp = async (pathname, sourceBuffer, width, height) => {
  await sharp(sourceBuffer)
    .resize(width, height)
    .webp({ quality: 92, effort: 4 })
    .toFile(fileURLToPath(new URL(pathname, wallpapersDir)))
}

const main = async () => {
  await mkdir(fileURLToPath(wallpapersDir), { recursive: true })

  await writeWebp('wallpaper-1-desktop.webp', renderDesktop1(), 3840, 2160)
  await writeWebp('wallpaper-1-mobile.webp', renderMobile1(), 1170, 2532)
  await writeWebp('wallpaper-2-desktop.webp', renderDesktop2(), 3840, 2160)
  await writeWebp('wallpaper-2-mobile.webp', renderMobile2(), 1170, 2532)
  await writeWebp('wallpaper-3-desktop.webp', renderDesktop3(), 3840, 2160)
  await writeWebp('wallpaper-3-mobile.webp', renderMobile3(), 1170, 2532)
  
  // also overwrite the default wallpaper.webp with desktop 2
  await writeWebp('wallpaper.webp', renderDesktop2(), 3840, 2160)
  
  console.log('Successfully generated 6 new wallpapers in src/assets/wallpapers.')
}

main().catch(console.error)
