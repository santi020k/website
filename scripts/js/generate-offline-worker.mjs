import { createHash } from 'node:crypto'
import { glob, readFile, writeFile } from 'node:fs/promises'
import { join, resolve as resolvePath, sep } from 'node:path'
import { fileURLToPath } from 'node:url'

const projectRoot = fileURLToPath(new URL('../..', import.meta.url))
const assetsMarker = 'const BUILD_ASSETS = []'
const revisionMarker = 'const BUILD_REVISION = \'development\''

/** @param {string} [root] */
export const generateOfflineWorker = async (root = projectRoot) => {
  const dist = join(root, 'dist')
  const template = await readFile(join(root, 'public/sw.js'), 'utf8')

  for (const marker of [assetsMarker, revisionMarker]) {
    if (template.split(marker).length !== 2) {
      throw new Error(`Missing or repeated service worker build marker: ${marker}`)
    }
  }

  const assets = (await Array.fromAsync(glob('**/*.{js,css,woff2}', { cwd: join(dist, '_astro') }))).sort()

  // Reserve capacity for the fixed shell and runtime responses within the
  // worker's 256-entry budget. Never silently ship an incomplete recovery shell.
  if (assets.length === 0 || assets.length > 200) {
    throw new Error(`Expected 1–200 offline code/font assets; found ${assets.length}`)
  }

  const hash = createHash('sha256').update(template)

  for (const file of ['index.html', 'offline/index.html', ...assets.map(asset => join('_astro', asset))]) {
    hash.update(file.split(sep).join('/')).update('\0')

    hash.update(await readFile(join(dist, file))).update('\0')
  }

  const revision = hash.digest('hex').slice(0, 16)
  const urls = assets.map(asset => `/_astro/${asset.split(sep).map(encodeURIComponent).join('/')}`)

  const worker = template
    .replace(assetsMarker, `const BUILD_ASSETS = ${JSON.stringify(urls)}`)
    .replace(revisionMarker, `const BUILD_REVISION = '${revision}'`)

  await writeFile(join(dist, 'sw.js'), worker)

  return { assets: urls, revision }
}

if (process.argv[1] && resolvePath(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const { assets, revision } = await generateOfflineWorker()

  console.log(`Offline worker ${revision}: ${assets.length} code/font assets, excluding images and archives.`)
}
