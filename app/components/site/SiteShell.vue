<script setup lang="ts">
import { ref } from 'vue'
import { GITHUB_URL, ISSUES_URL, LOGO_URL, NAV_LINKS, SITE_YEAR } from '~/utils/site'

const scroller = ref<HTMLElement | null>(null)
const logoOk = ref(true)
useReveal(scroller)
</script>

<template>
  <div ref="scroller" class="site">
    <div class="site-bg" aria-hidden="true"><i class="neb n1" /><i class="neb n2" /><i class="stars s1" /><i class="stars s2" /></div>

    <header class="site-nav">
      <NuxtLink class="brand" to="/" aria-label="VOIDTYPE home">
        <img v-if="logoOk" :src="LOGO_URL" alt="" width="34" height="34" decoding="async" @error="logoOk = false">
        <span>VOIDTYPE</span>
      </NuxtLink>
      <nav aria-label="Site">
        <NuxtLink v-for="l in NAV_LINKS" :key="l.to" :to="l.to" class="nav-a" active-class="on">{{ l.label }}</NuxtLink>
        <NuxtLink class="nav-play" to="/">Play</NuxtLink>
      </nav>
    </header>

    <main class="site-main">
      <slot />
    </main>

    <footer class="site-foot">
      <div class="foot-row">
        <div class="foot-brand">
          <b>VOIDTYPE</b>
          <span>Type. Aim. Survive.</span>
        </div>
        <nav class="foot-links" aria-label="Legal">
          <NuxtLink to="/">Play</NuxtLink>
          <NuxtLink to="/about">About</NuxtLink>
          <NuxtLink to="/terms">Terms &amp; Conditions</NuxtLink>
          <NuxtLink to="/license">License</NuxtLink>
          <a :href="GITHUB_URL" target="_blank" rel="noopener noreferrer">Source</a>
          <a :href="ISSUES_URL" target="_blank" rel="noopener noreferrer">Report an issue</a>
        </nav>
      </div>
      <p class="foot-credit">&copy; {{ SITE_YEAR }} Itz-Murali and Itz-Anya. Made with love for typists and stargazers.</p>
    </footer>
  </div>
</template>
