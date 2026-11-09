import { getLocale, sharedTranslator } from '@/i18n'

const t = sharedTranslator(() => getLocale(window.location.pathname))

class GalleryViewerElement extends HTMLElement {
  #events: AbortController | undefined
  #binding: MutationObserver | undefined
  #image: HTMLImageElement | null = null

  #resetViewport = () => {
    const viewport = this.querySelector<HTMLElement>('[data-gallery-viewport]')

    if (!viewport) return

    // The public viewport controller observes these values and owns the transform,
    // action availability, pointer capture, keyboard panning, and zoom announcements.
    viewport.dataset.zoom = '1'

    viewport.dataset.panX = '0'

    viewport.dataset.panY = '0'
  }

  #imageState = (state: 'loading' | 'failed' | 'ready') => {
    const viewport = this.querySelector<HTMLElement>('[data-gallery-viewport]')
    const retry = this.querySelector<HTMLButtonElement>('[data-gallery-retry]')
    const help = this.querySelector<HTMLElement>('[data-gallery-help]')
    const status = this.querySelector('[data-gallery-status]')

    if (!viewport || !retry || !help || !status) return

    const ready = state === 'ready'
    const stage = viewport.querySelector<HTMLElement>('[data-ui-media-viewport-stage]')

    if (ready && stage && this.#image?.naturalWidth && this.#image.naturalHeight) {
      // Keep each image's fitted proportions; CSS caps tall captures to the dialog.
      stage.style.aspectRatio = `${this.#image.naturalWidth} / ${this.#image.naturalHeight}`
    }

    viewport.dataset.disabled = String(!ready)

    viewport.hidden = !ready

    help.hidden = !ready

    retry.hidden = state !== 'failed'

    const messages = {
      failed: t('shared.imagePreviewFailed'),
      loading: t('shared.loadingImage'),
      ready: t('shared.completeImage')
    }

    status.textContent = messages[state]
  }

  #prepareImage = () => {
    const assetSource = this.dataset.galleryImageSrc
    const mount = this.querySelector('[data-gallery-image-mount]')
    // Firefox can speculatively fetch an image's src even inside an inert template.
    const image = assetSource ? new Image() : this.closest('figure')?.querySelector(':scope > img')?.cloneNode(true)

    if (!mount || !(image instanceof HTMLImageElement)) return

    image.loading = 'eager'

    image.draggable = false

    image.removeAttribute('id')

    if (assetSource) {
      image.alt = this.dataset.galleryImageAlt ?? ''

      image.decoding = 'async'
    } else {
      // Preserve Astro's optimized sources while requesting the intrinsic detail size.
      image.sizes = `${image.width}px`
    }

    this.#resetViewport()

    this.#imageState('loading')

    this.#image = image

    mount.replaceChildren(image)

    if (assetSource) image.src = assetSource

    const original = this.querySelector<HTMLAnchorElement>('[data-gallery-error-link]')

    if (!assetSource && original) original.href = image.src

    if (image.complete) this.#imageState(image.naturalWidth === 0 ? 'failed' : 'ready')
  }

  connectedCallback() {
    this.#events?.abort()

    this.#binding?.disconnect()

    const opener = this.querySelector<HTMLButtonElement>('[data-gallery-open]')
    const fallback = this.querySelector<HTMLElement>('[data-gallery-fallback]')
    const dialog = this.querySelector('dialog')
    const retry = this.querySelector<HTMLButtonElement>('[data-gallery-retry]')

    if (!opener || !dialog || !retry) return

    this.#events = new AbortController()

    const { signal } = this.#events

    const enable = () => {
      if (opener.dataset.uiBound !== 'true') return

      opener.hidden = false

      if (fallback) fallback.hidden = true

      this.#binding?.disconnect()
    }

    this.#binding = new MutationObserver(enable)

    this.#binding.observe(opener, { attributes: true, attributeFilter: ['data-ui-bound'] })

    enable()

    // Prepare before Lumen's trigger opens the native dialog and moves focus.
    opener.addEventListener('click', this.#prepareImage, { capture: true, signal })

    retry.addEventListener('click', () => {
      // Retry disappears while loading; keep focus on a stable modal control.
      dialog.querySelector<HTMLButtonElement>('[data-ui-dialog-close]')?.focus()

      this.#prepareImage()
    }, { signal })

    this.addEventListener('load', event => {
      if (event.target === this.#image) this.#imageState('ready')
    }, { capture: true, signal })

    this.addEventListener('error', event => {
      if (event.target === this.#image) this.#imageState('failed')
    }, { capture: true, signal })

    dialog.addEventListener('keydown', event => {
      // This modal owns its shortcuts; do not open site search over the viewer.
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()

        event.stopPropagation()
      }
    }, { signal })

    dialog.addEventListener('close', this.#resetViewport, { signal })
  }

  disconnectedCallback() {
    this.#events?.abort()

    this.#binding?.disconnect()

    this.querySelector('dialog')?.close()

    this.#image = null
  }
}

if (!customElements.get('gallery-viewer')) {
  customElements.define('gallery-viewer', GalleryViewerElement)
}
