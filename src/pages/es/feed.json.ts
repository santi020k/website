import type { APIContext } from 'astro'

import { createJsonFeed } from '../feed.json'

export const GET = (context: APIContext) => createJsonFeed(context, 'es')
