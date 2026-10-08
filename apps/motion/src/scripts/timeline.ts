import type { gsap as Gsap } from 'gsap'

declare const gsap: typeof Gsap

declare global {
  interface Window {
    __timelines?: Record<string, ReturnType<typeof Gsap.timeline>>
  }
}

const root = document.querySelector<HTMLElement>('[data-composition-id]')

if (root?.dataset.compositionId) {
  // Keep still and export seeks on the same 2D rasterization path.
  gsap.config({ force3D: false })

  const duration = Number(root.dataset.duration)
  const timeline = gsap.timeline({ paused: true })
  const scenes = root.querySelectorAll<HTMLElement>('.scene')

  gsap.set(scenes, { autoAlpha: 0 })

  scenes.forEach((scene, index) => {
    const start = Number(scene.dataset.sceneStart)
    const previous = scenes[index - 1]

    timeline.to(scene, { autoAlpha: 1, duration: index === 0 ? 0 : 0.35 }, start)

    if (previous) timeline.to(previous, { autoAlpha: 0, duration: 0.35 }, start)

    timeline.fromTo(scene.querySelectorAll('h1, h2, .film-eyebrow, .chapter-change, .opening-note, .ending-description, .ending a'), { opacity: 0, y: 22 }, { opacity: 1, y: 0, duration: 0.6, stagger: 0.08, ease: 'power3.out' }, start + 0.15)

    const desktop = scene.querySelector('.desktop-capture')
    const mobile = scene.querySelector('.mobile-capture')

    if (desktop) {
      timeline.fromTo(desktop, { opacity: 0, y: 36, rotation: -2 }, { opacity: 1, y: 0, rotation: 0, duration: 0.75, ease: 'power3.out' }, start + 0.2)

      timeline.fromTo(desktop.querySelector('img'), { scale: 1 }, { scale: 1.025, duration: 4.5, ease: 'none' }, start + 0.3)
    }

    if (mobile) timeline.fromTo(mobile, { opacity: 0, y: 50 }, { opacity: 1, y: 0, duration: 0.75, ease: 'power3.out' }, start + 0.6)
  })

  timeline.to({}, { duration }, 0)

  window.__timelines ??= {}

  window.__timelines[root.dataset.compositionId] = timeline

  const publishState = () => {
    if (window.parent !== window) window.parent.postMessage({ type: 'website-motion-state', time: timeline.time(), playing: !timeline.paused() && timeline.time() < duration }, window.location.origin)
  }

  timeline.eventCallback('onUpdate', publishState)

  timeline.eventCallback('onComplete', publishState)

  window.addEventListener('message', (event: MessageEvent<unknown>) => {
    if (event.origin !== window.location.origin || event.source !== window.parent) return

    const command = event.data

    if (typeof command !== 'object' || command === null || !('type' in command)) return

    if (command.type === 'website-motion-play') timeline.restart()

    if (command.type === 'website-motion-pause') {
      timeline.pause()

      publishState()
    }

    if (command.type === 'website-motion-seek' && 'time' in command && typeof command.time === 'number' && Number.isFinite(command.time)) timeline.pause().seek(Math.max(0, Math.min(duration, command.time)))
  })

  timeline.seek(1)
}
