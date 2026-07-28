import { readdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { load as loadYaml } from 'js-yaml'

const rootDirectory = fileURLToPath(new URL('../..', import.meta.url))
const projectDirectory = path.join(rootDirectory, 'src/content/project')
const baseRedirectsPath = path.join(rootDirectory, 'public/_redirects')
const outputPath = path.join(rootDirectory, 'dist/_redirects')
const frontmatterPattern = /^---\r?\n([\s\S]*?)\r?\n---/

const getTechnologySlug = technology => technology
  .normalize('NFKD')
  .replace(/[\u0300-\u036f]/g, '')
  .replaceAll('&', ' and ')
  .replaceAll('+', ' plus ')
  .replaceAll('#', ' sharp ')
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-+|-+$/g, '')

const findContentFiles = async directory => {
  const entries = await readdir(directory, { withFileTypes: true })

  const nestedFiles = await Promise.all(entries.map(async entry => {
    const entryPath = path.join(directory, entry.name)

    if (entry.isDirectory()) return findContentFiles(entryPath)

    return entry.isFile() && /\.mdx?$/.test(entry.name) ? [entryPath] : []
  }))

  return nestedFiles.flat()
}

const getLegacyTechnologyRedirects = async () => {
  const files = await findContentFiles(projectDirectory)
  const technologies = new Set()

  for (const file of files) {
    const source = await readFile(file, 'utf8')
    const match = frontmatterPattern.exec(source)

    if (!match) continue

    const frontmatter = loadYaml(match[1] ?? '')

    if (
      !frontmatter ||
      typeof frontmatter !== 'object' ||
      frontmatter.draft === true ||
      !Array.isArray(frontmatter.technologies)
    ) continue

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

const output = [
  baseRedirects,
  '',
  '# Generated legacy technology redirects',
  ...technologyRedirects,
  ''
].join('\n')

await writeFile(outputPath, output)

console.log(`Generated ${technologyRedirects.length} legacy technology redirects in dist/_redirects`)
