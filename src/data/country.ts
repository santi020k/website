import { getCollection } from 'astro:content'

import { travelCountries } from './travel'

/** Keep the confirmed geography and authored impressions joined by country code. */
export const getCountryNotebooks = async () => {
  const entries = await getCollection('country')
  const byCode = new Map(entries.map(entry => [entry.data.code, entry]))

  if (byCode.size !== entries.length) throw new Error('Country notebooks must use unique country codes.')

  return travelCountries.map(country => {
    const entry = byCode.get(country.code)

    if (!entry) throw new Error(`Missing country notebook for ${country.code}. Add it to src/content/country.`)

    return { country, entry }
  })
}
