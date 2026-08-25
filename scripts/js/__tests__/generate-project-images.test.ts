import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'

import sharp from 'sharp'
import { describe, expect, test } from 'vitest'

import {
  buildProjectSvg,
  generateProjectImages,
  getFallbackAccent,
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
role: Creator
typesId: personal
technologies:
  - Astro
coverImage:
  src: ./cover.webp
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

    const outputs = await generateProjectImages({ projectsRoot: root })

    expect(outputs).toHaveLength(IMAGE_VARIANTS.length)

    for (const [index, output] of outputs.entries()) {
      const metadata = await sharp(output).metadata()
      const variant = IMAGE_VARIANTS[index]

      expect(metadata.width).toBe(variant?.width)
      expect(metadata.height).toBe(variant?.height)
    }

    await fs.rm(root, { force: true, recursive: true })
  })

  test('keeps metadata in thumbnails and scenery templates text-free', () => {
    const project = {
      accent: '#7c3aed',
      logoAspect: 'square',
      logoSurface: 'dark',
      role: 'Creator',
      technologies: ['Astro'],
      title: 'Sample Project',
      type: 'personal'
    }
    const [thumbnail, hero, portrait] = IMAGE_VARIANTS

    expect(buildProjectSvg(project, thumbnail)).toContain('Sample Project')
    expect(buildProjectSvg(project, hero)).not.toContain('Sample Project')
    expect(buildProjectSvg(project, portrait)).not.toContain('Sample Project')
    expect(hero?.kind).toBe('hero')
    expect(portrait?.kind).toBe('portrait')
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
      logoAspect: 'square',
      logoSurface: 'dark',
      role: 'Creator',
      technologies: ['Astro'],
      title: 'Sample Project',
      type: 'personal'
    }
    const [thumbnail] = IMAGE_VARIANTS
    const svg = buildProjectSvg(project, thumbnail)

    expect(svg).toContain('fill="#fbf8ff" fill-opacity="0.12"')
    expect(svg).toContain('stroke-opacity="0.62"')
    expect(svg).toContain('class="eyebrow project-label">INDEPENDENT PROJECT</text>')
    expect(svg).toContain('.project-label { fill: #d8c8f2; fill-opacity: 0.92; }')
    expect(svg).toContain('class="eyebrow footer-label">SANTI020K / PORTFOLIO</text>')
    expect(svg).toContain('.footer-label { fill: #fbf8ff; fill-opacity: 0.88; }')
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
