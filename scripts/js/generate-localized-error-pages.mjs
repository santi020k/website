import { copyFile } from 'node:fs/promises'
import { join, resolve as resolvePath } from 'node:path'
import { fileURLToPath } from 'node:url'

const projectRoot = fileURLToPath(new URL('../..', import.meta.url))

/** @param {string} [root] */
export const generateLocalizedErrorPages = async (root = projectRoot) => {
  const source = 'es/404/index.html'
  const destination = 'es/404.html'

  // Astro treats /es/404/ as a regular page. Cloudflare Pages looks for a
  // 404.html in the missing URL's nearest parent directory instead.
  try {
    await copyFile(join(root, 'dist', source), join(root, 'dist', destination))
  } catch (error) {
    throw new Error(`Could not create dist/${destination} from the localized recovery page dist/${source}.`, { cause: error })
  }

  return destination
}

if (process.argv[1] && resolvePath(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const destination = await generateLocalizedErrorPages()

  console.log(`Localized recovery page: dist/${destination}`)
}
