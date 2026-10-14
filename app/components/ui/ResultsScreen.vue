<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'

const { stats, best, newBest, newBestScore, startGame, toMenu } = useGame()
const again = ref<HTMLButtonElement | null>(null)
onMounted(() => again.value?.focus())

const fmt = (n: number) => n.toLocaleString('en-US')
const time = computed(() => {
  const t = Math.floor(stats.value.elapsed)
  return `${Math.floor(t / 60)}:${String(t % 60).padStart(2, '0')}`
})
</script>

<template>
  <section class="overlay dim" role="dialog" aria-modal="true" aria-label="Results">
    <div class="results">
      <h2 class="h-lg">GAME OVER</h2>
      <div class="big">
        <div><b>{{ stats.wpm }}</b><small>WPM</small></div>
        <div><b>{{ stats.accuracy }}%</b><small>Accuracy</small></div>
        <div><b>{{ fmt(stats.score) }}</b><small>Score</small></div>
        <div><b>×{{ stats.maxCombo }}</b><small>Max combo</small></div>
      </div>
      <p class="destroyed"><b>{{ stats.destroyed }}</b> asteroids destroyed</p>
      <p class="summary">
        Survived {{ time }} · Level {{ stats.level }} · {{ stats.correct }} hits, {{ stats.incorrect }} misses
        <template v-if="newBest || newBestScore"> · <span class="nb">{{ newBestScore ? 'New best score' : 'New best WPM' }}</span></template>
        <template v-else-if="best > 0"> · Best {{ best }} WPM</template>
      </p>
      <div class="actions">
        <button ref="again" class="btn primary" type="button" @click="startGame">Play again</button>
        <button class="btn" type="button" @click="toMenu">Main menu</button>
      </div>
    </div>
  </section>
</template>
