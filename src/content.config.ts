import { glob } from 'astro/loaders'
import { defineCollection } from 'astro:content'
import { z } from 'astro/zod'

const removeDuplicates = (array: string[]) => [...new Set(array)]
const removeDupsAndLowerCase = (array: string[]) => [...new Set(array.map(str => str.toLowerCase()))]

const baseSchema = z.object({
  title: z.string().max(60)
})

const post = defineCollection({
  loader: glob({ base: './src/content/post', pattern: '**/*.{md,mdx}' }),
  schema: ({ image }) => baseSchema.extend({
    description: z.string(),
    coverImage: z
      .object({
        alt: z.string(),
        src: image()
      })
      .optional(),
    draft: z.boolean().default(false),
    ogImage: z.string().optional(),
    tags: z.array(z.string()).default([]).transform(removeDupsAndLowerCase),
    publishDate: z
      .string()
      .or(z.date())
      .transform(val => new Date(val)),
    updatedDate: z
      .string()
      .optional()
      .transform(str => (str ? new Date(str) : undefined)),
    // Series
    seriesId: z.string().optional(),
    orderInSeries: z.number().optional()
    // End
  })
})

const project = defineCollection({
  loader: glob({ base: './src/content/project', pattern: '**/*.{md,mdx}' }),
  schema: ({ image }) => baseSchema.extend({
    description: z.string(),
    rol: z.enum(['Technical Lead', 'Full Stack', 'Front-End Lead', 'Front End Developer', 'CTO', 'Creator', 'Co-Organizer']).optional(),
    coverImage: z
      .object({
        alt: z.string(),
        src: image(),
        ogImage: z.string().optional()
      })
      .optional(),
    draft: z.boolean().default(false),
    technologies: z.array(z.string()).default([]).transform(removeDuplicates),
    startingDate: z
      .string()
      .or(z.date())
      .transform(val => new Date(val)),
    endingDate: z
      .string()
      .optional()
      .transform(str => (str ? new Date(str) : undefined)),
    seoTitle: z.string().optional(),
    seoDescription: z.string().optional(),
    githubUrl: z.url().optional(),
    liveDemoUrl: z.url().optional(),
    // type
    typesId: z.enum(['professional', 'personal', 'experimental']).optional(),
    orderInTypes: z.number().optional()
    // End
  })
})

const note = defineCollection({
  loader: glob({ base: './src/content/note', pattern: '**/*.{md,mdx}' }),
  schema: baseSchema.extend({
    description: z.string().optional(),
    publishDate: z
      .string()
      // Ensures ISO 8601 format with offsets allowed (e.g. "2024-01-01T00:00:00Z" and "2024-01-01T00:00:00+02:00")
      .iso.datetime({ offset: true })
      .transform(val => new Date(val))
  })
})

// Series
const series = defineCollection({
  loader: glob({ base: './src/content/series', pattern: '**/*.{md,mdx}' }),
  schema: z.object({
    id: z.string(),
    title: z.string(),
    description: z.string(),
    featured: z.boolean().default(false)
  })
})
// End

// Series
const types = defineCollection({
  loader: glob({ base: './src/content/types', pattern: '**/*.{md,mdx}' }),
  schema: z.object({
    id: z.string(),
    title: z.string(),
    description: z.string(),
    featured: z.boolean().default(false)
  })
})
// End

// Series
export const collections = { post, note, series, project, types }
