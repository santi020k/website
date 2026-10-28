import type { TravelCountry } from '@/data/travel'
import { travelCountries } from '@/data/travel'
import type { Locale } from '@/i18n'

import { sharedTranslator } from './shared-copy'

const placesEs: Readonly<Record<string, string>> = {
  'Mexico City (DF)': 'Ciudad de México (DF)',
  'Guatemala City': 'Ciudad de Guatemala',
  'Panama City': 'Ciudad de Panamá',
  'New York': 'Nueva York',
  'Rio de Janeiro': 'Río de Janeiro',
  Iguazu: 'Iguazú',
  Paris: 'París',
  Tokyo: 'Tokio'
}

const notesEs: Readonly<Record<string, string>> = {
  MX: 'Estos son algunos de los lugares que he visitado en México; aún faltan otros por añadir.',
  AR: 'La Patagonia es una región; añadiré las paradas concretas cuando escriba sobre ese viaje.'
}

/** Lumen also includes map regions that are not ISO 3166-1 region codes. */
export const getLocalizedCountryName = (id: string, name: string, locale: Locale): string => {
  if (locale === 'en') return name

  if (id === 'CYN') return 'Chipre del Norte'

  if (id === 'SOL') return 'Somalilandia'

  if (!/^[A-Z]{2}$/u.test(id)) return name

  return new Intl.DisplayNames(['es-419'], { type: 'region' }).of(id) ?? name
}

/** Country names use the platform's Spanish region names; visit counts remain unchanged. */
export const getLocalizedTravelCountries = (locale: Locale): readonly TravelCountry[] => {
  if (locale === 'en') return travelCountries

  return travelCountries.map(country => ({
    ...country,
    name: getLocalizedCountryName(country.code, country.name, locale),
    places: country.places.map(place => placesEs[place] ?? place),
    ...(country.note ? { note: notesEs[country.code] ?? country.note } : {})
  }))
}

export const getLocalizedVisitLabel = (country: TravelCountry, locale: Locale): string => {
  const t = sharedTranslator(locale)

  if (country.connection === 'home') return t('travel.homeCountry')

  const singular = t('travel.visit')
  const plural = t('travel.visits')
  const count = `${country.visits} ${country.visits === 1 ? singular : plural}`
  const residence = t('travel.residence')

  return country.connection === 'resident' ? `${count} · ${residence}` : count
}

export const getTravelControlCopy = (locale: Locale) => {
  const t = sharedTranslator(locale)

  return {
    closed: t('travel.closed'),
    choose: t('travel.choose'),
    discover: t('travel.discover'),
    beyond: t('travel.beyond'),
    home: t('travel.home'),
    noEntry: t('travel.noEntry'),
    previous: t('travel.previous'),
    residence: t('travel.residence'),
    story: t('travel.story'),
    visit: t('travel.visit'),
    visits: t('travel.visits'),
    from: t('travel.from'),
    placeholder: t('travel.placeholder'),
    notebook: t('travel.notebook'),
    remaining: t('travel.remaining')
  }
}
