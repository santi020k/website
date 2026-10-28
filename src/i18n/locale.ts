/** English owns the source messages and unprefixed URLs. */
export const defaultLocale = 'en'
export const locales = ['en', 'es'] as const
export type Locale = typeof locales[number]
