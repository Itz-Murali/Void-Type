<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { animate, createTimeline } from 'animejs'
import SiteShell from '~/components/site/SiteShell.vue'
import { LEGAL_UPDATED } from '~/utils/site'
import type { LegalSection } from '~/utils/site'

defineProps<{ kicker: string; title: string; lead: string; sections: LegalSection[] }>()

const head = ref<HTMLElement | null>(null)
const { settings } = useSettings()

const go = (id: string): void => {
  document.getElementById(id)?.scrollIntoView({ behavior: settings.reducedMotion ? 'auto' : 'smooth', block: 'start' })
}

onMounted(() => {
  const h = head.value
  if (!h || settings.reducedMotion) return
  const q = (s: string) => Array.from(h.querySelectorAll<HTMLElement>(s))
  createTimeline({ defaults: { ease: 'outExpo', duration: 900 } })
    .add(q('.kicker'), { opacity: [0, 1], translateY: [16, 0] })
    .add(q('h1'), { opacity: [0, 1], translateY: [28, 0] }, '-=650')
    .add(q('.lead, .stamp'), { opacity: [0, 1], translateY: [20, 0] }, '-=650')
  animate(q('.rule'), { scaleX: [0, 1], duration: 1400, ease: 'outExpo', delay: 300 })
})
</script>

<template>
  <SiteShell>
    <section ref="head" class="doc-head">
      <p class="kicker pre-hide">{{ kicker }}</p>
      <h1 class="pre-hide">{{ title }}</h1>
      <p class="lead pre-hide">{{ lead }}</p>
      <p class="stamp pre-hide">Last updated {{ LEGAL_UPDATED }}</p>
      <i class="rule" aria-hidden="true" />
    </section>

    <div class="doc-grid">
      <aside class="doc-toc" aria-label="On this page">
        <small>On this page</small>
        <ol>
          <li v-for="(s, i) in sections" :key="s.id">
            <button type="button" @click="go(s.id)"><i>{{ String(i + 1).padStart(2, '0') }}</i>{{ s.title }}</button>
          </li>
        </ol>
      </aside>

      <article class="doc-body">
        <section v-for="(s, i) in sections" :id="s.id" :key="s.id" class="doc-sec" data-reveal>
          <header>
            <span class="num">{{ String(i + 1).padStart(2, '0') }}</span>
            <h2>{{ s.title }}</h2>
          </header>
          <p v-for="(p, pi) in s.paras" :key="pi">{{ p }}</p>
          <ul v-if="s.items"><li v-for="(it, ii) in s.items" :key="ii">{{ it }}</li></ul>
        </section>
        <slot />
      </article>
    </div>
  </SiteShell>
</template>
