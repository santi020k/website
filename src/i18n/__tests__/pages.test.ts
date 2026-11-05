import { describe, expect, test } from 'vitest'

import { testimonials } from '@/data/profile'
import { travelCountries } from '@/data/travel'
import { localizePageSource } from '@/i18n/page-copy'
import { getLocalizedProfile } from '@/i18n/profile'
import { getLocalizedCountryName, getLocalizedTravelCountries, getLocalizedVisitLabel, getTravelControlCopy } from '@/i18n/travel'

describe('current-site Spanish page copy', () => {
  test('preserves English text and whitespace exactly', () => {
    const copy = '  Work experience\n'

    expect(localizePageSource('en', copy)).toBe(copy)
    expect(localizePageSource('es', copy)).toBe('  Experiencia laboral\n')
    expect(localizePageSource('es', 'ProductName')).toBe('ProductName')
    expect(localizePageSource('es', '  ')).toBe('  ')
  })

  test('translates page and policy content without changing quoted recommendations', () => {
    const spanish = getLocalizedProfile('es')

    expect(localizePageSource('es', 'Privacy questions should be easy to ask.')).toBe('Preguntar sobre privacidad debería ser sencillo.')
    expect(spanish.engineeringPrinciples[0]?.title).toBe('Automatiza la fricción, conserva el criterio')
    expect(spanish.speakingFormats[1]?.title).toBe('Talleres')
    expect(spanish.speakingTopics[0]?.source.href).toMatch(/^\/es\/blog\//u)
    expect(spanish.testimonials.map(item => item.quote)).toEqual(testimonials.map(item => item.quote))
    expect(spanish.testimonials[0]?.relationship).toBe('Fue responsable de Santiago en Optic Power')
    expect(getLocalizedProfile('en').testimonials).toEqual(testimonials)
  })

  test('localizes travel presentation while preserving country facts and ordering', () => {
    const countries = getLocalizedTravelCountries('es')

    expect(getLocalizedTravelCountries('en')).toBe(travelCountries)
    const facts = countries.map(({ code, visits, connection }) => ({ code, visits, connection }))
    const originalFacts = travelCountries.map(({ code, visits, connection }) => ({ code, visits, connection }))

    expect(facts).toEqual(originalFacts)
    expect(countries.find(country => country.code === 'US')?.name).toBe('Estados Unidos')
    expect(countries.find(country => country.code === 'MX')?.places[0]).toBe('Ciudad de México (DF)')
    expect(countries.find(country => country.code === 'AR')?.note).toContain('La Patagonia es una región')
    expect(getLocalizedVisitLabel({ code: 'CO', name: 'Colombia', connection: 'home', visits: null, places: [] }, 'es')).toBe('País de origen')
    expect(getLocalizedVisitLabel({ code: 'PY', name: 'Paraguay', connection: 'resident', visits: 7, places: [] }, 'es')).toBe('7 visitas · País de residencia')
    expect(getLocalizedVisitLabel({ code: 'FR', name: 'France', visits: 1, places: [] }, 'es')).toBe('1 visita')
    expect(getTravelControlCopy('es').previous).toBe('País anterior')
  })
})

test('supplemental world-map regions retain usable Spanish labels without invalid region lookups', () => {
  expect(getLocalizedCountryName('CYN', 'Northern Cyprus', 'es')).toBe('Chipre del Norte')
  expect(getLocalizedCountryName('SOL', 'Somaliland', 'es')).toBe('Somalilandia')
  expect(getLocalizedCountryName('CUSTOM', 'A named region', 'es')).toBe('A named region')
  expect(getLocalizedCountryName('CO', 'Colombia', 'en')).toBe('Colombia')
})
