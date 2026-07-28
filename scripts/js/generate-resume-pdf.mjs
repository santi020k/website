import { copyFile, mkdir, readFile, rename, rm, stat } from 'node:fs/promises'
import { createServer } from 'node:http'
import { extname, join, relative, resolve as resolvePath, sep } from 'node:path'

import { chromium } from 'playwright'

const projectRoot = resolvePath(import.meta.dirname, '../..')
const distDirectory = join(projectRoot, 'dist')
const publicPdfDirectory = join(projectRoot, 'public', 'pdf')
const publicPdfPath = join(publicPdfDirectory, 'cv.pdf')
const temporaryPdfPath = join(publicPdfDirectory, 'cv.tmp.pdf')
const distPdfPath = join(distDirectory, 'pdf', 'cv.pdf')

const contentTypes = new Map([
  ['.avif', 'image/avif'],
  ['.css', 'text/css; charset=utf-8'],
  ['.html', 'text/html; charset=utf-8'],
  ['.js', 'text/javascript; charset=utf-8'],
  ['.json', 'application/json; charset=utf-8'],
  ['.png', 'image/png'],
  ['.svg', 'image/svg+xml'],
  ['.webp', 'image/webp'],
  ['.woff2', 'font/woff2']
])

await stat(join(distDirectory, 'resume', 'index.html')).catch(() => {
  throw new Error('Missing dist/resume/index.html. Run "pnpm run build" before generating the CV.')
})

const server = createServer(async (request, response) => {
  try {
    const requestUrl = new URL(request.url ?? '/', 'http://127.0.0.1')
    const pathname = decodeURIComponent(requestUrl.pathname)
    const relativePath = pathname.endsWith('/') ? `${pathname}index.html` : pathname
    const filePath = resolvePath(distDirectory, `.${relativePath}`)
    const isInsideDist = relative(distDirectory, filePath)

    if (isInsideDist.startsWith(`..${sep}`) || isInsideDist === '..') {
      response.writeHead(403).end('Forbidden')

      return
    }

    const body = await readFile(filePath)

    response.writeHead(200, {
      'Content-Type': contentTypes.get(extname(filePath)) ?? 'application/octet-stream'
    })

    response.end(body)
  } catch {
    response.writeHead(404).end('Not found')
  }
})

await new Promise((resolve, reject) => {
  server.once('error', reject)

  server.listen(0, '127.0.0.1', resolve)
})

const address = server.address()

if (!address || typeof address === 'string') {
  server.close()

  throw new Error('Unable to resolve the temporary preview server address.')
}

let browser

try {
  await mkdir(publicPdfDirectory, { recursive: true })

  browser = await chromium.launch({ headless: true })

  const page = await browser.newPage({ colorScheme: 'light' })

  await page.goto(`http://127.0.0.1:${address.port}/resume/`, {
    waitUntil: 'networkidle'
  })

  await page.evaluate(() => document.fonts.ready)

  await page.pdf({
    path: temporaryPdfPath,
    displayHeaderFooter: false,
    format: 'A4',
    outline: true,
    preferCSSPageSize: true,
    printBackground: true,
    tagged: true
  })

  await rename(temporaryPdfPath, publicPdfPath)

  await mkdir(join(distDirectory, 'pdf'), { recursive: true })

  await copyFile(publicPdfPath, distPdfPath)

  console.log(`Generated ${relative(projectRoot, publicPdfPath)} from the current resume page.`)
} finally {
  await browser?.close()

  await rm(temporaryPdfPath, { force: true })

  await new Promise(resolve => server.close(resolve))
}
