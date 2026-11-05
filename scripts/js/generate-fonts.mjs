import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'

import subsetFont from 'subset-font'
import { compress } from 'wawoff2'

const fontsDir = new URL('../../public/fonts/', import.meta.url)
const latinFontsDir = new URL('../../src/assets/fonts/', import.meta.url)

const variableFonts = [
  'montserrat-variable-font-wght.ttf',
  'montserrat-italic-variable-font-wght.ttf'
]

const main = async () => {
  await mkdir(latinFontsDir, { recursive: true })

  // The served CSS is the source of truth for subset coverage. Read each face's
  // explicit Unicode ranges so font generation cannot drift from the browser.
  const styles = await readFile(new URL('../../src/styles/partials/base.css', import.meta.url), 'utf8')
  const fontFaces = styles.match(/@font-face\s*\{[^}]*\}/gu) ?? []

  for (const filename of variableFonts) {
    const ttfPath = fileURLToPath(new URL(filename, fontsDir))
    const woff2Path = fileURLToPath(new URL(filename.replace('.ttf', '.woff2'), fontsDir))
    const ttfBuffer = await readFile(ttfPath)
    const woff2Buffer = await compress(ttfBuffer)

    await writeFile(woff2Path, woff2Buffer)

    // Leave variation axes, shaping features, and hinting intact. The original
    // full font remains available for characters outside the Latin subset.
    const latinFilename = filename.replace('.ttf', '.latin.woff2')
    const face = fontFaces.find(rule => rule.includes(`/fonts/${latinFilename}`))
    const unicodeRange = face?.match(/unicode-range:\s*([^;]+);/u)?.[1]

    if (!unicodeRange) throw new Error(`Missing Unicode range for ${latinFilename}`)

    const latinText = unicodeRange.split(',').map(range => {
      const match = /^\s*U\+([\dA-F]+)(?:-([\dA-F]+))?\s*$/iu.exec(range)

      if (!match?.[1]) throw new Error(`Invalid Unicode range in ${latinFilename}: ${range}`)

      const start = Number.parseInt(match[1], 16)
      const end = Number.parseInt(match[2] ?? match[1], 16)

      if (end < start || end > 0x10ffff) throw new Error(`Invalid Unicode bounds in ${latinFilename}: ${range}`)

      return Array.from({ length: end - start + 1 }, (_, index) => String.fromCodePoint(start + index)).join('')
    }).join('')

    const latinBuffer = await subsetFont(ttfBuffer, latinText, { targetFormat: 'woff2' })

    await writeFile(new URL(latinFilename, latinFontsDir), latinBuffer)

    const saved = ((ttfBuffer.byteLength - woff2Buffer.byteLength) / ttfBuffer.byteLength * 100).toFixed(1)

    console.log(`✓ ${filename.replace('.ttf', '.woff2')} — ${(woff2Buffer.byteLength / 1024).toFixed(0)}KB (saved ${saved}%)`)

    console.log(`✓ ${latinFilename} — ${(latinBuffer.byteLength / 1024).toFixed(0)}KB`)
  }
}

main().catch(error => {
  console.error(error)

  process.exitCode = 1
})
