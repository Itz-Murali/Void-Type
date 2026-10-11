<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { GITHUB_URL, HERO_LOGO_URL } from '~/utils/site'

const { panel, launching, launchGame } = useGame()
const { profile, accuracy } = useProfile()
const { canInstall, install } = usePwa()
const start = ref<HTMLButtonElement | null>(null)
const logoOk = ref(true)

const fmt = (n: number) => n.toLocaleString('en-US')
const chips = computed(() => [
  { label: 'Best score', value: profile.games ? fmt(profile.bestScore) : '—', cls: '' },
  { label: 'Best WPM', value: profile.bestWpm ? String(profile.bestWpm) : '—', cls: '' },
  { label: 'Runs', value: String(profile.games), cls: '' },
  { label: 'Accuracy', value: profile.games ? `${accuracy.value}%` : '—', cls: 'hide-sm' }
])
const pct = (v: number, max: number) => Math.max(0, Math.min(100, Math.round((v / max) * 100)))
const rings = computed(() => [
  { label: 'Best WPM', value: profile.bestWpm ? String(profile.bestWpm) : '—', p: pct(profile.bestWpm, 120) },
  { label: 'Accuracy', value: profile.games ? `${accuracy.value}%` : '—', p: profile.games ? accuracy.value : 0 },
  { label: 'Top sector', value: String(profile.bestSector), p: pct(profile.bestSector, 10) }
])

const tips = [
  'Type the first letter of a word to lock on, then finish it.',
  'A wrong key breaks your combo. Accuracy beats raw speed.',
  'Guardians (green) restore 25 HP when you type them down.',
  'Enemy ships flash red just before they fire. Kill them first.',
  'Your beam upgrades at ×10 and ×25 combo.',
  'Bonus asteroids (violet) double your score for 8 seconds.',
  'Gold supply crates grant Slow-Time, Overdrive or a Nova Bomb.'
]
const tip = ref(0)
let timer = 0
onMounted(() => {
  start.value?.focus()
  timer = window.setInterval(() => { tip.value = (tip.value + 1) % tips.length }, 6000)
})
onBeforeUnmount(() => window.clearInterval(timer))
</script>

<template>
  <section class="overlay menu-bg hub" :class="{ out: launching }" aria-label="Main menu">
    <div class="frame" aria-hidden="true"><i /><i /><i /><i /></div>
    <div class="scan" aria-hidden="true" />

    <header class="menu-top">
      <button class="career" type="button" aria-label="Open career statistics" @click="panel = 'stats'">
        <span v-for="c in chips" :key="c.label" class="chip" :class="c.cls">
          <small>{{ c.label }}</small>
          <b>{{ c.value }}</b>
        </span>
      </button>
      <div class="menu-top-actions">
        <button v-if="canInstall" class="btn link" type="button" @click="install">Install app</button>
        <button class="btn link" type="button" @click="panel = 'about'">About</button>
        <a class="icon-btn" :href="GITHUB_URL" target="_blank" rel="noopener noreferrer" aria-label="Source code on GitHub">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden="true"><path d="M12 .5a12 12 0 0 0-3.8 23.4c.6.1.8-.3.8-.6v-2.1c-3.3.7-4-1.6-4-1.6-.6-1.4-1.4-1.8-1.4-1.8-1.1-.7.1-.7.1-.7 1.2.1 1.9 1.3 1.9 1.3 1.1 1.9 2.9 1.3 3.6 1 .1-.8.4-1.3.8-1.6-2.7-.3-5.5-1.3-5.5-5.9 0-1.3.5-2.4 1.2-3.2-.1-.3-.5-1.5.1-3.2 0 0 1-.3 3.3 1.2a11.5 11.5 0 0 1 6 0c2.3-1.5 3.3-1.2 3.3-1.2.7 1.7.3 2.9.1 3.2.8.8 1.2 1.9 1.2 3.2 0 4.6-2.8 5.6-5.5 5.9.4.4.8 1.1.8 2.2v3.3c0 .3.2.7.8.6A12 12 0 0 0 12 .5Z" /></svg>
        </a>
      </div>
    </header>

    <div class="hero">
      <h1 class="sr-only">VOIDTYPE. Type. Aim. Survive.</h1>
      <div class="logo-stage">
        <div class="orbit" aria-hidden="true"><span class="o1" /><span class="o2" /><span class="o3" /></div>
        <img v-if="logoOk" class="hero-logo" :src="HERO_LOGO_URL" alt="" decoding="async" fetchpriority="high" @error="logoOk = false">
        <p v-else class="hero-fallback" aria-hidden="true">VOIDTYPE</p>
      </div>

      <button ref="start" class="cta" type="button" :disabled="launching" @click="launchGame"><span>Start game</span></button>
      <nav class="subnav" aria-label="Menu">
        <button class="sub" type="button" @click="panel = 'how'">How to play</button>
        <button class="sub" type="button" @click="panel = 'stats'">Career</button>
        <button class="sub" type="button" @click="panel = 'settings'">Settings</button>
      </nav>
      <p :key="tip" class="tip center"><small>Tip</small>{{ tips[tip] }}</p>
    </div>

    <aside class="gauges foot" aria-label="Pilot record">
      <div v-for="r in rings" :key="r.label" class="ring" :style="{ '--p': r.p }">
        <b>{{ r.value }}</b>
        <small>{{ r.label }}</small>
      </div>
    </aside>
  </section>
</template>
