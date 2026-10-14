import { computed, reactive, watch } from 'vue'
import type { Stats } from '~/types/game'

export interface GameRecord {
  at: number; score: number; wpm: number; accuracy: number
  maxCombo: number; destroyed: number; seconds: number; sector: number
}
export interface Profile {
  since: number; games: number; totalScore: number
  bestScore: number; bestWpm: number; bestAccuracy: number; bestCombo: number; bestSector: number
  destroyed: number; correct: number; incorrect: number; seconds: number
  history: GameRecord[]
}

const KEY = 'voidtype:profile'
const blank = (): Profile => ({
  since: Date.now(), games: 0, totalScore: 0, bestScore: 0, bestWpm: 0, bestAccuracy: 0, bestCombo: 0, bestSector: 1,
  destroyed: 0, correct: 0, incorrect: 0, seconds: 0, history: []
})

function load(): Profile {
  const p = blank()
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) Object.assign(p, JSON.parse(raw) as Partial<Profile>)
    else p.bestWpm = Number(localStorage.getItem('voidtype:best')) || 0
  } catch { }
  return p
}

const profile = reactive<Profile>(load())

if (typeof window !== 'undefined') {
  watch(profile, () => {
    try { localStorage.setItem(KEY, JSON.stringify(profile)) } catch { }
  }, { deep: true })
}

const accuracy = computed(() => {
  const t = profile.correct + profile.incorrect
  return t === 0 ? 0 : Math.round((profile.correct / t) * 100)
})

function record(s: Stats): { newBestWpm: boolean; newBestScore: boolean } {
  const newBestWpm = s.wpm > profile.bestWpm
  const newBestScore = s.score > profile.bestScore
  profile.games++
  profile.totalScore += s.score
  profile.destroyed += s.destroyed
  profile.correct += s.correct
  profile.incorrect += s.incorrect
  profile.seconds += s.elapsed
  profile.bestWpm = Math.max(profile.bestWpm, s.wpm)
  profile.bestScore = Math.max(profile.bestScore, s.score)
  profile.bestAccuracy = Math.max(profile.bestAccuracy, s.accuracy)
  profile.bestCombo = Math.max(profile.bestCombo, s.maxCombo)
  profile.bestSector = Math.max(profile.bestSector, s.level)
  profile.history.unshift({
    at: Date.now(), score: s.score, wpm: s.wpm, accuracy: s.accuracy,
    maxCombo: s.maxCombo, destroyed: s.destroyed, seconds: Math.round(s.elapsed), sector: s.level
  })
  if (profile.history.length > 20) profile.history.length = 20
  return { newBestWpm, newBestScore }
}

function reset(): void {
  Object.assign(profile, blank())
}

export function useProfile() {
  return { profile, accuracy, record, reset }
}
