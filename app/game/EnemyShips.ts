import * as THREE from 'three'
import type { AsteroidKind } from '../types/game'
import { pick } from '../utils/random'
import { flameMaterial, makeFlameGeometry, tickFlames } from './Flame'
import { glowTexture } from './textures'

export interface EnemyBuild {
  group: THREE.Group
  hull: THREE.MeshStandardMaterial
  amp: number; freq: number; interval: number; burst: number
}

type Variant = 'razor' | 'viper' | 'wraith' | 'reaper' | 'marauder'

const SPECS: Record<Variant, { color: number; glow: number; flame: [number, number]; amp: number; freq: number; interval: number; burst: number }> = {
  razor: { color: 0x34262e, glow: 0xff3040, flame: [0xffd0c0, 0xff2a2a], amp: 3.6, freq: 1.1, interval: 2.5, burst: 1 },
  viper: { color: 0x20332a, glow: 0x5dff6a, flame: [0xe8ffd0, 0x2fff5a], amp: 5.2, freq: 1.5, interval: 2.2, burst: 1 },
  wraith: { color: 0x2a2244, glow: 0xb084ff, flame: [0xf0e0ff, 0x8a4aff], amp: 2.6, freq: 0.8, interval: 3.0, burst: 1 },
  reaper: { color: 0x44202a, glow: 0xffa030, flame: [0xfff0c0, 0xff7a10], amp: 2.2, freq: 0.6, interval: 4.2, burst: 2 },
  marauder: { color: 0x3a2046, glow: 0xff40a8, flame: [0xffe0f0, 0xff2a9a], amp: 1.6, freq: 0.5, interval: 6.0, burst: 3 }
}
const FIGHTERS: Variant[] = ['razor', 'viper', 'wraith']
const GUNSHIPS: Variant[] = ['reaper', 'marauder']

export class EnemyFactory {
  private geos = new Map<string, THREE.BufferGeometry>()
  private glows = new Map<Variant, THREE.MeshBasicMaterial>()
  private flames = new Map<Variant, THREE.ShaderMaterial>()
  private halos = new Map<Variant, THREE.SpriteMaterial>()
  private dark = new THREE.MeshStandardMaterial({ color: 0x120e16, metalness: 0.75, roughness: 0.4 })
  private flameGeo = makeFlameGeometry()
  private tex = glowTexture('255,255,255', 64)

  private geo(key: string, make: () => THREE.BufferGeometry): THREE.BufferGeometry {
    let g = this.geos.get(key)
    if (!g) { g = make(); this.geos.set(key, g) }
    return g
  }
  private box = (w: number, h: number, d: number) => this.geo(`b${w},${h},${d}`, () => new THREE.BoxGeometry(w, h, d))
  private coneF = (r: number, h: number) => this.geo(`cf${r},${h}`, () => { const g = new THREE.ConeGeometry(r, h, 6); g.rotateX(Math.PI / 2); return g })
  private coneB = (r: number, h: number) => this.geo(`cb${r},${h}`, () => { const g = new THREE.ConeGeometry(r, h, 6); g.rotateX(-Math.PI / 2); return g })
  private coneU = (r: number, h: number) => this.geo(`cu${r},${h}`, () => new THREE.ConeGeometry(r, h, 5))
  private cyl = (r1: number, r2: number, h: number) => this.geo(`c${r1},${r2},${h}`, () => { const g = new THREE.CylinderGeometry(r1, r2, h, 10); g.rotateX(Math.PI / 2); return g })
  private sphere = (r: number) => this.geo(`s${r}`, () => new THREE.SphereGeometry(r, 14, 10))
  private torus = (r: number, t: number) => this.geo(`t${r},${t}`, () => new THREE.TorusGeometry(r, t, 8, 24))
  private lathe = (key: string, pts: [number, number][]) => this.geo(`l${key}`, () => {
    const g = new THREE.LatheGeometry(pts.map(([r, y]) => new THREE.Vector2(r, y)), 18)
    g.rotateX(Math.PI / 2)
    return g
  })

  private glow(v: Variant): THREE.MeshBasicMaterial {
    let m = this.glows.get(v)
    if (!m) { m = new THREE.MeshBasicMaterial({ color: SPECS[v].glow }); this.glows.set(v, m) }
    return m
  }
  private flame(v: Variant): THREE.ShaderMaterial {
    let m = this.flames.get(v)
    if (!m) { m = flameMaterial(SPECS[v].flame[0], SPECS[v].flame[1], Math.random() * 6); this.flames.set(v, m) }
    return m
  }
  private halo(v: Variant): THREE.SpriteMaterial {
    let m = this.halos.get(v)
    if (!m) {
      m = new THREE.SpriteMaterial({ map: this.tex, color: SPECS[v].glow, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, opacity: 0.8 })
      this.halos.set(v, m)
    }
    return m
  }

