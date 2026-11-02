<script setup lang="ts">
import { ref } from 'vue'
import LegalDoc from '~/components/site/LegalDoc.vue'
import { GITHUB_URL, LICENSE_TEXT } from '~/utils/site'
import type { LegalSection } from '~/utils/site'

useSeoMeta({
  title: 'License — VOIDTYPE',
  description: 'VOIDTYPE Attribution License: free to use, fork and modify as long as both creators are credited.'
})

const sections: LegalSection[] = [
  {
    id: 'summary', title: 'The short version',
    paras: [
      'VOIDTYPE is free to use, fork and build on. The only real price is credit: give clear and visible credit to both Itz-Murali and Itz-Anya, and keep the license notice. This summary is for convenience; the full legal text below is what applies.'
    ]
  },
  {
    id: 'can', title: 'What you can do',
    items: [
      'Use VOIDTYPE for any purpose, including commercial projects.',
      'Copy, fork, modify, merge and publish your own version.',
      'Distribute it and sublicense it, in source or compiled form.',
      'Sell copies, as long as the conditions below are met.'
    ]
  },
  {
    id: 'must', title: 'What you must do',
    items: [
      'Credit BOTH Itz-Murali and Itz-Anya as the original creators.',
      `Name them and link to the original repository (${GITHUB_URL}) in your README and in any public page, About screen or credits section.`,
      'Keep the copyright notice and this license text in all copies and substantial portions.',
      'Leave existing credits and author names in place. Do not remove, hide or replace them.'
    ]
  },
  {
    id: 'cannot', title: 'What you cannot do',
    items: [
      'Claim that you are the original author of VOIDTYPE.',
      'Imply that Itz-Murali or Itz-Anya endorse your project without their written permission.'
    ]
  },
  {
    id: 'credit', title: 'A ready-made credit line',
    paras: ['Copy this line into your README and About page:']
  }
]

const copied = ref(false)
const creditLine = `Based on VOIDTYPE by Itz-Murali and Itz-Anya - ${GITHUB_URL}`
async function copy(text: string): Promise<void> {
  try {
    await navigator.clipboard.writeText(text)
    copied.value = true
    window.setTimeout(() => { copied.value = false }, 1800)
  } catch { /* clipboard blocked: the text is still selectable */ }
}
</script>

<template>
  <LegalDoc
    kicker="Open source"
    title="VOIDTYPE Attribution License"
    lead="Use it, fork it, remix it. Just credit both creators and keep the notice."
    :sections="sections"
  >
    <div class="credit-box" data-reveal>
      <code>{{ creditLine }}</code>
      <button class="btn" type="button" @click="copy(creditLine)">{{ copied ? 'Copied' : 'Copy' }}</button>
    </div>

    <section id="full-text" class="doc-sec" data-reveal>
      <header>
        <span class="num">&#9670;</span>
        <h2>Full license text</h2>
      </header>
      <pre class="license-text" tabindex="0" aria-label="Full license text">{{ LICENSE_TEXT }}</pre>
      <div class="doc-cta-row">
        <NuxtLink class="btn primary" to="/">Back to the game</NuxtLink>
        <NuxtLink class="btn" to="/terms">Terms &amp; Conditions</NuxtLink>
        <a class="btn" :href="GITHUB_URL" target="_blank" rel="noopener noreferrer">View on GitHub</a>
      </div>
    </section>
  </LegalDoc>
</template>
