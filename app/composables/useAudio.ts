import { watch } from 'vue'
import type { SfxName } from '~/types/game'
import { useSettings } from './useSettings'

const { settings } = useSettings()
let ctx: AudioContext | null = null
let master: GainNode | null = null
let noiseBuf: AudioBuffer | null = null

function tone(type: OscillatorType, f0: number, f1: number, dur: number, vol: number, delay = 0): void {
  if (!ctx || !master) return
  const t = ctx.currentTime + delay
  const osc = ctx.createOscillator()
  const g = ctx.createGain()
  osc.type = type
  osc.frequency.setValueAtTime(f0, t)
  osc.frequency.exponentialRampToValueAtTime(Math.max(f1, 1), t + dur)
  g.gain.setValueAtTime(vol, t)
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur)
  osc.connect(g).connect(master)
  osc.start(t)
  osc.stop(t + dur + 0.02)
}

function noise(dur: number, vol: number, f0: number, f1: number): void {
  if (!ctx || !master || !noiseBuf) return
  const t = ctx.currentTime
  const src = ctx.createBufferSource()
  const filt = ctx.createBiquadFilter()
  const g = ctx.createGain()
  src.buffer = noiseBuf
  filt.type = 'lowpass'
  filt.frequency.setValueAtTime(f0, t)
  filt.frequency.exponentialRampToValueAtTime(f1, t + dur)
  g.gain.setValueAtTime(vol, t)
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur)
  src.connect(filt).connect(g).connect(master)
  src.start(t)
  src.stop(t + dur + 0.02)
}

const MUSIC_URL = 'https://anya-file-host.vercel.app/w9lsys1ir6'
const MUSIC_VOLUME = 0.18
let track: HTMLAudioElement | null = null
let wantMusic = false
let fadeTimer = 0

function fadeTrack(target: number, done?: () => void): void {
  window.clearInterval(fadeTimer)
  const el = track
  if (!el) return
  fadeTimer = window.setInterval(() => {
    const d = target - el.volume
    if (Math.abs(d) < 0.01) {
      el.volume = target
      window.clearInterval(fadeTimer)
      done?.()
      return
    }
    el.volume = Math.min(1, Math.max(0, el.volume + Math.sign(d) * 0.01))
  }, 40)
}

function syncMusic(): void {
  if (settings.music && wantMusic) {
    if (!track) {
      track = new Audio(MUSIC_URL)
      track.loop = true
      track.preload = 'auto'
      track.volume = 0
      track.addEventListener('error', () => { track = null })
    }
    if (track.paused) void track.play().catch(() => { })
    fadeTrack(MUSIC_VOLUME)
  } else if (track) {
    fadeTrack(0, () => track?.pause())
  }
}

function setMusicActive(active: boolean): void {
  wantMusic = active
  syncMusic()
}

watch(() => settings.music, syncMusic)

function unlock(): void {
  try {
    if (!ctx) {
      const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
      if (!Ctor) return
      ctx = new Ctor()
      master = ctx.createGain()
      master.gain.value = 0.5
      master.connect(ctx.destination)
      noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 0.6, ctx.sampleRate)
      const d = noiseBuf.getChannelData(0)
      for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1
    }
    if (ctx.state === 'suspended') void ctx.resume()
    syncMusic()
  } catch {
    ctx = null
  }
}

function play(n: SfxName): void {
  if (!ctx || !master || !settings.sound) return
  switch (n) {
    case 'laser': tone('sawtooth', 900, 240, 0.09, 0.05); break
    case 'hit': tone('square', 200, 90, 0.07, 0.05); break
    case 'explode': noise(0.5, 0.3, 1200, 90); tone('sine', 120, 40, 0.4, 0.15); break
    case 'error': tone('square', 120, 80, 0.1, 0.05); break
    case 'combo': tone('sine', 660, 660, 0.12, 0.08); tone('sine', 990, 990, 0.18, 0.08, 0.08); break
    case 'damage': noise(0.45, 0.35, 900, 60); tone('sawtooth', 130, 40, 0.35, 0.12); break
    case 'start': tone('sine', 440, 880, 0.25, 0.08); break
    case 'gameover': tone('sawtooth', 330, 55, 0.9, 0.1); noise(0.8, 0.25, 800, 50); break
    case 'enemy': tone('sawtooth', 320, 110, 0.16, 0.05); break
    case 'cheat':
      tone('triangle', 520, 980, 0.16, 0.09); tone('triangle', 980, 640, 0.22, 0.09, 0.14)
      tone('sine', 660, 660, 0.12, 0.07, 0.42); tone('sine', 880, 880, 0.12, 0.07, 0.52); tone('sine', 1320, 1320, 0.28, 0.08, 0.62)
      break
    case 'bonus': tone('sine', 880, 880, 0.12, 0.08); tone('sine', 1320, 1320, 0.2, 0.08, 0.09); noise(0.4, 0.2, 1000, 90); break
  }
}

export function useAudio() {
  return { unlock, play, setMusicActive }
}
