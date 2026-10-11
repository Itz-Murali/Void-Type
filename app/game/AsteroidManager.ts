import * as THREE from 'three'
import type { AsteroidKind } from '../types/game'
import { mergeVertices } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import { mulberry32, rand, clamp } from '../utils/random'
import { rockTexture } from './textures'
import { EnemyFactory, type EnemyBuild } from './EnemyShips'

export interface KindConfig {
  color: number; emissive: number; glow: number
  scale: number; speed: number; damage: number; points: number; accent: string
}

export const KINDS: Record<AsteroidKind, KindConfig> = {
  normal: { color: 0x8a96a8, emissive: 0x0a1220, glow: 0.4, scale: 1, speed: 1, damage: 12, points: 1, accent: '#8fa3bd' },
  fast: { color: 0x6f93a6, emissive: 0x0e7a9a, glow: 0.9, scale: 0.75, speed: 1.8, damage: 12, points: 2, accent: '#4fd8ff' },
  armored: { color: 0xc4ccd6, emissive: 0x1a1f26, glow: 0.3, scale: 1.5, speed: 0.8, damage: 20, points: 3, accent: '#e3eaf2' },
  bonus: { color: 0x8a78c4, emissive: 0x7a4dff, glow: 1.1, scale: 0.9, speed: 1.15, damage: 0, points: 2, accent: '#b48cff' },
  danger: { color: 0x9a5a62, emissive: 0xff2a3a, glow: 0.9, scale: 1.15, speed: 1.1, damage: 35, points: 3, accent: '#ff5a64' },
  fighter: { color: 0x7a5a66, emissive: 0xff2a3a, glow: 0.6, scale: 1, speed: 1.3, damage: 20, points: 4, accent: '#ff7a5a' },
  gunship: { color: 0x5a4a78, emissive: 0xff2a3a, glow: 0.6, scale: 1.45, speed: 0.9, damage: 30, points: 6, accent: '#ff4d8d' },
  shield: { color: 0x6a8a90, emissive: 0x14c8a0, glow: 1.0, scale: 1.1, speed: 0.9, damage: 0, points: 2, accent: '#4dffc3' },
  crate: { color: 0x3a3f4a, emissive: 0xffb02e, glow: 0.5, scale: 1.0, speed: 1.0, damage: 0, points: 3, accent: '#ffc233' }
}

class Label {
  readonly sprite: THREE.Sprite
  private canvas = document.createElement('canvas')
  private ctx: CanvasRenderingContext2D
  private tex: THREE.CanvasTexture

  constructor() {
    this.canvas.width = 1024
    this.canvas.height = 192
    this.ctx = this.canvas.getContext('2d')!
    this.tex = new THREE.CanvasTexture(this.canvas)
    this.tex.colorSpace = THREE.SRGBColorSpace
    this.tex.anisotropy = 4
    this.sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: this.tex, transparent: true, depthTest: false, depthWrite: false, toneMapped: false }))
    this.sprite.renderOrder = 10
  }

  draw(text: string, active: boolean, accent: string): void {
    const c = this.ctx
    c.setTransform(1, 0, 0, 1, 0, 0)
    c.clearRect(0, 0, 1024, 192)
    c.setTransform(2, 0, 0, 2, 0, 0)
    if (text) {
      const step = 36
      const total = text.length * step
      const x0 = (512 - total) / 2 - 14
      const w = total + 28
      const g = c.createLinearGradient(x0, 0, x0 + w, 0)
      g.addColorStop(0, 'rgba(4,8,18,0.82)')
      g.addColorStop(1, 'rgba(4,8,18,0.5)')
      c.fillStyle = g
      c.fillRect(x0, 16, w, 58)
      c.fillStyle = accent
      c.fillRect(x0, 16, 4, 58)
      c.fillRect(x0 + w - 14, 70, 14, 3)
      c.font = '600 50px "IBM Plex Mono", ui-monospace, monospace'
      c.textBaseline = 'middle'
      c.textAlign = 'center'
      for (let i = 0; i < text.length; i++) {
        const cx = x0 + 14 + i * step + step / 2
        if (i === 0 && active) {
          c.fillStyle = accent
          c.globalAlpha = 0.22
          c.fillRect(cx - step / 2 + 2, 20, step - 4, 50)
          c.globalAlpha = 1
          c.fillStyle = '#ffffff'
          c.shadowColor = accent
          c.shadowBlur = 12
        } else {
          c.fillStyle = 'rgba(214,226,244,0.8)'
          c.shadowBlur = 0
        }
        c.fillText(text[i] ?? '', cx, 46)
      }
      c.shadowBlur = 0
    }
    this.tex.needsUpdate = true
  }

  dispose(): void {
    this.tex.dispose()
    this.sprite.material.dispose()
  }
}

