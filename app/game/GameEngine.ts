import * as THREE from 'three'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js'
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js'
import type { AsteroidKind, EngineEvents, Quality, Settings, Stats } from '../types/game'
import { calcAccuracy, calcWpm } from '../utils/wpm'
import { clamp, pick, rand } from '../utils/random'
import type { SpaceEvent } from './Environment'
import { Environment } from './Environment'
import { Spaceship } from './Spaceship'
import { AsteroidManager, KINDS, type Asteroid } from './AsteroidManager'
import { LaserManager } from './LaserManager'
import { ParticleSystem } from './ParticleSystem'
import { ImpactFX } from './ImpactFX'
import { WordManager } from './WordManager'

const QUALITY: Record<Quality, { dpr: number; stars: number; fx: number; bloom: boolean }> = {
  low: { dpr: 1, stars: 250, fx: 0.45, bloom: false },
  medium: { dpr: 1.5, stars: 450, fx: 0.75, bloom: false },
  high: { dpr: 2, stars: 700, fx: 1, bloom: true }
}
function createRenderer(canvas: HTMLCanvasElement, compat: boolean): THREE.WebGLRenderer {
  const attempts: THREE.WebGLRendererParameters[] = compat
    ? [{ antialias: false, powerPreference: 'default', stencil: false }]
    : [
        { antialias: true, powerPreference: 'high-performance' },
        { antialias: false, powerPreference: 'default' },
        { antialias: false, powerPreference: 'low-power', stencil: false, alpha: false }
      ]
  let last: unknown = new Error('WebGL is not available')
  for (const a of attempts) {
    try { return new THREE.WebGLRenderer({ canvas, ...a }) } catch (e) { last = e }
  }
  throw last
}

function detectSoftware(r: THREE.WebGLRenderer): boolean {
  try {
    const gl = r.getContext()
    const ext = gl.getExtension('WEBGL_debug_renderer_info')
    const name = ext ? String(gl.getParameter(ext.UNMASKED_RENDERER_WEBGL)) : ''
    return /swiftshader|llvmpipe|softpipe|software|basic render/i.test(name)
  } catch { return false }
}

const AUTO_STEP = 0.06

type Mode = 'idle' | 'ready' | 'playing' | 'paused' | 'over'

const SHIP_POS = new THREE.Vector3(0, -2.6, 0)
const CAM_LOOK = new THREE.Vector3(0, -1.6, -10)

interface RoundState {
  score: number; combo: number; maxCombo: number; shield: number; destroyed: number
  correct: number; incorrect: number; elapsed: number; bonusUntil: number; level: number
  errorPulse: number; damagePulse: number; alertPulse: number; healPulse: number; eventPulse: number; eventText: string
  slowUntil: number; overUntil: number
}
const freshRound = (): RoundState => ({
  score: 0, combo: 0, maxCombo: 0, shield: 100, destroyed: 0, correct: 0, incorrect: 0,
  elapsed: 0, bonusUntil: 0, level: 1, errorPulse: 0, damagePulse: 0, alertPulse: 0, healPulse: 0, eventPulse: 0, eventText: '', slowUntil: 0, overUntil: 0
})

export class GameEngine {
  private renderer: THREE.WebGLRenderer
  private scene = new THREE.Scene()
  private camera = new THREE.PerspectiveCamera(55, 1, 0.1, 900)
  private composer: EffectComposer | null = null
  private env!: Environment
  private ship!: Spaceship
  private asteroids = new AsteroidManager()
  private lasers = new LaserManager({ palettes: [{ core: 0xe8ffff, rgb: '80,225,255' }, { core: 0xfff4d0, rgb: '255,205,90' }, { core: 0xffe6ff, rgb: '210,120,255' }], tail: 6 })
  private hostile = new LaserManager({ size: 16, palettes: [{ core: 0xffe0e0, rgb: '255,60,70' }], width: 0.12, travel: 1, tail: 3.5, glow: 1.6 })
  private particles = new ParticleSystem(1400)
  private words = new WordManager()
  private envMap: THREE.WebGLRenderTarget | null = null
  private flash = new THREE.PointLight(0xffb070, 0, 45, 2)
  private colors = new Map<string, THREE.Color>()
  private tmp = new THREE.Vector3()
  private back = new THREE.Vector3(0, 0, 1)
  private v1 = new THREE.Vector3()
  private v2 = new THREE.Vector3()
  private impactFx!: ImpactFX
  private software = false
  private launch = 0
  private launchOn = false
  private crateTimer = rand(30, 45)
  private cheat = false
  private autoClock = 0

