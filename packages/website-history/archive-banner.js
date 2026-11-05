// Archive pages only: pins the archive notice once its real height is known.
// Without this module the notice stays in normal document flow.
const root = document.documentElement
const readyAttribute = 'data-website-archive-ready'
const heightProperty = '--website-archive-banner-height'
/** @type {ResizeObserver | undefined} */
let observer
let focusFrame = 0
let pointerFocus = false
/** @param {number} height */
const reserve = height => root.style.setProperty(heightProperty, `${Math.ceil(height)}px`)

const teardown = () => {
  observer?.disconnect()

  cancelAnimationFrame(focusFrame)

  observer = undefined
}

const setup = () => {
  teardown()

  const banner = document.querySelector('.website-archive-banner')

  if (!banner) {
    root.removeAttribute(readyAttribute)

    root.style.removeProperty(heightProperty)

    return
  }

  // Switch to the fixed layout and measure it in the same task, before any paint.
  root.setAttribute(readyAttribute, '')

  reserve(banner.getBoundingClientRect().height)

  if (!('ResizeObserver' in window)) return

  observer = new ResizeObserver(() => {
    reserve(banner.getBoundingClientRect().height)
  })

  observer.observe(banner)
}

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
  const bottom = banner.getBoundingClientRect().top - 8
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

setup()

// Astro's client router replaces <body> and the root attributes; measure the new notice.
document.addEventListener('astro:before-swap', teardown)

document.addEventListener('astro:after-swap', setup)