export interface EnemyState {
  fireTimer: number; interval: number; windup: number; burst: number
  hoverZ: number; anchorX: number; amp: number; freq: number; phase: number
}

export interface Asteroid {
  id: number
  kind: AsteroidKind
  word: string
  typed: number
  pending: number
  dying: boolean
  removed: boolean
  ambient: boolean
  mesh: THREE.Object3D
  material: THREE.MeshStandardMaterial
  label: Label
  velocity: THREE.Vector3
  spin: THREE.Vector3
  radius: number
  base: number
  flash: number
  enemy: EnemyState | null
}

function makeRock(seed: number): THREE.BufferGeometry {
  const r = mulberry32(seed)
  const g = new THREE.IcosahedronGeometry(1, 3)
  const pos = g.attributes.position as THREE.BufferAttribute
  const ph = Array.from({ length: 6 }, () => r() * 6.28)
  const p = (i: number) => ph[i] ?? 0
  const sx = 0.8 + r() * 0.5, sy = 0.7 + r() * 0.4, sz = 0.8 + r() * 0.5
  const v = new THREE.Vector3()
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i).normalize()
    const n = Math.sin(v.x * 3.1 + p(0)) * 0.5 + Math.sin(v.y * 4.3 + p(1)) * 0.35 + Math.sin(v.z * 5.7 + p(2)) * 0.25 +
      Math.sin((v.x + v.y) * 8.1 + p(3)) * 0.12 + Math.sin(v.z * 11 + p(4)) * 0.06 + Math.sin((v.y - v.z) * 17 + p(5)) * 0.04
    v.multiplyScalar(1 + n * 0.17)
    pos.setXYZ(i, v.x * sx, v.y * sy, v.z * sz)
  }
  g.deleteAttribute('normal')
  const merged = mergeVertices(g, 1e-4)
  merged.computeVertexNormals()
  g.dispose()
  return merged
}

function ringTexture(): THREE.CanvasTexture {
  const c = document.createElement('canvas')
  c.width = c.height = 128
  const x = c.getContext('2d')!
  x.strokeStyle = '#7ae7ff'
  x.lineWidth = 4
  for (let i = 0; i < 4; i++) {
    x.beginPath()
    x.arc(64, 64, 54, i * Math.PI / 2 + 0.25, i * Math.PI / 2 + Math.PI / 2 - 0.25)
    x.stroke()
  }
  const t = new THREE.CanvasTexture(c)
  t.colorSpace = THREE.SRGBColorSpace
  return t
}

export class AsteroidManager {
  readonly group = new THREE.Group()
  readonly labels = new THREE.Group()
  readonly active: Asteroid[] = []
  private geos = [1, 2, 3, 4, 5, 6].map((s) => makeRock(s * 7919))
  private wireMat = new THREE.MeshBasicMaterial({ color: 0xcfd8e3, wireframe: true, transparent: true, opacity: 0.3 })
  private ring: THREE.Sprite
  private targetRef: Asteroid | null = null
  private nextId = 1
  private rock = rockTexture(11)
  private enemies = new EnemyFactory()
  private guard = this.makeGuardAssets()
  private crate = this.makeCrateAssets()
  private clockT = 0
  onFire: ((a: Asteroid, i: number) => void) | null = null

  constructor() {
    this.ring = new THREE.Sprite(new THREE.SpriteMaterial({
      map: ringTexture(), transparent: true, depthTest: false, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0.9, toneMapped: false
    }))
    this.ring.renderOrder = 9
    this.ring.visible = false
    this.labels.add(this.ring)
  }

  private makeCrateAssets() {
    const box = new THREE.BoxGeometry(1.5, 1.5, 1.5)
    return {
      box,
      edges: new THREE.EdgesGeometry(box),
      strap: new THREE.BoxGeometry(1.58, 0.2, 1.58),
      edgeMat: new THREE.LineBasicMaterial({ color: 0xffc233, toneMapped: false }),
      strapMat: new THREE.MeshBasicMaterial({ color: 0xffb02e })
    }
  }

