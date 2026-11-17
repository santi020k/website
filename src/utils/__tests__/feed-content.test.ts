import type { loadRenderers } from 'astro:container'
import type { CollectionEntry, RenderResult } from 'astro:content'

import type { getContainerRenderer } from '@astrojs/mdx/container-renderer'
import type { experimental_AstroContainer as AstroContainer } from 'astro/container'
import { beforeEach, describe, expect, test, vi } from 'vitest'

const {
  renderMock, loadRenderersMock, getContainerRendererMock, createMock, renderToStringMock, getPostTranslationMock
} = vi.hoisted(() => {
  const renderToStringMock = vi.fn<AstroContainer['renderToString']>()

  return {
    renderMock: vi.fn<(entry: CollectionEntry<'post' | 'postTranslation'>) => Promise<Pick<RenderResult, 'Content'>>>(),
    loadRenderersMock: vi.fn<typeof loadRenderers>(),
    getContainerRendererMock: vi.fn<typeof getContainerRenderer>(),
    createMock: vi.fn<(options?: Parameters<typeof AstroContainer.create>[0]) => Promise<Pick<AstroContainer, 'renderToString'>>>(),
    renderToStringMock,
    getPostTranslationMock: vi.fn<(id: string) => Promise<CollectionEntry<'postTranslation'> | undefined>>()
  }
})

vi.mock('astro:container', () => ({ loadRenderers: loadRenderersMock }))
vi.mock('astro:content', () => ({ render: renderMock }))
vi.mock('@astrojs/mdx/container-renderer', () => ({ getContainerRenderer: getContainerRendererMock }))
vi.mock('astro/container', () => ({ experimental_AstroContainer: { create: createMock } }))
vi.mock('../content-translations', () => ({ getPostTranslation: getPostTranslationMock }))

const post: CollectionEntry<'post'> = {
  collection: 'post',
  id: '2026/example',
  body: 'English body',
  data: {
    contentLocale: 'en',
    title: 'Example',
    description: 'Original description',
    draft: false,
    publishDate: new Date('2026-01-01T00:00:00Z'),
    updatedDate: undefined,
    tags: ['typescript'],
    postType: 'Article'
  }
}

const translation: CollectionEntry<'postTranslation'> = {
  collection: 'postTranslation',
  id: post.id,
  body: 'Cuerpo en español',
  data: { title: 'Ejemplo', description: 'Descripción traducida', sourceHash: '0123456789ab' }
}

const Content: RenderResult['Content'] = () => new Response('Article component')
const articleUrl = new URL('https://santi020k.com/posts/2026/example/')
const spanishArticleUrl = new URL('https://santi020k.com/es/posts/2026/example/')

