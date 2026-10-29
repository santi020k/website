import { copyFile, mkdir } from 'node:fs/promises'
import { createRequire } from 'node:module'

import current from '../../../packages/website-history/current.json' with { type: 'json' }
import versions from '../../../packages/website-history/versions.json' with { type: 'json' }

const require = createRequire(import.meta.url)
const destination = new URL('../public/assets/', import.meta.url)

await mkdir(destination, { recursive: true })

await Promise.all([
  ...['lumen-web', 'postlens-editor'].map(name => copyFile(new URL(`../captures/${name}.mp4`, import.meta.url), new URL(`${name}.mp4`, destination))),
  copyFile(new URL('../audio/chills-history-edit.mp3', import.meta.url), new URL('chills-history-edit.mp3', destination)),
  copyFile(require.resolve('gsap/dist/gsap.min.js'), new URL('gsap.min.js', destination)),
  copyFile(new URL('../../../public/fonts/montserrat-variable-font-wght.woff2', import.meta.url), new URL('montserrat.woff2', destination)),
  ...[...versions, current].map(({ id }) => id).flatMap(id => ['desktop', 'mobile'].map(device => copyFile(new URL(`../../../src/assets/website-history/${id}-${device}.webp`, import.meta.url), new URL(`${id}-${device}.webp`, destination))))
])
