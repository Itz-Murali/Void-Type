import * as THREE from 'three'
import { rand } from '../utils/random'
import type { ParticleSystem } from './ParticleSystem'
import { fireTexture, glowTexture, shockTexture } from './textures'

const SHIELD_VERT = `
varying vec3 vObj; varying vec3 vN; varying vec3 vView; varying vec2 vUv;
void main() {
  vObj = position; vUv = uv;
  vN = normalize(mat3(modelMatrix) * normal);
  vec4 wp = modelMatrix * vec4(position, 1.0);
  vView = normalize(cameraPosition - wp.xyz);
  gl_Position = projectionMatrix * viewMatrix * wp;
}`

const SHIELD_FRAG = `
uniform vec3 uImpact; uniform float uT; uniform float uPower;
varying vec3 vObj; varying vec3 vN; varying vec3 vView; varying vec2 vUv;
float hexDist(vec2 p) { p = abs(p); return max(dot(p, normalize(vec2(1.0, 1.73))), p.x); }
float hexEdge(vec2 uv) {
  vec2 r = vec2(1.0, 1.73); vec2 h = r * 0.5;
  vec2 a = mod(uv, r) - h; vec2 b = mod(uv - h, r) - h;
  vec2 gv = dot(a, a) < dot(b, b) ? a : b;
  return 1.0 - smoothstep(0.02, 0.07, 0.5 - hexDist(gv));
}
void main() {
  vec3 p = normalize(vObj); vec3 N = normalize(vN); vec3 V = normalize(vView);
  float fres = pow(1.0 - max(dot(N, V), 0.0), 2.2);
  float ang = distance(p, uImpact);
  float ripple = exp(-pow((ang - uT * 1.9) * 5.0, 2.0)) * (1.0 - uT);
  float core = exp(-ang * 2.6) * (1.0 - uT) * (1.0 - uT);
  float hex = hexEdge(vUv * vec2(46.0, 23.0));
  float e = fres * 0.35 * (1.0 - uT) + hex * (ripple * 2.2 + core * 0.9 + 0.04 * (1.0 - uT)) + ripple * 0.5 + core * 0.9;
  vec3 col = mix(vec3(0.15, 0.75, 1.0), vec3(1.0), clamp(ripple + core, 0.0, 1.0));
  gl_FragColor = vec4(col * e * uPower, 1.0);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}`

interface Puff { sprite: THREE.Sprite; t: number; life: number; delay: number; s0: number; s1: number; active: boolean }
interface Chunk { mesh: THREE.Mesh; mat: THREE.MeshStandardMaterial; vel: THREE.Vector3; spin: THREE.Vector3; t: number; life: number; s: number; active: boolean }

export class ImpactFX {
  readonly group = new THREE.Group()
  private bubble: THREE.Mesh
  private bmat: THREE.ShaderMaterial
  private uImpact = new THREE.Vector3(0, 0, -1)
  private uT = { value: 1 }
  private uPow = { value: 1 }
  private puffs: Puff[] = []
  private shocks: Puff[] = []
  private flares: Puff[] = []
  private flareTex = glowTexture('200,245,255', 64)
  private chunks: Chunk[] = []
  private fireTex = fireTexture()
  private shockTex = shockTexture()
  private chunkGeo = new THREE.IcosahedronGeometry(0.5, 0)
  private v = new THREE.Vector3()
  private white = new THREE.Color('#ffe9b0')
  private orange = new THREE.Color('#ff9a3c')
  private cyan = new THREE.Color('#7ef0ff')

  constructor(private shipPos: THREE.Vector3, private particles: ParticleSystem) {
    this.bmat = new THREE.ShaderMaterial({
      vertexShader: SHIELD_VERT, fragmentShader: SHIELD_FRAG,
      uniforms: { uImpact: { value: this.uImpact }, uT: this.uT, uPower: this.uPow },
      transparent: true, blending: THREE.AdditiveBlending, depthWrite: false
    })
    this.bubble = new THREE.Mesh(new THREE.SphereGeometry(1, 64, 40), this.bmat)
    this.bubble.scale.set(2.7, 1.9, 3.0)
    this.bubble.renderOrder = 6
    this.bubble.visible = false
    this.group.add(this.bubble)

    const sprite = (map: THREE.Texture): THREE.Sprite => {
      const s = new THREE.Sprite(new THREE.SpriteMaterial({
        map, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, depthTest: false
      }))
      s.renderOrder = 8
      s.visible = false
      this.group.add(s)
      return s
    }
    const puff = (map: THREE.Texture): Puff => ({ sprite: sprite(map), t: 0, life: 1, delay: 0, s0: 1, s1: 1, active: false })
    for (let i = 0; i < 14; i++) this.puffs.push(puff(this.fireTex))
    for (let i = 0; i < 6; i++) this.shocks.push(puff(this.shockTex))
    for (let i = 0; i < 10; i++) this.flares.push(puff(this.flareTex))
    for (let i = 0; i < 28; i++) {
      const mat = new THREE.MeshStandardMaterial({ color: 0x5a4e48, roughness: 0.9, emissive: 0xff6a1a, emissiveIntensity: 0, flatShading: true })
      const mesh = new THREE.Mesh(this.chunkGeo, mat)
      mesh.visible = false
      this.group.add(mesh)
      this.chunks.push({ mesh, mat, vel: new THREE.Vector3(), spin: new THREE.Vector3(), t: 0, life: 1, s: 1, active: false })
    }
  }

  private take<T extends { active: boolean }>(pool: T[]): T | undefined {
    return pool.find((p) => !p.active)
  }

