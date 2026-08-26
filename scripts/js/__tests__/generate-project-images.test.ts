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

  test('discovers a project and renders every responsive variant', async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), 'project-images-'))
    const projectDirectory = path.join(root, 'sample-project')

    await fs.mkdir(projectDirectory)
    await fs.writeFile(path.join(projectDirectory, 'index.md'), `---
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
  logoAspect: square
  logoSurface: dark
  alt: Sample project cover
---
`)
    await sharp({
      create: {
        background: '#7c3aed',
        channels: 4,
        height: 64,
        width: 64
      }
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
    }

    await fs.rm(root, { force: true, recursive: true })
  }, 15_000)

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
