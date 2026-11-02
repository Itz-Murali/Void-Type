<script setup lang="ts">
import { computed } from 'vue'

const { settings } = useSettings()
useHead({ htmlAttrs: { class: computed(() => (settings.reducedMotion ? 'reduce' : '')) } })
</script>

<template>
  <NuxtPage />
</template>
