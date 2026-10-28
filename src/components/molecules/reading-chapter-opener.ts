class ReadingChapterOpenerElement extends HTMLElement {
  #mutations: MutationObserver | undefined
  #sizes: ResizeObserver | undefined
  #frame = 0
  #holder: HTMLElement | null = null
  #story: HTMLElement | null = null
  #details: HTMLDetailsElement | null = null
  #summary: HTMLElement | null = null

  #updateCurrent = () => {
    const chapters = [...this.querySelectorAll<HTMLElement>('[data-reading-chapter]')]
    const active = this.querySelector('a[aria-current="location"]')?.closest<HTMLElement>('[data-reading-chapter]') ?? chapters[0]
    const current = this.querySelector<HTMLElement>('[data-toc-current]')
    const count = this.querySelector('[data-toc-count]')

    if (!active || !current || !count) return

    const label = active.dataset.readingChapter ?? ''
    const position = (this.dataset.positionTemplate ?? '').replace('{current}', String(chapters.indexOf(active) + 1))

    if (current.textContent !== label) current.textContent = label

    if (count.textContent !== position) count.textContent = position

    current.hidden = false
  }

  #updateLayout = () => {
    this.#frame = 0

    if (!this.#holder || !this.#summary || !this.#story) return

    const top = Number.parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop) || 0
    const summaryHeight = this.#summary.getBoundingClientRect().height
    const viewportHeight = window.visualViewport?.height ?? innerHeight
    const gap = Number.parseFloat(getComputedStyle(document.documentElement).fontSize)
    const available = viewportHeight - top - summaryHeight - gap
    // Keep a reading window below the control; short viewports retain the normal opener.
    const sticky = this.getClientRects().length > 0 && available >= 160

    const ended = sticky && this.#story.getBoundingClientRect().bottom <= top + summaryHeight + gap &&
      !this.contains(document.activeElement)

    this.#holder.toggleAttribute('data-companion-sticky', sticky)

    this.#holder.toggleAttribute('data-companion-ended', ended)

    this.inert = ended

    this.#holder.style.setProperty('--chapter-companion-top', `${top}px`)

    this.style.setProperty('--chapter-menu-height', `${Math.max(160, available)}px`)

    this.#story.style.setProperty('--chapter-companion-clearance', sticky ? `${summaryHeight + gap}px` : '0px')
  }

  #scheduleLayout = () => {
    if (!this.#frame) this.#frame = requestAnimationFrame(this.#updateLayout)
  }

  #close = () => {
    if (this.#details) this.#details.open = false
  }

  #followLink = (event: MouseEvent) => {
    if (
      event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey
    ) return

    const link = event.target instanceof Element ? event.target.closest<HTMLAnchorElement>('a[href^="#"]') : null

    if (!link || !this.contains(link)) return

    let fragment = link.hash.slice(1)

    try {
      fragment = decodeURIComponent(fragment)
    } catch {
      // A literal percent sign may be part of an authored heading ID.
    }

    const target = document.getElementById(fragment)

    if (!target) return

    this.#close()

    if (!target.hasAttribute('tabindex')) target.tabIndex = -1

    target.focus({ preventScroll: true })
    // The native link still owns the URL, history entry, and fragment scroll.
  }

  #dismiss = (event: KeyboardEvent) => {
    if (event.key !== 'Escape' || !this.#details?.open) return

    event.preventDefault()

    this.#close()

    this.#summary?.focus({ preventScroll: true })
  }

  #outside = (event: PointerEvent) => {
    if (event.target instanceof Node && !this.contains(event.target)) this.#close()
  }

  connectedCallback() {
    if (!this.hasAttribute('data-companion')) return

    this.#holder = this.closest<HTMLElement>('[data-post-mobile-toc]')

    this.#story = this.closest<HTMLElement>('[data-post-story]')

    this.#details = this.querySelector<HTMLDetailsElement>('[data-toc-opener]')

    this.#summary = this.querySelector<HTMLElement>('[data-toc-summary]')

    this.setAttribute('data-companion-ready', '')

    this.#updateCurrent()

    this.#updateLayout()

    this.#mutations = new MutationObserver(this.#updateCurrent)

    this.#mutations.observe(this, { attributes: true, attributeFilter: ['aria-current'], subtree: true })

    this.#sizes = new ResizeObserver(this.#scheduleLayout)

    this.#sizes.observe(this)

    this.addEventListener('click', this.#followLink)

    this.addEventListener('keydown', this.#dismiss)

    this.addEventListener('focusout', this.#scheduleLayout)

    document.addEventListener('pointerdown', this.#outside)

    window.addEventListener('resize', this.#scheduleLayout)

    window.addEventListener('scroll', this.#scheduleLayout, { passive: true })

    window.visualViewport?.addEventListener('resize', this.#scheduleLayout)
  }

  disconnectedCallback() {
    this.#mutations?.disconnect()

    this.#sizes?.disconnect()

    cancelAnimationFrame(this.#frame)

    this.#frame = 0

    this.removeEventListener('click', this.#followLink)

    this.removeEventListener('keydown', this.#dismiss)

    this.removeEventListener('focusout', this.#scheduleLayout)

    document.removeEventListener('pointerdown', this.#outside)

    window.removeEventListener('resize', this.#scheduleLayout)

    window.removeEventListener('scroll', this.#scheduleLayout)

    window.visualViewport?.removeEventListener('resize', this.#scheduleLayout)
  }
}

if (!customElements.get('reading-chapter-opener')) {
  customElements.define('reading-chapter-opener', ReadingChapterOpenerElement)
}
