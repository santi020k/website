class ReadingContentsElement extends HTMLElement {
  #observer: MutationObserver | undefined
  #activeLink: HTMLAnchorElement | null = null
  #automaticChapter: HTMLDetailsElement | null = null
  #manualChapters = new WeakSet<HTMLDetailsElement>()

  #rememberChoice = (event: Event) => {
    const control = event.target instanceof Element ? event.target.closest('[data-chapter-summary], a[href^="#"]') : null
    const chapter = control?.closest('[data-chapter-group]')

    // Choosing a chapter link is also a manual choice. Keep it open while the
    // native fragment jump moves focus and the scroll marker catches up.
    if (chapter instanceof HTMLDetailsElement) this.#manualChapters.add(chapter)
  }

  #showChapter = (link: HTMLAnchorElement) => {
    // Embedded navigation lives inside another disclosure. Only chapter details
    // follow the active section; the outer mobile opener stays reader-controlled.
    const parent = link.closest('[data-chapter-group]')
    const chapter = parent instanceof HTMLDetailsElement ? parent : null
    const previous = this.#automaticChapter

    if (
      previous && previous !== chapter && !this.#manualChapters.has(previous) &&
      !previous.contains(document.activeElement)
    ) {
      previous.open = false
    }

    if (chapter) chapter.open = true

    this.#automaticChapter = chapter
  }

  #openFragment = () => {
    let fragment = window.location.hash.slice(1)

    try {
      fragment = decodeURIComponent(fragment)
    } catch {
      // A literal percent sign can still identify a heading.
    }

    const link = [...this.querySelectorAll<HTMLAnchorElement>('a[href^="#"]')]
      .find(item => item.getAttribute('href') === `#${fragment}`)

    if (link) this.#showChapter(link)
  }

  #revealCurrent = () => {
    const link = this.querySelector<HTMLAnchorElement>('a[aria-current="location"]')

    // Anchor rewrites its marker on scroll. Reopen only when the section changes,
    // so a reader can close the current chapter without fighting the scroll-spy.
    if (!link || link === this.#activeLink) return

    this.#activeLink = link

    this.#showChapter(link)
  }

  connectedCallback() {
    this.#observer?.disconnect()

    this.#activeLink = null

    this.#openFragment()

    this.#revealCurrent()

    this.#observer = new MutationObserver(this.#revealCurrent)

    this.#observer.observe(this, { attributeFilter: ['aria-current'], attributes: true, subtree: true })

    this.addEventListener('click', this.#rememberChoice)

    window.addEventListener('hashchange', this.#openFragment)
  }

  disconnectedCallback() {
    this.#observer?.disconnect()

    window.removeEventListener('hashchange', this.#openFragment)

    this.removeEventListener('click', this.#rememberChoice)

    this.#activeLink = null

    this.#automaticChapter = null
  }
}

if (!customElements.get('reading-contents')) {
  customElements.define('reading-contents', ReadingContentsElement)
}
