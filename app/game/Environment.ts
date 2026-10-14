import * as THREE from 'three'
import { clamp, pick, rand } from '../utils/random'
import { cloudTexture, clusterTexture, cometTexture, ellipticalTexture, galaxyTexture, glowTexture, ringNebulaTexture, shockTexture } from './textures'

const DEPTH = 240
export type SpaceEvent = 'meteors' | 'flare' | 'supernova' | 'ion' | 'singularity'
const FAR = -380
const SUN_DIR = new THREE.Vector3(0.78, 0.28, -0.1).normalize()
const smooth = (a: number, b: number, x: number): number => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t) }

const VERT = `
varying vec3 vObj; varying vec3 vN; varying vec3 vView;
void main() {
  vObj = position;
  vN = normalize(mat3(modelMatrix) * normal);
  vec4 wp = modelMatrix * vec4(position, 1.0);
  vView = normalize(cameraPosition - wp.xyz);
  gl_Position = projectionMatrix * viewMatrix * wp;
}`

const NOISE = `
float hash(vec3 p){ p = fract(p * 0.3183099 + 0.1); p *= 17.0; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }
float noise(vec3 x){
  vec3 i = floor(x), f = fract(x); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(mix(hash(i), hash(i + vec3(1,0,0)), f.x), mix(hash(i + vec3(0,1,0)), hash(i + vec3(1,1,0)), f.x), f.y),
             mix(mix(hash(i + vec3(0,0,1)), hash(i + vec3(1,0,1)), f.x), mix(hash(i + vec3(0,1,1)), hash(i + vec3(1,1,1)), f.x), f.y), f.z);
}
float fbm(vec3 p){ float v = 0.0, a = 0.5; for (int i = 0; i < 5; i++) { v += a * noise(p); p *= 2.03; a *= 0.5; } return v; }
float fbm3(vec3 p){ float v = 0.0, a = 0.5; for (int i = 0; i < 3; i++) { v += a * noise(p); p *= 2.03; a *= 0.5; } return v; }
mat2 rot(float a){ float c = cos(a), s = sin(a); return mat2(c, -s, s, c); }
`

const PLANET_FRAG = `
uniform vec3 uSun; uniform float uTime; uniform float uStyle; uniform float uSeed; uniform float uSpin; uniform float uAlpha; uniform float uAtmoAmt;
uniform vec3 uA; uniform vec3 uB; uniform vec3 uC; uniform vec3 uAtmo;
varying vec3 vObj; varying vec3 vN; varying vec3 vView;
${NOISE}
float heightAt(vec3 p){ return fbm3(p * 2.6 + uSeed); }
void main() {
  vec3 N0 = normalize(vN); vec3 V = normalize(vView); vec3 L = normalize(uSun);
  vec3 p = normalize(vObj); p.xz = rot(uSpin) * p.xz;
  float h = fbm(p * 2.6 + uSeed);
  float land = 1.0; float cl = 0.0; float gloss = 0.0; float bump = 0.0; vec3 emis = vec3(0.0); vec3 col;
  if (uStyle < 0.5) {
    land = smoothstep(0.5, 0.54, h);
    vec3 ocean = mix(uA * 0.45, uA, smoothstep(0.2, 0.5, h));
    vec3 ground = mix(uB, uC, smoothstep(0.54, 0.75, h));
    col = mix(ocean, ground, land);
    float ice = smoothstep(0.78, 0.92, abs(p.y) + (fbm(p * 6.0) - 0.5) * 0.2);
    col = mix(col, vec3(0.9, 0.95, 1.0), ice);
    cl = smoothstep(0.52, 0.72, fbm(p * 4.0 + vec3(uTime * 0.01, 0.0, uSeed)));
    land = max(land, ice); gloss = 1.0 - land; bump = land * 0.12;
  } else if (uStyle < 1.5) {
    col = mix(uA, uB, smoothstep(0.3, 0.7, h));
    col = mix(col, uC, smoothstep(0.55, 0.8, fbm(p * 9.0)) * 0.5);
    cl = smoothstep(0.62, 0.85, fbm(p * 4.0 + vec3(uTime * 0.012, 0.0, uSeed))) * 0.35; bump = 0.14;
  } else if (uStyle < 2.5) {
    col = mix(uA, uB, fbm(p * 5.0 + uSeed)) * (0.8 + 0.4 * noise(p * 22.0));
    col = mix(col, col * 0.5, smoothstep(0.55, 0.62, fbm(p * 1.8 + 4.0))); bump = 0.2;
  } else if (uStyle < 3.5) {
    col = mix(uA, uB, fbm(p * 4.0 + uSeed));
    float crack = 1.0 - smoothstep(0.0, 0.03, abs(fbm(p * 7.0 + uSeed) - 0.5));
    col = mix(col, uB * 0.45, crack * 0.8); gloss = 0.8; bump = 0.05;
    cl = smoothstep(0.6, 0.8, fbm(p * 3.0 + vec3(uTime * 0.01, 0.0, uSeed))) * 0.5;
  } else {
    col = mix(uA, uB, fbm(p * 6.0 + uSeed));
    float crack = 1.0 - smoothstep(0.0, 0.06, abs(fbm(p * 5.0 + uSeed) - 0.5));
    emis = uC * crack * (1.4 + 0.5 * sin(uTime * 1.5 + h * 10.0)); bump = 0.1;
  }
  vec3 N = N0;
  if (bump > 0.0) {
    float e = 0.012; float h0 = heightAt(p);
    vec3 g = vec3(heightAt(p + vec3(e, 0.0, 0.0)) - h0, heightAt(p + vec3(0.0, e, 0.0)) - h0, heightAt(p + vec3(0.0, 0.0, e)) - h0) / e;
    g.xz = rot(-uSpin) * g.xz;
    g -= N0 * dot(g, N0);
    N = normalize(N0 - g * bump);
  }
  col = mix(col, vec3(1.0), cl * (uStyle < 0.5 ? 0.85 : 1.0));
  float ndl0 = dot(N0, L); float ndl = dot(N, L);
  float diff = smoothstep(-0.06, 0.5, ndl);
  vec3 lit = col * (0.03 + diff * 1.25);
  vec3 R = reflect(-L, N);
  lit += vec3(1.0, 0.95, 0.85) * pow(max(dot(R, V), 0.0), 48.0) * gloss * (1.0 - cl) * diff * 0.9;
  if (uStyle < 0.5) {
    float night = 1.0 - smoothstep(-0.12, 0.12, ndl0);
    lit += vec3(1.0, 0.8, 0.45) * step(0.74, fbm(p * 16.0 + 7.0)) * land * night * (1.0 - cl) * 0.9;
  }
  lit += emis;
  float fres = pow(1.0 - max(dot(N0, V), 0.0), 3.0);
  lit += uAtmo * fres * uAtmoAmt * (0.12 + 1.1 * smoothstep(-0.25, 0.45, ndl0));
  lit += vec3(1.0, 0.5, 0.25) * fres * smoothstep(-0.05, 0.1, ndl0) * (1.0 - smoothstep(0.1, 0.35, ndl0)) * 0.5 * uAtmoAmt;
  gl_FragColor = vec4(lit, uAlpha);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}`

