import type { ImageMetadata } from 'astro'

/** Preserve the source ratio and keep generated candidates within the target width. */
export const getResponsiveImageDimensions = (
  image: Pick<ImageMetadata, 'width' | 'height'>,
  maxWidth: number,
  candidateWidths: readonly number[]
) => {
  const width = Math.min(maxWidth, image.width)

  return {
    width,
    height: Math.round(width * image.height / image.width),
    widths: [...new Set([...candidateWidths, width])]
      .filter(candidate => candidate <= width)
      .sort((first, second) => first - second)
  }
}