  private mode: Mode = 'idle'
  private s: RoundState = freshRound()
  private target: Asteroid | null = null
  private q = QUALITY.medium
  private reduced = false
  private w = 1
  private h = 1
  private raf = 0
  private last = 0
  private time = 0
  private spawnTimer = 0
  private ambientTimer = 0
  private statsClock = 0
  private shake = 0
  private overTimer = 0
  private resultsSent = false
  private dirty = false
  private muzzle = false
  private kick = 0
  private warp = 0
  private baseFov = 55
  private lastQuality: Quality | null = null
  private eventTimer = rand(18, 28)
  private ambientEvent = rand(10, 18)
  private labelScene = new THREE.Scene()

  constructor(private canvas: HTMLCanvasElement, private ev: EngineEvents, settings: Settings, compat = false) {
    this.renderer = createRenderer(canvas, compat)
    try { this.init(settings, compat) } catch (e) { this.renderer.dispose(); throw e }
  }

  private init(settings: Settings, compat: boolean): void {
    this.software = compat || detectSoftware(this.renderer)
    this.renderer.setClearColor(0x03050a, 1)
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping

    const key = new THREE.DirectionalLight(0xbfe4ff, 2.2)
    key.position.set(-6, 9, 8)
    const rim = new THREE.DirectionalLight(0xffd6a0, 1.7)
    rim.position.set(8, 4, -8)
    this.env = new Environment()
    this.ship = new Spaceship(SHIP_POS)
    this.impactFx = new ImpactFX(this.ship.group.position, this.particles)
    if (!this.software) {
      try {
        const pmrem = new THREE.PMREMGenerator(this.renderer)
        this.envMap = pmrem.fromScene(new RoomEnvironment(), 0.04)
        pmrem.dispose()
        this.scene.environment = this.envMap.texture
        this.scene.environmentIntensity = 0.3
      } catch { this.envMap = null }
    }
    this.scene.add(new THREE.AmbientLight(0x4a5a7a, this.envMap ? 0.6 : 1.8), key, rim, this.env.group, this.ship.group,
      this.asteroids.group, this.lasers.group, this.hostile.group, this.particles.points, this.impactFx.group, this.flash)
    this.camera.position.set(0, 3, 9)
    this.labelScene.add(this.asteroids.labels)
    this.asteroids.onFire = (a, i) => this.enemyFire(a, i)

    this.applySettings(settings)
    this.last = performance.now()
    this.raf = requestAnimationFrame(this.loop)
  }

