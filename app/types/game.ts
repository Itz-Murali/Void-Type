export type Phase = 'menu' | 'ready' | 'playing' | 'paused' | 'gameover' | 'results'
export type AsteroidKind = 'normal' | 'fast' | 'armored' | 'bonus' | 'danger' | 'fighter' | 'gunship' | 'shield' | 'crate'
export type Quality = 'low' | 'medium' | 'high'
export type SfxName = 'laser' | 'hit' | 'explode' | 'error' | 'combo' | 'damage' | 'start' | 'gameover' | 'bonus' | 'enemy' | 'cheat'

export interface Settings {
  sound: boolean
  music: boolean
  reducedMotion: boolean
  quality: Quality
}

export interface Stats {
  score: number
  wpm: number
  accuracy: number
  combo: number
  maxCombo: number
  shield: number
  level: number
  destroyed: number
  correct: number
  incorrect: number
  bonusActive: boolean
  elapsed: number
  errorPulse: number
  damagePulse: number
  alertPulse: number
  healPulse: number
  eventPulse: number
  eventText: string
  power: string
  powerLeft: number
}

export interface EngineEvents {
  onStats(s: Stats): void
  onOver(): void
  onResults(s: Stats): void
  onSfx(n: SfxName): void
}
