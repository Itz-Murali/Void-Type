<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'

const { stats, pause } = useGame()
const fmt = (n: number) => n.toLocaleString('en-US')
const filled = computed(() => Math.ceil(stats.value.shield / 10))
const low = computed(() => stats.value.shield <= 30)
const toNext = computed(() => `${(stats.value.combo % 10) * 10}%`)
const toast = ref<{ text: string; warn: boolean; id: number } | null>(null)
let toastId = 0
let toastTimer = 0
function show(text: string, warn: boolean): void {
  window.clearTimeout(toastTimer)
  toast.value = { text, warn, id: ++toastId }
  toastTimer = window.setTimeout(() => { toast.value = null }, 2000)
}
watch(() => stats.value.level, (l, o) => { if (l > o) show(`SECTOR ${String(l).padStart(2, '0')}`, false) })
watch(() => stats.value.healPulse, (a, o) => { if (a > o) show('HP +25', false) })
watch(() => stats.value.eventPulse, (a, o) => { if (a > o) show(stats.value.eventText, false) })
watch(() => stats.value.alertPulse, (a, o) => { if (a > o) show('HOSTILES INBOUND', true) })
onBeforeUnmount(() => window.clearTimeout(toastTimer))

const focusKeyboard = () => {
  const el = document.getElementById('typing-input') as HTMLInputElement | null
  if (!el) return
  if (document.activeElement === el) el.blur()
  else el.focus()
}
</script>

<template>
  <div class="hud">
    <div v-if="stats.errorPulse > 0" :key="'e' + stats.errorPulse" class="flash err" aria-hidden="true" />
    <div v-if="stats.healPulse > 0" :key="'h' + stats.healPulse" class="flash heal" aria-hidden="true" />
    <div v-if="stats.damagePulse > 0" :key="'d' + stats.damagePulse" class="flash dmg" aria-hidden="true" />

    <div v-if="toast" :key="toast.id" class="toast" :class="{ warn: toast.warn }" role="status"><span>{{ toast.text }}</span></div>

    <header class="hud-top">
      <div class="readout">
        <small>Score</small>
        <b>{{ fmt(stats.score) }}</b>
      </div>
      <div class="gauge">
        <small>Sector</small>
        <b>{{ String(stats.level).padStart(2, '0') }}</b>
      </div>
      <div class="readout right">
        <small>Accuracy</small>
        <b>{{ stats.accuracy }}%</b>
      </div>
    </header>

    <div v-if="stats.power" class="power" role="status"><span>{{ stats.power }}</span><i><b :style="{ width: stats.powerLeft * 100 + '%' }" /></i></div>
    <div v-if="stats.power === 'SLOW-TIME'" class="slow-fx" aria-hidden="true" />

    <footer class="hud-bottom">
      <button class="icon-btn touch-only" type="button" aria-label="Open keyboard" @click="focusKeyboard">
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="2" y="6" width="20" height="12" rx="1.5" /><path d="M6 10h.01M10 10h.01M14 10h.01M18 10h.01M7 14h10" stroke-linecap="round" /></svg>
      </button>
      <div class="cluster">
        <div class="combo">
          <small>Combo</small>
          <b>×{{ stats.combo }}</b>
          <span v-if="stats.bonusActive" class="bonus">Bonus ×2</span>
        </div>
        <div class="meter" aria-hidden="true"><span :style="{ width: toNext }" /></div>
        <div class="shield" role="meter" aria-label="HP" :aria-valuenow="stats.shield" aria-valuemin="0" aria-valuemax="100">
          <small>HP</small>
          <span class="bar" :class="{ low }"><i v-for="n in 10" :key="n" :class="{ on: n <= filled }" /></span>
          <em>{{ stats.shield }}</em>
        </div>
      </div>
      <button class="icon-btn pause" type="button" aria-label="Pause" @click="pause">
        <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><rect x="6" y="5" width="4" height="14" /><rect x="14" y="5" width="4" height="14" /></svg>
      </button>
    </footer>
  </div>
</template>
