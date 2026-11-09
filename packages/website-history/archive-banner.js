// Archive pages only: keep keyboard focus clear of each era's sticky navigation.
let focusFrame = 0
let pointerFocus = false

// Native focus scrolling can consider a link visible even when fixed chrome covers it.
const keepFocusVisible = () => {
  const target = document.activeElement
  const banner = document.querySelector('.website-archive-banner')

  if (pointerFocus || !(target instanceof HTMLElement) || !banner ||
    !target.matches(':focus-visible') || getComputedStyle(target).position === 'fixed' ||
    !target.matches('a[href], button, input, select, textarea, [tabindex="0"]') ||
    target.closest('.website-archive-banner, header, dialog, [role="dialog"], #drawer, #back-to-top')) return

  const header = document.querySelector('header')
  const top = Math.max(0, header?.getBoundingClientRect().bottom ?? 0) + 8
  const bottom = innerHeight - 8
  const bounds = target.getBoundingClientRect()

  if (bottom > top && (bounds.top < top || bounds.bottom > bottom)) {
    const space = Math.max(0, (bottom - top - bounds.height) / 2)

    window.scrollBy({ top: bounds.top - top - space, behavior: 'instant' })
  }
}

document.addEventListener('pointerdown', () => {
  pointerFocus = true
})

document.addEventListener('keydown', () => {
  pointerFocus = false
})

document.addEventListener('focusin', () => {
  cancelAnimationFrame(focusFrame)

  // WebKit may lay out content-visibility regions after its native focus scroll.
  focusFrame = requestAnimationFrame(() => {
    focusFrame = requestAnimationFrame(keepFocusVisible)
  })
})

document.addEventListener('astro:before-swap', () => {
  cancelAnimationFrame(focusFrame)
})
