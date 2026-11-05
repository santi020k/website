import * as profile from '@/data/profile'

import type { Locale } from './locale'
import { defaultLocale } from './locale'

/** Names, facts and quoted recommendations remain authored content. */
export const getLocalizedProfile = (locale: Locale = defaultLocale) => ({
  testimonials: profile.getTestimonials(locale),
  selectedOrganizations: profile.getSelectedOrganizations(locale),
  collaborationLanes: profile.getCollaborationLanes(locale),
  speakingHighlights: profile.getSpeakingHighlights(locale),
  speakingTopics: profile.getSpeakingTopics(locale),
  speakingFormats: profile.getSpeakingFormats(locale),
  engineeringPrinciples: profile.getEngineeringPrinciples(locale)
})