  applySettings(s: Settings): void {
    const quality: Quality = this.software ? 'low' : s.quality
    this.q = QUALITY[quality]
    this.reduced = s.reducedMotion
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, this.q.dpr))
    this.env.setCount(this.q.stars)
    if (this.lastQuality !== quality) {
      this.lastQuality = quality
      this.composer?.dispose()
      this.composer = null
      if (this.q.bloom) {
        try {
          const c = new EffectComposer(this.renderer)
          c.addPass(new RenderPass(this.scene, this.camera))
          c.addPass(new UnrealBloomPass(new THREE.Vector2(this.w, this.h), 0.5, 0.6, 0.85))
          c.addPass(new OutputPass())
          this.composer = c
        } catch { this.composer = null }
      }
    }
    this.applySize()
  }

  resize(w: number, h: number): void {
    this.w = Math.max(1, Math.floor(w))
    this.h = Math.max(1, Math.floor(h))
    this.applySize()
  }

  private applySize(): void {
    this.renderer.setSize(this.w, this.h, false)
    this.camera.aspect = this.w / this.h
    const ar = this.camera.aspect
    this.baseFov = ar < 0.75 ? 74 : ar < 1.1 ? 64 : 55
    this.camera.fov = this.baseFov
    this.camera.updateProjectionMatrix()
    this.composer?.setPixelRatio(this.renderer.getPixelRatio())
    this.composer?.setSize(this.w, this.h)
  }

  prepare(): void {
    this.resetRound()
    this.mode = 'ready'
  }

  startRound(): void {
    this.resetRound()
    this.mode = 'playing'
    this.spawnTimer = 2
    if (this.cheat) this.cheatBurst()
  }

  setCheat(on: boolean): void {
    if (this.cheat === on) return
    this.cheat = on
    this.autoClock = 0
    this.ship.setTurbo(on)
    if (on) {
      this.cheatBurst()
      this.ev.onSfx('cheat')
    }
  }

  private cheatBurst(): void {
    const p = this.ship.group.position
    this.warp = 1
    this.kick = 1
    this.addShake(0.3)
    this.impactFx.explode(p, 1.2, this.fx(), false)
    this.particles.emit(p, Math.round(60 * this.fx()), this.color('#ff7ad9'), 9, 1)
    this.particles.emit(p, Math.round(40 * this.fx()), this.color('#7ef0ff'), 7, 0.9)
    this.flash.position.copy(p)
    this.flash.color.set(0xff7ad9)
    this.flash.intensity = 9
  }

  setLaunch(on: boolean): void { this.launchOn = on }

  pause(): void { if (this.mode === 'playing') this.mode = 'paused' }
  resume(): void { if (this.mode === 'paused') { this.mode = 'playing'; this.last = performance.now() } }

  toMenu(): void {
    this.resetRound()
    this.mode = 'idle'
  }

  private resetRound(): void {
    this.s = freshRound()
    this.target = null
    this.asteroids.clear()
    this.lasers.clear()
    this.hostile.clear()
    this.impactFx.clear()
    this.kick = 0
    this.warp = 0
    this.particles.clear()
    this.ship.group.visible = true
    this.ship.setAim(0)
    this.shake = 0
    this.overTimer = 0
    this.resultsSent = false
    this.eventTimer = rand(20, 32)
    this.crateTimer = rand(30, 45)
    this.flash.intensity = 0
    this.dirty = true
  }

  dispose(): void {
    cancelAnimationFrame(this.raf)
    this.asteroids.dispose()
    this.lasers.dispose()
    this.hostile.dispose()
    this.impactFx.dispose()
    this.particles.dispose()
    this.ship.dispose()
    this.env.dispose()
    this.flash.dispose()
    this.envMap?.dispose()
    this.composer?.dispose()
    this.renderer.dispose()
    this.renderer.forceContextLoss()
  }

  handleChar(ch: string): void {
    if (this.mode !== 'playing' || this.cheat || !/^[a-zA-Z]$/.test(ch)) return
    const c = ch.toUpperCase()
    if (!this.target) {
      let best: Asteroid | null = null
      for (const a of this.asteroids.active) {
        if (a.ambient || a.dying || a.word[a.typed] !== c) continue
        if (!best || a.mesh.position.z > best.mesh.position.z) best = a
      }
      if (!best) return this.miss()
      this.setTarget(best)
    }
    const t = this.target!
    if (t.word[t.typed] !== c) return this.miss()
    this.hitChar(t)
  }

  private setTarget(a: Asteroid | null): void {
    this.target = a
    this.asteroids.setTarget(a)
  }

  private miss(): void {
    this.s.incorrect++
    this.s.combo = 0
    this.s.errorPulse++
    this.addShake(0.04)
    this.ev.onSfx('error')
    this.dirty = true
  }

  private hitChar(a: Asteroid): void {
    const s = this.s
    a.typed++
    s.correct++
    s.combo++
    s.maxCombo = Math.max(s.maxCombo, s.combo)
    s.score += Math.round(10 * this.mult())
    const final = a.typed >= a.word.length
    if (final) a.dying = true
    this.asteroids.refresh(a)

    const muzzle = (this.muzzle = !this.muzzle) ? this.ship.muzzleL : this.ship.muzzleR
    muzzle.getWorldPosition(this.tmp)
    this.particles.emit(this.tmp, Math.round(3 * this.fx()), this.color('#7ef0ff'), 3, 0.25, this.tmp.clone().sub(this.ship.group.position).normalize())
    a.pending++
    this.lasers.fire(this.tmp, a.mesh.position, () => this.onLaserArrive(a, final), undefined, s.combo >= 25 ? 2 : s.combo >= 10 ? 1 : 0)
    this.ship.setAim(clamp(a.mesh.position.x * 0.25, -3, 3))
    this.addShake(0.008)
    this.ev.onSfx('laser')
    if (s.elapsed < s.overUntil || this.cheat) {
      ;(this.muzzle ? this.ship.muzzleR : this.ship.muzzleL).getWorldPosition(this.v1)
      this.lasers.fire(this.v1, a.mesh.position, () => this.impactFx.flare(a.mesh.position, 1.6), undefined, 2)
    }

    if (s.combo % 10 === 0) { this.ev.onSfx('combo'); this.addShake(0.1) }
    this.dirty = true
  }

  private onLaserArrive(a: Asteroid, final: boolean): void {
    if (a.removed) return
    a.pending = Math.max(0, a.pending - 1)
    a.flash = 1
    this.impactFx.flare(a.mesh.position, 2.4)
    this.particles.emit(a.mesh.position, Math.round(7 * this.fx()), this.color(KINDS[a.kind].accent), 5, 0.45)
    this.addShake(0.015)
    if (!final) this.ev.onSfx('hit')
    if (a.dying && a.pending === 0) this.destroy(a)
  }

  private destroy(a: Asteroid): void {
    const s = this.s
    const cfg = KINDS[a.kind]
    const pos = a.mesh.position
    this.particles.emit(pos, Math.round(26 * this.fx()), this.color('#9aa7b8'), 9, 0.9)
    this.particles.emit(pos, Math.round(18 * this.fx()), this.color(cfg.accent), 6, 0.7)
    this.impactFx.explode(pos, a.enemy ? 1.15 : 0.5, this.fx(), true)
    this.flash.position.copy(pos)
    this.flash.color.set(0xffb070)
    this.flash.intensity = 7
    this.addShake(0.1)
    this.ev.onSfx(a.kind === 'bonus' || a.kind === 'shield' || a.kind === 'crate' ? 'bonus' : 'explode')
    s.destroyed++
    if (a.kind === 'shield') this.healShip(25)
    if (a.kind === 'crate') this.grantPower()
    s.score += Math.round(a.word.length * 15 * cfg.points * this.mult())
    if (a.kind === 'bonus') s.bonusUntil = s.elapsed + 8
    this.asteroids.remove(a)
    if (this.target === a) this.setTarget(null)
    this.ship.setAim(0)
    this.dirty = true
  }

  private mult(): number {
    const combo = 1 + Math.min(Math.floor(this.s.combo / 10), 9) * 0.25
    return combo * (this.s.elapsed < this.s.bonusUntil ? 2 : 1) * (this.s.elapsed < this.s.overUntil ? 2 : 1) * (this.cheat ? 2 : 1)
  }

  private skill(): number { return clamp(calcWpm(this.s.correct, this.s.elapsed) / 50, 0.4, 1.6) }

  private levelNow(): number {
    return 1 + Math.floor((this.s.elapsed / 26 + this.s.destroyed / 9) * (0.8 + 0.3 * this.skill()))
  }

  private pickKind(level: number, enemies: number, guardians: number, crates: number): AsteroidKind {
    const r = Math.random()
    if (level >= 2 && crates === 0 && this.crateTimer <= 0) { this.crateTimer = rand(40, 60); return 'crate' }
    const hull = this.s.shield
    if (level >= 2 && guardians === 0 && Math.random() < (hull < 60 ? 0.35 : hull < 90 ? 0.14 : 0.025)) return 'shield'
    if (enemies < (level >= 7 ? 2 : 1)) {
      if (level >= 6 && r < 0.1) return 'gunship'
      if (level >= 3 && r < 0.22) return 'fighter'
    }
    if (level >= 4 && r < 0.1) return 'danger'
    if (level >= 3 && r < 0.25) return 'armored'
    if (level >= 2 && r < 0.38) return 'fast'
    if (level >= 2 && r < 0.45) return 'bonus'
    return 'normal'
  }

  private spawnReal(level: number): void {
    const enemies = this.asteroids.active.filter((a) => a.enemy).length
    const guardians = this.asteroids.active.filter((a) => a.kind === 'shield').length
    const crates = this.asteroids.active.filter((a) => a.kind === 'crate').length
    const kind = this.pickKind(level, enemies, guardians, crates)
    const taken = new Set(this.asteroids.active.map((a) => a.word[0] ?? ''))
    const word = this.words.next(kind, level, taken)
    const speed = (3.1 + level * 0.34) * (0.88 + 0.2 * this.skill()) * KINDS[kind].speed
    this.asteroids.spawn(kind, word, speed, SHIP_POS)
    if (kind === 'fighter' || kind === 'gunship') {
      this.s.alertPulse++
      this.dirty = true
      this.ev.onSfx('enemy')
    }
  }

  private impact(a: Asteroid): void {
    const s = this.s
    const cfg = KINDS[a.kind]
    if (cfg.damage > 0) {
      s.shield = Math.max(0, s.shield - cfg.damage)
      s.combo = 0
      s.damagePulse++
      this.addShake(0.55)
      this.flash.position.copy(a.mesh.position)
      this.flash.color.set(0xff3a4a)
      this.flash.intensity = 8
      this.particles.emit(a.mesh.position, Math.round(30 * this.fx()), this.color('#ff5a64'), 8, 0.8)
      this.hitShip(a.mesh.position, cfg.damage / 35)
      this.ev.onSfx('damage')
    } else {
      this.particles.emit(a.mesh.position, Math.round(10 * this.fx()), this.color(cfg.accent), 4, 0.5)
    }
    if (this.target === a) this.setTarget(null)
    this.asteroids.remove(a)
    this.dirty = true
    if (s.shield <= 0) this.gameOver()
  }

  private gameOver(): void {
    this.mode = 'over'
    this.overTimer = 0
    this.setTarget(null)
    this.ship.group.visible = false
    this.impactFx.explode(this.ship.group.position, 1.8, this.fx(), true)
    this.particles.emit(this.ship.group.position, Math.round(70 * this.fx()), this.color('#7ef0ff'), 11, 1.2)
    this.particles.emit(this.ship.group.position, Math.round(40 * this.fx()), this.color('#ffb070'), 8, 1)
    this.flash.position.copy(this.ship.group.position)
    this.flash.color.set(0xffb070)
    this.flash.intensity = 10
    this.addShake(0.8)
    this.ev.onSfx('gameover')
    this.ev.onStats(this.snapshot())
    this.ev.onOver()
  }

  private loop = (now: number): void => {
    this.raf = requestAnimationFrame(this.loop)
    const dt = Math.min((now - this.last) / 1000, 0.05)
    this.last = now
    this.update(dt)
    if (this.composer) this.composer.render()
    else this.renderer.render(this.scene, this.camera)
    this.renderer.autoClear = false
    this.renderer.clearDepth()
    this.renderer.render(this.labelScene, this.camera)
    this.renderer.autoClear = true
  }

  private update(dt: number): void {
    if (this.mode !== 'paused') {
      this.time += dt
      this.launch += ((this.launchOn ? 1 : 0) - this.launch) * Math.min(1, dt * 3)
      const playing = this.mode === 'playing'
      this.env.update(dt, (playing ? 7 : 2.5) * (this.cheat ? 2 : 1) + this.warp * 30 + this.launch * 55)
      this.ship.update(this.time, dt)
      if (playing) this.stepPlay(dt)
      else if (this.mode === 'idle' || this.mode === 'ready') this.stepAmbient(dt)
      else if (this.mode === 'over') {
        this.overTimer += dt
        if (this.overTimer > 1.8 && !this.resultsSent) {
          this.resultsSent = true
          this.ev.onResults(this.snapshot())
        }
      }
      const gdt = this.mode === 'playing' && this.s.elapsed < this.s.slowUntil ? dt * 0.4 : dt
      this.asteroids.update(gdt, this.camera, this.mode !== 'over', this.h, this.camera.fov)
      this.lasers.update(dt)
      this.hostile.update(gdt)
      this.particles.update(dt)
      this.impactFx.update(dt)
      this.flash.intensity = Math.max(0, this.flash.intensity - dt * 18)
      this.shake = Math.max(0, this.shake - dt * 2.2)
      this.kick = Math.max(0, this.kick - dt * 4)
      this.warp = Math.max(0, this.warp - dt * 1.6)
    }
    const amp = this.shake * (this.reduced ? 0.15 : 1)
    this.camera.position.set(
      this.ship.x * 0.15 + (Math.sin(this.time * 47) * 0.6 + Math.sin(this.time * 31) * 0.4) * amp * 0.5,
      3 + (Math.sin(this.time * 41) * 0.6 + Math.sin(this.time * 27) * 0.4) * amp * 0.5,
      9
    )
    this.camera.lookAt(CAM_LOOK)
    const fov = this.baseFov + this.launch * (this.reduced ? 4 : 18) + (this.reduced ? 0 : this.kick * 3)
    if (Math.abs(fov - this.camera.fov) > 0.01) {
      this.camera.fov = fov
      this.camera.updateProjectionMatrix()
    }
  }

  private stepPlay(dt: number): void {
    const s = this.s
    s.elapsed += dt
    const level = this.levelNow()
    if (level > s.level) {
      s.level = level
      this.addShake(0.12)
      this.ev.onSfx('combo')
      this.dirty = true
    }
    if (this.cheat) this.autoPilot(dt)
    const skill = this.skill()
    const every = clamp(3.6 - level * 0.22, 0.9, 3.6) / (0.9 + 0.15 * skill)
    const max = Math.min(1 + Math.floor((level - 1) / 2), 5)
    this.spawnTimer += dt
    const live = this.asteroids.active.filter((a) => !a.enemy).length
    if (live < max && (this.spawnTimer >= every || (live === 0 && this.spawnTimer > 0.5))) {
      this.spawnTimer = 0
      this.spawnReal(level)
    }
    for (let i = this.asteroids.active.length - 1; i >= 0; i--) {
      const a = this.asteroids.active[i]!
      if (!a.dying && a.mesh.position.distanceTo(SHIP_POS) < a.radius + 1) {
        this.impact(a)
        if (this.mode !== 'playing') return
      }
    }
    const fx = this.fx()
    for (const side of [-0.48, 0.48]) {
      this.tmp.set(this.ship.x + side, SHIP_POS.y + 0.12, 1.55)
      this.particles.emit(this.tmp, fx > 0.5 ? 2 : 1, this.color('#a67bff'), 2.2, 0.4, this.back)
    }
    this.eventTimer -= dt
    this.crateTimer -= dt
    if (this.eventTimer <= 0) this.fireEvent(true)
    this.statsClock += dt
    if (this.statsClock > 0.1) { this.statsClock = 0; this.dirty = true }
    if (this.dirty) { this.dirty = false; this.ev.onStats(this.snapshot()) }
  }

  private autoPick(): Asteroid | null {
    let best: Asteroid | null = null
    let bestScore = Infinity
    for (const a of this.asteroids.active) {
      if (a.ambient || a.dying || a.removed || a.typed >= a.word.length) continue
      const score = a.mesh.position.distanceTo(SHIP_POS) - (a.enemy ? 10 : 0) - (a.kind === 'danger' ? 4 : 0)
      if (score < bestScore) { bestScore = score; best = a }
    }
    return best
  }

  private autoPilot(dt: number): void {
    this.autoClock = Math.min(this.autoClock + dt, AUTO_STEP * 3)
    while (this.autoClock >= AUTO_STEP && this.mode === 'playing') {
      this.autoClock -= AUTO_STEP
      let t = this.target
      if (!t || t.dying || t.removed) {
        t = this.autoPick()
        if (!t) { this.autoClock = 0; return }
        this.setTarget(t)
      }
      this.hitChar(t)
    }
  }

  private stepAmbient(dt: number): void {
    this.ambientTimer += dt
    this.ambientEvent -= dt
    if (this.ambientEvent <= 0) this.fireEvent(false)
    const count = this.asteroids.active.length
    if (this.ambientTimer > 1.6 && count < 6) {
      this.ambientTimer = 0
      const side = Math.random() < 0.5 ? -1 : 1
      this.tmp.set(side * rand(14, 22), -2, 4)
      this.asteroids.spawn('normal', '', 2.4, this.tmp, true)
    }
    if (this.dirty) { this.dirty = false; this.ev.onStats(this.snapshot()) }
  }

  private grantPower(): void {
    const s = this.s
    const kind = pick(['slow', 'overdrive', 'nova'] as const)
    if (kind === 'slow') { s.slowUntil = s.elapsed + 6; this.announce('SLOW-TIME') }
    else if (kind === 'overdrive') { s.overUntil = s.elapsed + 8; this.announce('OVERDRIVE') }
    else { this.announce('NOVA BOMB'); this.novaBlast() }
  }

  private announce(text: string): void {
    this.s.eventPulse++
    this.s.eventText = text
    this.dirty = true
  }

  private novaBlast(): void {
    this.hostile.clear()
    this.impactFx.explode(this.ship.group.position, 2.2, this.fx(), false)
    this.flash.position.set(0, 2, -4)
    this.flash.color.set(0xcfe6ff)
    this.flash.intensity = 12
    this.addShake(0.3)
    for (const t of [...this.asteroids.active]) {
      if (t.ambient || t.dying || t.removed || t.kind === 'crate') continue
      t.dying = true
      this.destroy(t)
    }
  }

  private healShip(amount: number): void {
    const s = this.s
    s.shield = Math.min(100, s.shield + amount)
    s.healPulse++
    this.particles.emit(this.ship.group.position, Math.round(40 * this.fx()), this.color('#4dffc3'), 6, 0.9)
    this.flash.position.copy(this.ship.group.position)
    this.flash.color.set(0x4dffc3)
    this.flash.intensity = 5
    this.dirty = true
  }

  private enemyFire(a: Asteroid, i: number): void {
    if (this.mode !== 'playing') return
    this.tmp.copy(a.mesh.position)
    if (a.enemy && a.enemy.burst > 1) this.tmp.x += (i - (a.enemy.burst - 1) / 2) * 1.2
    const dur = Math.max(0.5, this.tmp.distanceTo(this.ship.group.position) / 22)
    const origin = this.tmp.clone()
    this.hostile.fire(this.tmp, this.ship.group.position, () => this.onHostileHit(a.kind, origin), dur)
    this.ev.onSfx('enemy')
  }

  private onHostileHit(kind: AsteroidKind, origin: THREE.Vector3): void {
    if (this.mode !== 'playing') return
    const s = this.s
    s.shield = Math.max(0, s.shield - (kind === 'gunship' ? 10 : 7))
    s.combo = 0
    s.damagePulse++
    this.addShake(0.4)
    this.flash.position.copy(this.ship.group.position)
    this.flash.color.set(0xff3a4a)
    this.flash.intensity = 6
    this.particles.emit(this.ship.group.position, Math.round(18 * this.fx()), this.color('#ff5a64'), 6, 0.6)
    this.hitShip(origin, kind === 'gunship' ? 0.45 : 0.3)
    this.ev.onSfx('damage')
    this.dirty = true
    if (s.shield <= 0) this.gameOver()
  }

  private hitShip(from: THREE.Vector3, power: number): void {
    const sp = this.ship.group.position
    this.v1.copy(from).sub(sp).normalize()
    this.v2.copy(this.v1).multiplyScalar(2).add(sp)
    this.impactFx.shipHit(this.v2, power, this.fx())
    this.ship.hit(this.v1.x, power)
  }

  private fireEvent(announce: boolean): void {
    const names: Record<SpaceEvent, string> = { meteors: 'METEOR SHOWER', flare: 'SOLAR FLARE', supernova: 'SUPERNOVA', ion: 'ION STORM', singularity: 'SINGULARITY DETECTED' }
    const kind = pick(Object.keys(names) as SpaceEvent[])
    this.env.trigger(kind)
    if (kind === 'flare') {
      this.flash.color.set(0xffd9a0)
      this.flash.position.set(8, 6, -10)
      this.flash.intensity = 3
    }
    if (announce) {
      this.s.eventPulse++
      this.s.eventText = names[kind]
      this.dirty = true
      this.eventTimer = rand(28, 45)
    } else this.ambientEvent = rand(14, 24)
  }

  private fx(): number { return this.q.fx * (this.reduced ? 0.5 : 1) }
  private addShake(v: number): void { this.shake = Math.min(1, this.shake + v) }
  private color(css: string): THREE.Color {
    let c = this.colors.get(css)
    if (!c) { c = new THREE.Color(css); this.colors.set(css, c) }
    return c
  }

  private snapshot(): Stats {
    const s = this.s
    const slowLeft = Math.max(0, (s.slowUntil - s.elapsed) / 6)
    const overLeft = Math.max(0, (s.overUntil - s.elapsed) / 8)
    return {
      power: overLeft > 0 && overLeft >= slowLeft ? 'OVERDRIVE' : slowLeft > 0 ? 'SLOW-TIME' : '',
      powerLeft: Math.max(slowLeft, overLeft),
      score: s.score, wpm: calcWpm(s.correct, s.elapsed), accuracy: calcAccuracy(s.correct, s.incorrect),
      combo: s.combo, maxCombo: s.maxCombo, shield: Math.max(0, Math.round(s.shield)), level: s.level,
      destroyed: s.destroyed, correct: s.correct, incorrect: s.incorrect,
      bonusActive: s.elapsed < s.bonusUntil, elapsed: s.elapsed,
      errorPulse: s.errorPulse, damagePulse: s.damagePulse, alertPulse: s.alertPulse, healPulse: s.healPulse, eventPulse: s.eventPulse, eventText: s.eventText
    }
  }
}