  private makeGuardAssets() {
    const time = { value: 0 }
    return {
      time,
      shellGeo: new THREE.SphereGeometry(1.6, 32, 24),
      ringGeo: new THREE.TorusGeometry(1.95, 0.04, 8, 56),
      ringMat: new THREE.MeshBasicMaterial({ color: 0x7dffd8 }),
      shellMat: new THREE.ShaderMaterial({
        transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, uniforms: { uTime: time },
        vertexShader: 'varying vec3 vN; varying vec3 vV; void main(){ vN = normalize(normalMatrix * normal); vec4 mv = modelViewMatrix * vec4(position, 1.0); vV = normalize(-mv.xyz); gl_Position = projectionMatrix * mv; }',
        fragmentShader: 'uniform float uTime; varying vec3 vN; varying vec3 vV; void main(){ float f = pow(1.0 - max(dot(normalize(vN), normalize(vV)), 0.0), 2.2); float pulse = 0.75 + 0.25 * sin(uTime * 3.0); vec3 c = mix(vec3(0.1, 1.0, 0.75), vec3(0.6, 1.0, 0.95), f); gl_FragColor = vec4(c * f * pulse * 1.4, f * 0.8 * pulse); }'
      })
    }
  }

  private stepEnemy(a: Asteroid, e: EnemyState, dt: number): void {
    const p = a.mesh.position
    if (p.z < e.hoverZ) {
      p.addScaledVector(a.velocity, dt)
      if (p.z >= e.hoverZ) { p.z = e.hoverZ; e.anchorX = clamp(p.x, -6, 6); e.amp = Math.min(e.amp, Math.max(1.5, 8.5 - Math.abs(e.anchorX))) }
    } else {
      e.phase += dt * e.freq
      const nx = e.anchorX + Math.sin(e.phase) * e.amp
      a.mesh.rotation.z = (nx - p.x) * -0.6
      p.x = nx
      p.z = e.hoverZ + Math.sin(e.phase * 0.7) * 0.8
    }
    if (e.windup > 0) {
      e.windup -= dt
      a.flash = Math.max(a.flash, 0.55 + 0.45 * Math.sin(e.windup * 45))
      if (e.windup <= 0) for (let i = 0; i < e.burst; i++) this.onFire?.(a, i)
    } else {
      e.fireTimer -= dt
      if (e.fireTimer <= 0) { e.windup = 0.45; e.fireTimer = e.interval }
    }
  }

  spawn(kind: AsteroidKind, word: string, speed: number, aim: THREE.Vector3, ambient = false): Asteroid {
    const cfg = KINDS[kind]
    const isEnemy = kind === 'fighter' || kind === 'gunship'
    let mesh: THREE.Object3D
    let material: THREE.MeshStandardMaterial
    let radius: number
    let base: number
    let eb: EnemyBuild | null = null
    if (isEnemy) {
      const e = this.enemies.build(kind)
      eb = e
      mesh = e.group
      material = e.hull
      radius = cfg.scale * rand(1.0, 1.15)
      base = 0.2
    } else {
      material = new THREE.MeshStandardMaterial({
        color: cfg.color, map: this.rock, bumpMap: this.rock, bumpScale: 1.6, roughness: 0.85,
        metalness: kind === 'armored' ? 0.6 : 0.15, emissive: cfg.emissive, emissiveIntensity: cfg.glow * 0.5
      })
      const geo = this.geos[Math.floor(Math.random() * this.geos.length)]!
      const rockMesh = new THREE.Mesh(geo, material)
      if (kind === 'armored') {
        const wire = new THREE.Mesh(geo, this.wireMat)
        wire.scale.setScalar(1.08)
        rockMesh.add(wire)
      }
      if (kind === 'shield') {
        const G = this.guard
        const r1 = new THREE.Mesh(G.ringGeo, G.ringMat)
        r1.rotation.x = 1.1
        const r2 = new THREE.Mesh(G.ringGeo, G.ringMat)
        r2.rotation.set(Math.PI / 2, 0.5, 0)
        const grp = new THREE.Group()
        grp.add(rockMesh, new THREE.Mesh(G.shellGeo, G.shellMat), r1, r2)
        mesh = grp
      } else if (kind === 'crate') {
        const C = this.crate
        const top = new THREE.Mesh(C.strap, C.strapMat)
        top.position.y = 0.45
        const bot = new THREE.Mesh(C.strap, C.strapMat)
        bot.position.y = -0.45
        const grp = new THREE.Group()
        grp.add(new THREE.Mesh(C.box, material), top, bot, new THREE.LineSegments(C.edges, C.edgeMat))
        mesh = grp
      } else mesh = rockMesh
      radius = cfg.scale * rand(1.1, 1.5)
      base = cfg.glow * 0.5
      mesh.rotation.set(rand(0, 6), rand(0, 6), rand(0, 6))
    }
    mesh.scale.setScalar(radius)
    let x = 0
    for (let i = 0; i < 6; i++) {
      x = rand(-9, 9)
      if (this.active.every((a) => Math.abs(a.mesh.position.x - x) > 4 || a.mesh.position.z > -25)) break
    }
    mesh.position.set(x, rand(-0.5, 4.5), -50)
    const label = new Label()
    label.sprite.visible = word !== ''
    label.draw(word, false, cfg.accent)
    const enemy: EnemyState | null = eb ? {
      fireTimer: rand(0.3, 0.8), interval: eb.interval, windup: 0, burst: eb.burst,
      hoverZ: kind === 'gunship' ? -24 : -18, anchorX: x, amp: eb.amp * rand(0.85, 1.15), freq: eb.freq * rand(0.9, 1.1), phase: rand(0, 6)
    } : null
    const a: Asteroid = {
      id: this.nextId++, kind, word, typed: 0, pending: 0, dying: false, removed: false, ambient,
      mesh, material, label,
      velocity: aim.clone().sub(mesh.position).normalize().multiplyScalar(speed),
      spin: isEnemy ? new THREE.Vector3() : kind === 'shield' || kind === 'crate' ? new THREE.Vector3(rand(-0.2, 0.2), rand(0.4, 0.8), rand(-0.15, 0.15)) : new THREE.Vector3(rand(-0.6, 0.6), rand(-0.6, 0.6), rand(-0.4, 0.4)),
      radius, base, flash: 0, enemy
    }
    this.group.add(mesh)
    this.labels.add(label.sprite)
    this.active.push(a)
    return a
  }

