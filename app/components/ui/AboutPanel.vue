<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { DEVELOPERS, GITHUB_URL, HERO_LOGO_URL } from '~/utils/site'

const { panel } = useGame()
const back = ref<HTMLButtonElement | null>(null)
const logoOk = ref(true)
const imgFailed = reactive<Record<string, boolean>>({})
onMounted(() => back.value?.focus())
</script>

<template>
  <section class="overlay dim" role="dialog" aria-modal="true" aria-label="About VOIDTYPE">
    <div class="panel about3">
      <header class="a3-head">
        <img v-if="logoOk" class="a3-logo" :src="HERO_LOGO_URL" alt="VOIDTYPE" decoding="async" @error="logoOk = false">
        <h2 v-else class="a-fallback">VOIDTYPE</h2>
      </header>

      <div class="a3-text">
        <p>Every asteroid, enemy ship and supply crate carries a word. Type it to fire, destroy it and survive.</p>
        <p>Your records are saved on this device, and the game installs like an app.</p>
      </div>

      <section class="a3-devs" aria-label="Developers">
        <h3>Developers</h3>
        <div class="dev-grid">
          <article v-for="d in DEVELOPERS" :key="d.handle" class="dev-card">
            <div class="dev-photo">
              <img v-if="!imgFailed[d.handle]" :src="d.img" :alt="d.handle" loading="lazy" referrerpolicy="no-referrer" @error="imgFailed[d.handle] = true">
              <span v-else aria-hidden="true">{{ d.handle[0] }}</span>
            </div>
            <b class="dev-name">{{ d.name }}</b>
            <a class="gh" :href="d.github" target="_blank" rel="noopener noreferrer">
              <svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor" aria-hidden="true"><path d="M12 .5a12 12 0 0 0-3.8 23.4c.6.1.8-.3.8-.6v-2.1c-3.3.7-4-1.6-4-1.6-.6-1.4-1.4-1.8-1.4-1.8-1.1-.7.1-.7.1-.7 1.2.1 1.9 1.3 1.9 1.3 1.1 1.9 2.9 1.3 3.6 1 .1-.8.4-1.3.8-1.6-2.7-.3-5.5-1.3-5.5-5.9 0-1.3.5-2.4 1.2-3.2-.1-.3-.5-1.5.1-3.2 0 0 1-.3 3.3 1.2a11.5 11.5 0 0 1 6 0c2.3-1.5 3.3-1.2 3.3-1.2.7 1.7.3 2.9.1 3.2.8.8 1.2 1.9 1.2 3.2 0 4.6-2.8 5.6-5.5 5.9.4.4.8 1.1.8 2.2v3.3c0 .3.2.7.8.6A12 12 0 0 0 12 .5Z" /></svg>
              GitHub · {{ d.handle }}
            </a>
          </article>
        </div>
      </section>

      <div class="a-actions">
        <a class="btn" :href="GITHUB_URL" target="_blank" rel="noopener noreferrer">Source code</a>
        <button ref="back" class="btn primary" type="button" @click="panel = null">Back</button>
      </div>
    </div>
  </section>
</template>
