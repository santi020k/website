class ProjectPreviewViewerElement extends HTMLElement {
  #events: AbortController | undefined
  #binding: MutationObserver | undefined
  #image: HTMLImageElement | null = null

  #setZoom = (zoomed: boolean) => {
    const canvas = this.querySelector<HTMLElement>('[data-gallery-canvas]')
    const button = this.querySelector<HTMLButtonElement>('[data-gallery-zoom]')
    const label = this.querySelector('[data-gallery-zoom-label]')
    const status = this.querySelector('[data-gallery-status]')

    if (!canvas || !button || !label || !status) return

    canvas.dataset.zoomed = String(zoomed)

    button.setAttribute('aria-pressed', String(zoomed))

    label.textContent = zoomed ? 'Fit image' : 'Inspect detail'

    status.textContent = zoomed ? 'Full detail · scroll or use arrow keys' : 'Complete image'

    canvas.scrollTo({ left: 0, top: 0, behavior: 'instant' })
  }

  #imageState = (failed: boolean) => {
    const button = this.querySelector<HTMLButtonElement>('[data-gallery-zoom]')
    const recovery = this.querySelector<HTMLElement>('[data-gallery-error-link]')
    const status = this.querySelector('[data-gallery-status]')

    if (!button || !recovery || !status) return

    button.disabled = failed

    button.hidden = failed

    recovery.hidden = !failed

    status.textContent = failed ? 'The preview could not load. Open the original image to try again.' : 'Complete image'
  }

  #prepareImage = () => {
    const template = this.querySelector<HTMLTemplateElement>('[data-gallery-template]')
    const canvas = this.querySelector('[data-gallery-canvas]')
    const status = this.querySelector('[data-gallery-status]')
    const button = this.querySelector<HTMLButtonElement>('[data-gallery-zoom]')

    if (!template || !canvas || !status || !button) return

    this.#setZoom(false)

    this.#imageState(false)

    button.disabled = true

    status.textContent = 'Loading image…'

    canvas.replaceChildren(template.content.cloneNode(true))

    this.#image = canvas.querySelector('img')

    if (this.#image?.complete) this.#imageState(this.#image.naturalWidth === 0)
  }

  connectedCallback() {
    this.#events?.abort()

    this.#binding?.disconnect()

    const opener = this.querySelector<HTMLButtonElement>('[data-gallery-open]')
    const fallback = this.querySelector<HTMLElement>('[data-gallery-fallback]')
    const dialog = this.querySelector('dialog')
    const zoom = this.querySelector<HTMLButtonElement>('[data-gallery-zoom]')

    if (!opener || !fallback || !dialog || !zoom) return

    this.#events = new AbortController()

    const { signal } = this.#events

    const enable = () => {
      if (opener.dataset.uiBound !== 'true') return

      opener.hidden = false

      fallback.hidden = true

      this.#binding?.disconnect()
    }

    this.#binding = new MutationObserver(enable)

    this.#binding.observe(opener, { attributes: true, attributeFilter: ['data-ui-bound'] })

    enable()

    // Prepare before Lumen's trigger opens the native dialog and moves focus.
    opener.addEventListener('click', this.#prepareImage, { capture: true, signal })

    zoom.addEventListener('click', () => {
      this.#setZoom(zoom.getAttribute('aria-pressed') !== 'true')
    }, { signal })

    this.addEventListener('load', event => {
      if (event.target === this.#image) this.#imageState(false)
    }, { capture: true, signal })

    this.addEventListener('error', event => {
      if (event.target === this.#image) this.#imageState(true)
    }, { capture: true, signal })

    dialog.addEventListener('keydown', event => {
      // This modal owns its shortcuts; do not open site search over the viewer.
      if (event.key === '/' || ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k')) {
        event.preventDefault()

        event.stopPropagation()
      }

      if (event.altKey || event.metaKey || event.ctrlKey || zoom.getAttribute('aria-pressed') !== 'true') return

      const directions: Record<string, [number, number]> = {
        ArrowLeft: [-100, 0],
        ArrowRight: [100, 0],
        ArrowUp: [0, -100],
        ArrowDown: [0, 100]
      }

      const direction = directions[event.key]

      if (!direction) return

      event.preventDefault()

      this.querySelector('[data-gallery-canvas]')?.scrollBy({ left: direction[0], top: direction[1], behavior: 'instant' })
    }, { signal })

    dialog.addEventListener('close', () => {
      this.#setZoom(false)
    }, { signal })
  }

  disconnectedCallback() {
    this.#events?.abort()

    this.#binding?.disconnect()

    this.querySelector('dialog')?.close()

    this.#image = null
  }
}

if (!customElements.get('project-preview-viewer')) {
  customElements.define('project-preview-viewer', ProjectPreviewViewerElement)
}
