/** Require a rendered value without conditional assertions inside test bodies. */
export const requireValue = <T>(value: T | null | undefined): T => {
  if (value === null || value === undefined) throw new Error('Expected a rendered value')

  return value
}
