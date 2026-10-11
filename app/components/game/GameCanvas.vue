<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { GameEngine } from '~/game/GameEngine'

const canvas = ref<HTMLCanvasElement | null>(null)
const input = ref<HTMLInputElement | null>(null)
const game = useGame()
const { settings } = useSettings()
let engine: GameEngine | null = null
let observer: ResizeObserver | null = null

function fit(): void {
  const el = canvas.value
  if (!el || !engine) return
  const r = el.getBoundingClientRect()
  engine.resize(r.width, r.height)
}

function syncViewport(): void {
  const vv = window.visualViewport
  if (!vv) return
  const root = document.documentElement.style
  root.setProperty('--vvh', `${vv.height}px`)
  root.setProperty('--vvt', `${vv.offsetTop}px`)
  if (window.scrollY !== 0) window.scrollTo(0, 0)
}

function onVisibility(): void {
  if (document.hidden) game.pause()
}

function onInput(): void {
  const el = input.value
  if (!el) return
  game.typeChars(el.value)
  el.value = ''
}

watch(settings, () => engine?.applySettings(settings), { deep: true })

onMounted(() => {
  if (!canvas.value) return
  let failure: unknown = null
  for (const compat of [false, true]) {
    try {
      engine = new GameEngine(canvas.value, game.engineEvents, settings, compat)
      failure = null
      break
    } catch (e) {
      failure = e
      console.error(`[VOIDTYPE] renderer init failed${compat ? ' (compatibility mode)' : ''}`, e)
    }
  }
  if (!engine) {
    game.webglError.value = true
    game.webglDetail.value = failure instanceof Error ? failure.message : String(failure)
    return
  }
  game.attach(engine)
  fit()
  observer = new ResizeObserver(fit)
  observer.observe(canvas.value)
  window.addEventListener('keydown', game.onKey)
  syncViewport()
  window.visualViewport?.addEventListener('resize', syncViewport)
  window.visualViewport?.addEventListener('scroll', syncViewport)
  document.addEventListener('visibilitychange', onVisibility)
})

onBeforeUnmount(() => {
  observer?.disconnect()
  window.removeEventListener('keydown', game.onKey)
  window.visualViewport?.removeEventListener('resize', syncViewport)
  window.visualViewport?.removeEventListener('scroll', syncViewport)
  document.documentElement.style.removeProperty('--vvh')
  document.documentElement.style.removeProperty('--vvt')
  document.removeEventListener('visibilitychange', onVisibility)
  game.detach()
  engine?.dispose()
  engine = null
})
</script>

<template>
  <canvas ref="canvas" class="scene" aria-hidden="true" />
  <input
    id="typing-input" ref="input" class="typing-input" type="text" inputmode="text"
    autocapitalize="off" autocomplete="off" autocorrect="off" spellcheck="false"
    aria-label="Type the highlighted word" @input="onInput"
  >
</template>
