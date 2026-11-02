<script setup lang="ts">
import { computed } from 'vue'
import GameCanvas from '~/components/game/GameCanvas.vue'
import GameHUD from '~/components/ui/GameHUD.vue'
import MainMenu from '~/components/ui/MainMenu.vue'
import PauseMenu from '~/components/ui/PauseMenu.vue'
import ResultsScreen from '~/components/ui/ResultsScreen.vue'
import SettingsMenu from '~/components/ui/SettingsMenu.vue'
import HowToPlay from '~/components/ui/HowToPlay.vue'
import StatsPanel from '~/components/ui/StatsPanel.vue'
import LaunchSequence from '~/components/ui/LaunchSequence.vue'
import CheatMode from '~/components/ui/CheatMode.vue'

const { phase, countdown, panel, webglError, webglDetail, launching } = useGame()
const reload = () => window.location.reload()
const inRound = computed(() => ['ready', 'playing', 'paused', 'gameover'].includes(phase.value))
useSeoMeta({ title: 'VOIDTYPE — 3D typing combat' })
</script>

<template>
  <main class="stage">
    <GameCanvas />
    <MainMenu v-if="phase === 'menu'" />
    <LaunchSequence v-if="launching" />
    <GameHUD v-if="inRound" />
    <CheatMode v-if="inRound || launching" />
    <div v-if="phase === 'ready' && countdown" :key="countdown" class="countdown" aria-live="assertive">{{ countdown }}</div>
    <div v-if="phase === 'gameover'" class="banner">GAME OVER</div>
    <PauseMenu v-if="phase === 'paused' && !panel" />
    <ResultsScreen v-if="phase === 'results'" />
    <SettingsMenu v-if="panel === 'settings'" />
    <HowToPlay v-if="panel === 'how'" />
    <StatsPanel v-if="panel === 'stats'" />
    <section v-if="webglError" class="overlay fatal" role="alert">
      <div class="menu fatal-box">
        <h2 class="h-lg">WebGL unavailable</h2>
        <p>VOIDTYPE draws its 3D space with WebGL, and your browser could not start it (standard and compatibility modes were both tried).</p>
        <ul class="fix">
          <li><b>Chrome / Chromium (Linux):</b> Settings, System, turn on <em>Use graphics acceleration when available</em>. If it stays blocked, open <code>chrome://flags</code>, enable <em>Override software rendering list</em> and relaunch. <code>chrome://gpu</code> shows the reason.</li>
          <li><b>Firefox:</b> Settings, General, Performance: untick <em>Use recommended performance settings</em> and tick <em>Use hardware acceleration when available</em>. If needed set <code>webgl.force-enabled</code> to <code>true</code> in <code>about:config</code>. <code>about:support</code> shows the reason.</li>
          <li><b>Still stuck?</b> Update your graphics drivers (Mesa on Linux) or try another browser.</li>
        </ul>
        <code v-if="webglDetail" class="fatal-detail">{{ webglDetail }}</code>
        <button class="btn primary" type="button" @click="reload">Reload</button>
      </div>
    </section>
  </main>
</template>
