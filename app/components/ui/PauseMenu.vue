<script setup lang="ts">
import { onMounted, ref } from 'vue'

const { resume, toMenu, panel } = useGame()
const first = ref<HTMLButtonElement | null>(null)
onMounted(() => first.value?.focus())
</script>

<template>
  <section class="overlay dim" role="dialog" aria-modal="true" aria-label="Paused">
    <div class="menu pause-menu">
      <h2 class="h-lg">PAUSED</h2>
      <nav class="menu-list" aria-label="Pause menu">
        <button ref="first" class="item primary" type="button" @click="resume"><i>01</i>Resume</button>
        <button class="item" type="button" @click="panel = 'settings'"><i>02</i>Settings</button>
        <button class="item" type="button" @click="toMenu"><i>03</i>Quit to menu</button>
      </nav>
    </div>
  </section>
</template>
