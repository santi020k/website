import { defineCollection } from 'astro:content'

import { glob } from 'astro/loaders'
import { z } from 'astro/zod'

import { projectPurposeIds } from './data/project-purposes'

const removeDuplicates = (array: string[]) => [...new Set(array)]
const dateField = () => z.string().or(z.date()).transform(val => new Date(val))

// Astro's frontmatter parser can provide Date objects for unquoted YAML dates.
const optionalDateField = () => z
  .string()
  .or(z.date())
  .optional()
  .transform(value => (value ? new Date(value) : undefined))

const projectBrandColor = z.string().regex(/^#[\da-f]{6}$/iu, 'Use a six-digit hexadecimal brand color')

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
    cardDescription: z.string().trim().min(1).max(160).optional(),
    brand: z.object({
      primary: projectBrandColor,
      secondary: projectBrandColor,
      surface: projectBrandColor
    }),
    role: z.enum([
      'Technical Lead',
      'Full Stack',
      'Front-End Lead',
      'Front End Developer',
      'Technology Coordinator',
      'Volunteer Technology Coordinator',
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
        background: image().optional(),
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
    updatedDate: optionalDateField(),
    seoTitle: z.string().optional(),
    seoDescription: z.string().optional(),
    githubUrl: z.url().optional(),
    liveDemoUrl: z.url().optional(),
    impactMetrics: z.array(z.string()).default([]),
    previews: z.object({
      description: z.string().trim().min(1),
      images: z.array(z.object({
        src: image(),
        alt: z.string().trim().min(1),
        title: z.string().trim().min(1),
        caption: z.string().trim().min(1)
      })).min(1).max(4)
    }).optional(),
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
    typesId: z.enum(['professional', 'personal', 'experimental', 'community']).optional(),
    purpose: z.enum(projectPurposeIds).optional(),
    orderInTypes: z.number().optional()
    // End
  }).superRefine((project, context) => {
    if (project.typesId === 'personal' && !project.purpose) {
      context.addIssue({
        code: 'custom',
        message: 'Personal projects must declare a browsing purpose.',
        path: ['purpose']
      })
    }
  })
})

const talk = defineCollection({
  loader: glob({ base: './src/content/talk', pattern: '**/*.{md,mdx}' }),
  schema: baseSchema.extend({
    audience: z.string().optional(),
    date: optionalDateField(),
    dateLabel: z.string().optional(),
    description: z.string(),
    draft: z.boolean().default(false),
    evidence: z.enum(['private', 'public', 'reconstructed']).default('public'),
    event: z.string(),
    links: z
      .object({
        event: z.url().optional(),
        slides: z.url().optional(),
        video: z.url().optional()
      })
      .default({}),
    location: z.string().optional(),
    order: z.number().default(0),
    tags: z.array(z.string()).default([]).transform(removeDuplicates),
    year: z.number().int()
  })
})

const post = defineCollection({
  loader: glob({ base: './src/content/post', pattern: ['**/*.{md,mdx}', '!AGENTS.md'] }),
  schema: ({ image }) => baseSchema.extend({
    description: z.string(),
    cardDescription: z.string().trim().min(1).max(160).optional(),
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
    startHere: z.object({
      order: z.number().int().positive(),
      label: z.string().trim().min(1),
      reason: z.string().trim().min(1)
    }).optional(),
    seriesId: z.string().optional(),
    seriesOrder: z.number().int().positive().optional()
  })
})

export const collections = { post, project, series, talk }
