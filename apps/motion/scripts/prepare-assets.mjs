import { copyFile, mkdir } from 'node:fs/promises'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const destination = new URL('../public/assets/', import.meta.url)

await mkdir(destination, { recursive: true })

await Promise.all([
  copyFile(require.resolve('gsap/dist/gsap.min.js'), new URL('gsap.min.js', destination)),
  copyFile(new URL('../../../public/fonts/montserrat-variable-font-wght.woff2', import.meta.url), new URL('montserrat.woff2', destination)),
  ...['v1', 'v2', 'v3', 'v4'].flatMap(id => ['desktop', 'mobile'].map(device => copyFile(new URL(`../../../src/assets/website-history/${id}-${device}.webp`, import.meta.url), new URL(`${id}-${device}.webp`, destination))))
])
