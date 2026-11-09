import { z } from 'astro/zod'

// Translations own copy. Original entries remain authoritative for publication,
// routing, taxonomy, asset paths, links, and project facts.
const text = z.string().trim().min(1)

const copy = {
  title: text.max(100),
  description: text,
  cardDescription: text.max(160).optional(),
  seoTitle: text.optional(),
  coverImage: z.strictObject({ alt: text }).optional()
}

export const postTranslationSchema = z.strictObject({
  ...copy,
  startHere: z.strictObject({ label: text, reason: text }).optional()
})

export const projectTranslationSchema = z.strictObject({
  ...copy,
  seoDescription: text.optional(),
  impactMetrics: z.array(text),
  focusAreas: z.array(z.strictObject({ label: text.max(40), description: text.max(100) })).min(2).max(3),
  caseStudy: z.strictObject({
    problem: text.optional(), approach: text.optional(), outcome: text.optional(), metrics: text.optional()
  }).optional(),
  closingLinkLabels: z.array(text.max(80)).optional(),
  relatedWritingLabels: z.array(text.max(40)).optional(),
  previews: z.strictObject({
    description: text,
    linkLabel: text.max(80).optional(),
    images: z.array(z.strictObject({ alt: text, title: text, caption: text }))
  }).optional()
})
