import { createHash } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import { join, relative, resolve as resolvePath } from 'node:path'

const projectRoot = resolvePath(import.meta.dirname, '../..')

const resumeProjectFiles = [
  'datagran/index.md',
  'justbit/index.md',
  'nebular/index.md',
  'optic-power/index.md',
  'pads/index.md',
  'react-js-colombia/index.md',
  'smith-commerce/index.md',
  'void/index.mdx',
  'xgames/index.md'
]

export const resumeSourcePaths = [
  'package.json',
  'pnpm-lock.yaml',
  'scripts/js/generate-resume-pdf.mjs',
  'scripts/js/resume-source-fingerprint.mjs',
  'src/layouts/Base.astro',
  'src/pages/resume.astro',
  'src/site.config.ts',
  'src/styles/global.css',
  'src/styles/partials/about.css',
  'src/styles/partials/animations.css',
  'src/styles/partials/base.css',
  'src/styles/partials/footer.css',
  'src/styles/partials/home-content.css',
  'src/styles/partials/home-hero.css',
  'src/styles/partials/nav.css',
  'src/styles/partials/projects.css',
  'src/styles/partials/remaining-pages.css',
  'src/styles/partials/prose.css',
  'src/styles/partials/tokens.css',
  'src/styles/partials/ui.css',
  'src/styles/partials/utilities.css',
  'src/styles/partials/work.css',
  ...resumeProjectFiles.map(file => `src/content/project/${file}`)
].sort()

export const getResumeSourceHash = async () => {
  const hash = createHash('sha256')

  // The rendered experience count changes each year even when source files do not.
  hash.update(String(new Date().getFullYear()))

  hash.update('\0')

  for (const sourcePath of resumeSourcePaths) {
    const absolutePath = join(projectRoot, sourcePath)
    const content = await readFile(absolutePath)

    hash.update(relative(projectRoot, absolutePath))

    hash.update('\0')

    hash.update(content)

    hash.update('\0')
  }

  return hash.digest('hex')
}