  shipHit(point: THREE.Vector3, power: number, fx: number): void {
    this.bubble.position.set(this.shipPos.x, this.shipPos.y + 0.1, this.shipPos.z + 0.2)
    this.bubble.updateMatrixWorld(true)
    this.uImpact.copy(this.bubble.worldToLocal(this.v.copy(point))).normalize()
    this.uT.value = 0
    this.uPow.value = 1 + power * 0.5
    this.bubble.visible = true
    this.explode(point, 0.35 + power * 0.55, fx, true)
    this.particles.emit(point, Math.round((20 + power * 30) * fx), this.cyan, 9, 0.5)
  }

  explode(point: THREE.Vector3, power: number, fx: number, debris: boolean): void {
    const layers: [number, number, number][] = [[0, 0.55, 1], [0.06, 0.65, 0.8], [0.12, 0.5, 0.6]]
    for (const [delay, life, k] of layers) {
      const p = this.take(this.puffs)
      if (!p) break
      p.active = true; p.t = 0; p.delay = delay; p.life = life * (0.8 + power * 0.3)
      p.s0 = 0.6; p.s1 = (3.5 + power * 4.5) * k
      p.sprite.position.copy(point).addScaledVector(this.v.set(rand(-1, 1), rand(-1, 1), rand(-1, 1)), 0.25 * power)
      p.sprite.material.rotation = rand(0, 6)
    }
    const sw = this.take(this.shocks)
    if (sw) {
      sw.active = true; sw.t = 0; sw.delay = 0; sw.life = 0.6
      sw.s0 = 0.8; sw.s1 = 5 + power * 8
      sw.sprite.position.copy(point)
    }
    if (debris) {
      const n = Math.round((6 + power * 8) * Math.min(1, fx + 0.3))
      for (let i = 0; i < n; i++) {
        const c = this.take(this.chunks)
        if (!c) break
        const z = rand(-1, 1), a = rand(0, Math.PI * 2), r = Math.sqrt(1 - z * z)
        const sp = (3 + rand(0, 7)) * (0.6 + power * 0.5)
        c.vel.set(r * Math.cos(a) * sp, r * Math.sin(a) * sp * 0.8, z * sp * 0.6 + 2.5)
        c.spin.set(rand(-6, 6), rand(-6, 6), rand(-6, 6))
        c.mesh.position.copy(point)
        c.s = rand(0.15, 0.4) * (0.6 + power * 0.6)
        c.t = 0; c.life = rand(1.1, 1.8); c.active = true
        c.mesh.visible = true
        c.mat.emissiveIntensity = 1.6
      }
    }
    this.particles.emit(point, Math.round(34 * power * fx), this.white, 12, 0.6)
    this.particles.emit(point, Math.round(24 * power * fx), this.orange, 7, 1)
  }

  update(dt: number): void {
    if (this.bubble.visible) {
      this.uT.value += dt
      this.bubble.position.set(this.shipPos.x, this.shipPos.y + 0.1, this.shipPos.z + 0.2)
      if (this.uT.value >= 1) this.bubble.visible = false
    }
    for (const p of this.puffs) this.stepPuff(p, dt, 1.5, 1)
    for (const p of this.shocks) this.stepPuff(p, dt, 1, 0.85)
    for (const p of this.flares) this.stepPuff(p, dt, 1.2, 1)
    for (const c of this.chunks) {
      if (!c.active) continue
      c.t += dt
      const k = c.t / c.life
      if (k >= 1) { c.active = false; c.mesh.visible = false; continue }
      c.vel.multiplyScalar(Math.max(0, 1 - 0.8 * dt))
      c.mesh.position.addScaledVector(c.vel, dt)
      c.mesh.rotation.x += c.spin.x * dt
      c.mesh.rotation.y += c.spin.y * dt
      c.mesh.rotation.z += c.spin.z * dt
      c.mesh.scale.setScalar(c.s * (1 - k * k))
      c.mat.emissiveIntensity = (1 - k) * 1.6
    }
  }

  flare(point: THREE.Vector3, size: number): void {
    const p = this.take(this.flares)
    if (!p) return
    p.active = true; p.t = 0; p.delay = 0; p.life = 0.2
    p.s0 = size; p.s1 = size * 0.25
    p.sprite.position.copy(point)
  }

  private stepPuff(p: Puff, dt: number, fadePow: number, peak: number): void {
    if (!p.active) return
    if (p.delay > 0) { p.delay -= dt; return }
    p.t += dt
    const k = p.t / p.life
    if (k >= 1) { p.active = false; p.sprite.visible = false; return }
    p.sprite.visible = true
    const s = p.s0 + (p.s1 - p.s0) * (1 - (1 - k) * (1 - k))
    p.sprite.scale.set(s, s, 1)
    p.sprite.material.opacity = Math.pow(1 - k, fadePow) * peak
  }

  clear(): void {
    this.bubble.visible = false
    for (const p of [...this.puffs, ...this.shocks, ...this.flares]) { p.active = false; p.sprite.visible = false }
    for (const c of this.chunks) { c.active = false; c.mesh.visible = false }
  }

  dispose(): void {
    this.bubble.geometry.dispose()
    this.bmat.dispose()
    for (const p of [...this.puffs, ...this.shocks, ...this.flares]) p.sprite.material.dispose()
    for (const c of this.chunks) c.mat.dispose()
    this.chunkGeo.dispose()
    this.fireTex.dispose()
    this.shockTex.dispose()
    this.flareTex.dispose()
  }
}
