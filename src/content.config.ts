import { defineCollection } from 'astro:content'

import { glob } from 'astro/loaders'
import { z } from 'astro/zod'

const removeDuplicates = (array: string[]) => [...new Set(array)]
const dateField = () => z.string().or(z.date()).transform(val => new Date(val))
const optionalDateField = () => z.string().optional().transform(str => (str ? new Date(str) : undefined))

const baseSchema = z.object({
  title: z.string().max(100)
})

const series = defineCollection({
  loader: glob({ base: './src/content/series', pattern: '**/*.{md,mdx}' }),
  schema: baseSchema.extend({
    cadence: z.string(),
    description: z.string(),
    draft: z.boolean().default(false),
    focusAreas: z.array(z.string()).default([]).transform(removeDuplicates),
    order: z.number().default(0),
    seoDescription: z.string().optional(),
    seoTitle: z.string().optional(),
    status: z.enum(['active', 'planned', 'archived']).default('active')
  })
})

const project = defineCollection({
  loader: glob({ base: './src/content/project', pattern: '**/*.{md,mdx}' }),
  schema: ({ image }) => baseSchema.extend({
    description: z.string(),
    role: z.enum([
      'Technical Lead',
      'Full Stack',
      'Front-End Lead',
      'Front End Developer',
      'Technology Coordinator',
      'Senior Front End Developer',
      'Senior Full Stack Engineer',
      'Junior Full Stack Developer',
      'Full Stack Developer',
      'CTO & Co-Founder',
      'Creator',
      'Co-Organizer'
    ]).optional(),
    coverImage: z
      .object({
        alt: z.string().min(1),
        src: image(),
        horizontal: image().optional(),
        vertical: image().optional(),
        ogImage: z.string().optional(),
        logo: image().optional(),
        logoAspect: z.enum(['square', 'wide', 'tall']).optional(),
        logoSurface: z.enum(['dark', 'light', 'neutral']).optional()
      })
      .optional(),
    draft: z.boolean().default(false),
    technologies: z.array(z.string()).default([]).transform(removeDuplicates),
    startingDate: dateField(),
    endingDate: optionalDateField(),
    seoTitle: z.string().optional(),
    seoDescription: z.string().optional(),
    githubUrl: z.url().optional(),
    liveDemoUrl: z.url().optional(),
    impactMetrics: z.array(z.string()).default([]),
    caseStudy: z
      .object({
        approach: z.string().optional(),
        metrics: z.string().optional(),
        outcome: z.string().optional(),
        problem: z.string().optional()
      })
      .optional(),
    relevanceWeight: z.number().int().min(0).max(100).default(0),
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

const talk = defineCollection({
  loader: glob({ base: './src/content/talk', pattern: '**/*.{md,mdx}' }),
  schema: baseSchema.extend({
    audience: z.string().optional(),
    description: z.string(),
    draft: z.boolean().default(false),
    event: z.string(),
    links: z
      .object({
        slides: z.url().optional(),
        video: z.url().optional()
      })
      .default({}),
    order: z.number().default(0),
    tags: z.array(z.string()).default([]).transform(removeDuplicates),
    year: z.number().int()
  })
})

const post = defineCollection({
  loader: glob({ base: './src/content/post', pattern: '**/*.{md,mdx}' }),
  schema: ({ image }) => baseSchema.extend({
    description: z.string(),
    publishDate: dateField(),
    updatedDate: optionalDateField(),
    coverImage: z
      .object({
        alt: z.string(),
        src: image()
      })
      .optional(),
    tags: z.array(z.string()).default([]).transform(removeDuplicates),
    draft: z.boolean().default(false),
    canonicalUrl: z.url().optional(),
    seoTitle: z.string().optional(),
    postType: z.enum(['Article', 'Tutorial', 'Guide', 'Opinion', 'Case Study', 'Deep Dive']).default('Article'),
    seriesId: z.string().optional(),
    seriesOrder: z.number().int().positive().optional()
  })
})

export const collections = { post, project, series, talk, types }
