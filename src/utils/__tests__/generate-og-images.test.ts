import path from 'node:path'

import { describe, expect, test } from 'vitest'

import {
  collectCards,
  collectSpecs,
  formatTopicName
} from '../../../scripts/js/generate-og-images.js'

interface SocialImageProps {
  coverImagePath?: string
  pathLabel?: string
  title?: string
}

describe('collectSpecs', () => {
  test('includes generated images for the current static page routes', async () => {
    const specs = await collectSpecs()
    const outFiles = new Set(specs.map(spec => spec.outFile))

    for (const fileName of [
      'index.webp',
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
