import { reactive, watch } from 'vue'
import type { Settings } from '~/types/game'

const KEY = 'voidtype:settings:v2'

function load(): Settings {
  const defaults: Settings = {
    sound: true,
    music: false,
    reducedMotion: typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches,
    quality: 'high'
  }
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? { ...defaults, ...(JSON.parse(raw) as Partial<Settings>) } : defaults
  } catch {
    return defaults
  }
}

const settings = reactive<Settings>(load())

if (typeof window !== 'undefined') {
  watch(settings, () => {
    try { localStorage.setItem(KEY, JSON.stringify(settings)) } catch { }
  }, { deep: true })
}

export function useSettings() {
  return { settings }
}
