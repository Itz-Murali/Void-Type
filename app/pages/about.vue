<script setup lang="ts">
import { onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import { animate, createTimeline } from 'animejs'
import SiteShell from '~/components/site/SiteShell.vue'
import { DEVELOPERS, GITHUB_URL, HERO_LOGO_URL, TECH_STACK } from '~/utils/site'

useSeoMeta({
  title: 'About — VOIDTYPE',
  description: 'About VOIDTYPE: a 3D space-combat typing game by Itz-Murali and Itz-Anya. Story, features, creators, tech stack and license.',
  ogTitle: 'About VOIDTYPE',
  ogDescription: 'Type. Aim. Survive. Meet the creators and the tech behind the game.'
})

const hero = ref<HTMLElement | null>(null)
const logoOk = ref(true)
const imgFailed = reactive<Record<string, boolean>>({})
const { settings } = useSettings()
const loops: Array<{ cancel?: () => void }> = []

const stats = [
  { n: 5, suffix: '', label: 'Enemy ship classes' },
  { n: 3, suffix: '', label: 'Power-ups' },
  { n: 3, suffix: '', label: 'Beam tiers' },
  { n: 0, suffix: ' MB', label: 'Textures to download' }
]

const features = [
  { t: 'Typing is shooting', d: 'No input box. Type the first letter to lock on, finish the word to destroy the target. Every correct key fires a visible beam.' },
  { t: 'A real 3D game', d: 'Ship, asteroids, enemy fleets, lasers, particles, explosions and shields, all rendered live with Three.js.' },
  { t: 'A living universe', d: 'Procedural planets and moons, galaxies, nebulae, black holes, stations, comets and live space events.' },
  { t: 'Adaptive difficulty', d: 'Driven by both time and your actual WPM. It rises steadily and never spikes, so every run stays fair.' },
  { t: 'Plays anywhere', d: 'Responsive from phones to ultrawide screens. Installable as an app and playable offline.' },
  { t: 'Zero assets', d: 'Models, textures, shaders and sound effects are generated procedurally, so there is nothing heavy to fetch.' }
]

const steps = [
  { t: 'Lock on', d: 'Type the first letter of a target\'s word. Asteroids, ships and supply crates all carry one.' },
  { t: 'Fire', d: 'Finish the word. Each correct key sends a beam that upgrades from cyan to gold to violet as your combo grows.' },
  { t: 'Survive', d: 'Mistakes break your combo, leaks and enemy fire drain your hull. Hold on as long as you can.' }
]

onMounted(() => {
  const h = hero.value
  if (!h || settings.reducedMotion) return
  const q = (s: string) => Array.from(h.querySelectorAll<HTMLElement>(s))
  createTimeline({ defaults: { ease: 'outExpo', duration: 1000 } })
    .add(q('.hero-logo-wrap'), { opacity: [0, 1], scale: [0.7, 1] })
    .add(q('.about-kicker'), { opacity: [0, 1], translateY: [16, 0] }, '-=700')
    .add(q('.about-tag'), { opacity: [0, 1], translateY: [24, 0] }, '-=750')
    .add(q('.about-lede'), { opacity: [0, 1], translateY: [24, 0] }, '-=800')
    .add(q('.about-actions > *'), { opacity: [0, 1], translateY: [20, 0], delay: (_el: unknown, i: number) => i * 110 }, '-=800')
  loops.push(
    animate(q('.orb-a'), { rotate: 360, duration: 26000, ease: 'linear', loop: true }),
    animate(q('.orb-b'), { rotate: -360, duration: 38000, ease: 'linear', loop: true }),
    animate(q('.hero-logo-wrap img, .hero-logo-wrap .fallback'), { translateY: [-7, 7], duration: 3400, ease: 'inOutSine', alternate: true, loop: true })
  )
})

onBeforeUnmount(() => loops.forEach((a) => { try { a.cancel?.() } catch { /* done */ } }))
</script>

<template>
  <SiteShell>
    <section ref="hero" class="about-hero">
      <h1 class="sr-only">About VOIDTYPE</h1>
      <div class="hero-logo-wrap pre-hide">
        <i class="orb orb-a" aria-hidden="true" />
        <i class="orb orb-b" aria-hidden="true" />
        <img v-if="logoOk" :src="HERO_LOGO_URL" alt="VOIDTYPE" decoding="async" fetchpriority="high" @error="logoOk = false">
        <h1 v-else class="fallback">VOIDTYPE</h1>
      </div>
      <p class="about-kicker pre-hide">About the game</p>
      <h2 class="about-tag pre-hide">Type. Aim. Survive.</h2>
      <p class="about-lede pre-hide">
        VOIDTYPE is a fast, cinematic 3D space-combat typing game. Every asteroid, enemy ship and supply crate carries a word.
        Type it and your ship fires. Faster, cleaner typing clears more of the sky.
      </p>
      <div class="about-actions">
        <NuxtLink class="btn primary big-btn pre-hide" to="/">Play now</NuxtLink>
        <a class="btn big-btn pre-hide" :href="GITHUB_URL" target="_blank" rel="noopener noreferrer">View source</a>
      </div>
    </section>

    <section class="band" aria-label="At a glance">
      <ul class="stat-row" data-stagger>
        <li v-for="s in stats" :key="s.label">
          <b><span :data-count="s.n" :data-suffix="s.suffix">0{{ s.suffix }}</span></b>
          <small>{{ s.label }}</small>
        </li>
      </ul>
    </section>

    <section class="block">
      <header class="block-head" data-reveal>
        <small>Why it feels different</small>
        <h2>Built for flow</h2>
      </header>
      <div class="feat-grid" data-stagger>
        <article v-for="(f, i) in features" :key="f.t" class="feat">
          <span class="feat-n">{{ String(i + 1).padStart(2, '0') }}</span>
          <h3>{{ f.t }}</h3>
          <p>{{ f.d }}</p>
        </article>
      </div>
    </section>

    <section class="block">
      <header class="block-head" data-reveal>
        <small>How it plays</small>
        <h2>Three steps to the stars</h2>
      </header>
      <ol class="steps" data-stagger>
        <li v-for="(s, i) in steps" :key="s.t">
          <span class="step-n">{{ i + 1 }}</span>
          <div><h3>{{ s.t }}</h3><p>{{ s.d }}</p></div>
        </li>
      </ol>
    </section>

    <section id="creators" class="block">
      <header class="block-head" data-reveal>
        <small>The crew</small>
        <h2>Created by</h2>
        <p>VOIDTYPE is designed, built and maintained by two developers who love fast keyboards and slow starlight.</p>
      </header>
      <div class="crew-grid" data-stagger>
        <article v-for="d in DEVELOPERS" :key="d.handle" class="crew">
          <div class="crew-photo">
            <img v-if="!imgFailed[d.handle]" :src="d.img" :alt="d.handle" loading="lazy" referrerpolicy="no-referrer" @error="imgFailed[d.handle] = true">
            <span v-else aria-hidden="true">{{ d.handle[0] }}</span>
          </div>
          <b class="crew-name">{{ d.name }}</b>
          <span class="crew-handle">@{{ d.handle }}</span>
          <small>Co-creator</small>
          <a class="btn" :href="d.github" target="_blank" rel="noopener noreferrer">GitHub profile</a>
        </article>
      </div>
    </section>

    <section class="block">
      <header class="block-head" data-reveal>
        <small>Under the hood</small>
        <h2>Tech stack</h2>
      </header>
      <ul class="tech-grid" data-stagger>
        <li v-for="t in TECH_STACK" :key="t.name">
          <small>{{ t.tag }}</small>
          <b>{{ t.name }}</b>
          <span>{{ t.role }}</span>
        </li>
      </ul>
    </section>

    <section class="block">
      <header class="block-head" data-reveal>
        <small>The fine print</small>
        <h2>License &amp; legal</h2>
      </header>
      <div class="legal-grid" data-stagger>
        <NuxtLink class="legal-card" to="/license">
          <small>Open source</small>
          <b>VOIDTYPE Attribution License</b>
          <span>Free to use, fork and modify. Just credit Itz-Murali and Itz-Anya and keep the notice.</span>
          <em>Read the license</em>
        </NuxtLink>
        <NuxtLink class="legal-card" to="/terms">
          <small>Rules of play</small>
          <b>Terms &amp; Conditions</b>
          <span>What you agree to when you play, how your data is stored and how to reach us.</span>
          <em>Read the terms</em>
        </NuxtLink>
      </div>
    </section>

    <section class="block final" data-reveal>
      <h2>Your sky is waiting.</h2>
      <p>By playing you agree to our <NuxtLink to="/terms">Terms &amp; Conditions</NuxtLink> and <NuxtLink to="/license">License</NuxtLink>.</p>
      <NuxtLink class="btn primary big-btn" to="/">Launch the game</NuxtLink>
    </section>
  </SiteShell>
</template>
