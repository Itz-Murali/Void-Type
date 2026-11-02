import { onBeforeUnmount, onMounted } from 'vue'
import type { Ref } from 'vue'
import { animate, stagger } from 'animejs'

/**
 * Scroll-triggered section animation powered by anime.js.
 *
 *  [data-reveal]   fades and slides the element in once it scrolls into view
 *  [data-stagger]  does the same for each direct child, one after another
 *  [data-count]    counts a number up from 0 (value in the attribute)
 *
 * Falls back to showing everything instantly when reduced motion is on.
 */
export function useReveal(root: Ref<HTMLElement | null>) {
  const { settings } = useSettings()
  let observer: IntersectionObserver | null = null
  const running: Array<{ revert?: () => void; cancel?: () => void }> = []

  const reducedNow = (): boolean => settings.reducedMotion || !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

  function play(el: HTMLElement): void {
    if (el.hasAttribute('data-count')) {
      const end = Number(el.getAttribute('data-count')) || 0
      const suffix = el.getAttribute('data-suffix') ?? ''
      const state = { v: 0 }
      running.push(animate(state, {
        v: end, duration: 1600, ease: 'outExpo',
        onUpdate: () => { el.textContent = `${Math.round(state.v)}${suffix}` }
      }))
      return
    }
    const targets = el.hasAttribute('data-stagger') ? Array.from(el.children) : [el]
    running.push(animate(targets, {
      opacity: [0, 1],
      translateY: [32, 0],
      duration: 900,
      delay: stagger(el.hasAttribute('data-stagger') ? 90 : 0),
      ease: 'outExpo'
    }))
  }

  onMounted(() => {
    const host = root.value
    if (!host) return
    const items = Array.from(host.querySelectorAll<HTMLElement>('[data-reveal], [data-stagger], [data-count]'))
    if (reducedNow() || typeof IntersectionObserver === 'undefined') {
      host.classList.add('static')
      items.forEach((el) => {
        if (el.hasAttribute('data-count')) el.textContent = `${el.getAttribute('data-count')}${el.getAttribute('data-suffix') ?? ''}`
      })
      return
    }
    observer = new IntersectionObserver((entries) => {
      for (const e of entries) {
        if (!e.isIntersecting) continue
        observer?.unobserve(e.target)
        play(e.target as HTMLElement)
      }
    }, { root: host.closest('.site') ?? null, threshold: 0.12, rootMargin: '0px 0px -6% 0px' })
    items.forEach((el) => observer?.observe(el))
  })

  onBeforeUnmount(() => {
    observer?.disconnect()
    running.forEach((a) => { try { a.cancel?.() } catch { /* already finished */ } })
    running.length = 0
  })
}
