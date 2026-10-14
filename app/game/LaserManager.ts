import * as THREE from 'three'
import { beamTexture, glowTexture } from './textures'

export interface Palette { core: number; rgb: string }
export interface LaserOptions { size?: number; palettes?: Palette[]; width?: number; travel?: number; tail?: number; glow?: number }

interface Bolt {
  root: THREE.Group
  body: THREE.Group
  core: THREE.Mesh
  tailA: THREE.Mesh
  tailB: THREE.Mesh
  head: THREE.Sprite
  active: boolean
  t: number
  dur: number
  from: THREE.Vector3
  to: THREE.Vector3 | null
  cb: (() => void) | null
}
interface Flash { sprite: THREE.Sprite; t: number; active: boolean }
interface Mats { core: THREE.MeshBasicMaterial; tail: THREE.MeshBasicMaterial; head: THREE.SpriteMaterial }

const FLASH_LIFE = 0.1

export class LaserManager {
  readonly group = new THREE.Group()
  private pool: Bolt[] = []
  private flashes: Flash[] = []
  private mats: Mats[] = []
  private owned: { dispose(): void }[] = []
  private travel: number
  private tailLen: number
  private head = new THREE.Vector3()

  constructor(o: LaserOptions = {}) {
    const { size = 24, palettes = [{ core: 0xe8ffff, rgb: '80,225,255' }], width = 0.09, travel = 0.13, tail = 5, glow = 1 } = o
    this.travel = travel
    this.tailLen = tail
    const own = <T extends { dispose(): void }>(v: T): T => (this.owned.push(v), v)

    for (const p of palettes) {
      const beam = own(beamTexture(p.rgb))
      const gl = own(glowTexture(p.rgb, 64))
      this.mats.push({
        core: own(new THREE.MeshBasicMaterial({ color: p.core })),
        tail: own(new THREE.MeshBasicMaterial({ map: beam, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide })),
        head: own(new THREE.SpriteMaterial({ map: gl, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }))
      })
    }
    const coreGeo = own(new THREE.BoxGeometry(width, width, 1))
    const mk = (rotZ: boolean): THREE.PlaneGeometry => {
      const g = own(new THREE.PlaneGeometry(1, 0.55 * glow))
      g.rotateY(Math.PI / 2)
      if (rotZ) g.rotateZ(Math.PI / 2)
      return g
    }
    const gA = mk(false), gB = mk(true)
    const m0 = this.mats[0]!
    for (let i = 0; i < size; i++) {
      const core = new THREE.Mesh(coreGeo, m0.core)
      core.scale.z = 0.35
      core.position.z = 0.325
      const tailA = new THREE.Mesh(gA, m0.tail)
      const tailB = new THREE.Mesh(gB, m0.tail)
      const body = new THREE.Group()
      body.add(tailA, tailB, core)
      const head = new THREE.Sprite(m0.head)
      head.scale.setScalar(0.9 * glow)
      const root = new THREE.Group()
      root.add(body, head)
      root.visible = false
      this.group.add(root)
      this.pool.push({ root, body, core, tailA, tailB, head, active: false, t: 0, dur: travel, from: new THREE.Vector3(), to: null, cb: null })
    }
    for (let i = 0; i < 8; i++) {
      const sprite = new THREE.Sprite(m0.head)
      sprite.visible = false
      this.group.add(sprite)
      this.flashes.push({ sprite, t: 0, active: false })
    }
  }

  fire(from: THREE.Vector3, to: THREE.Vector3, cb: () => void, dur?: number, tier = 0): void {
    const b = this.pool.find((p) => !p.active)
    if (!b) { cb(); return }
    const m = this.mats[Math.min(tier, this.mats.length - 1)]!
    b.core.material = m.core
    b.tailA.material = m.tail
    b.tailB.material = m.tail
    b.head.material = m.head
    b.active = true
    b.t = 0
    b.dur = dur ?? this.travel
    b.from.copy(from)
    b.to = to
    b.cb = cb
    b.root.visible = true
    const f = this.flashes.find((x) => !x.active)
    if (f) {
      f.active = true
      f.t = 0
      f.sprite.material = m.head
      f.sprite.position.copy(from)
      f.sprite.visible = true
    }
  }

  update(dt: number): void {
    for (const b of this.pool) {
      if (!b.active || !b.to) continue
      b.t += dt / b.dur
      const t = Math.min(1, b.t)
      this.head.copy(b.from).lerp(b.to, t)
      const len = Math.min(this.tailLen, this.head.distanceTo(b.from) + 0.3)
      b.root.position.copy(this.head)
      if (this.head.distanceToSquared(b.to) > 1e-4) b.root.lookAt(b.to)
      b.body.scale.z = len
      b.body.position.z = -len / 2
      if (b.t >= 1) {
        b.active = false
        b.root.visible = false
        const cb = b.cb
        b.cb = null
        cb?.()
      }
    }
    for (const f of this.flashes) {
      if (!f.active) continue
      f.t += dt
      const k = f.t / FLASH_LIFE
      if (k >= 1) { f.active = false; f.sprite.visible = false; continue }
      f.sprite.scale.setScalar(2.4 * (1 - k) + 0.2)
    }
  }

  clear(): void {
    for (const b of this.pool) { b.active = false; b.cb = null; b.root.visible = false }
    for (const f of this.flashes) { f.active = false; f.sprite.visible = false }
  }

  dispose(): void { this.owned.forEach((o) => o.dispose()) }
}
