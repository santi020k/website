import { z } from 'astro/zod'

import manifest from '../../public/og/manifest.json' with { type: 'json' }

// JSON imports widen literal fields; validate the generated artifact before
// passing it to OG's typed route selector. A malformed manifest fails the build.
export const routeManifestSchema = z.object({
  generatorVersion: z.string(),
  routes: z.record(z.string(), z.object({
    images: z.array(z.object({
      format: z.enum(['avif', 'jpeg', 'jpg', 'png', 'svg', 'webp']),
      height: z.number().positive(),
      output: z.string(),
      primary: z.boolean(),
      url: z.string(),
      width: z.number().positive()
    })),
    pathname: z.string()
  })),
  version: z.literal(1)
})

export const ogManifest = routeManifestSchema.parse(manifest)
