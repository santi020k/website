export interface ProjectBrandPalette {
  primary: string
  secondary: string
  surface: string
}

interface HslColor {
  hue: number
  lightness: number
  saturation: number
}

interface RgbColor {
  blue: number
  green: number
  red: number
}

const HEX_COLOR_PATTERN = /^#[\da-f]{6}$/iu
const LIGHT_CANVAS = '#fbf8ff'
const DARK_CANVAS = '#10091c'

export const DEFAULT_PROJECT_BRAND = {
  primary: '#8747ff',
  secondary: '#b78cff',
  surface: DARK_CANVAS
} satisfies ProjectBrandPalette

const normalizeHex = (value: string) => {
  if (!HEX_COLOR_PATTERN.test(value)) throw new TypeError(`Invalid project brand color: ${value}`)

  return value.toLowerCase()
}

const hexToRgb = (value: string): RgbColor => {
  const normalized = normalizeHex(value)

  return {
    blue: Number.parseInt(normalized.slice(5, 7), 16),
    green: Number.parseInt(normalized.slice(3, 5), 16),
    red: Number.parseInt(normalized.slice(1, 3), 16)
  }
}

const rgbToHex = ({ blue, green, red }: RgbColor) => `#${[red, green, blue]
  .map(channel => Math.round(channel).toString(16).padStart(2, '0'))
  .join('')}`

const rgbToHsl = ({ blue, green, red }: RgbColor): HslColor => {
  const r = red / 255
  const g = green / 255
  const b = blue / 255
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const lightness = (max + min) / 2
  const delta = max - min

  if (delta === 0) return { hue: 0, lightness, saturation: 0 }

  const saturation = delta / (1 - Math.abs((2 * lightness) - 1))
  let hue: number

  if (max === r) hue = ((g - b) / delta) % 6
  else if (max === g) hue = ((b - r) / delta) + 2
  else hue = ((r - g) / delta) + 4

  return {
    hue: ((hue * 60) + 360) % 360,
    lightness,
    saturation
  }
}

const getRelativeLuminance = ({ blue, green, red }: RgbColor) => {
  const toLinearChannel = (channel: number) => {
    const normalized = channel / 255

    return normalized <= 0.04045 ? normalized / 12.92 : ((normalized + 0.055) / 1.055) ** 2.4
  }

  return (0.2126 * toLinearChannel(red)) +
    (0.7152 * toLinearChannel(green)) +
    (0.0722 * toLinearChannel(blue))
}

export const getProjectColorContrast = (first: string, second: string) => {
  const firstLuminance = getRelativeLuminance(hexToRgb(first))
  const secondLuminance = getRelativeLuminance(hexToRgb(second))
  const lighter = Math.max(firstLuminance, secondLuminance)
  const darker = Math.min(firstLuminance, secondLuminance)

  return (lighter + 0.05) / (darker + 0.05)
}

const mixRgb = (color: RgbColor, target: RgbColor, amount: number): RgbColor => ({
  blue: color.blue + ((target.blue - color.blue) * amount),
  green: color.green + ((target.green - color.green) * amount),
  red: color.red + ((target.red - color.red) * amount)
})

export const getReadableProjectColor = (color: string, background: string) => {
  const normalizedColor = normalizeHex(color)
  const normalizedBackground = normalizeHex(background)

  if (getProjectColorContrast(normalizedColor, normalizedBackground) >= 4.5) return normalizedColor

  const source = hexToRgb(normalizedColor)
  const backgroundLuminance = getRelativeLuminance(hexToRgb(normalizedBackground))
  const target = backgroundLuminance > 0.45 ? hexToRgb('#000000') : hexToRgb('#ffffff')

  for (let amount = 0.05; amount <= 1; amount += 0.05) {
    const candidate = rgbToHex(mixRgb(source, target, amount))

    if (getProjectColorContrast(candidate, normalizedBackground) >= 4.5) return candidate
  }

  return backgroundLuminance > 0.45 ? '#000000' : '#ffffff'
}

const toHslChannels = (value: string) => {
  const { hue, lightness, saturation } = rgbToHsl(hexToRgb(value))

  return `${Math.round(hue)} ${Math.round(saturation * 100)}% ${Math.round(lightness * 100)}%`
}

export const getProjectBrandStyle = (brand?: ProjectBrandPalette) => {
  const palette = brand ?? DEFAULT_PROJECT_BRAND
  const primary = normalizeHex(palette.primary)
  const secondary = normalizeHex(palette.secondary)
  const surface = normalizeHex(palette.surface)
  const onSurface = getProjectColorContrast('#ffffff', surface) >= 4.5 ? '#ffffff' : '#000000'
  const primaryOnLight = getReadableProjectColor(primary, LIGHT_CANVAS)
  const primaryOnDark = getReadableProjectColor(primary, DARK_CANVAS)

  return [
    `--project-primary: ${toHslChannels(primary)}`,
    `--project-secondary: ${toHslChannels(secondary)}`,
    `--project-surface: ${toHslChannels(surface)}`,
    `--project-on-surface: ${toHslChannels(onSurface)}`,
    `--project-primary-readable: ${toHslChannels(primaryOnLight)}`,
    `--project-primary-readable-dark: ${toHslChannels(primaryOnDark)}`
  ].join('; ')
}
