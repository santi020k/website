import readingTime from 'reading-time'

export const getReadingStats = (body: string | undefined): { minutes: number, words: number } => {
  const stats = readingTime(body ?? '')

  return { minutes: Math.max(1, Math.ceil(stats.minutes)), words: stats.words }
}

export const getReadingTime = (body: string | undefined): number => getReadingStats(body).minutes
