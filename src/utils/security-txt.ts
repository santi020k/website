const DAY = 24 * 60 * 60 * 1000

/**
 * RFC 9116 security contact file. `Expires` is required and should stay well under a year
 * away, so it is derived from the build date: every deployment, scheduled posts included,
 * pushes it forward. Six months leaves room for a quiet stretch without deployments.
 */
interface SecurityTxtOptions {
  email: string
  now?: Date
  site: string | URL
}

export const createSecurityTxt = ({ email, now = new Date(), site }: SecurityTxtOptions): string => {
  const expires = new Date(Math.floor((now.getTime() + 180 * DAY) / DAY) * DAY)

  return [
    `Contact: mailto:${email}`,
    `Expires: ${expires.toISOString().replace('.000Z', 'Z')}`,
    'Preferred-Languages: en, es',
    `Canonical: ${new URL('/.well-known/security.txt', site).href}`,
    ''
  ].join('\n')
}
