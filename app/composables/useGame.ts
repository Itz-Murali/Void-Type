import { computed, ref, shallowRef } from 'vue'
import type { GameEngine } from '~/game/GameEngine'
import type { EngineEvents, Phase, Stats } from '~/types/game'
import { useAudio } from './useAudio'
import { useProfile } from './useProfile'

const emptyStats = (): Stats => ({
  score: 0, wpm: 0, accuracy: 100, combo: 0, maxCombo: 0, shield: 100, level: 1, destroyed: 0,
  correct: 0, incorrect: 0, bonusActive: false, elapsed: 0, errorPulse: 0, damagePulse: 0, alertPulse: 0, healPulse: 0, eventPulse: 0, eventText: '', power: '', powerLeft: 0
})

const { profile, record } = useProfile()
const phase = ref<Phase>('menu')
const stats = shallowRef<Stats>(emptyStats())
const countdown = ref('')
const panel = ref<'how' | 'settings' | 'about' | 'stats' | null>(null)
const webglError = ref(false)
const webglDetail = ref('')
const launching = ref(false)
const best = computed(() => profile.bestWpm)
const newBest = ref(false)
const newBestScore = ref(false)
let engine: GameEngine | null = null
let timers: number[] = []

const audio = useAudio()

const engineEvents: EngineEvents = {
  onStats: (s) => { stats.value = s },
  onSfx: (n) => audio.play(n),
  onOver: () => { audio.setMusicActive(false); phase.value = 'gameover' },
  onResults: (s) => {
    stats.value = s
    const r = record(s)
    newBest.value = r.newBestWpm
    newBestScore.value = r.newBestScore
    phase.value = 'results'
  }
}

function clearTimers(): void {
  timers.forEach((t) => window.clearTimeout(t))
  timers = []
}

function beginRound(fromLaunch: boolean): void {
  if (!engine) return
  clearTimers()
  audio.unlock()
  if (!fromLaunch) { audio.play('start'); audio.setMusicActive(true) }
  panel.value = null
  newBest.value = false
  newBestScore.value = false
  stats.value = emptyStats()
  engine.prepare()
  phase.value = 'ready';
  if (!fromLaunch) {
    ;(document.activeElement as HTMLElement | null)?.blur()
    if (window.matchMedia('(pointer: coarse)').matches) document.getElementById('typing-input')?.focus()
  }
  const steps = ['READY', '3', '2', '1', 'GO']
  steps.forEach((label, i) => timers.push(window.setTimeout(() => { countdown.value = label }, i * 800)))
  timers.push(window.setTimeout(() => {
    countdown.value = ''
    if (phase.value === 'ready') { engine?.startRound(); phase.value = 'playing' }
  }, steps.length * 800))
}

function startGame(): void {
  beginRound(false)
}

function launchGame(): void {
  if (!engine || launching.value) return
  clearTimers()
  audio.unlock()
  audio.play('start')
  audio.setMusicActive(true)
  panel.value = null
  ;(document.activeElement as HTMLElement | null)?.blur()
  if (window.matchMedia('(pointer: coarse)').matches) document.getElementById('typing-input')?.focus()
  launching.value = true
  engine.setLaunch(true)
  timers.push(window.setTimeout(() => {
    engine?.setLaunch(false)
    launching.value = false
    beginRound(true)
  }, 1500))
}

function pause(): void {
  if (phase.value !== 'playing') return
  engine?.pause()
  audio.setMusicActive(false)
  phase.value = 'paused'
}

function resume(): void {
  if (phase.value !== 'paused') return
  panel.value = null
  engine?.resume()
  audio.setMusicActive(true)
  phase.value = 'playing'
}

function toMenu(): void {
  clearTimers()
  launching.value = false
  engine?.setLaunch(false)
  countdown.value = ''
  panel.value = null
  audio.setMusicActive(false)
  engine?.toMenu()
  stats.value = emptyStats()
  phase.value = 'menu'
}

function onKey(e: KeyboardEvent): void {
  if (e.key === 'Escape') {
    if (panel.value) panel.value = null
    else if (phase.value === 'playing') pause()
    else if (phase.value === 'paused') resume()
    return
  }
  if (phase.value !== 'playing' || e.ctrlKey || e.metaKey || e.altKey) return
  if ((e.target as HTMLElement | null)?.id === 'typing-input') return
  if (e.key.length === 1) {
    e.preventDefault()
    if (!e.repeat) engine?.handleChar(e.key)
  } else if (e.key === 'Tab' || e.key === 'Backspace') {
    e.preventDefault()
  }
}

function typeChars(text: string): void {
  if (phase.value !== 'playing') return
  for (const ch of text) engine?.handleChar(ch)
}

function attach(e: GameEngine): void { engine = e }
function detach(): void { clearTimers(); engine = null }

export function useGame() {
  return {
    phase, stats, countdown, panel, webglError, webglDetail, launching, launchGame, best, newBest, newBestScore, engineEvents,
    attach, detach, startGame, pause, resume, toMenu, onKey, typeChars
  }
}
