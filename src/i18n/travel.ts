import type { TravelCountry } from '@/data/travel'
import { travelCountries } from '@/data/travel'
import type { Locale } from '@/i18n'

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
  if (country.connection === 'home') return locale === 'es' ? 'País de origen' : 'Home country'

  const singular = locale === 'es' ? 'visita' : 'visit'
  const plural = locale === 'es' ? 'visitas' : 'visits'
  const count = `${country.visits} ${country.visits === 1 ? singular : plural}`
  const residence = locale === 'es' ? 'País de residencia' : 'Country of residence'

  return country.connection === 'resident' ? `${count} · ${residence}` : count
}

export const getTravelControlCopy = (locale: Locale) => locale === 'es' ?
  {
    closed: 'Detalles del país cerrados.',
    choose: 'Elige un país destacado para explorar los lugares que he visitado.',
    discover: 'Más lugares por descubrir',
    beyond: 'Más allá del cuaderno',
    home: 'Donde empieza mi historia',
    noEntry: 'Sin entrada en mi diario de viajes',
    previous: 'País anterior',
    residence: 'País de residencia',
    story: 'Un lugar en mi historia',
    visit: 'visita',
    visits: 'visitas',
    from: 'Soy de Colombia. Aquí empieza mi historia.'
  } :
  {
    closed: 'Country details closed.',
    choose: 'Choose a highlighted country to explore the places I have visited.',
    discover: 'More places to discover',
    beyond: 'Beyond the notebook',
    home: 'Where my story begins',
    noEntry: 'No entry in my travel journal',
    previous: 'Previous country',
    residence: 'Country of residence',
    story: 'A place in my story',
    visit: 'visit',
    visits: 'visits',
    from: 'I’m from Colombia. This is where my story begins.'
  }
