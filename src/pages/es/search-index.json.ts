import type { APIRoute } from 'astro'

import { createSearchIndex } from '../search-index.json'

export const GET: APIRoute = () => createSearchIndex('es')
