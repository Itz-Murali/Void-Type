import * as THREE from 'three'

const VERT = `
varying vec3 vN; varying vec3 vV; varying float vT;
void main() {
  vT = position.z + 0.5;
  vN = normalize(normalMatrix * normal);
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  vV = normalize(-mv.xyz);
  gl_Position = projectionMatrix * mv;
}`

const FRAG = `
uniform float uTime; uniform float uPhase; uniform vec3 uC1; uniform vec3 uC2;
varying vec3 vN; varying vec3 vV; varying float vT;
void main() {
  float t = clamp(vT, 0.0, 1.0);
  float edge = pow(max(dot(normalize(vN), normalize(vV)), 0.0), 1.2);
  float flick = 0.78 + 0.22 * sin(uTime * 42.0 - t * 16.0 + uPhase) + 0.08 * sin(uTime * 97.0 + uPhase * 3.0);
  float inten = pow(1.0 - t, 1.3) * flick;
  vec3 col = mix(uC1, uC2, smoothstep(0.0, 0.7, t));
  gl_FragColor = vec4(col * inten * 1.8, inten * edge);
}`

export function makeFlameGeometry(): THREE.ConeGeometry {
  const g = new THREE.ConeGeometry(1, 1, 16, 1, true)
  g.rotateX(Math.PI / 2)
  return g
}

export function flameMaterial(c1: number, c2: number, phase = 0): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    vertexShader: VERT, fragmentShader: FRAG, transparent: true,
    blending: THREE.AdditiveBlending, depthWrite: false,
    uniforms: { uTime: { value: 0 }, uPhase: { value: phase }, uC1: { value: new THREE.Color(c1) }, uC2: { value: new THREE.Color(c2) } }
  })
}

export function tickFlames(mats: Iterable<THREE.ShaderMaterial>, t: number): void {
  for (const m of mats) (m.uniforms.uTime as THREE.IUniform).value = t
}
