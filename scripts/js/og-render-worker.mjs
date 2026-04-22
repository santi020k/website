/**
 * Worker thread for OG image rasterization (Satori + Resvg + Sharp).
 * Loaded only from `generate-og-images.js` via `worker_threads`.
 */
import { parentPort } from 'node:worker_threads'

import { renderSocialImage } from '../../src/utils/render-social-image.js'

parentPort?.on('message', async ({ id, props }) => {
  try {
    const buffer = await renderSocialImage(props)
    const copy = new Uint8Array(buffer.length)
    copy.set(buffer)
    parentPort.postMessage({ id, ok: true, buffer: copy.buffer }, [copy.buffer])
  } catch (err) {
    parentPort.postMessage({
      id,
      ok: false,
      message: err instanceof Error ? err.message : String(err),
      stack: err instanceof Error ? err.stack : undefined
    })
  }
})
