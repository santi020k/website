class ArticleCodeScrollCue extends HTMLElement {
  private cleanup: (() => void) | undefined

  connectedCallback(): void {
    this.cleanup?.()

    const pre = this.parentElement?.querySelector('pre')
    const code = pre?.querySelector('code')

    if (!pre || !code) return

    const description = pre.getAttribute('aria-describedby')?.split(/\s+/u)
      .filter(id => id && id !== this.id) ?? []

    const update = () => {
      if (!this.isConnected) return

      this.hidden = pre.clientWidth === 0 || pre.scrollWidth <= pre.clientWidth + 1

      const ids = this.hidden ? description : [...description, this.id]

      if (ids.length) pre.setAttribute('aria-describedby', ids.join(' '))
      else pre.removeAttribute('aria-describedby')
    }

    const observer = new ResizeObserver(update)

    observer.observe(pre)

    observer.observe(code)

    this.cleanup = () => {
      observer.disconnect()
    }

    void document.fonts.ready.then(update)

    update()
  }

  disconnectedCallback(): void {
    this.cleanup?.()

    this.cleanup = undefined
  }
}

if (!customElements.get('article-code-scroll-cue')) {
  customElements.define('article-code-scroll-cue', ArticleCodeScrollCue)
}
