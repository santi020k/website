import path from 'node:path'

import { describe, expect, test } from 'vitest'

import {
  collectCards,
  collectSpecs,
  formatTopicName
} from '../../../scripts/js/generate-og-images.js'
import { renderOgAtmosphere } from '../../../scripts/js/render-og-atmosphere.mjs'

interface SocialImageProps {
  coverImagePath?: string
  pathLabel?: string
  title?: string
}

describe('collectSpecs', { timeout: 15_000 }, () => {
  test('includes generated images for the current static page routes', async () => {
    const specs = await collectSpecs()
    const outFiles = new Set(specs.map(spec => spec.outFile))

    for (const fileName of [
      'index.webp',
      'developer-experience.webp',
      'work.webp',
      'projects.webp',
      'resume.webp',
      'privacy.webp',
      'accessibility.webp',
      'terms.webp',
      'blog--tags.webp'
    ]) {
      expect(outFiles.has(path.join(process.cwd(), 'public', 'og', 'pages', fileName))).toBe(true)
    }
  })

  test('includes generated images for blog topic archive routes', async () => {
    const specs = await collectSpecs()
    const topicSpec = specs.find(spec => spec.outFile === path.join(
      process.cwd(), 'public', 'og', 'pages', 'blog--tags--typescript.webp'
    ))
    const topicProps = topicSpec?.props as SocialImageProps | undefined

    expect(topicProps?.title).toBe('TypeScript posts')
    expect(topicProps?.pathLabel).toBe('/blog/tags/typescript/')
  })

  test('includes generated route cards for non-empty taxonomies with one entry', async () => {
    const pathnames = new Set((await collectCards()).map(card => card.route?.pathname))

    expect(pathnames.has('/blog/tags/alpine/')).toBe(true)
    expect(pathnames.has('/technologies/actionlint/')).toBe(true)
    expect(pathnames.has('/blog/tags/typescript/')).toBe(true)
    expect(pathnames.has('/technologies/typescript/')).toBe(true)
  })

  test('matches the blog index pagination size', async () => {
    const cards = await collectCards()
    const pathnames = new Set(cards.map(card => card.route?.pathname))

    expect(pathnames.has('/blog/4/')).toBe(true)
    expect(pathnames.has('/blog/5/')).toBe(false)
  })

  test('embeds normalized cover art and complete route metadata', async () => {
    const cards = await collectCards()
    const postCard = cards.find(card => card.output ===
      'blog/deterministic-open-graph-images-without-design-lock-in.webp')
    const postData: { image?: unknown, variant?: string } | undefined = postCard?.data

    expect(postData?.image).toMatch(/^data:image\/png;base64,/u)
    expect(postData?.variant).toBe('article')
    expect(postCard?.route).toMatchObject({
      alt: 'Deterministic Open Graph images without design lock-in — Santiago Molina',
      pathname: '/blog/deterministic-open-graph-images-without-design-lock-in/',
      title: 'Deterministic Open Graph images without design lock-in'
    })
  })

  test('uses real cover art as the only right-side visual', async () => {
    const cards = await collectCards()
    const visualVariants = cards
      .filter(card => Boolean((card.data as { image?: unknown }).image))
      .map(card => (card.data as { variant?: string }).variant)
    const imageFreeVariants = cards
      .filter(card => !(card.data as { image?: unknown }).image)
      .map(card => (card.data as { variant?: string }).variant)

    expect(new Set(visualVariants)).toEqual(new Set(['article', 'product']))
    expect(new Set(imageFreeVariants)).toEqual(new Set(['simple']))
  })

  test.each([
    ['configuration', 'Configuration'],
    ['developer-experience', 'Developer experience'],
    ['typescript', 'TypeScript'],
    ['ui-engineering', 'UI engineering'],
    ['vscode', 'VS Code']
  ])('formats the topic label %s as %s', (topic, expected) => {
    expect(formatTopicName(topic)).toBe(expected)
  })

  test('excludes scheduled posts until their publish date', async () => {
    const specs = await collectSpecs()
    const scheduledPost = specs.find(spec => spec.outFile.endsWith(
      'what-changed-when-i-started-writing-architecture-notes-every-month.webp'
    ))

    expect(scheduledPost).toBeUndefined()
  })

  test('includes project entries stored in nested index.md files', async () => {
    const specs = await collectSpecs()
    const xgamesSpec = specs.find(spec => spec.outFile === path.join(process.cwd(), 'public', 'og', 'portfolio', 'xgames.webp'))
    const xgamesProps = xgamesSpec?.props as SocialImageProps | undefined

    expect(xgamesProps?.title).toBe('X Games')
    expect(xgamesProps?.pathLabel).toBe('/portfolio/xgames/')
  })

  test('resolves cover image assets for blog posts and falls back to cover src when a project ogImage is missing', async () => {
    const specs = await collectSpecs()
    const postSpec = specs.find(spec => spec.outFile === path.join(
      process.cwd(), 'public', 'og', 'blog', 'ai-coding-is-probabilistic-your-delivery-process-should-not-be.webp'
    ))
    const projectSpec = specs.find(spec => spec.outFile === path.join(process.cwd(), 'public', 'og', 'portfolio', 'eslint-config-basic.webp'))
    const postProps = postSpec?.props as SocialImageProps | undefined
    const projectProps = projectSpec?.props as SocialImageProps | undefined

    expect(postProps?.coverImagePath).toBe(path.join(
      process.cwd(), 'src', 'content', 'post', '2026', 'ai-coding-is-probabilistic-your-delivery-process-should-not-be', 'cover.webp'
    ))
    expect(projectProps?.coverImagePath).toBe(path.join(
      process.cwd(), 'src', 'content', 'project', 'eslint-config-basic', 'cover.webp'
    ))
  })

  test('keeps existing technology image filenames while using canonical path labels', async () => {
    const designSystemsSpec = (await collectSpecs()).find(spec => spec.outFile.endsWith('technologies--Design~20Systems.webp'))
    const designSystemsProps = designSystemsSpec?.props as SocialImageProps | undefined

    expect(designSystemsProps?.pathLabel).toBe('/technologies/design-systems/')
  })
})

describe('renderOgAtmosphere', () => {
  test('adds only diffuse light to image-free cards', () => {
    const atmosphere = renderOgAtmosphere(
      { title: 'Image-free page' },
      {},
      { accent: '#9b66ff' }
    )

    expect(atmosphere).toContain('feGaussianBlur')
    expect(atmosphere).toContain('aria-hidden="true"')
    expect(atmosphere).not.toContain('<rect')
  })

  test('preserves the preset cover visual when a real image exists', () => {
    expect(renderOgAtmosphere(
      { image: 'data:image/png;base64,cover' },
      {},
      { accent: '#9b66ff' }
    )).toBeUndefined()
  })
})
