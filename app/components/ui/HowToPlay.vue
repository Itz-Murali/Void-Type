<script setup lang="ts">
import { onMounted, ref } from 'vue'

const { panel } = useGame()
const back = ref<HTMLButtonElement | null>(null)
onMounted(() => back.value?.focus())

const kinds = [
  ['#8fa3bd', 'Normal', 'Standard word.'],
  ['#4fd8ff', 'Fast', 'Quicker, worth more.'],
  ['#e3eaf2', 'Armored', 'Big rock, long word.'],
  ['#b48cff', 'Bonus', 'Destroy for 8s of ×2 score.'],
  ['#ff5a64', 'Danger', 'Heavy shield damage if it lands.'],
  ['#ff7a5a', 'Fighter', 'Enemy ship. Hovers and shoots you.'],
  ['#ff4d8d', 'Gunship', 'Armed twin cannons. Kill fast.'],
  ['#4dffc3', 'Guardian', 'Friendly. Destroy it to restore 25 HP.'],
  ['#ffc233', 'Supply crate', 'Random power-up: Slow-Time, Overdrive or Nova Bomb.']
] as const
</script>

<template>
  <section class="overlay dim" role="dialog" aria-modal="true" aria-label="How to play">
    <div class="panel">
      <h2>How to play</h2>
      <p>Type the first letter of an asteroid's word to lock on, then finish the word. Every correct key fires a laser. A wrong key breaks your combo. Asteroids that reach your ship drain your HP. <kbd>Esc</kbd> pauses.</p>
      <ul class="legend">
        <li v-for="k in kinds" :key="k[1]">
          <span class="dot" :style="{ background: k[0] }" /><b>{{ k[1] }}</b><span>{{ k[2] }}</span>
        </li>
      </ul>
      <button ref="back" class="btn" type="button" @click="panel = null">Back</button>
    </div>
  </section>
</template>
