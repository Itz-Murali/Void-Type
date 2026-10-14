<script setup lang="ts">
const checks = [['ENGINES', 'ONLINE'], ['WEAPONS', 'ARMED'], ['SHIELDS', 'UP']]
</script>

<template>
  <div class="launch" role="status" aria-live="polite" aria-label="Launching">
    <div class="rays" aria-hidden="true" />
    <div class="rays r2" aria-hidden="true" />
    <div class="launch-core">
      <ul class="checks">
        <li v-for="(c, i) in checks" :key="c[0]" :style="{ animationDelay: i * 0.4 + 's' }">
          <span>{{ c[0] }}</span><i /><b>{{ c[1] }}</b>
        </li>
      </ul>
      <p class="engage">ENGAGING</p>
      <div class="lbar"><span /></div>
    </div>
    <div class="launch-flash" aria-hidden="true" />
  </div>
</template>
