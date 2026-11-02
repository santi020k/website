/** Arrow directions drawn by ArrowExchange and Markdown reference links. */
export const arrowDirections = ['down', 'down-right', 'left', 'right', 'up', 'up-right'] as const

export type ArrowDirection = typeof arrowDirections[number]

/** Every page defines these symbols once; each arrow glyph references one with `<use>`. */
export const arrowSymbolId = (direction: ArrowDirection): string => `site-arrow-${direction}`
