import * as THREE from 'three'
import { flameMaterial, makeFlameGeometry, tickFlames } from './Flame'
import { glowTexture } from './textures'

export class Spaceship {
  readonly group = new THREE.Group()
  readonly muzzleL = new THREE.Object3D()
  readonly muzzleR = new THREE.Object3D()
  private flameMats: THREE.ShaderMaterial[] = []
  private glows: THREE.Sprite[] = []
  private pulseMats: THREE.MeshBasicMaterial[] = []
  private light = new THREE.PointLight(0x9a6bff, 3, 12, 2)
  private timeU = { value: 0 }
  private baseY: number
  private aimX = 0
  private px = 0
  private impulse = 0
  private hitDir = 1
  private heat = 0
  private tint: THREE.MeshStandardMaterial[] = []
  private owned: { dispose(): void }[] = []
  private turbo = 0
  private turboOn = false
  private ears = new THREE.Group()
  private baseLight = new THREE.Color(0x9a6bff)
  private turboLight = new THREE.Color(0xff5ad8)

  constructor(position: THREE.Vector3) {
    this.baseY = position.y
    this.group.position.copy(position)
    this.group.scale.setScalar(0.46)
    const o = <T extends { dispose(): void }>(v: T): T => (this.owned.push(v), v)

    const hull = o(new THREE.MeshPhysicalMaterial({ color: 0xffffff, metalness: 0.55, roughness: 0.38, clearcoat: 0.7, clearcoatRoughness: 0.25, side: THREE.DoubleSide }))
    hull.customProgramCacheKey = () => 'voidtype-hull-v4'
    hull.onBeforeCompile = (sh) => {
      sh.uniforms.uTime = this.timeU
      sh.vertexShader = sh.vertexShader
        .replace('#include <common>', '#include <common>\nvarying vec3 vOP;')
        .replace('#include <begin_vertex>', '#include <begin_vertex>\nvOP = position;')
      sh.fragmentShader = sh.fragmentShader
        .replace('#include <common>', '#include <common>\nvarying vec3 vOP;\nuniform float uTime;')
        .replace('#include <color_fragment>', `#include <color_fragment>
          vec3 q = vOP * 1.25;
          vec2 g1 = vec2(q.x + q.z * 0.45, q.z + q.y * 0.6);
          vec2 cell = floor(g1 * 1.3);
          float h = fract(sin(dot(cell, vec2(127.1, 311.7))) * 43758.5453);
          float h2 = fract(sin(dot(floor(g1 * 3.1), vec2(269.5, 183.3))) * 43758.5453);
          float cam = step(0.48, h);
          vec3 whiteC = vec3(0.86, 0.87, 0.93); vec3 blackC = vec3(0.045, 0.045, 0.07);
          vec3 base = mix(blackC, whiteC, cam);
          base = mix(base, mix(whiteC, blackC, cam), step(0.9, h2) * 0.5);
          vec2 f = abs(fract(g1 * 1.3) - 0.5);
          float pline = smoothstep(0.47, 0.5, max(f.x, f.y));
          base *= 1.0 - pline * 0.55;
          base *= 0.9 + 0.1 * fract(sin(dot(floor(q.xz * 14.0), vec2(12.9898, 78.233))) * 43758.5453);
          diffuseColor.rgb = base;`)
        .replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
          totalEmissiveRadiance += vec3(0.55, 0.22, 1.0) * pline * step(0.7, h) * 1.3;
          float band = pow(max(0.0, sin(vOP.z * 2.4 - uTime * 3.0)), 28.0);
          totalEmissiveRadiance += vec3(0.5, 0.3, 1.0) * band * 0.7;`)
    }
    const white = o(new THREE.MeshStandardMaterial({ color: 0xdcdde8, metalness: 0.5, roughness: 0.35, side: THREE.DoubleSide }))
    const carbon = o(new THREE.MeshStandardMaterial({ color: 0x0c0c14, metalness: 0.7, roughness: 0.42, side: THREE.DoubleSide }))
    const glass = o(new THREE.MeshStandardMaterial({ color: 0x050a1c, emissive: 0x1a4cff, emissiveIntensity: 1.2, metalness: 0.9, roughness: 0.05 }))
    const neon = o(new THREE.MeshBasicMaterial({ color: 0xb98cff }))
    const neonB = o(new THREE.MeshBasicMaterial({ color: 0x6fa8ff }))
    const nozzleCore = o(new THREE.MeshBasicMaterial({ color: 0xe6d6ff }))
    const ringGlow = o(new THREE.MeshBasicMaterial({ color: 0x9a6bff, transparent: true, opacity: 0.6, blending: THREE.AdditiveBlending, depthWrite: false }))
    this.pulseMats.push(ringGlow)
    this.tint = [hull, white]

    const add = (geo: THREE.BufferGeometry, mat: THREE.Material, x: number, y: number, z: number, rx = 0, ry = 0, rz = 0, parent: THREE.Object3D = this.group): THREE.Mesh => {
      const m = new THREE.Mesh(geo, mat)
      m.position.set(x, y, z)
      m.rotation.set(rx, ry, rz)
      parent.add(m)
      return m
    }
    const box = (w: number, h: number, d: number) => o(new THREE.BoxGeometry(w, h, d))
    const cyl = (rRear: number, rFront: number, len: number, seg = 16) => { const g = o(new THREE.CylinderGeometry(rRear, rFront, len, seg)); g.rotateX(Math.PI / 2); return g }
    const coneB = (r: number, h: number, seg = 10) => { const g = o(new THREE.ConeGeometry(r, h, seg)); g.rotateX(-Math.PI / 2); return g }
    const torus = (r: number, t: number) => o(new THREE.TorusGeometry(r, t, 8, 28))

    const prof = ([[0, -2.3], [0.5, -2.3], [0.75, -1.6], [0.88, -0.6], [0.9, 0.6], [0.8, 1.6], [0.55, 2.4], [0.28, 3.1], [0.1, 3.7], [0, 4.0]] as [number, number][])
      .map(([r, y]) => new THREE.Vector2(r, y))
    const fuseGeo = o(new THREE.LatheGeometry(prof, 36))
    fuseGeo.rotateX(-Math.PI / 2)
    add(fuseGeo, hull, 0, 0, 0).scale.set(1.3, 0.5, 1)
    add(coneB(0.13, 1.0), carbon, 0, 0, -4.4)
    add(o(new THREE.TorusGeometry(0.2, 0.02, 8, 20)), neon, 0, 0, -3.5)

    add(o(new THREE.SphereGeometry(0.5, 28, 18)), glass, 0, 0.36, -1.9).scale.set(0.8, 0.5, 3.0)
    for (const z of [-3.0, -2.35, -1.7, -1.05, -0.5]) add(box(0.62, 0.03, 0.07), carbon, 0, 0.56 + (z + 3) * 0.004, z)

    for (const s of [-1, 1]) {
      add(box(0.55, 0.34, 3.0), white, s * 0.98, -0.03, -0.7, 0, s * 0.08, 0)
      add(box(0.5, 0.28, 0.08), carbon, s * 1.02, -0.03, -2.2)
      add(box(0.04, 0.03, 2.4), neon, s * 1.28, 0.12, -0.7)
      add(box(1.0, 0.05, 0.6), hull, s * 1.0, 0.02, -2.6, 0, s * 0.5, 0)
      add(box(0.04, 0.03, 2.4), neonB, s * 0.75, 0.3, -0.9)
      add(box(0.05, 0.03, 2.6), neon, s * 0.3, 0.56, 1.0)
    }
    add(box(0.9, 0.24, 3.0), hull, 0, 0.42, 1.0)
    add(box(0.5, 0.04, 0.4), carbon, 0, 0.55, 2.0)
    for (let i = 0; i < 6; i++) for (const s of [-1, 1]) add(box(0.2, 0.025, 0.05), neonB, s * 0.62, 0.17, -3.0 + i * 0.45)

    const wing = new THREE.Shape()
    wing.moveTo(0, -1.2); wing.lineTo(3.7, 1.5); wing.lineTo(3.7, 2.4); wing.lineTo(0, 2.0); wing.closePath()
    const wingGeo = o(new THREE.ExtrudeGeometry(wing, { depth: 0.09, bevelEnabled: true, bevelThickness: 0.02, bevelSize: 0.03, bevelSegments: 1 }))
    wingGeo.rotateX(Math.PI / 2)
    const plate = new THREE.Shape()
    plate.moveTo(0.4, -0.2); plate.lineTo(2.6, 1.45); plate.lineTo(2.7, 2.0); plate.lineTo(0.4, 1.8); plate.closePath()
    const plateGeo = o(new THREE.ExtrudeGeometry(plate, { depth: 0.03, bevelEnabled: false }))
    plateGeo.rotateX(Math.PI / 2)
    const edgeGeo = box(4.58, 0.03, 0.05)
    const flapGeo = box(2.4, 0.05, 0.45)
    const podBody = cyl(0.14, 0.11, 1.9)
    const podBand = cyl(0.15, 0.15, 0.18)
    const podTip = coneB(0.11, 0.5)
    const podRing = torus(0.115, 0.02)
    const pylon = box(0.08, 0.2, 0.5)
    const tipBody = cyl(0.2, 0.16, 2.4)
    const tipTip = coneB(0.16, 0.7)
    const wingletGeo = box(0.06, 0.55, 0.9)

    for (const side of [1, -1]) {
      const w = new THREE.Group()
      add(wingGeo, hull, 0, 0, 0, 0, 0, 0, w)
      add(plateGeo, carbon, 0, 0.005, 0, 0, 0, 0, w)
      add(edgeGeo, neon, 1.85, 0.03, 0.15, 0, -0.63, 0, w)
      add(flapGeo, carbon, 2.0, -0.03, 1.95, 0, 0.06, 0, w)
      for (const x of [1.3, 2.1, 2.9]) {
        const zc = -1.2 + 0.73 * x + 0.2
        add(pylon, carbon, x, -0.1, zc + 0.2, 0, 0, 0, w)
        add(podBody, white, x, -0.22, zc, 0, 0, 0, w)
        add(podBand, carbon, x, -0.22, zc + 0.4, 0, 0, 0, w)
        add(podTip, carbon, x, -0.22, zc - 1.2, 0, 0, 0, w)
        add(podRing, neon, x, -0.22, zc - 0.95, 0, 0, 0, w)
      }
      add(tipBody, white, 3.7, -0.02, 1.4, 0, 0, 0, w)
      add(tipTip, carbon, 3.7, -0.02, 0.0, 0, 0, 0, w)
      add(wingletGeo, carbon, 3.7, 0.25, 2.0, 0, 0, 0.12, w)
      add(box(0.03, 0.03, 0.8), neon, 3.7, 0.55, 2.0, 0, 0, 0, w)
      w.position.set(side * 1.0, -0.08, 0)
      w.scale.x = side
      this.group.add(w)
    }
    this.muzzleL.position.set(-3.1, -0.3, -0.8)
    this.muzzleR.position.set(3.1, -0.3, -0.8)

    const fin = new THREE.Shape()
    fin.moveTo(0, 0); fin.lineTo(1.8, 0); fin.lineTo(1.15, 2.1); fin.lineTo(0.7, 2.1); fin.closePath()
    const finGeo = o(new THREE.ExtrudeGeometry(fin, { depth: 0.07, bevelEnabled: false }))
    finGeo.rotateY(-Math.PI / 2)
    for (const s of [-1, 1]) {
      add(finGeo, carbon, s * 1.1, 0.3, 0.9, 0, 0, -s * 0.28)
      add(box(0.03, 0.03, 0.5), neon, s * 1.69, 2.3, 1.5, 0, 0, -s * 0.28)
      add(box(0.05, 0.9, 0.5), white, s * 1.35, 1.0, 1.4, 0, 0, -s * 0.28)
    }

    const flameGeo = o(makeFlameGeometry())
    const inMat = o(flameMaterial(0xffffff, 0xc79bff, 0))
    const outMat = o(flameMaterial(0x9a5cff, 0x3a1aff, 1.7))
    this.flameMats.push(inMat, outMat)
    const glowTex = o(glowTexture('170,120,255', 64))
    const nac = cyl(0.6, 0.55, 2.4, 20)
    const bell = cyl(0.5, 0.42, 0.5, 20)
    const disc = cyl(0.42, 0.42, 0.04, 20)
    const lip = torus(0.56, 0.05)
    const nozzleRing = torus(0.47, 0.04)
    const halo = torus(0.62, 0.03)
    for (const s of [-1, 1]) {
      const x = s * 1.05, y = 0.28
      add(nac, hull, x, y, 1.9)
      add(lip, neon, x, y, 0.72)
      add(bell, carbon, x, y, 3.2)
      add(nozzleRing, neon, x, y, 3.45)
      add(halo, ringGlow, x, y, 3.0)
      add(disc, nozzleCore, x, y, 3.42)
      add(flameGeo, inMat, x, y, 3.45 + 1.8).scale.set(0.3, 0.3, 3.6)
      add(flameGeo, outMat, x, y, 3.45 + 2.5).scale.set(0.5, 0.5, 5)
      const glow = new THREE.Sprite(o(new THREE.SpriteMaterial({ map: glowTex, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false })))
      glow.position.set(x, y, 3.5)
      this.glows.push(glow)
      this.group.add(glow)
    }
    this.light.position.set(0, 0.3, 3.9)
    this.group.add(this.muzzleL, this.muzzleR, this.light)

    const earMat = o(new THREE.MeshBasicMaterial({ color: 0xff7ad9 }))
    const earGeo = o(new THREE.ConeGeometry(0.34, 1.0, 4))
    for (const s of [-1, 1]) {
      const ear = new THREE.Mesh(earGeo, earMat)
      ear.position.set(s * 0.46, 0.95, -1.1)
      ear.rotation.z = -s * 0.28
      this.ears.add(ear)
    }
    this.ears.visible = false
    this.ears.scale.setScalar(0.001)
    this.group.add(this.ears)
  }

  setTurbo(on: boolean): void { this.turboOn = on }

  get x(): number { return this.px }

  setAim(x: number): void { this.aimX = x }

  hit(dirX: number, power: number): void {
    this.impulse = Math.min(1.5, this.impulse + 0.6 + power * 0.8)
    this.hitDir = dirX >= 0 ? -1 : 1
    this.heat = 1
  }

  update(t: number, dt: number): void {
    const g = this.group
    this.timeU.value = t
    const turboTo = this.turboOn ? 1 : 0
    this.turbo += (turboTo - this.turbo) * Math.min(1, dt * 4)
    if (Math.abs(turboTo - this.turbo) < 0.005) this.turbo = turboTo
    this.px += (this.aimX - this.px) * Math.min(1, dt * 3 * (1 + this.turbo))
    this.impulse *= Math.exp(-dt * 5)
    this.heat = Math.max(0, this.heat - dt * 1.8)
    g.position.x = this.px + this.hitDir * this.impulse * 0.5
    g.position.y = this.baseY + Math.sin(t * 1.3) * 0.1 - this.impulse * 0.15
    g.position.z = this.impulse * 0.7
    g.rotation.z = Math.sin(t * 0.8) * 0.03 - (this.aimX - this.px) * 0.08 + this.hitDir * this.impulse * 0.35
    g.rotation.x = -this.impulse * 0.12
    tickFlames(this.flameMats, t)
    const gs = 3 * (1 + Math.sin(t * 22) * 0.07) * (1 + this.turbo * 0.5)
    this.glows.forEach((s) => s.scale.set(gs, gs, 1))
    for (const m of this.pulseMats) m.opacity = 0.45 + 0.25 * Math.sin(t * 5)
    this.light.intensity = 3 + Math.sin(t * 30) * 0.35 + this.turbo * 3
    this.light.color.copy(this.baseLight).lerp(this.turboLight, this.turbo)
    this.ears.visible = this.turbo > 0.02
    this.ears.scale.setScalar(Math.max(0.001, this.turbo))
    this.ears.children.forEach((e, i) => { e.rotation.x = Math.sin(t * 9 + i * 2.1) * 0.12 * this.turbo })
    const flick = this.heat > 0 && Math.sin(t * 60) > 0 ? 1 : 0.35
    for (const m of this.tint) {
      m.emissive.setHex(this.heat > 0 ? 0xff3a1a : 0x000000)
      m.emissiveIntensity = this.heat * flick * 1.6
    }
  }

  dispose(): void { this.owned.forEach((v) => v.dispose()) }
}
