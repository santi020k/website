import '../../components/pages/home/home-product-film'

import { afterEach, beforeEach, describe, expect, type MockInstance, test, vi } from 'vitest'

const mountFilm = () => {
  const root = document.createElement('home-product-film')

  root.dataset.loadingLabel = 'Loading video…'
  root.dataset.errorLabel = 'The film could not load.'
  root.innerHTML = `
    <button data-film-open data-ui-bound="true" hidden>Watch</button>
    <a data-film-fallback href="/film.mp4">Watch file</a>
    <template data-film-tracks>
      <track kind="captions" src="/en.vtt" srclang="en" label="English">
      <track kind="captions" src="/es.vtt" srclang="es" label="Español" default>
    </template>
    <dialog data-film-dialog>
      <video data-film-video data-src="/film.mp4" data-portrait-src="/portrait.mp4" tabindex="0"></video>
      <p data-film-error role="status"></p>
      <button data-film-retry hidden>Retry</button>
      <a data-film-file href="/film.mp4">Open file</a>
    </dialog>
  `

  document.body.append(root)

  const opener = root.querySelector<HTMLButtonElement>('[data-film-open]')
  const video = root.querySelector('video')
  const dialog = root.querySelector('dialog')
  const status = root.querySelector('[data-film-error]')
  const retry = root.querySelector<HTMLButtonElement>('[data-film-retry]')

  if (!opener || !video || !dialog || !status || !retry) throw new Error('Incomplete film fixture')

  return { root, opener, video, dialog, status, retry }
}

describe('product film lifecycle', () => {
  let load: MockInstance<HTMLMediaElement['load']>
  let play: MockInstance<HTMLMediaElement['play']>
  let pause: MockInstance<HTMLMediaElement['pause']>

  beforeEach(() => {
    vi.stubGlobal('matchMedia', vi.fn(() => ({ matches: false })))
    load = vi.spyOn(HTMLMediaElement.prototype, 'load').mockImplementation(() => undefined)
    play = vi.spyOn(HTMLMediaElement.prototype, 'play').mockResolvedValue(undefined)
    pause = vi.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(() => undefined)
  })

  afterEach(() => {
    document.body.replaceChildren()
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })

  test('defers video and caption sources until the reader requests playback', () => {
    const { opener, video, status, retry } = mountFilm()

    expect(video.hasAttribute('src')).toBe(false)
    expect(video.querySelectorAll('track')).toHaveLength(0)
    expect(load).not.toHaveBeenCalled()
    expect(opener.hidden).toBe(false)

    opener.click()

    expect(video.getAttribute('src')).toBe('/film.mp4')
    expect(video.querySelectorAll('track')).toHaveLength(2)
    expect(video.querySelector('track[srclang="es"]')?.hasAttribute('default')).toBe(true)
    expect(status.textContent).toBe('Loading video…')
    expect(retry.hidden).toBe(true)

    video.dispatchEvent(new Event('loadedmetadata'))

    expect(status.textContent).toBe('')
  })

  test('retry reloads the same source once, replaces captions and focuses native controls', () => {
    const { opener, video, dialog, status, retry } = mountFilm()

    dialog.open = true
    opener.click()
    video.dispatchEvent(new Event('error'))

    expect(status.textContent).toBe('The film could not load.')
    expect(retry.hidden).toBe(false)

    retry.click()

    expect(load).toHaveBeenCalledTimes(2)
    expect(video.getAttribute('src')).toBe('/film.mp4')
    expect(video.querySelectorAll('track')).toHaveLength(2)
    expect(document.activeElement).toBe(video)
    expect(status.textContent).toBe('Loading video…')
    expect(retry.hidden).toBe(true)
  })

  test('reopening retries a failed source but preserves healthy playback position', () => {
    const { opener, video } = mountFilm()

    opener.click()
    video.currentTime = 12
    opener.click()

    expect(load).toHaveBeenCalledTimes(1)
    expect(video.currentTime).toBe(12)

    Object.defineProperty(video, 'error', { configurable: true, value: { code: 2, message: 'Network failure' } })
    opener.click()

    expect(load).toHaveBeenCalledTimes(2)
    expect(video.getAttribute('src')).toBe('/film.mp4')
  })

  test('pauses on page exit and removes lifecycle listeners when disconnected', () => {
    const { root, dialog } = mountFilm()

    window.dispatchEvent(new Event('pagehide'))
    document.dispatchEvent(new Event('astro:before-swap'))
    dialog.dispatchEvent(new Event('close'))

    expect(pause).toHaveBeenCalledTimes(3)

    root.remove()

    expect(pause).toHaveBeenCalledTimes(4)

    window.dispatchEvent(new Event('pagehide'))
    document.dispatchEvent(new Event('astro:before-swap'))
    dialog.dispatchEvent(new Event('close'))

    expect(pause).toHaveBeenCalledTimes(4)
  })

  test('ignores a playback rejection that settles after the reader leaves', async () => {
    let rejectPlayback: ((reason: Error) => void) | undefined

    play.mockImplementation(() => new Promise<void>((_resolve, reject) => {
      rejectPlayback = reject
    }))

    const { opener, video, retry } = mountFilm()

    opener.click()
    window.dispatchEvent(new Event('pagehide'))
    Object.defineProperty(video, 'error', { configurable: true, value: { code: 2, message: 'Network failure' } })
    rejectPlayback?.(new Error('Playback ended'))
    await Promise.resolve()

    expect(retry.hidden).toBe(true)
  })
})
