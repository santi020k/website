import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'

import sharp from 'sharp'
import { describe, expect, test } from 'vitest'

import {
  buildProjectSvg,
  discoverProjects,
  generateProjectImages,
  getFallbackAccent,
  getLogoBounds,
  getProjectImageVariants,
  getReadableAccent,
  IMAGE_VARIANTS,
  selectAccentFromPixels,
  splitTitle
} from '../generate-project-images.mjs'

describe('project image generator', () => {
  test('selects a saturated logo color and falls back for neutral pixels', () => {
    const saturated = Buffer.from([
      245,
      90,
      20,
      255,
      245,
      90,
      20,
      255,
      245,
      90,
      20,
      255
    ])
    const neutral = Buffer.from([
      255,
      255,
      255,
      255,
      0,
      0,
      0,
      255
    ])

    expect(selectAccentFromPixels(saturated, '#8b5cf6')).toBe('#f55a14')
    expect(selectAccentFromPixels(neutral, '#8b5cf6')).toBe('#8b5cf6')
    expect(getFallbackAccent('astro-doctor')).toMatch(/^#[\da-f]{6}$/u)
  })

  // Each fixture renders all four full-resolution image variants before pixel inspection.
  test.each([
    { extension: 'md', height: 64, logoAspect: 'square', width: 64 },
    { extension: 'mdx', height: 64, logoAspect: 'wide', width: 320 },
    { extension: 'md', height: 320, logoAspect: 'tall', width: 64 },
    { extension: 'md', height: 64, logoAspect: 'square', padding: 160, width: 64 },
    { extension: 'mdx', height: 64, logoAspect: 'wide', padding: 160, width: 320 },
    { extension: 'md', height: 320, logoAspect: 'tall', padding: 160, width: 64 },
    { extension: 'md', height: 64, logoAspect: 'square', logoScale: 1.5, width: 64 },
    { extension: 'mdx', height: 64, logoAspect: 'wide', logoScale: 1.5, width: 320 },
    { extension: 'md', height: 320, logoAspect: 'tall', logoScale: 1.5, width: 64 }
  ])('gives $logoAspect artwork a consistent visual size inside square crops (padding: $padding, scale: $logoScale)', async ({ extension, height, logoAspect, logoScale = 1, padding = 0, width }) => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), 'project-images-'))
    const projectDirectory = path.join(root, 'sample-project')

    await fs.mkdir(projectDirectory)
    await fs.writeFile(path.join(projectDirectory, `index.${extension}`), `---
title: Sample Project
description: A generated fixture.
brand:
  primary: "#0ea5e9"
  secondary: "#22d3ee"
  surface: "#082f49"
role: Creator
typesId: personal
technologies:
  - Astro
coverImage:
  src: ./cover.webp
  background: ./cover-background.webp
  logo: ./logo.png
  logoAspect: ${logoAspect}
  logoScale: ${logoScale}
  logoSurface: dark
  alt: Sample project cover
---
`)
    await sharp({
      create: {
        background: '#7c3aed',
        channels: 4,
        height,
        width
      }
    }).extend({
      background: { alpha: 0, b: 0, g: 0, r: 0 },
      bottom: padding,
      left: padding,
      right: padding,
      top: padding
    }).png().toFile(path.join(projectDirectory, 'logo.png'))

    const [project] = await discoverProjects(root)
    const outputs = await generateProjectImages({ projectsRoot: root })

    expect(project?.brand).toEqual({
      primary: '#0ea5e9',
      secondary: '#22d3ee',
      surface: '#082f49'
    })
    expect(project?.accent).toBe('#0ea5e9')

    expect(outputs).toHaveLength(IMAGE_VARIANTS.length)

    for (const [index, output] of outputs.entries()) {
      const metadata = await sharp(output).metadata()
      const variant = IMAGE_VARIANTS[index]

      expect(metadata.width).toBe(variant?.width)
      expect(metadata.height).toBe(variant?.height)

      if (variant?.kind !== 'hero' && variant?.kind !== 'portrait') continue

      const size = Math.min(variant.width, variant.height)
      const image = sharp(output).removeAlpha()
      const full = await image.clone().raw().toBuffer()
      const crop = await image.clone().extract({
        height: size,
        left: Math.round((variant.width - size) / 2),
        top: Math.round((variant.height - size) / 2),
        width: size
      }).raw().toBuffer()
      const measureLogo = (pixels: Buffer, imageWidth: number) => {
        let count = 0
        let left = imageWidth
        let right = -1
        let top = pixels.length
        let bottom = -1

        for (let offset = 0; offset < pixels.length; offset += 3) {
          const red = pixels[offset] ?? 0
          const green = pixels[offset + 1] ?? 0
          const blue = pixels[offset + 2] ?? 0

          if (red <= 90 || green >= 90 || blue <= 180) continue

          const x = (offset / 3) % imageWidth
          const y = Math.floor(offset / 3 / imageWidth)

          count += 1
          left = Math.min(left, x)
          right = Math.max(right, x)
          top = Math.min(top, y)
          bottom = Math.max(bottom, y)
        }

        return {
          centerX: (left + right + 1) / 2,
          centerY: (top + bottom + 1) / 2,
          count,
          height: bottom - top + 1,
          width: right - left + 1
        }
      }

      const artwork = measureLogo(full, variant.width)
      const croppedArtwork = measureLogo(crop, size)
      const minimumScale = { square: 0.55, tall: 0.63, wide: 0.89 }[logoAspect]

      expect(artwork.count).toBeGreaterThan(1000)
      expect(croppedArtwork.count).toBe(artwork.count)
      expect(Math.abs(artwork.centerX - variant.width / 2)).toBeLessThanOrEqual(1)
      expect(Math.abs(artwork.centerY - variant.height / 2)).toBeLessThanOrEqual(1)
      expect(Math.abs(croppedArtwork.centerX - size / 2)).toBeLessThanOrEqual(1)
      expect(Math.abs(croppedArtwork.centerY - size / 2)).toBeLessThanOrEqual(1)
      expect(Math.max(artwork.height, artwork.width) / size).toBeGreaterThan(minimumScale ?? 0)
    }

    await fs.rm(root, { force: true, recursive: true })
  }, 60_000)

  test('measures alpha instead of background colors and rejects invisible logos', async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), 'project-logo-bounds-'))
    const logoPath = path.join(root, 'logo.png')
    const visible = await sharp({
      create: { background: '#000000', channels: 4, height: 5, width: 10 }
    }).png().toBuffer()
    const image = sharp({
      create: { background: { alpha: 0.02, b: 255, g: 255, r: 255 }, channels: 4, height: 20, width: 30 }
    })

    await image.clone().composite([{ input: visible, left: 7, top: 9 }]).png().toFile(logoPath)
    await expect(getLogoBounds(logoPath)).resolves.toEqual({ height: 5, left: 7, top: 9, width: 10 })
    await image.png().toFile(logoPath)
    await expect(getLogoBounds(logoPath)).rejects.toThrow('Logo has no visible artwork')
    await fs.rm(root, { force: true, recursive: true })
  })

  test('renders vector logos at cover resolution before measuring their bounds', async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), 'project-vector-logo-'))
    const logoPath = path.join(root, 'logo.svg')

    await fs.writeFile(logoPath, '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" fill="#000"/></svg>')
    await expect(getLogoBounds(logoPath)).resolves.toEqual({ height: 1600, left: 0, top: 0, width: 1600 })
    await fs.rm(root, { force: true, recursive: true })
  })

  test.each(['0', '2', 'large', '.nan'])('rejects an invalid optical scale: %s', async scale => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), 'project-logo-scale-'))
    const directory = path.join(root, 'sample')

    await fs.mkdir(directory)
    await fs.writeFile(path.join(directory, 'index.md'), `---
title: Sample
description: A generated fixture.
coverImage:
  logo: ./logo.png
  logoScale: ${scale}
---
`)
    await expect(discoverProjects(root)).rejects.toThrow('coverImage.logoScale must be between 0.75 and 1.5')
    await fs.rm(root, { force: true, recursive: true })
  })

  test('keeps metadata in thumbnails and scenery templates text-free', () => {
    const project = {
      accent: '#7c3aed',
      brand: {
        primary: '#7c3aed',
        secondary: '#22d3ee',
        surface: '#10091c'
      },
      logoAspect: 'square',
      logoSurface: 'dark',
      role: 'Creator',
      technologies: ['Astro'],
      title: 'Sample Project',
      type: 'personal'
    }
    const [thumbnail, hero, portrait, background] = IMAGE_VARIANTS

    expect(buildProjectSvg(project, thumbnail)).toContain('Sample Project')
    expect(buildProjectSvg(project, hero)).not.toContain('Sample Project')
    expect(buildProjectSvg(project, portrait)).not.toContain('Sample Project')
    expect(buildProjectSvg(project, background)).not.toContain('<g filter="url(#shadow)">')
    expect(hero?.kind).toBe('hero')
    expect(portrait?.kind).toBe('portrait')
    expect(background?.kind).toBe('background')
  })

  test('generates a logo-free background only when the project opts in', () => {
    expect(getProjectImageVariants({ background: undefined })).toHaveLength(3)
    expect(getProjectImageVariants({ background: './cover-background.webp' })).toEqual(IMAGE_VARIANTS)
  })

  test('wraps long thumbnail titles without splitting ordinary titles', () => {
    expect(splitTitle('Between Contractions', false)).toEqual(['Between', 'Contractions'])
    expect(splitTitle('Workspace Organizer', false)).toEqual(['Workspace', 'Organizer'])
    expect(splitTitle('Smith Commerce', false)).toEqual(['Smith Commerce'])
    expect(splitTitle('eslint-config-basic', false)).toEqual(['eslint-config-basic'])
  })

  test('keeps thumbnail technology pills and the portfolio label legible', () => {
    const project = {
      accent: '#052660',
      brand: {
        primary: '#052660',
        secondary: '#22d3ee',
        surface: '#10091c'
      },
      logoAspect: 'square',
      logoSurface: 'dark',
      role: 'Creator',
      technologies: ['Astro'],
      title: 'Sample Project',
      type: 'personal'
    }
    const [thumbnail] = IMAGE_VARIANTS
    const svg = buildProjectSvg(project, thumbnail)
    const readableAccentValue: unknown = getReadableAccent(project.accent)
    const readableFooterAccentValue: unknown = getReadableAccent(project.brand.primary, project.brand.surface)

    expect(typeof readableAccentValue).toBe('string')
    expect(typeof readableFooterAccentValue).toBe('string')

    if (typeof readableAccentValue !== 'string' || typeof readableFooterAccentValue !== 'string') {
      throw new TypeError('Readable project accents must be strings')
    }

    const readableAccent = readableAccentValue
    const readableFooterAccent = readableFooterAccentValue

    expect(readableAccent).not.toBe(project.accent)
    expect(readableAccent).toBe('#3279f4')
    expect(getReadableAccent('#ff002b')).toBe('#ff002b')
    expect(svg).toContain(`fill="${readableAccent}" fill-opacity="0.26"`)
    expect(svg).toContain('stroke-opacity="0.72"')
    expect(svg).toContain('class="eyebrow project-label">INDEPENDENT PROJECT</text>')
    expect(buildProjectSvg({ ...project, type: 'community' }, thumbnail))
      .toContain('class="eyebrow project-label">COMMUNITY WORK</text>')
    expect(svg).toContain(`.project-label { fill: ${readableAccent}; }`)
    expect(svg).toContain('class="eyebrow footer-label">SANTI020K / PORTFOLIO</text>')
    expect(svg).toContain(`.footer-label { fill: ${readableFooterAccent};`)
  })

  test('rejects unknown project slugs', async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), 'project-images-'))

    await expect(generateProjectImages({
      projectsRoot: root,
      slugs: ['missing']
    })).rejects.toThrow('Unknown project slug(s): missing')

    await fs.rm(root, { force: true, recursive: true })
  })
})
