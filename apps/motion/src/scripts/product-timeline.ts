/* One deterministic paused timeline, following the existing motion studio. */
gsap.config({ force3D: false })

const timeline = gsap.timeline({ paused: true })
const scenes = [...document.querySelectorAll<HTMLElement>('.scene')]

gsap.set(scenes, { autoAlpha: 0 })

for (const [index, scene] of scenes.entries()) {
  const start = Number(scene.dataset.sceneStart)

  timeline.set(scene, { autoAlpha: 1 }, start)

  const previous = scenes[index - 1]

  if (previous) {
    timeline.fromTo(scene, { clipPath: 'inset(0 0 100% 0)' }, { clipPath: 'inset(0 0 0% 0)', duration: 0.42, ease: 'power3.inOut' }, start)

    timeline.set(previous, { autoAlpha: 0 }, start)
  }

  timeline.fromTo(scene.querySelectorAll('.film-top, .film-bottom'), { opacity: 0 }, { opacity: 1, duration: 0.3 }, start + 0.15)
}

timeline.fromTo('.opening-mark', { scale: 0.8, y: 50, opacity: 0 }, { scale: 1, y: 0, opacity: 1, duration: 0.7, ease: 'power3.out' }, 0.05)

timeline.fromTo('.opening-type .line', { y: 100, opacity: 0 }, { y: 0, opacity: 1, duration: 0.65, stagger: 0.12, ease: 'power3.out' }, 0.16)

timeline.fromTo('.opening-rule', { scaleX: 0 }, { scaleX: 1, duration: 0.7, ease: 'power3.inOut' }, 0.45)

timeline.fromTo('.opening-note', { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.4 }, 0.65)

timeline.fromTo('.product-copy > *', { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.6, stagger: 0.08, ease: 'power3.out' }, 3.25)

timeline.fromTo('.workspace-plate', { x: 170, scale: 1.06, opacity: 0 }, { x: 0, scale: 1, opacity: 1, duration: 0.9, ease: 'power3.out' }, 3.15)

timeline.fromTo('.native-copy > *', { y: 40, opacity: 0 }, { y: 0, opacity: 1, duration: 0.6, stagger: 0.1, ease: 'power3.out' }, 9.2)

timeline.fromTo('.native-workspace', { scale: 1.04, x: 80, opacity: 0 }, { scale: 1, x: 0, opacity: 1, duration: 0.75, ease: 'power3.out' }, 9.15)

timeline.fromTo('.native-phone', { y: 125, opacity: 0 }, { y: 0, opacity: 1, duration: 0.85, ease: 'power3.out' }, 9.35)

timeline.fromTo('.postlens-copy > *', { y: 45, opacity: 0 }, { y: 0, opacity: 1, duration: 0.7, stagger: 0.08, ease: 'power3.out' }, 13.2)

timeline.fromTo('.photo-strip', { x: 150, clipPath: 'inset(0 100% 0 0)' }, { x: 0, clipPath: 'inset(0 0% 0 0)', duration: 1, ease: 'power3.out' }, 13.3)

timeline.fromTo('.editor-phone', { y: 110, scale: 0.96, opacity: 0 }, { y: 0, scale: 1, opacity: 1, duration: 0.95, ease: 'power3.out' }, 13.45)

timeline.fromTo('.ecosystem h2', { y: 45, opacity: 0 }, { y: 0, opacity: 1, duration: 0.65, ease: 'power3.out' }, 21.2)

timeline.fromTo('.ecosystem-rule', { scaleX: 0 }, { scaleX: 1, duration: 0.6, ease: 'power3.inOut' }, 21.3)

timeline.fromTo('.tool', { y: 45, opacity: 0 }, { y: 0, opacity: 1, duration: 0.55, stagger: 0.07, ease: 'power3.out' }, 21.45)

timeline.fromTo('.ending-brand', { y: 45, opacity: 0 }, { y: 0, opacity: 1, duration: 0.65, ease: 'power3.out' }, 26.2)

timeline.fromTo('.ending h2', { y: 60, opacity: 0 }, { y: 0, opacity: 1, duration: 0.65, ease: 'power3.out' }, 26.35)

timeline.fromTo('.ending-url', { x: -35, opacity: 0 }, { x: 0, opacity: 1, duration: 0.6, ease: 'power3.out' }, 26.55)

timeline.set({}, {}, 30)

window.__timelines ??= {}

window.__timelines['product-film'] = timeline

timeline.seek(1.45)
