export const getReadingTime = (body: string | undefined): number => {
  if (!body) return 1

  const words = body.trim().split(/\s+/).length

  return Math.max(1, Math.ceil(words / 200))
}