const STAR_FRAG = `
uniform float uTime; uniform float uAlpha; uniform vec3 uCore; uniform vec3 uHot;
varying vec3 vObj; varying vec3 vN; varying vec3 vView;
${NOISE}
void main() {
  vec3 p = normalize(vObj); vec3 N = normalize(vN); vec3 V = normalize(vView);
  float mu = max(dot(N, V), 0.0);
  float g = fbm(p * 6.0 + vec3(uTime * 0.04, 0.0, 0.0));
  float g2 = fbm(p * 14.0 - uTime * 0.06);
  vec3 col = mix(uCore, uHot, smoothstep(0.25, 0.75, g * 0.7 + g2 * 0.3));
  col *= 1.0 - smoothstep(0.62, 0.7, fbm(p * 3.0 + 4.0)) * 0.55;
  col *= (0.45 + 0.55 * pow(mu, 0.5)) * 1.8;
  gl_FragColor = vec4(col, uAlpha);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}`

interface Preset { style: number; a: number; b: number; c: number; atmo: number; atmoAmt: number; r: [number, number] }
const hsl = (h: number, sat: number, l: number): number => new THREE.Color().setHSL(h, sat, l).getHex()
const STYLE_POOL = [0, 0, 0, 1, 1, 2, 3, 4]

function makePreset(style: number, classic = false): Preset {
  if (classic) return { style: 0, a: 0x1b4f9c, b: 0x3c7a3a, c: 0x8a7b52, atmo: 0x5aa8ff, atmoAmt: 1, r: [24, 34] }
  switch (style) {
    case 0: { const oh = rand(0.5, 0.68); return { style, a: hsl(oh, 0.6, 0.3), b: hsl(rand(0.2, 0.4), 0.4, 0.28), c: hsl(rand(0.06, 0.14), 0.35, 0.4), atmo: hsl(oh, 0.8, 0.65), atmoAmt: 1, r: [16, 32] } }
    case 1: { const h = Math.random() < 0.5 ? rand(0.02, 0.1) : rand(0.55, 0.95); return { style, a: hsl(h, 0.55, 0.45), b: hsl(h + 0.02, 0.5, 0.28), c: hsl(h - 0.02, 0.5, 0.62), atmo: hsl(h, 0.7, 0.7), atmoAmt: 0.5, r: [10, 22] } }
    case 2: { const h = rand(0, 1); return { style, a: hsl(h, 0.08, 0.55), b: hsl(h, 0.1, 0.3), c: 0, atmo: hsl(h, 0.2, 0.7), atmoAmt: 0.12, r: [5, 12] } }
    case 3: { const h = rand(0.5, 0.62); return { style, a: hsl(h, 0.3, 0.88), b: hsl(h, 0.45, 0.6), c: 0xffffff, atmo: hsl(h, 0.8, 0.75), atmoAmt: 0.8, r: [10, 22] } }
    default: { const h = rand(0, 0.08); return { style: 4, a: hsl(h, 0.5, 0.05), b: hsl(h, 0.5, 0.12), c: hsl(h + 0.02, 1, 0.5), atmo: hsl(h + 0.02, 1, 0.55), atmoAmt: 0.6, r: [10, 22] } }
  }
}
const STARS = [
  { core: 0xff8a1f, hot: 0xfff1c0, corona: 0xffb060, r: [11, 16] },
  { core: 0xaa1a10, hot: 0xff6a30, corona: 0xff5a30, r: [16, 24] },
  { core: 0x4a8cff, hot: 0xeaf4ff, corona: 0x7ab0ff, r: [8, 12] },
  { core: 0xffb347, hot: 0xffe9a8, corona: 0xffc870, r: [9, 13] },
  { core: 0xcfd8ff, hot: 0xffffff, corona: 0xaecbff, r: [10, 15] }
]

