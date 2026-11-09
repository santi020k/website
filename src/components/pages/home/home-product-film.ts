class HomeProductFilm extends HTMLElement {
  #events: AbortController | undefined
  #binding: MutationObserver | undefined
  #video: HTMLVideoElement | null = null

  connectedCallback() {
    this.#events?.abort()

    this.#binding?.disconnect()

    this.#events = new AbortController()

    const { signal } = this.#events
    const opener = this.querySelector<HTMLButtonElement>('[data-film-open]')
    const fallback = this.querySelector<HTMLElement>('[data-film-fallback]')
    const dialog = this.querySelector<HTMLDialogElement>('[data-film-dialog]')
    const video = this.querySelector<HTMLVideoElement>('[data-film-video]')
    const error = this.querySelector<HTMLElement>('[data-film-error]')
    const retry = this.querySelector<HTMLButtonElement>('[data-film-retry]')
    const tracks = this.querySelector<HTMLTemplateElement>('[data-film-tracks]')

    if (!opener || !fallback || !dialog || !video || !error || !retry || !tracks) return

    this.#video = video

    let playbackRequest = 0

    const showError = () => {
      error.textContent = this.dataset.errorLabel ?? ''

      retry.hidden = false
    }

    const load = (source: string) => {
      error.textContent = this.dataset.loadingLabel ?? ''

      retry.hidden = true

      video.replaceChildren(document.importNode(tracks.content, true))

      video.src = source

      video.load()
    }

    const play = () => {
      const request = ++playbackRequest

      // A direct user request starts playback; native controls remain available if blocked.
      void video.play().catch(() => {
        if (!signal.aborted && this.isConnected && request === playbackRequest && video.error) showError()
      })
    }

    const pause = () => {
      playbackRequest += 1

      video.pause()
    }

    const enable = () => {
      if (opener.dataset.uiBound !== 'true') return

      opener.hidden = false

      fallback.hidden = true

      this.#binding?.disconnect()
    }

    this.#binding = new MutationObserver(enable)

    this.#binding.observe(opener, { attributes: true, attributeFilter: ['data-ui-bound'] })

    enable()

    opener.addEventListener('click', () => {
      const portrait = window.matchMedia('(max-width: 639px)').matches
      const source = portrait ? video.dataset.portraitSrc : video.dataset.src
      const poster = portrait ? video.dataset.portraitPoster : video.dataset.poster
      const fileLink = this.querySelector<HTMLAnchorElement>('[data-film-file]')

      if (!source) return

      video.dataset.format = portrait ? 'portrait' : 'landscape'

      if (poster) video.poster = poster

      if (video.getAttribute('src') !== source || video.error) load(source)

      if (fileLink) fileLink.href = source

      if (video.ended) video.currentTime = 0

      play()
    }, { capture: true, signal })

    retry.addEventListener('click', () => {
      const source = video.getAttribute('src')

      if (!source) return

      load(source)

      video.focus({ preventScroll: true })

      play()
    }, { signal })

    video.addEventListener('loadedmetadata', () => {
      error.textContent = ''

      retry.hidden = true
    }, { signal })

    video.addEventListener('error', showError, { signal })

    dialog.addEventListener('close', pause, { signal })

    document.addEventListener('astro:before-swap', pause, { signal })

    window.addEventListener('pagehide', pause, { signal })
  }

  disconnectedCallback() {
    this.#video?.pause()

    this.#events?.abort()

    this.#binding?.disconnect()
  }
}

if (!customElements.get('home-product-film')) customElements.define('home-product-film', HomeProductFilm)
