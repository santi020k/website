import { workProcess, workTopics, workWithMeFaq, workWithMeServices } from '@/data/work-with-me'
import type { Locale } from '@/i18n'
import { localizePath } from '@/i18n'
import { translatePage } from '@/i18n/page-copy'

/** One localized source drives both the visible FAQ and its structured data. */
export const getLocalizedWorkWithMe = (locale: Locale) => {
  const t = (source: string) => translatePage(locale, source)

  return {
    workProcess: workProcess.map(step => ({ title: t(step.title), body: t(step.body) })),
    workTopics: workTopics.map(topic => ({ ...topic, label: t(topic.label), opener: t(topic.opener) })),
    workWithMeFaq: workWithMeFaq.map(item => ({ question: t(item.question), answer: t(item.answer) })),
    workWithMeServices: workWithMeServices.map(service => ({
      ...service,
      description: t(service.description),
      examples: service.examples.map(example => t(example)),
      proof: { href: localizePath(service.proof.href, locale), label: t(service.proof.label) },
      title: t(service.title)
    }))
  }
}
