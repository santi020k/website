import current from '@santi020k/website-history/current' with { type: 'json' }
import versions from '@santi020k/website-history/versions' with { type: 'json' }

export const formats = ['portrait', 'square', 'landscape'] as const
export const duration = 26
export const outroStart = 22
export const chapters = [...versions, current].map((era, index) => ({
  ...era,
  start: 2 + index * 5,
  still: 3.5 + index * 5,
  change: [
    'A personal introduction. Selected work. A place to begin.',
    'A bolder identity. More writing. Room for projects.',
    'One shared system. A growing family of products.',
    'Warmer portraits. Sculpted type. A more personal studio.'
  ][index] ?? era.description
}))
