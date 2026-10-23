import { Buffer } from 'node:buffer'
import { createServer } from 'node:http'

/** Simulate an unreachable origin without bypassing WebKit's service workers. */
export const createOfflinePreview = async (baseURL: string | undefined, redirects: Record<string, string> = {}) => {
  if (!baseURL) throw new Error('Missing test preview URL')

  let online = true
  const server = createServer((request, response) => {
    if (!online) {
      request.socket.destroy()

      return
    }

    const destination = redirects[request.url ?? '/']

    if (destination) {
      response.writeHead(302, { Location: destination }).end()

      return
    }

    void fetch(new URL(request.url ?? '/', baseURL), { signal: AbortSignal.timeout(10_000) })
      .then(async upstream => {
        const body = Buffer.from(await upstream.arrayBuffer())

        response.writeHead(upstream.status, {
          'Content-Type': upstream.headers.get('content-type') ?? 'application/octet-stream'
        })

        return response.end(body)
      })
      .catch(() => {
        response.writeHead(502).end('Preview unavailable')
      })
  })

  await new Promise<void>((resolve, reject) => {
    server.once('error', reject)

    server.listen(0, '127.0.0.1', resolve)
  })

  const address = server.address()

  if (!address || typeof address === 'string') {
    server.close()

    throw new Error('Missing offline preview address')
  }

  return {
    // This trustworthy loopback hostname avoids intentional dev-only cleanup.
    url: `http://website.localhost:${address.port}`,
    setOnline: (value: boolean) => {
      online = value
    },
    close: () => new Promise<void>((resolve, reject) => {
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