const BH_FRAG = `
uniform float uTime; uniform float uAlpha; uniform vec3 uTint; varying vec2 vUv;
void main() {
  vec2 p = (vUv - 0.5) * 2.0; float r = length(p);
  float hole = 1.0 - smoothstep(0.2, 0.24, r);
  float ring = exp(-pow((r - 0.27) * 28.0, 2.0)) * 1.2;
  vec2 q = vec2(p.x, p.y / 0.28); float rd = length(q); float ang = atan(q.y, q.x);
  float disk = smoothstep(0.3, 0.42, rd) * (1.0 - smoothstep(0.75, 1.0, rd));
  float swirl = 0.65 + 0.35 * sin(ang * 3.0 + uTime * 1.5 - rd * 14.0);
  float dopp = 0.55 + 0.45 * (0.5 - p.x);
  float arc = exp(-pow((r - 0.33) * 9.0, 2.0)) * smoothstep(0.0, 0.9, abs(p.y) * 2.0) * 0.7;
  vec3 hot = mix(uTint, vec3(1.0, 0.95, 0.85), clamp(1.0 - rd, 0.0, 1.0) * 1.2);
  vec3 col = hot * disk * swirl * dopp * 1.6 + vec3(1.0, 0.8, 0.55) * ring + hot * arc * 0.8;
  float a = clamp(disk * swirl + ring + arc + hole, 0.0, 1.0) * uAlpha * (1.0 - smoothstep(0.92, 1.0, r));
  gl_FragColor = vec4(col * (1.0 - hole), a);
}`

interface Slot {
  obj: THREE.Object3D
  z: number
  wait: number
  fade: [number, number]
  rest: [number, number]
  apply(a: number): void
  respawn(variant?: number): void
  tick?(dt: number): void
}
type Uniforms = Record<string, THREE.IUniform>

class StarLayer {
  readonly points: THREE.Points
  private pos: Float32Array
  private drawn: number
  constructor(private max: number, size: number, tex: THREE.Texture, private twinkle: number, tints: number[][]) {
    this.drawn = max
    this.pos = new Float32Array(max * 3)
    const col = new Float32Array(max * 3)
    for (let i = 0; i < max; i++) {
      const o = i * 3
      this.pos[o] = rand(-160, 160)
      this.pos[o + 1] = rand(-90, 90)
      this.pos[o + 2] = rand(-DEPTH, 0)
      const b = 0.35 + Math.random() ** 2.2 * 0.65
      const t = pick(tints)
      col[o] = b * (t[0] ?? 1); col[o + 1] = b * (t[1] ?? 1); col[o + 2] = b * (t[2] ?? 1)
    }
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.BufferAttribute(this.pos, 3).setUsage(THREE.DynamicDrawUsage))
    g.setAttribute('color', new THREE.BufferAttribute(col, 3))
    this.points = new THREE.Points(g, new THREE.PointsMaterial({ size, map: tex, vertexColors: true, transparent: true, depthWrite: false, sizeAttenuation: false }))
    this.points.frustumCulled = false
  }
  setFraction(f: number): void {
    this.drawn = Math.max(1, Math.round(this.max * f))
    this.points.geometry.setDrawRange(0, this.drawn)
  }
  update(dt: number, speed: number, time: number): void {
    const p = this.pos
    for (let i = 0; i < this.drawn; i++) {
      const o = i * 3 + 2
      const z = (p[o] ?? 0) + speed * dt * (0.4 + ((p[o] ?? 0) + DEPTH) / DEPTH * 1.2)
      if (z > 0) { p[o] = -DEPTH; p[o - 2] = rand(-160, 160); p[o - 1] = rand(-90, 90) } else p[o] = z
    }
    ;(this.points.geometry.attributes.position as THREE.BufferAttribute).needsUpdate = true
    if (this.twinkle > 0) (this.points.material as THREE.PointsMaterial).opacity = 1 - this.twinkle + this.twinkle * (0.5 + 0.5 * Math.sin(time * 2.3 + this.max))
  }
  dispose(): void {
    this.points.geometry.dispose()
    ;(this.points.material as THREE.PointsMaterial).dispose()
  }
}

