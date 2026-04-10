/** All visual variants available in Badge.astro */
export type BadgeVariant =
  | 'default' |
  'accent' |
  'brand-accent' |
  'muted' |
  'outline' |
  'inactive' |
  'subtle' |
  'ghost' |
  'warning' |
  'danger'

/** Props shape for the Badge atom component. */
export interface Badge {
  variant?: BadgeVariant
  showHash?: boolean
  title: string
}
