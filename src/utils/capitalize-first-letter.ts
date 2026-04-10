/**
 * Returns `str` with the first character uppercased.
 * Returns an empty string when given an empty string.
 */
const capitalizeFirstLetter = (str: string): string => {
  if (str.length === 0) return ''

  return str.charAt(0).toUpperCase() + str.slice(1)
}

export { capitalizeFirstLetter }
