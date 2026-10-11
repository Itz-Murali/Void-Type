import * as THREE from 'three'
import { rand } from '../utils/random'
import { glowTexture } from './textures'

export class ParticleSystem {
  readonly points: THREE.Points
  private geo = new THREE.BufferGeometry()
  private mat: THREE.PointsMaterial
  private tex = glowTexture('255,255,255', 64)
  private pos: Float32Array
  private col: Float32Array
  private base: Float32Array
  private vel: Float32Array
  private life: Float32Array
  private maxLife: Float32Array
  private cursor = 0
  private hadAlive = false

  constructor(private n: number) {
    this.pos = new Float32Array(n * 3)
    this.col = new Float32Array(n * 3)
    this.base = new Float32Array(n * 3)
    this.vel = new Float32Array(n * 3)
    this.life = new Float32Array(n)
    this.maxLife = new Float32Array(n).fill(1)
    this.geo.setAttribute('position', new THREE.BufferAttribute(this.pos, 3).setUsage(THREE.DynamicDrawUsage))
    this.geo.setAttribute('color', new THREE.BufferAttribute(this.col, 3).setUsage(THREE.DynamicDrawUsage))
    this.mat = new THREE.PointsMaterial({
      size: 0.34, map: this.tex, vertexColors: true, transparent: true,
      blending: THREE.AdditiveBlending, depthWrite: false, sizeAttenuation: true
    })
    this.points = new THREE.Points(this.geo, this.mat)
    this.points.frustumCulled = false
  }

  emit(origin: THREE.Vector3, count: number, color: THREE.Color, speed: number, life: number, dir?: THREE.Vector3): void {
    for (let k = 0; k < count; k++) {
      const i = this.cursor
      this.cursor = (this.cursor + 1) % this.n
      const o = i * 3
      const z = rand(-1, 1)
      const a = rand(0, Math.PI * 2)
      const r = Math.sqrt(1 - z * z)
      const ux = r * Math.cos(a), uy = r * Math.sin(a), uz = z
      this.pos[o] = origin.x + ux * 0.15
      this.pos[o + 1] = origin.y + uy * 0.15
      this.pos[o + 2] = origin.z + uz * 0.15
      if (dir) {
        const s = speed * rand(0.6, 1.2)
        this.vel[o] = dir.x * s + ux * speed * 0.25
        this.vel[o + 1] = dir.y * s + uy * speed * 0.25
        this.vel[o + 2] = dir.z * s + uz * speed * 0.25
      } else {
        const s = speed * rand(0.3, 1)
        this.vel[o] = ux * s
        this.vel[o + 1] = uy * s
        this.vel[o + 2] = uz * s
      }
      this.base[o] = color.r
      this.base[o + 1] = color.g
      this.base[o + 2] = color.b
      this.life[i] = this.maxLife[i] = life * rand(0.6, 1.1)
    }
  }

  update(dt: number): void {
    let alive = 0
    const damp = Math.max(0, 1 - 1.8 * dt)
    for (let i = 0; i < this.n; i++) {
      const l = this.life[i] ?? 0
      if (l <= 0) continue
      const o = i * 3
      const nl = l - dt
      this.life[i] = nl
      alive++
      if (nl <= 0) {
        this.col[o] = this.col[o + 1] = this.col[o + 2] = 0
        continue
      }
      const f = nl / (this.maxLife[i] ?? 1)
      for (let c = 0; c < 3; c++) {
        const v = (this.vel[o + c] ?? 0) * damp
        this.vel[o + c] = v
        this.pos[o + c] = (this.pos[o + c] ?? 0) + v * dt
        this.col[o + c] = (this.base[o + c] ?? 0) * f
      }
    }
    if (alive > 0 || this.hadAlive) {
      ;(this.geo.attributes.position as THREE.BufferAttribute).needsUpdate = true
      ;(this.geo.attributes.color as THREE.BufferAttribute).needsUpdate = true
    }
    this.hadAlive = alive > 0
  }

  clear(): void {
    this.life.fill(0)
    this.col.fill(0)
    ;(this.geo.attributes.color as THREE.BufferAttribute).needsUpdate = true
  }

  dispose(): void {
    this.geo.dispose()
    this.tex.dispose()
    this.mat.dispose()
  }
}
