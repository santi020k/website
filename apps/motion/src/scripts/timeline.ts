import type { gsap as Gsap } from 'gsap'

import { openingStill } from '../composition'

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
  const soundtrack = root.querySelector<HTMLAudioElement>('#soundtrack')
  let musicEnabled = false
  let playbackRequest = 0

  gsap.set(scenes, { autoAlpha: 0 })

  scenes.forEach((scene, index) => {
    const start = Number(scene.dataset.sceneStart)
    const previous = scenes[index - 1]

    timeline.to(scene, { autoAlpha: 1, duration: index === 0 ? 0 : 0.35 }, start)

    if (previous) timeline.to(previous, { autoAlpha: 0, duration: 0.35 }, start)

    if (scene.classList.contains('brand-bookend')) {
      timeline.fromTo(scene.querySelectorAll('.brand-frame'), { opacity: 0, scale: 0.85, rotation: -8 }, { opacity: 1, scale: 1, rotation: 0, duration: 1.5, stagger: 0.12, ease: 'power3.out' }, start)

      timeline.fromTo(scene.querySelector('.signature-mark'), { scale: 0.7, y: 30, opacity: 0 }, { scale: 1, y: 0, opacity: 1, duration: 0.8, ease: 'power3.out' }, start + 0.12)

      timeline.fromTo(scene.querySelector('.signature-word'), { clipPath: 'inset(0 100% 0 0)', x: -20 }, { clipPath: 'inset(0 0% 0 0)', x: 0, duration: 0.9, ease: 'power3.out' }, start + 0.4)

      timeline.fromTo(scene.querySelector('.brand-rule'), { scaleX: 0 }, { scaleX: 1, duration: 0.6, ease: 'power3.out' }, start + 0.55)

      timeline.fromTo(scene.querySelectorAll('.brand-message, .brand-caption, .brand-destination, .brand-kicker, .brand-bottom'), { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.7, stagger: 0.1, ease: 'power3.out' }, start + 0.75)
    } else {
      timeline.fromTo(scene.querySelectorAll('h2, .film-eyebrow, .chapter-change'), { opacity: 0, y: 22 }, { opacity: 1, y: 0, duration: 0.6, stagger: 0.08, ease: 'power3.out' }, start + 0.15)
    }

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

  const pauseMusic = () => {
    playbackRequest += 1

    soundtrack?.pause()
  }

  const shouldPlayMusic = () => musicEnabled && !timeline.paused() && timeline.time() < duration

  const playMusic = async () => {
    if (!soundtrack || !shouldPlayMusic()) return

    const request = ++playbackRequest

    soundtrack.currentTime = timeline.time()

    try {
      await soundtrack.play()

      if (!shouldPlayMusic()) soundtrack.pause()
    } catch {
      if (request === playbackRequest) window.parent.postMessage({ type: 'website-motion-audio-blocked' }, window.location.origin)
    }
  }

  timeline.eventCallback('onComplete', () => {
    pauseMusic()

    publishState()
  })

  window.addEventListener('message', (event: MessageEvent<unknown>) => {
    if (event.origin !== window.location.origin || event.source !== window.parent) return

    const command = event.data

    if (typeof command !== 'object' || command === null || !('type' in command)) return

    if (command.type === 'website-motion-play') {
      timeline.restart()

      void playMusic()
    }

    if (command.type === 'website-motion-music' && 'enabled' in command && typeof command.enabled === 'boolean') {
      musicEnabled = command.enabled

      if (musicEnabled) void playMusic()
      else pauseMusic()
    }

    if (command.type === 'website-motion-pause') {
      timeline.pause()

      pauseMusic()

      publishState()
    }

    if (command.type === 'website-motion-seek' && 'time' in command && typeof command.time === 'number' && Number.isFinite(command.time)) {
      timeline.pause().seek(Math.max(0, Math.min(duration, command.time)))

      pauseMusic()
    }
  })

  timeline.seek(openingStill)
}
