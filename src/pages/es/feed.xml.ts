import type { APIContext } from 'astro'

import { createRssFeed } from '../feed.xml'

export const GET = (context: APIContext) => createRssFeed(context, 'es')
