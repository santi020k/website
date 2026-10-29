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

    if (!opener || !fallback || !dialog || !video || !error) return

    this.#video = video

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
      error.hidden = true

      const portrait = window.matchMedia('(max-width: 639px)').matches
      const source = portrait ? video.dataset.portraitSrc : video.dataset.src
      const poster = portrait ? video.dataset.portraitPoster : video.dataset.poster
      const fileLink = this.querySelector<HTMLAnchorElement>('[data-film-file]')

      video.dataset.format = portrait ? 'portrait' : 'landscape'

      if (poster) video.poster = poster

      if (source && video.getAttribute('src') !== source) video.src = source

      if (source && fileLink) fileLink.href = source

      if (video.ended) video.currentTime = 0

      // A direct user request starts playback; native controls remain available if blocked.
      void video.play().catch(() => {
        if (video.error) error.hidden = false
      })
    }, { capture: true, signal })

    video.addEventListener('error', () => {
      error.hidden = false
    }, { signal })

    dialog.addEventListener('close', () => {
      video.pause()
    }, { signal })

    document.addEventListener('astro:before-swap', () => {
      video.pause()
    }, { signal })
  }

  disconnectedCallback() {
    this.#video?.pause()

    this.#events?.abort()

    this.#binding?.disconnect()
  }
}

if (!customElements.get('home-product-film')) customElements.define('home-product-film', HomeProductFilm)
