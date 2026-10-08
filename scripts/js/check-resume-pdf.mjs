import { readFile, stat } from 'node:fs/promises'
import { resolve as resolvePath } from 'node:path'

import { getResumeSourceHash } from './resume-source-fingerprint.mjs'

const projectRoot = resolvePath(import.meta.dirname, '../..')

const pdfPaths = [
  resolvePath(projectRoot, 'public/pdf/cv.pdf'),
  resolvePath(projectRoot, 'public/pdf/cv-full.pdf')
]

const sourceMetadataPath = resolvePath(projectRoot, 'public/pdf/cv.source.json')

for (const pdfPath of pdfPaths) {
  await stat(pdfPath).catch(() => {
    throw new Error(`Missing ${pdfPath}. Run "pnpm run generate:cv".`)
  })
}

const sourceMetadata = await readFile(sourceMetadataPath, 'utf8')
  .then(content => JSON.parse(content))
  .catch(() => {
    throw new Error('Missing or invalid public/pdf/cv.source.json. Run "pnpm run generate:cv".')
  })

if (
  typeof sourceMetadata !== 'object' ||
  sourceMetadata === null ||
  !('sourceHash' in sourceMetadata) ||
  typeof sourceMetadata.sourceHash !== 'string'
) {
  throw new TypeError('public/pdf/cv.source.json must contain a string sourceHash.')
}

const currentSourceHash = await getResumeSourceHash()

if (sourceMetadata.sourceHash !== currentSourceHash) {
  throw new Error('The resume PDF is stale. Run "pnpm run generate:cv" and commit the PDF with its source metadata.')
}

console.log('Resume PDFs match their current source files.')