  build(kind: AsteroidKind): EnemyBuild {
    const v = pick(kind === 'gunship' ? GUNSHIPS : FIGHTERS)
    const spec = SPECS[v]
    const hull = new THREE.MeshStandardMaterial({ color: spec.color, metalness: 0.78, roughness: 0.36, emissive: spec.glow, emissiveIntensity: 0.12 })
    const glow = this.glow(v)
    const dark = this.dark
    const g = new THREE.Group()
    const add = (geo: THREE.BufferGeometry, mat: THREE.Material, x: number, y: number, z: number, rx = 0, ry = 0, rz = 0): THREE.Mesh => {
      const m = new THREE.Mesh(geo, mat)
      m.position.set(x, y, z)
      m.rotation.set(rx, ry, rz)
      g.add(m)
      return m
    }
    const engine = (x: number, y: number, z: number, len: number, rad: number): void => {
      const f = new THREE.Mesh(this.flameGeo, this.flame(v))
      f.scale.set(rad, rad, len)
      f.rotation.y = Math.PI
      f.position.set(x, y, z - len / 2)
      g.add(f)
      const h = new THREE.Sprite(this.halo(v))
      h.position.set(x, y, z - 0.05)
      h.scale.setScalar(rad * 5)
      g.add(h)
    }

    if (v === 'razor') {
      add(this.lathe('razor', [[0, -1.4], [0.22, -1.4], [0.3, -0.6], [0.28, 0.5], [0.12, 1.4], [0, 2.1]]), hull, 0, 0, 0).scale.y = 0.55
      add(this.coneF(0.05, 0.8), dark, 0, 0, 2.4)
      add(this.box(0.04, 0.4, 0.9), dark, 0, 0.28, -0.5)
      add(this.box(0.12, 0.05, 0.5), glow, 0, 0.14, 0.9)
      for (const s of [-1, 1]) {
        add(this.box(1.7, 0.04, 0.6), hull, s * 1.0, 0, -0.5, 0, s * 0.65, 0)
        add(this.box(1.3, 0.03, 0.25), dark, s * 1.15, 0.03, -0.75, 0, s * 0.65, 0)
        add(this.coneB(0.09, 0.9), dark, s * 1.75, 0, -1.0)
        add(this.box(1.5, 0.02, 0.05), glow, s * 0.95, 0.03, -0.2, 0, s * 0.65, 0)
        add(this.coneF(0.07, 0.9), dark, s * 0.2, -0.15, 1.0)
        add(this.coneB(0.05, 0.5), dark, s * 0.3, 0.18, -0.6)
        add(this.box(0.16, 0.035, 0.06), glow, s * 0.13, 0.1, 0.95, 0, 0, s * 0.35)
        engine(s * 0.16, 0, -1.4, 1.7, 0.13)
      }
    } else if (v === 'viper') {
      add(this.lathe('viper', [[0, -1.2], [0.18, -1.2], [0.26, 0], [0.2, 1], [0, 2.6]]), hull, 0, 0, 0)
      add(this.torus(0.28, 0.035), glow, 0, 0, 0.3)
      add(this.sphere(0.14), glow, 0, 0, 0.3)
      add(this.coneB(0.08, 1.6), dark, 0, 0, -1.9)
      for (const sx of [-1, 1]) {
        add(this.box(0.05, 0.05, 0.9), dark, sx * 0.14, -0.05, 2.1, 0, sx * 0.2, 0)
        for (const sy of [-1, 1]) {
          const rz = -sx * sy * 0.785
          add(this.box(0.06, 1.0, 1.2), hull, sx * 0.5, sy * 0.38, -0.3, 0, sx * 0.25, rz)
          add(this.box(0.03, 0.9, 0.08), glow, sx * 0.52, sy * 0.4, 0.3, 0, 0, rz)
          add(this.coneB(0.06, 0.8), dark, sx * 0.95, sy * 0.78, -0.9)
        }
      }
      engine(0, 0, -1.25, 2.0, 0.2)
    } else if (v === 'wraith') {
      add(this.sphere(0.4), hull, 0, 0, 0).scale.set(1, 0.7, 1.6)
      add(this.sphere(0.16), glow, 0, 0.08, 0.55)
      add(this.torus(0.24, 0.03), glow, 0, 0.08, 0.6)
      for (let i = -3; i <= 3; i++) {
        if (i === 0) continue
        const k = Math.abs(i)
        const z = -0.12 * k * k
        add(this.box(0.62, 0.05, 0.5), hull, i * 0.55, 0, z, 0, i * 0.25, 0)
        add(this.box(0.5, 0.02, 0.04), glow, i * 0.55, 0.04, z + 0.2, 0, i * 0.25, 0)
      }
      for (let i = -2; i <= 2; i++) add(this.coneU(0.06, 0.45), dark, i * 0.28, 0.32, -0.05 - Math.abs(i) * 0.1)
      for (const s of [-1, 1]) {
        add(this.coneB(0.12, 1.2), hull, s * 1.9, 0, -1.65)
        add(this.coneB(0.04, 1.0), dark, s * 0.25, -0.05, -1.1, 0, s * 0.15, 0)
      }
      engine(0, 0, -0.9, 1.8, 0.2)
    } else if (v === 'reaper') {
      add(this.box(0.9, 0.55, 2.6), hull, 0, 0, -0.2)
      add(this.box(2.8, 0.5, 0.7), hull, 0, 0, 1.0)
      add(this.coneF(0.1, 1.2), dark, 0, 0.3, 1.6)
      add(this.sphere(0.22), glow, 0, 0.3, 0.2)
      for (let i = -3; i <= 3; i++) add(this.coneF(0.07, 0.4), dark, i * 0.38, -0.2, 1.38)
      for (const s of [-1, 1]) {
        add(this.box(1.5, 0.08, 1.5), hull, s * 1.7, 0, -0.7, 0, s * 0.15, 0)
        add(this.cyl(0.13, 0.17, 1.9), dark, s * 1.05, -0.12, 1.1)
        add(this.cyl(0.2, 0.2, 0.15), glow, s * 1.05, -0.12, 2.08)
        add(this.coneF(0.12, 0.9), dark, s * 1.4, 0.1, 1.35)
        add(this.coneU(0.12, 0.9), dark, s * 1.4, 0.4, 0.9, 0, 0, -s * 0.4)
        add(this.box(0.28, 0.07, 0.07), glow, s * 0.5, 0.12, 1.36, 0, 0, s * 0.4)
        engine(s * 0.5, 0, -1.5, 2.0, 0.17)
      }
      engine(0, 0, -1.6, 2.4, 0.22)
    } else {
      add(this.geo('hex', () => new THREE.CylinderGeometry(1.1, 1.2, 0.5, 6)), hull, 0, 0, 0)
      add(this.sphere(0.45), hull, 0, 0.3, 0)
      add(this.sphere(0.2), glow, 0, 0.45, 0.35)
      add(this.geo('halo', () => { const t = new THREE.TorusGeometry(1.55, 0.05, 8, 40); t.rotateX(Math.PI / 2); return t }), glow, 0, 0, 0)
      for (let i = 0; i < 3; i++) {
        const phi = (i * Math.PI * 2) / 3
        add(this.box(0.9, 0.12, 0.5), dark, Math.cos(phi) * 0.7, 0.3, -Math.sin(phi) * 0.7, 0, phi, 0)
      }
      add(this.cyl(0.14, 0.2, 1.9), dark, 0, -0.05, 1.2)
      add(this.cyl(0.18, 0.18, 0.12), glow, 0, -0.05, 2.18)
      for (const s of [-1, 1]) {
        add(this.cyl(0.12, 0.16, 1.5), dark, s * 0.8, 0, 1.0)
        add(this.cyl(0.18, 0.18, 0.12), glow, s * 0.8, 0, 1.78)
        engine(s * 0.7, 0, -1.0, 1.9, 0.17)
      }
      engine(0, 0, -1.1, 2.3, 0.22)
      const spike = this.geo('spike', () => new THREE.ConeGeometry(0.13, 0.7, 5))
      for (let i = 0; i < 6; i++) {
        const phi = (i * Math.PI) / 3
        add(spike, dark, Math.cos(phi) * 1.3, 0, -Math.sin(phi) * 1.3, 0, phi, -Math.PI / 2)
      }
    }
    return { group: g, hull, amp: spec.amp, freq: spec.freq, interval: spec.interval, burst: spec.burst }
  }

  update(t: number): void {
    tickFlames(this.flames.values(), t)
  }

  dispose(): void {
    this.geos.forEach((g) => g.dispose())
    this.glows.forEach((m) => m.dispose())
    this.flames.forEach((m) => m.dispose())
    this.halos.forEach((m) => m.dispose())
    this.dark.dispose()
    this.flameGeo.dispose()
    this.tex.dispose()
  }
}
