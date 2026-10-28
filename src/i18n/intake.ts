import type { Locale } from '@/i18n'

import { sharedTranslator } from './shared-copy'

/** Compose only the supplied draft; this helper never stores or sends its values. */
export const createIntakeIntroduction = (locale: Locale, name: string, company: string): string => {
  const t = sharedTranslator(locale)

  if (name && company) return t('intake.namedCompany', { name, company })

  if (name) return t('intake.named', { name })

  return company ? t('intake.company', { company }) : t('intake.greeting')
}

export const getIntakeStatus = (locale: Locale): string => sharedTranslator(locale)('intake.status')

export const getDirectContactMessage = (locale: Locale): string => sharedTranslator(locale)('intake.direct')
