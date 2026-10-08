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
  'public/fonts/montserrat-variable-font-wght.ttf',
  'public/fonts/montserrat-variable-font-wght.woff2',
  'public/fonts/montserrat-italic-variable-font-wght.ttf',
  'public/fonts/montserrat-italic-variable-font-wght.woff2',
  'scripts/js/generate-fonts.mjs',
  'scripts/js/generate-resume-pdf.mjs',
  'scripts/js/resume-source-fingerprint.mjs',
  // Local render dependencies must participate alongside the page and project content.
  'src/components/atoms/AnimatedLogo.astro',
  'src/components/atoms/BackToTop.astro',
  'src/components/atoms/ButtonLink.astro',
  'src/components/atoms/ThemeToggle.astro',
  'src/components/molecules/SearchDialog.astro',
  'src/components/molecules/SiteSearch.astro',
  'src/components/organisms/SiteFooter.astro',
  'src/components/organisms/SiteHeader.astro',
  'src/components/shared/BaseHead.astro',
  'src/components/shared/NavProgress.astro',
  'src/components/shared/ServiceWorkerRegistration.astro',
  'src/components/shared/ThemeProvider.astro',
  'src/content.config.ts',
  'src/data/og-manifest.ts',
  'src/layouts/Base.astro',
  'src/utils/content.ts',
  'src/utils/date.ts',
  'src/utils/git.ts',
  'src/utils/seo.ts',
  'src/utils/social-image.ts',
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

/** @param {string} root - Directory containing the résumé render sources. */
export const getResumeSourceHash = async (root = projectRoot) => {
  const hash = createHash('sha256')

  // The rendered experience count changes each year even when source files do not.
  hash.update(String(new Date().getFullYear()))

  hash.update('\0')

  for (const sourcePath of resumeSourcePaths) {
    const absolutePath = join(root, sourcePath)
    const content = await readFile(absolutePath)

    hash.update(relative(root, absolutePath))

    hash.update('\0')

    hash.update(content)

    hash.update('\0')
  }

  return hash.digest('hex')
}
