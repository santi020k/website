import path from 'node:path'
import { describe, expect, it } from 'vitest'

import { collectSpecs } from '../../../scripts/js/generate-og-images.js'

interface SocialImageProps {
  coverImagePath?: string
  pathLabel?: string
  title?: string
}

describe('collectSpecs', () => {
  it('includes generated images for the current static page routes', () => {
    const specs = collectSpecs()
    const outFiles = new Set(specs.map(spec => spec.outFile))

    for (const fileName of [
      'index.webp',
      'work.webp',
      'projects.webp',
      'privacy.webp',
      'accessibility.webp',
      'blog--tags.webp'
    ]) {
      expect(outFiles.has(path.join(process.cwd(), 'public', 'og', 'pages', fileName))).toBe(true)
    }
  })

  it('includes generated images for blog topic archive routes', () => {
    const specs = collectSpecs()
    const topicSpec = specs.find(spec => spec.outFile === path.join(
      process.cwd(), 'public', 'og', 'pages', 'blog--tags--typescript.webp'
    ))
    const topicProps = topicSpec?.props as SocialImageProps | undefined

    expect(topicProps?.title).toBe('typescript Posts')
    expect(topicProps?.pathLabel).toBe('/blog/tags/typescript/')
  })

  it('includes project entries stored in nested index.md files', () => {
    const specs = collectSpecs()
    const xgamesSpec = specs.find(spec => spec.outFile === path.join(process.cwd(), 'public', 'og', 'portfolio', 'xgames.webp'))
    const xgamesProps = xgamesSpec?.props as SocialImageProps | undefined

    expect(xgamesProps?.title).toBe('X Games')
    expect(xgamesProps?.pathLabel).toBe('/portfolio/xgames/')
  })

  it('resolves cover image assets for blog posts and falls back to cover src when a project ogImage is missing', () => {
    const specs = collectSpecs()
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
})
