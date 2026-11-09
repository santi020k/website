import { z } from 'astro/zod'

import { locales } from '../i18n/locale.ts'

import { travelCountries } from './travel.ts'

const countryCodes = new Set(travelCountries.map(country => country.code))

/** Personal notes complement the confirmed country facts without copying them. */
export const travelNotesSchema = z.object({
  code: z.string().refine(code => countryCodes.has(code), 'Use a country code from src/data/travel.ts'),
  score: z.number().min(0).max(10).nullable().default(null),
  summary: z.string().trim().default(''),
  visitedWhen: z.string().trim().default(''),
  highlights: z.array(z.string().trim().min(1)).default([]),
  wouldReturn: z.enum(['yes', 'maybe', 'no']).nullable().default(null),
  language: z.enum(locales).default('en')
})

export type TravelNotes = z.infer<typeof travelNotesSchema>
