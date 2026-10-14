<script setup lang="ts">
import { onBeforeUnmount, ref, watch } from 'vue'

const { cheat } = useGame()
const intro = ref(false)
let timer = 0

watch(cheat, (on) => {
  window.clearTimeout(timer)
  intro.value = on
  if (on) timer = window.setTimeout(() => { intro.value = false }, 3200)
}, { immediate: true })

onBeforeUnmount(() => window.clearTimeout(timer))
</script>

<template>
  <div v-if="cheat" class="cheat" role="status" aria-live="assertive">
    <div v-if="intro" class="cheat-intro">
      <div class="cheat-vignette" aria-hidden="true" />
      <div class="cheat-scan" aria-hidden="true" />
      <div class="cheat-core">
        <svg class="cat" viewBox="0 0 64 64" width="72" height="72" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linejoin="round" stroke-linecap="round" aria-hidden="true">
          <path d="M10 28 L12 6 L26 16 Q32 14 38 16 L52 6 L54 28 Q58 36 52 46 Q44 58 32 58 Q20 58 12 46 Q6 36 10 28 Z" />
          <path d="M24 34 L24 38 M40 34 L40 38" />
          <path d="M30 42 L34 42 L32 45 Z" />
          <path d="M18 40 L4 38 M18 44 L5 47 M46 40 L60 38 M46 44 L59 47" />
        </svg>
        <h2 class="cheat-title" data-text="MEOW">MEOW</h2>
      </div>
    </div>
    <div class="cheat-badge"><span>MEOW MODE</span></div>
  </div>
</template>