describe('renderFeedContent', () => {
  beforeEach(() => {
    vi.resetModules()
    vi.resetAllMocks()
    renderMock.mockResolvedValue({ Content })
    loadRenderersMock.mockResolvedValue([])
    getContainerRendererMock.mockReturnValue({ name: 'astro:jsx', serverEntrypoint: '@astrojs/mdx/server.js' })
    createMock.mockResolvedValue({ renderToString: renderToStringMock })
    renderToStringMock.mockResolvedValue('<p>English body</p>')
    getPostTranslationMock.mockResolvedValue(undefined)
  })

  test('renders English content as sanitized HTML with absolute article and asset URLs', async () => {
    const { renderFeedContent } = await import('../feed-content')

    renderToStringMock.mockResolvedValue('<p class="prose">English <a href="./reference/">reference</a></p><img src="/cover.webp" alt="Cover"><button>Copy</button>')

    await expect(renderFeedContent(post, 'en', articleUrl)).resolves.toBe('<p>English <a href="https://santi020k.com/posts/2026/example/reference/">reference</a></p><img src="https://santi020k.com/cover.webp" alt="Cover">')
    expect(renderMock).toHaveBeenCalledWith(post)
    expect(renderToStringMock).toHaveBeenCalledWith(Content)
    expect(getPostTranslationMock).not.toHaveBeenCalled()
    expect(loadRenderersMock).toHaveBeenCalledWith([{ name: 'astro:jsx', serverEntrypoint: '@astrojs/mdx/server.js' }])
    expect(createMock).toHaveBeenCalledWith({ renderers: [] })
  })

  test('shares an in-flight render and its completed HTML between RSS and JSON consumers', async () => {
    const { renderFeedContent } = await import('../feed-content')
    let finishRender: (html: string) => void = () => {
      throw new Error('Render did not start')
    }

    renderToStringMock.mockReturnValue(new Promise(resolve => {
      finishRender = resolve
    }))

    const rssContent = renderFeedContent(post, 'en', articleUrl)
    const jsonContent = renderFeedContent(post, 'en', articleUrl)

    expect(jsonContent).toBe(rssContent)
    finishRender('<p>Shared article</p>')
    await expect(rssContent).resolves.toBe('<p>Shared article</p>')
    expect(renderFeedContent(post, 'en', articleUrl)).toBe(rssContent)
    expect(renderMock).toHaveBeenCalledTimes(1)
    expect(renderToStringMock).toHaveBeenCalledTimes(1)
  })

  test('renders separate posts independently while sharing one container initialization', async () => {
    const { renderFeedContent } = await import('../feed-content')
    const otherPost = { ...post, id: '2026/another' }

    await Promise.all([
      renderFeedContent(post, 'en', articleUrl),
      renderFeedContent(otherPost, 'en', new URL('https://santi020k.com/posts/2026/another/'))
    ])

    expect(renderMock).toHaveBeenCalledTimes(2)
    expect(renderMock).toHaveBeenCalledWith(otherPost)
    expect(renderToStringMock).toHaveBeenCalledTimes(2)
    expect(getContainerRendererMock).toHaveBeenCalledTimes(1)
    expect(loadRenderersMock).toHaveBeenCalledTimes(1)
    expect(createMock).toHaveBeenCalledTimes(1)
  })

  test('renders and caches Spanish translations separately from the English article', async () => {
    const { renderFeedContent } = await import('../feed-content')

    getPostTranslationMock.mockResolvedValue(translation)
    renderToStringMock.mockResolvedValueOnce('<p>English body</p>').mockResolvedValueOnce('<p>Cuerpo en español</p>')

    await expect(renderFeedContent(post, 'en', articleUrl)).resolves.toBe('<p>English body</p>')

    const spanishContent = renderFeedContent(post, 'es', spanishArticleUrl)

    await expect(spanishContent).resolves.toBe('<p>Cuerpo en español</p>')
    expect(renderFeedContent(post, 'es', spanishArticleUrl)).toBe(spanishContent)
    expect(getPostTranslationMock).toHaveBeenCalledExactlyOnceWith(post.id)
    expect(renderMock).toHaveBeenNthCalledWith(2, translation)
    expect(renderToStringMock).toHaveBeenCalledTimes(2)
    expect(createMock).toHaveBeenCalledTimes(1)
  })

  test('falls back to the original body when a Spanish translation is unavailable', async () => {
    const { renderFeedContent } = await import('../feed-content')

    renderToStringMock.mockResolvedValue('<p>English <a href="./reference/">reference</a></p>')

    await expect(renderFeedContent(post, 'es', spanishArticleUrl)).resolves.toBe('<p>English <a href="https://santi020k.com/es/posts/2026/example/reference/">reference</a></p>')
    expect(getPostTranslationMock).toHaveBeenCalledWith(post.id)
    expect(renderMock).toHaveBeenCalledWith(post)
  })

  test('propagates article rendering failures to feed consumers', async () => {
    const { renderFeedContent } = await import('../feed-content')
    const failure = new Error('Unable to render article')

    renderMock.mockRejectedValue(failure)

    await expect(renderFeedContent(post, 'en', articleUrl)).rejects.toBe(failure)
    expect(createMock).not.toHaveBeenCalled()
  })
})
