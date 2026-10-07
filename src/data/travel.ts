interface TravelCountryDetails {
  code: string
  name: string
  places: readonly string[]
  note?: string
}

export type TravelCountry = TravelCountryDetails & (
  { connection: 'home', visits: null } |
  { connection?: 'resident', visits: number }
)

// Country-level visits supplied by Santiago. Dates and city-level counts are intentionally absent.
export const travelCountries: readonly TravelCountry[] = [
  { code: 'CO', name: 'Colombia', places: [], visits: null, connection: 'home' },
  { code: 'US', name: 'United States', places: ['New York', 'Columbus'], visits: 2 },
  {
    code: 'MX',
    name: 'Mexico',
    places: ['Mexico City (DF)', 'Cancún', 'Puebla', 'Querétaro'],
    visits: 7,
    note: 'These are some of the places I have visited in Mexico; there are more to add.'
  },
  { code: 'GT', name: 'Guatemala', places: ['Guatemala City'], visits: 1 },
  { code: 'PA', name: 'Panama', places: ['Panama City'], visits: 1 },
  { code: 'EC', name: 'Ecuador', places: ['Quito'], visits: 1 },
  { code: 'PE', name: 'Peru', places: ['Lima', 'Cusco'], visits: 1 },
  { code: 'BR', name: 'Brazil', places: ['Rio de Janeiro', 'São Paulo', 'Iguazu'], visits: 2 },
  { code: 'CL', name: 'Chile', places: ['Santiago de Chile'], visits: 1 },
  {
    code: 'PY',
    name: 'Paraguay',
    places: ['Asunción', 'Encarnación', 'Ciudad del Este'],
    visits: 7,
    connection: 'resident'
  },
  { code: 'UY', name: 'Uruguay', places: ['Montevideo'], visits: 1 },
  {
    code: 'AR',
    name: 'Argentina',
    places: ['Buenos Aires', 'Patagonia'],
    visits: 2,
    note: 'Patagonia is a region; I will add the individual stops as I write about that journey.'
  },
  { code: 'ES', name: 'Spain', places: ['Madrid'], visits: 1 },
  { code: 'FR', name: 'France', places: ['Paris'], visits: 1 },
  { code: 'JP', name: 'Japan', places: ['Tokyo', 'Osaka'], visits: 1 }
]

export const travelSummary = {
  countriesAbroad: travelCountries.filter(country => country.connection !== 'home').length,
  countryVisits: travelCountries.reduce((total, country) => total + (country.visits ?? 0), 0)
}

export const getTravelVisitLabel = (country: TravelCountry): string => {
  if (country.connection === 'home') return 'Home country'

  const visits = `${country.visits} ${country.visits === 1 ? 'visit' : 'visits'}`

  return country.connection === 'resident' ? `${visits} · Country of residence` : visits
}

export const travelPageDescription =
  'Explore the places I have visited across the Americas, Europe, and Asia, from my roots in Colombia to life abroad as a resident of Paraguay.'