  refresh(a: Asteroid): void {
    a.label.draw(a.word.slice(a.typed), a === this.targetRef, KINDS[a.kind].accent)
  }

  setTarget(a: Asteroid | null): void {
    const prev = this.targetRef
    this.targetRef = a
    if (prev && !prev.removed) this.refresh(prev)
    if (a) this.refresh(a)
    this.ring.visible = !!a
  }

  update(dt: number, camera: THREE.Camera, advance: boolean, viewH = 800, fov = 55): void {
    this.clockT += dt
    this.enemies.update(this.clockT)
    this.guard.time.value = this.clockT
    for (let i = this.active.length - 1; i >= 0; i--) {
      const a = this.active[i]!
      if (advance && !a.dying) {
        if (a.enemy) this.stepEnemy(a, a.enemy, dt)
        else a.mesh.position.addScaledVector(a.velocity, dt)
      }
      a.mesh.rotation.x += a.spin.x * dt
      a.mesh.rotation.y += a.spin.y * dt
      a.mesh.rotation.z += a.spin.z * dt
      a.flash = Math.max(0, a.flash - dt * 5)
      a.material.emissiveIntensity = a.base + a.flash * 2.2
      a.mesh.scale.setScalar(a.radius * (1 + a.flash * 0.08))
      const dist = camera.position.distanceTo(a.mesh.position)
      const wpp = (2 * Math.tan((fov * Math.PI) / 360) * dist) / Math.max(1, viewH)
      const h = Math.max(clamp(dist * 0.06, 0.8, 2), 34 * wpp)
      a.label.sprite.scale.set(h * 5.33, h, 1)
      a.label.sprite.position.copy(a.mesh.position)
      a.label.sprite.position.y += a.radius * 1.1 + h * 0.55
      if (a.ambient && a.mesh.position.z > 10) this.remove(a)
    }
    const t = this.targetRef
    if (t && !t.removed) {
      this.ring.position.copy(t.mesh.position)
      this.ring.scale.setScalar(t.radius * 3.6)
      this.ring.material.rotation += dt * 0.8
    }
  }

  remove(a: Asteroid): void {
    if (a.removed) return
    a.removed = true
    if (this.targetRef === a) this.setTarget(null)
    this.group.remove(a.mesh)
    this.labels.remove(a.label.sprite)
    a.material.dispose()
    a.label.dispose()
    const i = this.active.indexOf(a)
    if (i >= 0) this.active.splice(i, 1)
  }

  clear(): void {
    for (let i = this.active.length - 1; i >= 0; i--) this.remove(this.active[i]!)
    this.ring.visible = false
  }

  dispose(): void {
    this.clear()
    this.geos.forEach((g) => g.dispose())
    this.wireMat.dispose()
    this.rock.dispose()
    this.enemies.dispose()
    const G = this.guard
    ;[G.shellGeo, G.ringGeo, G.ringMat, G.shellMat].forEach((d) => d.dispose())
    const C = this.crate
    ;[C.box, C.edges, C.strap, C.edgeMat, C.strapMat].forEach((d) => d.dispose())
    this.ring.material.map?.dispose()
    this.ring.material.dispose()
  }
}
