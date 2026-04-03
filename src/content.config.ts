import { glob } from 'astro/loaders'
import { z } from 'astro/zod'
import { defineCollection } from 'astro:content'

const removeDuplicates = (array: string[]) => [...new Set(array)]

const baseSchema = z.object({
  title: z.string().max(60)
})

const project = defineCollection({
  loader: glob({ base: './src/content/project', pattern: '**/*.{md,mdx}' }),
  schema: ({ image }) => baseSchema.extend({
    description: z.string(),
    rol: z.enum([
      'Technical Lead',
      'Full Stack',
      'Front-End Lead',
      'Front End Developer',
      'Senior Full Stack Engineer',
      'Junior Full Stack Developer',
      'CTO & Co-Founder',
      'Creator',
      'Co-Organizer'
    ]).optional(),
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

export const collections = { project, types }
