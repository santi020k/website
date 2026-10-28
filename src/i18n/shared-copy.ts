import { sharedMessages } from './catalogs/shared.ts'
import { createTranslator } from './messages.ts'

export const sharedTranslator = createTranslator(sharedMessages)
