import * as profile from '@/data/profile'
import type { Locale } from '@/i18n'
import { localizePath } from '@/i18n'
import { translatePage } from '@/i18n/page-copy'

/** Localize profile presentation while preserving names, facts and quoted recommendations. */
export const getLocalizedProfile = (locale: Locale) => {
  const t = (source: string) => translatePage(locale, source)

  const sourceLink = (source: { href: string, label: string }) => ({
    href: localizePath(source.href, locale),
    label: t(source.label)
  })

  return {
    collaborationLanes: profile.collaborationLanes.map(lane => ({
      ...lane,
      description: t(lane.description),
      fit: t(lane.fit),
      source: sourceLink(lane.source),
      title: t(lane.title)
    })),
    engineeringPrinciples: profile.engineeringPrinciples.map(principle => ({
      ...principle,
      body: t(principle.body),
      source: sourceLink(principle.source),
      title: t(principle.title)
    })),
    selectedOrganizations: profile.selectedOrganizations.map(organization => ({
      ...organization,
      context: t(organization.context)
    })),
    speakingFormats: profile.speakingFormats.map(format => ({
      ...format,
      description: t(format.description),
      outcome: { fit: t(format.outcome.fit), label: t(format.outcome.label) },
      subtitle: t(format.subtitle),
      title: t(format.title)
    })),
    speakingHighlights: profile.speakingHighlights.map(highlight => ({
      ...highlight,
      description: t(highlight.description),
      label: t(highlight.label),
      ...(highlight.prefix ? { prefix: t(highlight.prefix) } : {}),
      source: sourceLink(highlight.source),
      ...(highlight.suffix ? { suffix: t(highlight.suffix) } : {})
    })),
    speakingTopics: profile.speakingTopics.map(topic => ({
      ...topic,
      description: t(topic.description),
      source: sourceLink(topic.source),
      subtitle: t(topic.subtitle),
      title: t(topic.title)
    })),
    testimonials: profile.testimonials.map(testimonial => ({
      ...testimonial,
      relationship: t(testimonial.relationship),
      role: t(testimonial.role)
    }))
  }
}
