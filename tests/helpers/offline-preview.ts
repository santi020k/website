import { Buffer } from 'node:buffer'
import { createServer, request as requestUpstream, type ServerResponse } from 'node:http'

interface OfflinePreviewOptions {
  hostname?: 'website.localhost' | 'localhost' | '127.0.0.1' | '[::1]'
  vary?: string
}

/** Simulate an unreachable origin without bypassing WebKit's service workers. */
export const createOfflinePreview = async (
  baseURL: string | undefined,
  redirects: Record<string, string> = {},
  { hostname = 'website.localhost', vary }: OfflinePreviewOptions = {}
) => {
  if (!baseURL) throw new Error('Missing test preview URL')

  const preview = new URL(baseURL)

  if (preview.protocol !== 'http:') throw new Error('The offline preview proxies a local http preview only')

  let online = true
  let stalled = false
  let responseStatus: number | undefined
  let heldRequests = 0
  const stalledResponses = new Set<ServerResponse>()

  const releaseStalled = () => {
    for (const response of stalledResponses) response.destroy()

    stalledResponses.clear()
  }

  const server = createServer((request, response) => {
    if (!online) {
      request.socket.destroy()

      return
    }

    if (responseStatus !== undefined) {
      response.writeHead(responseStatus, { 'Content-Type': 'text/plain' }).end(`Preview response ${responseStatus}`)

      return
    }

    if (stalled) {
      // Accept the request but never send headers, like a connection that stops responding.
      heldRequests += 1

      stalledResponses.add(response)

      response.once('close', () => stalledResponses.delete(response))

      return
    }

    const destination = redirects[request.url ?? '/']

    if (destination) {
      response.writeHead(302, { Location: destination }).end()

      return
    }

    // Forward only the path and query to the fixed preview host: a request URL never chooses the upstream.
    const { pathname, search } = new URL(request.url ?? '/', 'http://offline-preview.invalid')
    const fail = () => {
      if (!response.headersSent) response.writeHead(502)

      response.end('Preview unavailable')
    }

    const forward = (path: string, redirectsLeft: number) => {
      const upstreamRequest = requestUpstream({
        hostname: preview.hostname.replace(/^\[|\]$/gu, ''),
        method: 'GET',
        path,
        port: preview.port || 80,
        timeout: 10_000
      }, upstream => {
        const location = upstream.headers.location
        const status = upstream.statusCode ?? 502

        // Follow same-origin redirects like fetch() did, so tests keep seeing the final document.
        if (location && status >= 300 && status < 400 && redirectsLeft > 0) {
          const next = new URL(location, preview)

          upstream.resume()

          if (next.origin === preview.origin) {
            forward(`${next.pathname}${next.search}`, redirectsLeft - 1)

            return
          }
        }

        const chunks: Buffer[] = []

        upstream.on('data', (chunk: Buffer) => chunks.push(chunk))
        upstream.on('error', fail)
        upstream.on('end', () => {
          response.writeHead(status, {
            'Content-Type': upstream.headers['content-type'] ?? 'application/octet-stream',
            ...(vary ? { Vary: vary } : {})
          })

          response.end(Buffer.concat(chunks))
        })
      })

      upstreamRequest.on('timeout', () => upstreamRequest.destroy())
      upstreamRequest.on('error', fail)
      upstreamRequest.end()
    }

    forward(`${pathname}${search}`, 5)
  })

  await new Promise<void>((resolve, reject) => {
    server.once('error', reject)

    server.listen(0, hostname === '[::1]' ? '::1' : '127.0.0.1', resolve)
  })

  const address = server.address()

  if (!address || typeof address === 'string') {
    server.close()

    throw new Error('Missing offline preview address')
  }

  return {
    // This trustworthy loopback hostname avoids intentional dev-only cleanup.
    url: `http://${hostname}:${address.port}`,
    setOnline: (value: boolean) => {
      online = value
    },
    setResponseStatus: (value: number | undefined) => {
      responseStatus = value
    },
    // Held requests are dropped when stalling ends or the preview closes.
    setStalled: (value: boolean) => {
      stalled = value

      if (!value) releaseStalled()
    },
    // Counts every request held while stalled, including ones already released.
    heldRequestCount: () => heldRequests,
    close: () => new Promise<void>((resolve, reject) => {
      releaseStalled()

      server.closeAllConnections()

      server.close(error => {
        if (error) {
          reject(error)

          return
        }

        resolve()
      })
    })
  }
}
