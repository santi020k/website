import { createSecurityTxt } from '@/utils/security-txt'

import { siteConfig } from '@/site.config'

export const GET = (): Response => new Response(
  createSecurityTxt({ email: siteConfig.contact.email, site: import.meta.env.SITE }),
  { headers: { 'Content-Type': 'text/plain; charset=utf-8' } }
)
