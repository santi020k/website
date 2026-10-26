import current from '@santi020k/website-history/current' with { type: 'json' }
import versions from '@santi020k/website-history/versions' with { type: 'json' }

export const formats = ['portrait', 'square', 'landscape'] as const
export const duration = 30

const chapterDuration = 20 / (versions.length + 1)

export const openingStill = 2.6
export const outroStart = 24
export const endingStill = 27.5
export const chapters = [...versions, current].map((era, index) => ({
  ...era,
  start: 4 + index * chapterDuration,
  still: 5.5 + index * chapterDuration,
  change: [
    'A personal introduction. Selected work. A place to begin.',
    'A bolder identity. More writing. Room for projects.',
    'One shared system. A growing family of products.',
    'Warmer portraits. Sculpted type. A more personal studio.',
    'Editorial spreads. Clear evidence. Connected stories.'
  ][index] ?? era.description
}))
