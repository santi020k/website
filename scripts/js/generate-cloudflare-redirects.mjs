import { readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { readContentFiles } from './utils/frontmatter.mjs'
import { prepareCloudflareRedirects, validateRedirectDestinations } from './cloudflare-redirects.mjs'

const rootDirectory = fileURLToPath(new URL('../..', import.meta.url))
const projectDirectory = path.join(rootDirectory, 'src/content/project')
const baseRedirectsPath = path.join(rootDirectory, 'public/_redirects')
const outputPath = path.join(rootDirectory, 'dist/_redirects')

const getTechnologySlug = technology => technology
  .normalize('NFKD')
  .replace(/[\u0300-\u036f]/g, '')
  .replaceAll('&', ' and ')
  .replaceAll('+', ' plus ')
  .replaceAll('#', ' sharp ')
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-+|-+$/g, '')

const getLegacyTechnologyRedirects = async () => {
  const technologies = new Set()

  // Translations share the original's technologies, so English entries cover every slug.
  for (const { frontmatter } of await readContentFiles(projectDirectory)) {
    if (frontmatter.draft === true || !Array.isArray(frontmatter.technologies)) continue

    for (const technology of frontmatter.technologies) {
      if (typeof technology === 'string') technologies.add(technology)
    }
  }

  return [...technologies]
    .sort((a, b) => a.localeCompare(b))
    .flatMap(technology => {
      const legacyPath = `/technologies/${encodeURIComponent(technology)}`
      const canonicalPath = `/technologies/${getTechnologySlug(technology)}/`

      if (`${legacyPath}/` === canonicalPath) return []

      return [
        `${legacyPath}  ${canonicalPath}  301`,
        `${legacyPath}/  ${canonicalPath}  301`
      ]
    })
}

const baseRedirects = (await readFile(baseRedirectsPath, 'utf8')).trimEnd()
const technologyRedirects = await getLegacyTechnologyRedirects()

const { output, rules, staticCount, dynamicCount } = prepareCloudflareRedirects([
  baseRedirects,
  '',
  '# Generated legacy technology redirects',
  ...technologyRedirects,
  ''
].join('\n'))

await validateRedirectDestinations(rules, path.join(rootDirectory, 'dist'))

await writeFile(outputPath, output)

console.log(`Generated dist/_redirects: ${staticCount} static and ${dynamicCount} dynamic rules (${technologyRedirects.length} from technology labels)`)