export class Environment {
  readonly group = new THREE.Group()
  private layers: StarLayer[] = []
  private dust: THREE.Points
  private dustPos: Float32Array
  private slots: Slot[] = []
  private textures: THREE.Texture[] = []
  private sphere = new THREE.SphereGeometry(1, 64, 48)
  private halo = glowTexture('255,255,255', 128)
  private uTime = { value: 0 }
  private comet: THREE.Sprite
  private cometVel = new THREE.Vector3()
  private cometLife = 0
  private cometTimer = rand(4, 8)
  private bhSlots: Slot[] = []
  private streaks: { sprite: THREE.Sprite; vel: THREE.Vector3; life: number; max: number }[] = []
  private evType: SpaceEvent | null = null
  private evT = 0
  private evDur = 0
  private flareK = 0
  private ionBoost = 0
  private ionLight = new THREE.PointLight(0x6aa8ff, 0, 500, 1.2)
  private snFlash!: THREE.Sprite
  private snRing!: THREE.Sprite
  private time = 0

  constructor() {
    const starTex = glowTexture('255,255,255', 32)
    this.textures.push(starTex, this.halo)
    const white = [[1, 1, 1], [0.7, 0.88, 1], [0.85, 0.9, 1]]
    const mixed = [[1, 1, 1], [0.7, 0.88, 1], [0.8, 0.7, 1], [1, 0.85, 0.7]]
    const vivid = [[0.6, 0.8, 1], [1, 0.7, 0.5], [0.8, 0.6, 1], [1, 0.95, 0.8], [1, 0.6, 0.55]]
    this.layers.push(new StarLayer(450, 2.2, starTex, 0, white), new StarLayer(200, 3.4, starTex, 0.12, mixed), new StarLayer(50, 5.6, starTex, 0.25, vivid))
    for (const l of this.layers) this.group.add(l.points)

    this.dustPos = new Float32Array(160 * 3)
    for (let i = 0; i < 160; i++) this.resetDust(i, true)
    const dg = new THREE.BufferGeometry()
    dg.setAttribute('position', new THREE.BufferAttribute(this.dustPos, 3).setUsage(THREE.DynamicDrawUsage))
    this.dust = new THREE.Points(dg, new THREE.PointsMaterial({
      size: 1.4, map: starTex, color: 0x9fb8ff, transparent: true, opacity: 0.4, depthWrite: false, sizeAttenuation: false
    }))
    this.dust.frustumCulled = false
    this.group.add(this.dust)

    const gal = [
      galaxyTexture('255,226,185', '150,178,255', 21, 4.6),
      galaxyTexture('255,215,235', '205,150,255', 47, 3.8, '255,110,160'),
      galaxyTexture('255,240,200', '120,220,230', 63, 3.0, '255,170,120', 3),
      galaxyTexture('255,200,160', '255,170,140', 88, 5.4, '200,120,255', 4),
      ellipticalTexture('255,214,160', 9)
    ]
    const neb = [
      cloudTexture('120,70,210', 3), cloudTexture('190,60,130', 8), cloudTexture('30,140,160', 5), cloudTexture('50,70,190', 12),
      cloudTexture('200,110,50', 15), cloudTexture('60,160,90', 19),
      ringNebulaTexture('90,220,255', '255,90,170', 4), ringNebulaTexture('120,255,190', '255,170,70', 9)
    ]
    const clu = [clusterTexture(5), clusterTexture(11)]
    this.textures.push(...gal, ...neb, ...clu)

    for (let i = 0; i < 5; i++) this.slots.push(this.planetSlot())
    for (let i = 0; i < 2; i++) this.slots.push(this.starSlot())
    for (let i = 0; i < 4; i++) this.slots.push(this.galaxySlot(gal))
    for (let i = 0; i < 6; i++) this.slots.push(this.nebulaSlot(neb))
    for (let i = 0; i < 2; i++) this.slots.push(this.clusterSlot(clu))
    for (let i = 0; i < 3; i++) { const b = this.blackHoleSlot(); this.bhSlots.push(b); this.slots.push(b) }
    this.slots.push(this.stationSlot(), this.fieldSlot(), this.fieldSlot())

    for (const s of this.slots) {
      s.respawn()
      s.z = rand(-340, -130)
      s.obj.position.z = s.z
    }
    const first = this.slots[0]!
    first.respawn(0)
    first.z = -200; first.obj.position.set(-74, 6, -200)
    const sun = this.slots[5]!
    sun.respawn(0)
    sun.z = -215; sun.obj.position.set(92, 34, -215)
    this.bhSlots.forEach((b, i) => { if (i > 0) { b.wait = rand(4, 14); b.obj.visible = false } })

    const streakTex = cometTexture()
    const shockTex = shockTexture()
    this.textures.push(streakTex, shockTex)
    for (let i = 0; i < 28; i++) {
      const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: streakTex, color: 0xffc890, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, opacity: 0 }))
      sprite.visible = false
      this.group.add(sprite)
      this.streaks.push({ sprite, vel: new THREE.Vector3(), life: 0, max: 1 })
    }
    this.snFlash = new THREE.Sprite(new THREE.SpriteMaterial({ map: this.halo, color: 0xdfeaff, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, opacity: 0 }))
    this.snRing = new THREE.Sprite(new THREE.SpriteMaterial({ map: shockTex, color: 0xaecbff, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, opacity: 0 }))
    this.snFlash.visible = false
    this.snRing.visible = false
    this.ionLight.position.set(0, 30, -50)
    this.group.add(this.snFlash, this.snRing, this.ionLight)

    this.comet = new THREE.Sprite(new THREE.SpriteMaterial({
      map: cometTexture(), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, opacity: 0
    }))
    this.comet.scale.set(46, 4, 1)
    this.group.add(this.comet)
  }

  private resetDust(i: number, any: boolean): void {
    const o = i * 3
    this.dustPos[o] = rand(-18, 18)
    this.dustPos[o + 1] = rand(-9, 12)
    this.dustPos[o + 2] = any ? rand(-70, 4) : -70
  }

  private side(): number { return Math.random() < 0.5 ? -1 : 1 }

  private planetMaterial(): THREE.ShaderMaterial {
    return new THREE.ShaderMaterial({
      vertexShader: VERT, fragmentShader: PLANET_FRAG, transparent: true,
      uniforms: {
        uSun: { value: SUN_DIR }, uTime: this.uTime, uStyle: { value: 0 }, uSeed: { value: 0 }, uSpin: { value: 0 },
        uAlpha: { value: 0 }, uAtmoAmt: { value: 1 },
        uA: { value: new THREE.Color() }, uB: { value: new THREE.Color() }, uC: { value: new THREE.Color() }, uAtmo: { value: new THREE.Color() }
      }
    })
  }

  private applyPreset(u: Uniforms, p: Preset): void {
    ;(u.uStyle as THREE.IUniform).value = p.style
    ;(u.uSeed as THREE.IUniform).value = rand(0, 60)
    ;(u.uAtmoAmt as THREE.IUniform).value = p.atmoAmt
    ;((u.uA as THREE.IUniform).value as THREE.Color).setHex(p.a)
    ;((u.uB as THREE.IUniform).value as THREE.Color).setHex(p.b)
    ;((u.uC as THREE.IUniform).value as THREE.Color).setHex(p.c)
    ;((u.uAtmo as THREE.IUniform).value as THREE.Color).setHex(p.atmo)
  }

  private planetSlot(): Slot {
    const mat = this.planetMaterial()
    const u = mat.uniforms as Uniforms
    const mesh = new THREE.Mesh(this.sphere, mat)
    const moonMat = this.planetMaterial()
    const mu = moonMat.uniforms as Uniforms
    const moon = new THREE.Mesh(this.sphere, moonMat)
    moon.visible = false
    const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: this.halo, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, opacity: 0 }))
    const obj = new THREE.Group()
    obj.add(mesh, moon, halo)
    let haloK = 0.3, spin = 0.02, orbitA = 0, orbitR = 0, orbitSpeed = 0.15, tilt = 0.3
    const slot: Slot = {
      obj, z: FAR, wait: 0, fade: [-130, -70], rest: [0, 5],
      apply: (a) => { (u.uAlpha as THREE.IUniform).value = a; (mu.uAlpha as THREE.IUniform).value = a; halo.material.opacity = a * haloK },
      tick: (dt) => {
        ;(u.uSpin as THREE.IUniform).value += dt * spin
        if (moon.visible) {
          orbitA += dt * orbitSpeed
          moon.position.set(Math.cos(orbitA) * orbitR, Math.sin(orbitA) * orbitR * tilt, Math.sin(orbitA) * orbitR * 0.5)
        }
      },
      respawn: (variant) => {
        const p = variant === undefined ? makePreset(pick(STYLE_POOL)) : makePreset(0, true)
        const r = rand(p.r[0], p.r[1])
        this.applyPreset(u, p)
        mesh.scale.setScalar(r)
        halo.scale.setScalar(r * 3)
        halo.material.color.setHex(p.atmo)
        haloK = p.style === 2 ? 0.08 : 0.3
        spin = rand(0.015, 0.05)
        const hasMoon = variant === undefined && p.style !== 2 && Math.random() < 0.55
        moon.visible = hasMoon
        if (hasMoon) {
          this.applyPreset(mu, makePreset(2))
          moon.scale.setScalar(r * rand(0.15, 0.25))
          orbitR = r * rand(1.9, 2.6)
          orbitA = rand(0, 6.28)
          orbitSpeed = rand(0.08, 0.2) * (Math.random() < 0.5 ? -1 : 1)
          tilt = rand(-0.35, 0.35)
        }
        obj.position.set(this.side() * (rand(62, 150) + r * 1.3), rand(-12, 52), FAR)
        slot.z = FAR
      }
    }
    this.group.add(obj)
    return slot
  }

  private starSlot(): Slot {
    const mat = new THREE.ShaderMaterial({
      vertexShader: VERT, fragmentShader: STAR_FRAG, transparent: true,
      uniforms: { uTime: this.uTime, uAlpha: { value: 0 }, uCore: { value: new THREE.Color() }, uHot: { value: new THREE.Color() } }
    })
    const u = mat.uniforms as Uniforms
    const mesh = new THREE.Mesh(this.sphere, mat)
    const mk = (opacity: number) => new THREE.Sprite(new THREE.SpriteMaterial({
      map: this.halo, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, opacity
    }))
    const inner = mk(0), outer = mk(0)
    const obj = new THREE.Group()
    obj.add(outer, inner, mesh)
    const slot: Slot = {
      obj, z: FAR, wait: 0, fade: [-130, -70], rest: [6, 20],
      apply: (a) => { (u.uAlpha as THREE.IUniform).value = a; inner.material.opacity = a * (0.55 + this.flareK * 0.9); outer.material.opacity = a * (0.2 + this.flareK * 0.5) },
      respawn: (variant) => {
        const s = variant === undefined ? pick(STARS) : STARS[0]!
        const r = rand(s.r[0], s.r[1])
        ;((u.uCore as THREE.IUniform).value as THREE.Color).setHex(s.core)
        ;((u.uHot as THREE.IUniform).value as THREE.Color).setHex(s.hot)
        mesh.scale.setScalar(r)
        inner.scale.setScalar(r * 3.2)
        outer.scale.setScalar(r * 7.5)
        inner.material.color.setHex(s.corona)
        outer.material.color.setHex(s.corona)
        obj.position.set(rand(75, 150) + r, rand(6, 55), FAR)
        slot.z = FAR
      }
    }
    this.group.add(obj)
    return slot
  }

  private galaxySlot(tex: THREE.Texture[]): Slot {
    const mat = new THREE.SpriteMaterial({ map: tex[0], transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, opacity: 0 })
    const sprite = new THREE.Sprite(mat)
    const slot: Slot = {
      obj: sprite, z: FAR, wait: 0, fade: [-170, -100], rest: [2, 10],
      apply: (a) => { mat.opacity = a * 0.9 },
      respawn: () => {
        mat.map = pick(tex)
        mat.color.setHSL(rand(0, 1), 0.45, 0.88)
        const s = rand(80, 140)
        sprite.scale.set(s, s * rand(0.35, 0.9), 1)
        mat.rotation = rand(0, Math.PI)
        sprite.position.set(this.side() * rand(55, 150), rand(-5, 62), FAR)
        slot.z = FAR
      }
    }
    this.group.add(sprite)
    return slot
  }

  private nebulaSlot(tex: THREE.Texture[]): Slot {
    const mat = new THREE.SpriteMaterial({ map: tex[0], transparent: true, depthWrite: false, opacity: 0, fog: false })
    const sprite = new THREE.Sprite(mat)
    let k = 0.3
    const drift = rand(-0.004, 0.004)
    const slot: Slot = {
      obj: sprite, z: FAR, wait: 0, fade: [-190, -120], rest: [0, 4],
      apply: (a) => { mat.opacity = a * k },
      tick: (dt) => { mat.rotation += drift * dt },
      respawn: () => {
        mat.map = pick(tex)
        mat.color.setHSL(rand(0, 1), 0.55, 0.72)
        const s = rand(240, 380)
        sprite.scale.set(s, s * rand(0.7, 1), 1)
        mat.rotation = rand(0, 6)
        k = rand(0.25, 0.42)
        sprite.position.set(this.side() * rand(10, 130), rand(-30, 60), FAR)
        slot.z = FAR
      }
    }
    this.group.add(sprite)
    return slot
  }

  private clusterSlot(tex: THREE.Texture[]): Slot {
    const mat = new THREE.SpriteMaterial({ map: tex[0], transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, opacity: 0 })
    const sprite = new THREE.Sprite(mat)
    const slot: Slot = {
      obj: sprite, z: FAR, wait: 0, fade: [-170, -100], rest: [3, 12],
      apply: (a) => { mat.opacity = a * 0.95 },
      respawn: () => {
        mat.map = pick(tex)
        mat.color.setHSL(rand(0.05, 0.65), 0.35, 0.85)
        sprite.scale.setScalar(rand(30, 60))
        sprite.position.set(this.side() * rand(40, 140), rand(-10, 60), FAR)
        slot.z = FAR
      }
    }
    this.group.add(sprite)
    return slot
  }

  private blackHoleSlot(): Slot {
    const mat = new THREE.ShaderMaterial({
      vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
      fragmentShader: BH_FRAG, transparent: true, depthWrite: false,
      uniforms: { uTime: this.uTime, uAlpha: { value: 0 }, uTint: { value: new THREE.Color(1, 0.45, 0.12) } }
    })
    const u = mat.uniforms as Uniforms
    const tints = [[1, 0.45, 0.12], [0.25, 0.55, 1], [0.7, 0.3, 1], [0.2, 1, 0.65], [1, 0.25, 0.4]]
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), mat)
    const slot: Slot = {
      obj: mesh, z: FAR, wait: 0, fade: [-170, -100], rest: [6, 20],
      apply: (a) => { (u.uAlpha as THREE.IUniform).value = a },
      respawn: () => {
        mesh.scale.setScalar(rand(70, 130))
        const tt = pick(tints)
        ;((u.uTint as THREE.IUniform).value as THREE.Color).setRGB(tt[0] ?? 1, tt[1] ?? 1, tt[2] ?? 1)
        mesh.rotation.z = rand(-0.5, 0.5)
        mesh.position.set(this.side() * rand(50, 120), rand(0, 50), FAR)
        slot.z = FAR
      }
    }
    this.group.add(mesh)
    return slot
  }

  private stationSlot(): Slot {
    const hull = new THREE.MeshStandardMaterial({ color: 0x7d8696, metalness: 0.8, roughness: 0.4, transparent: true })
    const panel = new THREE.MeshStandardMaterial({ color: 0x1a2a55, metalness: 0.6, roughness: 0.3, emissive: 0x0a1a44, transparent: true })
    const lights = new THREE.MeshBasicMaterial({ color: 0xffd9a0, transparent: true })
    const mats = [hull, panel, lights]
    const root = new THREE.Group()
    const ring = new THREE.Group()
    const mk = (geo: THREE.BufferGeometry, m: THREE.Material, parent: THREE.Object3D, x = 0, y = 0, z = 0): THREE.Mesh => {
      const mesh = new THREE.Mesh(geo, m); mesh.position.set(x, y, z); parent.add(mesh); return mesh
    }
    mk(new THREE.CylinderGeometry(0.8, 0.8, 7, 16), hull, root)
    mk(new THREE.TorusGeometry(3.2, 0.35, 10, 40), hull, ring).rotation.x = Math.PI / 2
    const win = new THREE.BoxGeometry(0.25, 0.18, 0.08)
    for (let i = 0; i < 24; i++) {
      const a = (i / 24) * Math.PI * 2
      const w = mk(win, lights, ring, Math.cos(a) * 3.55, 0, Math.sin(a) * 3.55)
      w.rotation.y = -a + Math.PI / 2
    }
    const spoke = new THREE.BoxGeometry(3.2, 0.12, 0.12)
    for (let i = 0; i < 4; i++) { const sp = mk(spoke, hull, ring, 0, 0, 0); sp.rotation.y = (i * Math.PI) / 2 + 0.2; sp.scale.x = 2 }
    mk(new THREE.BoxGeometry(4.6, 0.08, 0.08), hull, root, 0, 3.6, 0)
    for (const x of [-2.6, 2.6]) mk(new THREE.BoxGeometry(1.8, 0.04, 1.6), panel, root, x, 3.6, 0)
    root.add(ring)
    root.scale.setScalar(rand(8, 12))
    const slot: Slot = {
      obj: root, z: FAR, wait: 0, fade: [-150, -90], rest: [12, 40],
      apply: (a) => { mats.forEach((m) => { m.opacity = a }) },
      tick: (dt) => { ring.rotation.y += dt * 0.25 },
      respawn: () => {
        root.scale.setScalar(rand(7, 12))
        root.rotation.set(rand(0.2, 0.5), rand(0, 6), rand(-0.3, 0.3))
        root.position.set(this.side() * rand(45, 100), rand(-5, 40), FAR)
        slot.z = FAR
      }
    }
    this.group.add(root)
    return slot
  }

  private fieldSlot(): Slot {
    const geo = new THREE.IcosahedronGeometry(1, 0)
    const mat = new THREE.MeshStandardMaterial({ color: 0x6a625c, roughness: 0.95, flatShading: true, transparent: true })
    const inst = new THREE.InstancedMesh(geo, mat, 40)
    const m = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), pos = new THREE.Vector3(), sc = new THREE.Vector3()
    const layout = (): void => {
      for (let i = 0; i < 40; i++) {
        pos.set(rand(-40, 40), rand(-9, 9), rand(-25, 25))
        q.setFromEuler(e.set(rand(0, 6), rand(0, 6), rand(0, 6)))
        sc.setScalar(rand(0.7, 4))
        inst.setMatrixAt(i, m.compose(pos, q, sc))
      }
      inst.instanceMatrix.needsUpdate = true
    }
    layout()
    const slot: Slot = {
      obj: inst, z: FAR, wait: 0, fade: [-170, -100], rest: [6, 18],
      apply: (a) => { mat.opacity = a },
      tick: (dt) => { inst.rotation.y += dt * 0.03 },
      respawn: () => {
        layout()
        inst.rotation.set(rand(-0.3, 0.3), rand(0, 6), rand(-0.3, 0.3))
        inst.position.set(this.side() * rand(30, 110), rand(-10, 40), FAR)
        slot.z = FAR
      }
    }
    this.group.add(inst)
    return slot
  }

  trigger(kind: SpaceEvent): void {
    this.evType = kind
    this.evT = 0
    switch (kind) {
      case 'meteors': this.evDur = 10; break
      case 'flare': this.evDur = 3.5; break
      case 'supernova':
        this.evDur = 4.5
        this.snFlash.position.set(this.side() * rand(60, 140), rand(10, 60), -320)
        this.snRing.position.copy(this.snFlash.position)
        break
      case 'ion': this.evDur = 9; this.ionLight.position.set(rand(-30, 30), 30, -50); break
      case 'singularity': {
        this.evDur = 1
        const bh = this.bhSlots.find((x) => x.wait > 0 || x.z > -150) ?? this.bhSlots[0]!
        bh.respawn()
        bh.wait = 0
        bh.z = -250
        bh.obj.position.z = -250
        bh.obj.visible = true
        break
      }
    }
  }

  private spawnStreak(): void {
    const m = this.streaks.find((x) => x.life <= 0)
    if (!m) return
    const dir = Math.random() < 0.5 ? -1 : 1
    m.sprite.position.set(rand(-140, 140), rand(35, 85), rand(-270, -160))
    m.vel.set(-dir * rand(90, 150), -rand(40, 90), 0)
    m.sprite.material.rotation = Math.atan2(m.vel.y, m.vel.x)
    m.sprite.scale.set(rand(22, 40), 1.8, 1)
    m.life = m.max = rand(0.6, 1.1)
    m.sprite.visible = true
  }

  private updateEvents(dt: number): void {
    for (const m of this.streaks) {
      if (m.life <= 0) continue
      m.life -= dt
      m.sprite.position.addScaledVector(m.vel, dt)
      const k = m.life / m.max
      m.sprite.material.opacity = Math.min(1, k * 3, (1 - k) * 6)
      if (m.life <= 0) m.sprite.visible = false
    }
    this.flareK = 0
    const e = this.evType
    if (!e) {
      if (Math.random() < dt * 0.25) this.spawnStreak()
      return
    }
    this.evT += dt
    const k = this.evT / this.evDur
    if (k >= 1) {
      this.evType = null
      this.ionLight.intensity = 0
      this.snFlash.visible = false
      this.snRing.visible = false
      return
    }
    if (e === 'meteors' && Math.random() < dt * 7) this.spawnStreak()
    if (e === 'flare') this.flareK = Math.sin(Math.PI * k)
    if (e === 'supernova') {
      const size = 20 + 280 * Math.min(1, this.evT / 1.2)
      this.snFlash.visible = true
      this.snFlash.scale.set(size, size, 1)
      this.snFlash.material.opacity = Math.pow(1 - k, 2)
      this.snRing.visible = true
      this.snRing.scale.setScalar(30 + 400 * k)
      this.snRing.material.opacity = (1 - k) * 0.7
    }
    if (e === 'ion') {
      if (Math.random() < dt * 3.5) { this.ionBoost = 1; this.ionLight.color.setHex(Math.random() < 0.5 ? 0x6aa8ff : 0xcfe0ff) }
      this.ionBoost *= Math.exp(-dt * 12)
      this.ionLight.intensity = this.ionBoost * 10
    }
  }

  setCount(n: number): void {
    for (const l of this.layers) l.setFraction(clamp(n / 700, 0.1, 1))
  }

  update(dt: number, speed: number): void {
    this.time += dt
    this.uTime.value = this.time
    this.updateEvents(dt)
    for (const l of this.layers) l.update(dt, speed, this.time)

    const d = this.dustPos
    for (let i = 0; i < 160; i++) {
      d[i * 3 + 2] = (d[i * 3 + 2] ?? 0) + (speed * 3 + 6) * dt
      if ((d[i * 3 + 2] ?? 0) > 6) this.resetDust(i, false)
    }
    ;(this.dust.geometry.attributes.position as THREE.BufferAttribute).needsUpdate = true

    const v = Math.max(speed, 5) * 2.2
    for (const s of this.slots) {
      if (s.wait > 0) { s.wait -= dt; s.obj.visible = false; continue }
      s.obj.visible = true
      s.z += v * dt
      s.obj.position.z = s.z
      s.apply(smooth(FAR, FAR + 70, s.z) * (1 - smooth(s.fade[0], s.fade[1], s.z)))
      s.tick?.(dt)
      if (s.z > s.fade[1]) {
        s.respawn()
        s.wait = rand(s.rest[0], s.rest[1])
        s.obj.visible = false
      }
    }

    if (this.cometLife > 0) {
      this.cometLife -= dt
      this.comet.position.addScaledVector(this.cometVel, dt)
      this.comet.material.opacity = Math.min(1, this.cometLife * 2)
    } else {
      this.cometTimer -= dt
      if (this.cometTimer <= 0) {
        const dir = Math.random() < 0.5 ? -1 : 1
        this.comet.position.set(-dir * 120, rand(20, 70), -215)
        this.cometVel.set(dir * rand(90, 130), -rand(10, 35), 0)
        this.comet.material.rotation = Math.atan2(this.cometVel.y, this.cometVel.x)
        this.cometLife = 1.6
        this.cometTimer = rand(5, 11)
      }
    }
  }

  dispose(): void {
    this.group.traverse((o) => {
      const m = o as THREE.Mesh
      const mat = m.material as (THREE.Material & { map?: THREE.Texture | null }) | undefined
      if (mat) { mat.map?.dispose(); mat.dispose() }
      if (m.geometry && m.geometry !== this.sphere) m.geometry.dispose()
    })
    this.sphere.dispose()
    this.layers.forEach((l) => l.dispose())
    this.textures.forEach((t) => t.dispose())
  }
}
