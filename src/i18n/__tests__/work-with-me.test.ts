import { getPortfolioMetricDisplay } from '@/utils/portfolio-metric'

import { describe, expect, test } from 'vitest'

import { createFaqSchema, workProcess, workTopics, workWithMeFaq, workWithMeServices } from '@/data/work-with-me'
import { createIntakeIntroduction, getDirectContactMessage, getIntakeStatus } from '@/i18n/intake'
import { getLocalizedContactMetric, getLocalizedWorkWithMe } from '@/i18n/work-with-me'
import { siteConfig } from '@/site.config'

describe('localized contact content', () => {
  test('preserves all English contact content and identifiers', () => {
    expect(getLocalizedWorkWithMe('en')).toEqual({ workProcess, workTopics, workWithMeFaq, workWithMeServices })
    expect(siteConfig.contact.whatsapp).toContain(encodeURIComponent(getDirectContactMessage('en')))
  })

  test('translates every service, FAQ and topic without losing its original identity', () => {
    const localized = getLocalizedWorkWithMe('es')

    expect(localized.workTopics.map(topic => topic.id)).toEqual(workTopics.map(topic => topic.id))
    expect(localized.workWithMeServices.map(service => service.id))
      .toEqual(workWithMeServices.map(service => service.id))

    for (const [index, service] of localized.workWithMeServices.entries()) {
      const original = workWithMeServices[index]

      expect(service.title).not.toBe(original?.title)
      expect(service.description).not.toBe(original?.description)
      expect(service.examples).toHaveLength(original?.examples.length ?? 0)
      expect(service.proof.href).toMatch(/^\/es\//u)
      expect(service.proof.label).not.toBe(original?.proof.label)

      for (const [exampleIndex, example] of service.examples.entries()) {
        expect(example).not.toBe(original?.examples[exampleIndex])
      }
    }

    for (const [index, step] of localized.workProcess.entries()) {
      expect(step.title).not.toBe(workProcess[index]?.title)
      expect(step.body).not.toBe(workProcess[index]?.body)
    }

    for (const [index, topic] of localized.workTopics.entries()) {
      expect(topic.label).not.toBe(workTopics[index]?.label)
      expect(topic.opener).not.toBe(workTopics[index]?.opener)
    }

    for (const [index, item] of localized.workWithMeFaq.entries()) {
      expect(item.question).not.toBe(workWithMeFaq[index]?.question)
      expect(item.answer).not.toBe(workWithMeFaq[index]?.answer)
    }

    const schema = createFaqSchema(localized.workWithMeFaq, 'https://santi020k.com/es/work-with-me/')

    expect(schema.mainEntity.map(item => ({ question: item.name, answer: item.acceptedAnswer.text })))
      .toEqual(localized.workWithMeFaq)
  })
})

describe('contact draft introductions', () => {
  test.each([
    ['', '', 'Hola Santiago.'],
    ['Ana', '', 'Hola Santiago, soy Ana.'],
    ['', 'Acme', 'Hola Santiago, te escribo desde Acme.'],
    ['Ana', 'Acme', 'Hola Santiago, soy Ana de Acme.']
  ])('composes Spanish name %s and company %s', (name, company, expected) => {
    expect(createIntakeIntroduction('es', name, company)).toBe(expected)
  })

  test('preserves English introductions and gives accurate localized handoff status', () => {
    expect(createIntakeIntroduction('en', '', '')).toBe('Hi Santiago.')
    expect(createIntakeIntroduction('en', 'Ana', 'Acme')).toBe('Hi Santiago, I’m Ana from Acme.')
    expect(createIntakeIntroduction('en', '', 'Acme')).toBe('Hi Santiago, I’m reaching out from Acme.')
    expect(getIntakeStatus('es')).toBe('Tu mensaje está listo. Revísalo en WhatsApp y pulsa enviar.')
    expect(getIntakeStatus('en')).toBe('Your message is ready. Review it in WhatsApp, then press send.')
    expect(getDirectContactMessage('es')).toBe('Hola Santiago, vi tu sitio web y me gustaría hablar sobre')
  })
})

describe('localized contact metric displays', () => {
  const examples = [
    ['35% better system performance', '35%', 'Mejor rendimiento del sistema'],
    ['Marcone: Lighthouse score improved from 35 to 98', '35 → 98', 'Marcone: puntuación de Lighthouse'],
    ['40% better API performance', '40%', 'Mejor rendimiento de las API']
  ] as const

  test.each(examples)('preserves the approved English display for %s', metric => {
    expect(getLocalizedContactMetric(metric, 'en')).toEqual(getPortfolioMetricDisplay(metric))
  })

  test.each(examples)('translates the caption without changing the numbers for %s', (metric, value, label) => {
    expect(getLocalizedContactMetric(metric, 'es')).toEqual({ value, label })
  })
})
