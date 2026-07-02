import { readFile, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'

import { compress } from 'wawoff2'

const fontsDir = new URL('../../public/fonts/', import.meta.url)

const variableFonts = [
  'montserrat-variable-font-wght.ttf',
  'montserrat-italic-variable-font-wght.ttf'
]

const main = async () => {
  for (const filename of variableFonts) {
    const ttfPath = fileURLToPath(new URL(filename, fontsDir))
    const woff2Path = fileURLToPath(new URL(filename.replace('.ttf', '.woff2'), fontsDir))
    const ttfBuffer = await readFile(ttfPath)
    const woff2Buffer = await compress(ttfBuffer)

    await writeFile(woff2Path, woff2Buffer)

    const saved = ((ttfBuffer.byteLength - woff2Buffer.byteLength) / ttfBuffer.byteLength * 100).toFixed(1)

    console.log(`✓ ${filename.replace('.ttf', '.woff2')} — ${(woff2Buffer.byteLength / 1024).toFixed(0)}KB (saved ${saved}%)`)
  }
}

main().catch(error => {
  console.error(error)

  process.exitCode = 1
})
