<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'

const { panel } = useGame()
const { profile, accuracy, reset } = useProfile()
const back = ref<HTMLButtonElement | null>(null)
const confirming = ref(false)
onMounted(() => back.value?.focus())

const fmt = (n: number) => n.toLocaleString('en-US')
const clock = (sec: number) => {
  const s = Math.round(sec)
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60)
  return h ? `${h}h ${m}m` : m ? `${m}m ${s % 60}s` : `${s}s`
}
const rows = computed(() => [
  ['Runs played', fmt(profile.games)],
  ['Total score', fmt(profile.totalScore)],
  ['Best score', fmt(profile.bestScore)],
  ['Best WPM', String(profile.bestWpm)],
  ['Best accuracy', `${profile.bestAccuracy}%`],
  ['Lifetime accuracy', profile.games ? `${accuracy.value}%` : '—'],
  ['Best combo', `×${profile.bestCombo}`],
  ['Highest sector', String(profile.bestSector)],
  ['Targets destroyed', fmt(profile.destroyed)],
  ['Time in space', clock(profile.seconds)]
])
const recent = computed(() => profile.history.slice(0, 6))
const when = (t: number) => new Date(t).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
function wipe(): void {
  if (!confirming.value) { confirming.value = true; return }
  reset()
  confirming.value = false
}
</script>

<template>
  <section class="overlay dim" role="dialog" aria-modal="true" aria-label="Career statistics">
    <div class="panel wide">
      <h2>Career</h2>
      <dl class="grid-stats">
        <div v-for="r in rows" :key="r[0]"><dt>{{ r[0] }}</dt><dd>{{ r[1] }}</dd></div>
      </dl>
      <div v-if="recent.length" class="recent">
        <small>Recent runs</small>
        <table>
          <thead><tr><th>Date</th><th>Score</th><th>WPM</th><th>Acc</th><th>Sector</th></tr></thead>
          <tbody>
            <tr v-for="g in recent" :key="g.at">
              <td>{{ when(g.at) }}</td><td>{{ fmt(g.score) }}</td><td>{{ g.wpm }}</td><td>{{ g.accuracy }}%</td><td>{{ g.sector }}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p v-else class="empty">No runs yet. Finish a game and your records appear here.</p>
      <div class="actions left">
        <button ref="back" class="btn" type="button" @click="panel = null">Back</button>
        <button v-if="profile.games" class="btn link" type="button" @click="wipe">{{ confirming ? 'Tap again to erase' : 'Reset progress' }}</button>
      </div>
    </div>
  </section>
</template>
