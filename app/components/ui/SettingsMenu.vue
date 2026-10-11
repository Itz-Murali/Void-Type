<script setup lang="ts">
import { onMounted, ref } from 'vue'
import type { Quality } from '~/types/game'

const { panel } = useGame()
const { settings } = useSettings()
const back = ref<HTMLButtonElement | null>(null)
onMounted(() => back.value?.focus())

const toggles = [
  ['sound', 'Sound'],
  ['music', 'Music'],
  ['reducedMotion', 'Reduced motion']
] as const
const qualities: Quality[] = ['low', 'medium', 'high']
</script>

<template>
  <section class="overlay dim" role="dialog" aria-modal="true" aria-label="Settings">
    <div class="panel">
      <h2>Settings</h2>
      <div v-for="t in toggles" :key="t[0]" class="row">
        <span>{{ t[1] }}</span>
        <button
          class="sw" :class="{ on: settings[t[0]] }" type="button" role="switch"
          :aria-checked="settings[t[0]]" :aria-label="t[1]" @click="settings[t[0]] = !settings[t[0]]"
        >{{ settings[t[0]] ? 'ON' : 'OFF' }}</button>
      </div>
      <div class="row">
        <span>Graphics</span>
        <div class="segs" role="radiogroup" aria-label="Graphics quality">
          <button
            v-for="q in qualities" :key="q" type="button" role="radio" class="sw"
            :class="{ on: settings.quality === q }" :aria-checked="settings.quality === q"
            @click="settings.quality = q"
          >{{ q }}</button>
        </div>
      </div>
      <button ref="back" class="btn" type="button" @click="panel = null">Back</button>
    </div>
  </section>
</template>
