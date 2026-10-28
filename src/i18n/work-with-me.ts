import { getPortfolioMetricDisplay } from '@/utils/portfolio-metric'

import { getWorkProcess, getWorkTopics, getWorkWithMeFaq, getWorkWithMeServices } from '@/data/work-with-me'
import type { Locale } from '@/i18n'
import { localizePageSource } from '@/i18n/page-copy'

/** One localized source drives both the visible FAQ and its structured data. */
export const getLocalizedWorkWithMe = (locale: Locale) => ({
  workWithMeServices: getWorkWithMeServices(locale),
  workTopics: getWorkTopics(locale),
  workProcess: getWorkProcess(locale),
  workWithMeFaq: getWorkWithMeFaq(locale)
})

/** Preserve the approved metric parsing and values; only the contact label is localized. */
export const getLocalizedContactMetric = (metric: string, locale: Locale) => {
  const display = getPortfolioMetricDisplay(metric)

  if (locale === 'en') return display

  return {
    ...display,
    label: localizePageSource(locale, display.label),
    ...(display.value ? { value: display.value.replace(/ less$/u, ' menos') } : {})
  }
}
