/**
 * Add depth to image-free cards without introducing a placeholder object.
 *
 * Returning `undefined` for cards with cover art preserves the preset's real
 * image visual. Image-free cards receive only diffuse, non-semantic light.
 */
export const renderOgAtmosphere = (data, _context, { accent }) => {
  if (data.image) return undefined

  return `
    <defs>
      <filter id="og-atmosphere-blur" x="-60%" y="-60%" width="220%" height="220%" color-interpolation-filters="sRGB">
        <feGaussianBlur stdDeviation="64"/>
      </filter>
      <filter id="og-atmosphere-sweep" x="-30%" y="-300%" width="160%" height="700%" color-interpolation-filters="sRGB">
        <feGaussianBlur stdDeviation="34"/>
      </filter>
    </defs>
    <g aria-hidden="true" pointer-events="none">
      <ellipse cx="1048" cy="316" rx="174" ry="156" fill="${accent}" opacity="0.16" filter="url(#og-atmosphere-blur)"/>
      <ellipse cx="922" cy="540" rx="238" ry="62" fill="${accent}" opacity="0.10" filter="url(#og-atmosphere-sweep)"/>
      <path d="M738 616C864 552 1000 554 1168 490" fill="none" stroke="${accent}" stroke-width="18" stroke-linecap="round" opacity="0.07" filter="url(#og-atmosphere-sweep)"/>
    </g>`
}
