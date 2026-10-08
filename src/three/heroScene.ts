import * as THREE from "three"

export type HeroThree = { destroy: () => void }

type Tier = "desktop" | "tablet" | "mobile"
type Rng = () => number

type PrimaryStarDef = {
  hip: number
  name: string
  desig: string
  mag: number
  bv: number
  v: readonly [number, number, number]
}

// J2000 unit vectors on the celestial sphere (Hipparcos / HYG v4.1). Astronomical data — do not adjust.
const PRIMARY_LIBRA_STARS = {
  theta: { hip: 77853, name: "", desig: "θ Lib", mag: 4.13, bv: 1.003, v: [-0.501005, -0.28785, 0.816172] },
  gamma: { hip: 76333, name: "Zubenelhakrabi", desig: "γ Lib", mag: 3.91, bv: 1.007, v: [-0.569927, -0.255269, 0.781038] },
  beta: { hip: 74785, name: "Zubeneschamali", desig: "β Lib", mag: 2.61, bv: -0.071, v: [-0.644004, -0.163032, 0.747449] },
  alpha2: { hip: 72622, name: "Zubenelgenubi", desig: "α² Lib", mag: 2.75, bv: 0.147, v: [-0.706074, -0.276338, 0.651995] },
  sigma: { hip: 73714, name: "Brachium", desig: "σ Lib", mag: 3.25, bv: 1.674, v: [-0.627922, -0.427073, 0.650632] },
} satisfies Record<string, PrimaryStarDef>

type PrimaryKey = keyof typeof PRIMARY_LIBRA_STARS

const PRIMARY_ORDER = ["theta", "gamma", "beta", "alpha2", "sigma"] as const

// Stellarium modern stick figure: θ → γ → β → α² → σ → γ (quadrilateral closed at γ).
const LIBRA_LINES = [
  ["theta", "gamma"],
  ["gamma", "beta"],
  ["beta", "alpha2"],
  ["alpha2", "sigma"],
  ["sigma", "gamma"],
] as const satisfies readonly (readonly [PrimaryKey, PrimaryKey])[]

// Real Libra-region stars outside the stick figure (mag < 5 field rule): background only, no lines.
const BACKGROUND_LIBRA_STARS = {
  upsilon: { desig: "υ Lib", mag: 3.6, bv: 1.361, v: [-0.515138, -0.471552, 0.715731], z: -2.4 },
  tau: { desig: "τ Lib", mag: 3.66, bv: -0.177, v: [-0.502001, -0.496637, 0.708059], z: -3.1 },
} satisfies Record<string, { desig: string; mag: number; bv: number; v: readonly [number, number, number]; z: number }>

// Gnomonic projection onto the figure plane: camera-facing from +z, east on the left,
// reproducing the apparent-sky arrangement of the IAU Libra chart without mirroring.
const CENTROID: readonly [number, number, number] = [-0.614905, -0.284279, 0.73558]
const TAN_SCALE = 11.42

function projectLib(v: readonly [number, number, number]): { x: number; y: number; z: number } {
  const rl = Math.hypot(CENTROID[2], CENTROID[0])
  const right = [-CENTROID[2] / rl, 0, CENTROID[0] / rl]
  const up = [
    right[1] * CENTROID[2] - right[2] * CENTROID[1],
    right[2] * CENTROID[0] - right[0] * CENTROID[2],
    right[0] * CENTROID[1] - right[1] * CENTROID[0],
  ]
  const d = v[0] * CENTROID[0] + v[1] * CENTROID[1] + v[2] * CENTROID[2]
  return {
    x: ((v[0] * right[0] + v[1] * right[1] + v[2] * right[2]) / d) * TAN_SCALE,
    y: ((v[0] * up[0] + v[1] * up[1] + v[2] * up[2]) / d) * TAN_SCALE,
    z: -(1 - d) * TAN_SCALE,
  }
}

type SceneStar = PrimaryStarDef & { x: number; y: number; z: number }

const PRIMARY_SCENE = {} as Record<PrimaryKey, SceneStar>
for (const key of PRIMARY_ORDER) {
  PRIMARY_SCENE[key] = { ...PRIMARY_LIBRA_STARS[key], ...projectLib(PRIMARY_LIBRA_STARS[key].v) }
}

const CONFIG = {
  seed: 20251008,

  figScale: 1.6, 
  camera: { fov: 38, near: 0.1, far: 60 },

  palette: {
    starWhite: "#f4f6ff",
    violet: "#814de5",
    violetLight: "#a47ef0",
    violetDeep: "#6e30e3",
    highlight: "#efe8ff",
    dustGrey: "#9aa0b8",
  },

  sweep: { baseSize: 46, fieldSize: 16 },

  twinkle: { ampBright: 0.06, ampDim: 0.16, burstAmp: 0.3 },

  drag: {
    sensitivity: 1.0,
    maxYaw: 70,
    maxPitch: 35,
    friction: 3.5,
    minFling: 0.25,
    stopSpeed: 0.02,
    returnToFront: true,
    returnDelay: 3.5,
    returnRate: 1.8,
    deadzonePx: 4,
  },

  parallax: { camera: 0.12, fieldFollow: 0.03, damping: 3.0, radius: 0.22 },

  sway: { yawDeg: 2.2, pitchDeg: 1.4, periodsSec: [47, 71] },

  lighting: { exposure: 1.15, haloR0: 0.35, hazeAlpha: 0.006 },

  lines: { widthPx: 1.4, featherPx: 0.8, gap: 0.05, alpha: 0.55, traceDur: 1.0, traceStagger: 0.16 },

  pulse: { enabled: true, periodSec: 8.0 },

  haze: { periodSec: 20, wob: 0.1 },

  reveal: { starsSec: 1.4, linesSec: 1.0, fieldDelay: 1.6, fieldSec: 1.0 },

  tiers: {
    desktop: { dprCap: 1.75, field: 520, spikes: true, haze: true, fill: 0.5, sizeMul: 1 },
    tablet: { dprCap: 1.5, field: 300, spikes: true, haze: true, fill: 0.55, sizeMul: 1 },
    mobile: { dprCap: 1.25, field: 170, spikes: false, haze: false, fill: 0.35, sizeMul: 1.14 },
  },

  quality: { warmupFrames: 20, sampleFrames: 60, frameMs: 22, dprStep: 0.25, recheckMs: 2000 },
}

const FIG_SCALE = CONFIG.figScale

function mulberry32(seed: number): Rng {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const MAG_REF = 2.61
const magToFlux = (mag: number) => Math.pow(10, -0.4 * (mag - MAG_REF))
const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v)

function softClamp(v: number, limit: number): number {
  const a = Math.abs(v)
  const knee = limit * 0.7
  if (a <= knee) return v
  return Math.sign(v) * (knee + (limit - knee) * Math.tanh((a - knee) / (limit - knee)))
}

function bvToTemp(bv: number): number {
  const b = Math.max(-0.33, Math.min(2, bv))
  return 4600 * (1 / (0.92 * b + 1.7) + 1 / (0.92 * b + 0.62))
}

function kelvinToSrgb(k: number, whiteLerp: number): THREE.Color {
  const t = k / 100
  let r: number
  let g: number
  let b: number
  if (t <= 6.6) {
    r = 1
    g = Math.max(0, Math.min(1, 0.99 * Math.log(t * 10) - 0.63))
    b = t <= 1.9 ? 0 : Math.max(0, Math.min(1, 1.385 * Math.log(t * 10 - 1) - 3.05))
  } else {
    r = Math.max(0, Math.min(1, 1.292 * Math.pow(t * 10 - 6, -0.1332)))
    g = Math.max(0, Math.min(1, 1.129 * Math.pow(t * 10 - 6, -0.0755)))
    b = 1
  }
  const c = new THREE.Color(r, g, b)
  c.lerp(new THREE.Color(1, 1, 1), whiteLerp)
  return c
}

const STAR_VERT =  `
attribute float aFlux;
attribute float aSeed;
attribute vec3 aTint;
attribute float aSpike;

uniform float uTime;
uniform float uPixelRatio;
uniform float uSizeBase;
uniform float uRefDist;
uniform float uTwinkle;
uniform float uReveal;
uniform vec2 uPointerNDC;
uniform float uAspect;
uniform float uPointerRadius;
uniform float uMaxPoint;
uniform float uMode;   
uniform vec3 uInk;

varying vec3 vTint;
varying float vI;
varying float vSpike;
varying float vFlux;

float hash11(float n) { return fract(sin(n * 127.1) * 43758.5453); }

void main() {
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  gl_Position = projectionMatrix * mv;

  float st = (1.0 - clamp(aFlux, 0.0, 1.0)) * 0.5;
  float seq = clamp((uReveal - st) / 0.5, 0.0, 1.0);

  float s = aSeed * 6.2831;
  float tw = 0.50 * sin(uTime * (3.5 + 6.0 * aSeed) + s * 3.0)
           + 0.30 * sin(uTime * (7.0 + 7.0 * aSeed) + s * 7.0)
           + 0.20 * sin(uTime * (1.6 + 2.0 * aSeed) + s * 11.0);
  float amp = mix(0.16, 0.06, clamp(aFlux, 0.0, 1.0));

  float period = 6.0 + 9.0 * hash11(aSeed * 91.7);
  float tt = uTime + aSeed * period;
  float cycle = floor(tt / period);
  float ph = tt - cycle * period;
  float fire = step(0.45, hash11(cycle + aSeed * 57.3));
  float burst = fire * exp(-pow((ph - 0.25) / 0.14, 2.0)) * 0.30;
  float tw01 = 1.0 + uTwinkle * (amp * tw + burst * (tw * 0.5 + 0.5));

  vec2 ndc = gl_Position.xy / gl_Position.w;
  float hasPointer = step(abs(uPointerNDC.x), 4.0);
  float near = smoothstep(uPointerRadius, 0.0, length((ndc - uPointerNDC) * vec2(uAspect, 1.0))) * hasPointer;

  vI = (0.26 + 0.74 * pow(aFlux, 0.62)) * tw01 * seq * (1.0 + 0.35 * near);
  vTint = aTint;
  vSpike = aSpike;
  vFlux = clamp(aFlux, 0.0, 1.0);

  float size = uSizeBase * (0.34 + 0.66 * pow(aFlux, 0.42)) * (1.0 + 0.10 * (tw01 - 1.0) + 0.15 * near);
  gl_PointSize = clamp(size * uPixelRatio * (uRefDist / -mv.z), 2.0, uMaxPoint);
}
`

const STAR_FRAG =  `
uniform vec3 uHalo;
uniform float uExposure;
uniform float uMode;
uniform vec3 uInk;

varying vec3 vTint;
varying float vI;
varying float vSpike;
varying float vFlux;

void main() {
  vec2 p = (gl_PointCoord - 0.5) * 2.0;
  float r = length(p);
  if (r > 1.0) discard;
  float edge = 1.0 - smoothstep(0.55, 1.0, r);
  float coreR = mix(0.13, 0.085, vFlux);
  float core = exp(-pow(r / coreR, 2.0));
  float glow = exp(-r * mix(6.0, 3.4, vFlux)) * edge;
  vec2 q = abs(p);
  float spikes = (exp(-q.x * 38.0) * exp(-q.y * 2.6) + exp(-q.y * 38.0) * exp(-q.x * 2.6)) * edge * vSpike;

  vec3 spikeTint = mix(mix(vTint, vec3(1.0), 0.75), uInk, uMode);
  vec3 coreTint = mix(vTint, uInk, uMode);

  vec3 col = coreTint * (core * (1.3 + 1.9 * vFlux) + glow * (0.14 + 0.30 * vFlux))
           + spikeTint * spikes * (0.08 + 0.10 * vFlux)
           + uHalo * glow * (0.16 + 0.26 * vFlux) * mix(1.0, 0.7, uMode);
  col *= vI;
  col = 1.0 - exp(-col * uExposure);
  gl_FragColor = vec4(col, 1.0);
  #include <colorspace_fragment>

  gl_FragColor.a = clamp(max(gl_FragColor.r, max(gl_FragColor.g, gl_FragColor.b)), 0.0, 1.0);
}
`

const LINE_VERT =  `
attribute vec3 aOther;
attribute float aSide;
attribute float aAlong;
attribute float aSeg;
attribute float aDelay;
attribute float aDur;

uniform vec2 uResolution;
uniform float uHalfPx;
uniform float uFeatherPx;
uniform float uTrace;

varying vec3 vLocal;
varying float vAlong;
varying float vAcross;
varying float vSeg;
varying float vProg;

void main() {
  vec4 c0 = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  vec4 c1 = projectionMatrix * modelViewMatrix * vec4(aOther, 1.0);
  vec2 dir = normalize((c1.xy / c1.w - c0.xy / c0.w) * uResolution);
  vec2 nrm = vec2(-dir.y, dir.x);
  gl_Position = c0;
  gl_Position.xy += nrm * aSide * ((uHalfPx + uFeatherPx) / uResolution) * c0.w;
  vLocal = position;
  vAlong = aAlong;
  vAcross = aSide;
  vSeg = aSeg;
  vProg = clamp((uTrace - aDelay) / aDur, 0.0, 1.0);
}
`

const LINE_FRAG =  `
uniform vec3 uLine;
uniform vec3 uHighlight;
uniform float uLineAlpha;
uniform float uR0;
uniform float uPulseEnabled;
uniform vec2 uPulse;
uniform vec3 uStarPos[5];
uniform float uStarFlux[5];
uniform float uHalfPx;
uniform float uFeatherPx;

varying vec3 vLocal;
varying float vAlong;
varying float vAcross;
varying float vSeg;
varying float vProg;

void main() {

  float L = 0.0;
  for (int i = 0; i < 5; i++) {
    float d = distance(vLocal, uStarPos[i]);
    L += uStarFlux[i] / (1.0 + (d * d) / (uR0 * uR0));
  }
  float ends = smoothstep(0.0, 0.18, vAlong) * (1.0 - smoothstep(0.82, 1.0, vAlong));
  float dPx = abs(vAcross) * (uHalfPx + uFeatherPx);
  float across = 1.0 - smoothstep(max(uHalfPx - uFeatherPx, 0.0), uHalfPx + uFeatherPx, dPx);
  float seen = 1.0 - smoothstep(vProg - 0.06, vProg, vAlong);
  float head = exp(-pow((vAlong - vProg) / 0.04, 2.0)) * step(0.001, vProg) * step(vProg, 0.999);

  float a = uLineAlpha * (0.55 + 0.9 * min(L, 1.6)) * ends * across * seen;
  vec3 col = uLine * a;

  float pulse = exp(-pow((vAlong - uPulse.y) / 0.05, 2.0))
              * step(0.5, uPulseEnabled) * (1.0 - step(0.5, abs(vSeg - uPulse.x)));
  col += uHighlight * (head * 0.5 + pulse * 0.8) * across;

  col = 1.0 - exp(-col * 1.15);
  gl_FragColor = vec4(col, 1.0);
  #include <colorspace_fragment>
  gl_FragColor.a = clamp(max(gl_FragColor.r, max(gl_FragColor.g, gl_FragColor.b)), 0.0, 1.0);
}
`

const FIELD_VERT =  `
attribute float aSeed;
attribute vec3 aTint;
attribute float aFlux;

uniform float uTime;
uniform float uPixelRatio;
uniform float uSizeBase;
uniform float uRefDist;
uniform float uTwinkle;
uniform float uReveal;

varying vec3 vTint;
varying float vI;

void main() {
  vec3 p = position;
  float s = aSeed * 6.2831;
  p.x += sin(uTime * 0.031 + s) * 0.012;
  p.y += cos(uTime * 0.023 + s * 1.7) * 0.012;

  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  gl_Position = projectionMatrix * mv;

  float tw = 0.6 * sin(uTime * (2.2 + 3.5 * aSeed) + s * 3.0) + 0.4 * sin(uTime * (5.5 + 4.0 * aSeed) + s * 7.0);
  float tw01 = 1.0 + uTwinkle * 0.08 * tw;

  vI = (0.11 + 0.45 * pow(aFlux, 0.92)) * tw01 * uReveal;
  vTint = aTint;

  float size = uSizeBase * (0.28 + 0.42 * sqrt(aFlux));
  gl_PointSize = clamp(size * uPixelRatio * (uRefDist / -mv.z), 1.5, 7.0);
}
`

const FIELD_FRAG =  `
uniform float uExposure;
uniform vec3 uTintMul;
varying vec3 vTint;
varying float vI;

void main() {
  vec2 p = (gl_PointCoord - 0.5) * 2.0;
  float r = length(p);
  if (r > 1.0) discard;
  float edge = 1.0 - smoothstep(0.55, 1.0, r);
  float core = exp(-pow(r / 0.13, 2.0));
  float glow = exp(-r * 4.0) * edge;

  vec3 col = vTint * uTintMul * (core * 1.3 + glow * 0.18) * vI;
  col = 1.0 - exp(-col * uExposure);
  gl_FragColor = vec4(col, 1.0);
  #include <colorspace_fragment>
  gl_FragColor.a = clamp(max(gl_FragColor.r, max(gl_FragColor.g, gl_FragColor.b)), 0.0, 1.0);
}
`

const HAZE_VERT =  `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`

const HAZE_FRAG =  `
uniform vec3 uColor;
uniform float uAlpha;
varying vec2 vUv;

void main() {
  vec2 p = (vUv - 0.5) * 2.0;
  float r = length(p);
  float a = exp(-r * r * 3.4) * uAlpha * (1.0 - smoothstep(0.55, 0.95, r));
  gl_FragColor = vec4(uColor * a, 1.0);
  #include <colorspace_fragment>
  gl_FragColor.a = clamp(max(gl_FragColor.r, max(gl_FragColor.g, gl_FragColor.b)), 0.0, 1.0);
}
`

type StarBuild = {
  positions: Float32Array
  flux: Float32Array
  seeds: Float32Array
  tints: Float32Array
  spikes: Float32Array
  count: number
}

function buildPrimary(spikesOn: boolean): StarBuild {
  const rng = mulberry32(CONFIG.seed)
  const count = PRIMARY_ORDER.length
  const positions = new Float32Array(count * 3)
  const flux = new Float32Array(count)
  const seeds = new Float32Array(count)
  const tints = new Float32Array(count * 3)
  const spikes = new Float32Array(count)

  PRIMARY_ORDER.forEach((key, i) => {
    const d = PRIMARY_SCENE[key]
    positions[i * 3] = d.x
    positions[i * 3 + 1] = d.y
    positions[i * 3 + 2] = d.z
    flux[i] = magToFlux(d.mag)
    seeds[i] = rng()
    const c = kelvinToSrgb(bvToTemp(d.bv), 0.42)
    tints[i * 3] = c.r
    tints[i * 3 + 1] = c.g
    tints[i * 3 + 2] = c.b
    spikes[i] = spikesOn && d.mag < 3.0 ? Math.min(1, flux[i]) : 0
  })

  return { positions, flux, seeds, tints, spikes, count }
}

type LineBuild = {
  positions: Float32Array
  others: Float32Array
  sides: Float32Array
  alongs: Float32Array
  segs: Float32Array
  delays: Float32Array
  durs: Float32Array
}

function buildLines(cfg: typeof CONFIG.lines): LineBuild {
  const n = LIBRA_LINES.length
  const positions = new Float32Array(n * 4 * 3)
  const others = new Float32Array(n * 4 * 3)
  const sides = new Float32Array(n * 4)
  const alongs = new Float32Array(n * 4)
  const segs = new Float32Array(n * 4)
  const delays = new Float32Array(n * 4)
  const durs = new Float32Array(n * 4)

  for (let s = 0; s < n; s++) {
    const [aKey, bKey] = LIBRA_LINES[s]
    const a = PRIMARY_SCENE[aKey]
    const b = PRIMARY_SCENE[bKey]
    const dx = b.x - a.x
    const dy = b.y - a.y
    const dz = b.z - a.z
    const len = Math.hypot(dx, dy, dz)
    const g = cfg.gap
    const sx = a.x + (dx / len) * g
    const sy = a.y + (dy / len) * g
    const sz = a.z + (dz / len) * g
    const ex = b.x - (dx / len) * g
    const ey = b.y - (dy / len) * g
    const ez = b.z - (dz / len) * g
    const delay = s * cfg.traceStagger
    const dur = cfg.traceDur

    for (let v = 0; v < 4; v++) {
      const i = s * 4 + v
      const isEnd = v >= 2
      positions[i * 3] = isEnd ? ex : sx
      positions[i * 3 + 1] = isEnd ? ey : sy
      positions[i * 3 + 2] = isEnd ? ez : sz
      others[i * 3] = isEnd ? sx : ex
      others[i * 3 + 1] = isEnd ? sy : ey
      others[i * 3 + 2] = isEnd ? sz : ez
      sides[i] = v === 0 || v === 2 ? -1 : 1
      alongs[i] = isEnd ? 1 : 0
      segs[i] = s
      delays[i] = delay
      durs[i] = dur
    }
  }
  return { positions, others, sides, alongs, segs, delays, durs }
}

type FieldBuild = { positions: Float32Array; seeds: Float32Array; tints: Float32Array; flux: Float32Array }

function buildField(count: number, camZ: number, aspect: number): FieldBuild {
  const rng = mulberry32(CONFIG.seed + 1)
  const catalog = Object.values(BACKGROUND_LIBRA_STARS)
  const total = count + catalog.length
  const positions = new Float32Array(total * 3)
  const seeds = new Float32Array(total)
  const tints = new Float32Array(total * 3)
  const flux = new Float32Array(total)
  const base = new THREE.Color(CONFIG.palette.starWhite)
  const warm = new THREE.Color("#ffe9cf")
  const cool = new THREE.Color("#dfe8ff")
  const grey = new THREE.Color(CONFIG.palette.dustGrey)
  const c = new THREE.Color()

  const fovHalf = THREE.MathUtils.degToRad(CONFIG.camera.fov / 2)
  for (let i = 0; i < count; i++) {
    const shell = i % 3
    const dist = camZ + 5 + shell * 6 + rng() * 6
    const halfH = dist * Math.tan(fovHalf) * 1.3
    const halfW = halfH * Math.max(aspect, 1) * 1.15
    positions[i * 3] = (rng() * 2 - 1) * halfW
    positions[i * 3 + 1] = (rng() * 2 - 1) * halfH
    positions[i * 3 + 2] = camZ - dist
    seeds[i] = rng()
    flux[i] = Math.pow(rng(), 2.2)
    const pick = rng()
    c.copy(pick < 0.7 ? base : pick < 0.9 ? warm : cool)
    c.lerp(grey, 0.5)
    tints[i * 3] = c.r
    tints[i * 3 + 1] = c.g
    tints[i * 3 + 2] = c.b
  }

  catalog.forEach((e, j) => {
    const i = count + j
    const p = projectLib(e.v)
    positions[i * 3] = p.x
    positions[i * 3 + 1] = p.y
    positions[i * 3 + 2] = e.z
    seeds[i] = rng()
    flux[i] = magToFlux(e.mag)
    c.copy(kelvinToSrgb(bvToTemp(e.bv), 0.65)).lerp(grey, 0.35)
    tints[i * 3] = c.r
    tints[i * 3 + 1] = c.g
    tints[i * 3 + 2] = c.b
  })

  return { positions, seeds, tints, flux }
}

let active: { host: HTMLElement; destroy: () => void } | null = null

function pickTier(): Tier {
  const w = window.innerWidth
  if (w < 768) return "mobile"
  if (w < 1100) return "tablet"
  return "desktop"
}

type DragState = "idle" | "dragging" | "inertia"

export function initHeroThree(host: HTMLElement): HeroThree | null {
  if (active) {
    if (active.host === host) return active
    active.destroy()
    active = null
  }
  if (typeof window === "undefined") return null

  const tierName = pickTier()
  const tier = CONFIG.tiers[tierName]

  const heroEl = (host.closest("#hero") as HTMLElement | null) ?? host
  const fovHalfRad = THREE.MathUtils.degToRad(CONFIG.camera.fov / 2)
  let baseCamZ = FIG_SCALE / Math.tan(fovHalfRad) / tier.fill

  let renderer: THREE.WebGLRenderer
  try {
    renderer = new THREE.WebGLRenderer({
      alpha: true,
      premultipliedAlpha: true,
      antialias: true,
      powerPreference: "high-performance",
      stencil: true,
      depth: true,
    })
  } catch {
    return null
  }
  const canvas = renderer.domElement
  canvas.className = "hero-canvas"
  canvas.style.pointerEvents = "none"
  canvas.style.position = "absolute"
  canvas.style.inset = "0"
  canvas.style.zIndex = "-1"
  canvas.style.touchAction = "pan-y"
  canvas.style.display = "block"
  host.style.touchAction = "pan-y"
  heroEl.style.isolation = "isolate"
  heroEl.appendChild(canvas)

  const dprState = { value: Math.min(window.devicePixelRatio || 1, tier.dprCap) }
  renderer.setPixelRatio(dprState.value)
  renderer.setClearColor(0x000000, 0)
  renderer.outputColorSpace = THREE.SRGBColorSpace

  const halo = new THREE.Color(CONFIG.palette.violet)
  const lineColor = new THREE.Color(CONFIG.palette.violetLight)
  const violetDeep = new THREE.Color(CONFIG.palette.violetDeep)
  const highlight = new THREE.Color(CONFIG.palette.highlight)

  const scene = new THREE.Scene()
  const camera = new THREE.PerspectiveCamera(CONFIG.camera.fov, 1, CONFIG.camera.near, CONFIG.camera.far)

  const root = new THREE.Group()
  const pivot = new THREE.Group()
  pivot.rotation.order = "YXZ"
  const gFig = new THREE.Group()
  const gCreative = new THREE.Group()
  pivot.add(gFig, gCreative)
  root.add(pivot)
  scene.add(root)

  const stars = buildPrimary(tier.spikes)
  const starGeo = new THREE.BufferGeometry()
  starGeo.setAttribute("position", new THREE.BufferAttribute(stars.positions, 3))
  starGeo.setAttribute("aFlux", new THREE.BufferAttribute(stars.flux, 1))
  starGeo.setAttribute("aSeed", new THREE.BufferAttribute(stars.seeds, 1))
  starGeo.setAttribute("aTint", new THREE.BufferAttribute(stars.tints, 3))
  starGeo.setAttribute("aSpike", new THREE.BufferAttribute(stars.spikes, 1))

  let maxPoint = 64
  try {
    const gl = renderer.getContext() as WebGLRenderingContext
    const range = gl.getParameter(gl.ALIASED_POINT_SIZE_RANGE) as Float32Array | null
    if (range && range.length >= 2) maxPoint = Math.min(128, Math.max(16, range[1]))
  } catch {
  }

  const starMat = new THREE.ShaderMaterial({
    vertexShader: STAR_VERT,
    fragmentShader: STAR_FRAG,
    transparent: true,
    depthWrite: false,
    depthTest: false,
    blending: THREE.CustomBlending,
    blendEquation: THREE.AddEquation,
    blendSrc: THREE.OneFactor,
    blendDst: THREE.OneFactor,
    uniforms: {
      uTime: { value: 0 },
      uPixelRatio: { value: dprState.value },
      uSizeBase: { value: CONFIG.sweep.baseSize * tier.sizeMul },
      uRefDist: { value: 6 },
      uTwinkle: { value: 1 },
      uReveal: { value: 0 },
      uPointerNDC: { value: new THREE.Vector2(9, 9) },
      uAspect: { value: 1 },
      uPointerRadius: { value: CONFIG.parallax.radius },
      uMaxPoint: { value: maxPoint },
      uHalo: { value: halo },
      uExposure: { value: CONFIG.lighting.exposure },
      uMode: { value: 0 },
      uInk: { value: new THREE.Color("#33245c") },
    },
  })
  const starPts = new THREE.Points(starGeo, starMat)
  starPts.frustumCulled = false
  gFig.add(starPts)

  const lb = buildLines(CONFIG.lines)
  const lineGeo = new THREE.BufferGeometry()
  lineGeo.setAttribute("position", new THREE.BufferAttribute(lb.positions, 3))
  lineGeo.setAttribute("aOther", new THREE.BufferAttribute(lb.others, 3))
  lineGeo.setAttribute("aSide", new THREE.BufferAttribute(lb.sides, 1))
  lineGeo.setAttribute("aAlong", new THREE.BufferAttribute(lb.alongs, 1))
  lineGeo.setAttribute("aSeg", new THREE.BufferAttribute(lb.segs, 1))
  lineGeo.setAttribute("aDelay", new THREE.BufferAttribute(lb.delays, 1))
  lineGeo.setAttribute("aDur", new THREE.BufferAttribute(lb.durs, 1))
  const idx: number[] = []
  for (let s = 0; s < LIBRA_LINES.length; s++) {
    const b = s * 4
    idx.push(b, b + 1, b + 2, b + 2, b + 1, b + 3)
  }
  lineGeo.setIndex(idx)

  const uStarPos: THREE.Vector3[] = []
  const uStarFlux: number[] = []
  for (const key of PRIMARY_ORDER) {
    const d = PRIMARY_SCENE[key]
    uStarPos.push(new THREE.Vector3(d.x, d.y, d.z))
    uStarFlux.push(magToFlux(d.mag))
  }

  const lineMat = new THREE.ShaderMaterial({
    vertexShader: LINE_VERT,
    fragmentShader: LINE_FRAG,
    transparent: true,
    depthWrite: false,
    depthTest: false,
    side: THREE.DoubleSide,
    blending: THREE.CustomBlending,
    blendEquation: THREE.AddEquation,
    blendSrc: THREE.OneFactor,
    blendDst: THREE.OneFactor,
    uniforms: {
      uResolution: { value: new THREE.Vector2(1, 1) },
      uHalfPx: { value: CONFIG.lines.widthPx },
      uFeatherPx: { value: CONFIG.lines.featherPx },
      uTrace: { value: 0 },
      uLine: { value: lineColor },
      uHighlight: { value: highlight },
      uLineAlpha: { value: CONFIG.lines.alpha },
      uR0: { value: CONFIG.lighting.haloR0 },
      uPulseEnabled: { value: 0 },
      uPulse: { value: new THREE.Vector2(-1, -1) },
      uStarPos: { value: uStarPos },
      uStarFlux: { value: uStarFlux },
    },
  })
  const lines = new THREE.Mesh(lineGeo, lineMat)
  lines.frustumCulled = false
  gFig.add(lines)

  let hazeMat: THREE.ShaderMaterial | null = null
  if (tier.haze) {
    const hazeGeo = new THREE.PlaneGeometry(5.5, 5.5)
    hazeMat = new THREE.ShaderMaterial({
      vertexShader: HAZE_VERT,
      fragmentShader: HAZE_FRAG,
      transparent: true,
      depthWrite: false,
      depthTest: false,
      blending: THREE.CustomBlending,
      blendEquation: THREE.AddEquation,
      blendSrc: THREE.OneFactor,
      blendDst: THREE.OneFactor,
      uniforms: {
        uColor: { value: violetDeep },
        uAlpha: { value: 0 },
      },
    })
    const haze = new THREE.Mesh(hazeGeo, hazeMat)
    haze.position.set(0.1, 0.55, -1.5)
    haze.renderOrder = -1
    haze.frustumCulled = false
    root.add(haze)
  }

  const fb = buildField(
    tier.field,
    baseCamZ,
    Math.max(1, heroEl.clientWidth) / Math.max(1, heroEl.clientHeight),
  )
  const fieldGeo = new THREE.BufferGeometry()
  fieldGeo.setAttribute("position", new THREE.BufferAttribute(fb.positions, 3))
  fieldGeo.setAttribute("aSeed", new THREE.BufferAttribute(fb.seeds, 1))
  fieldGeo.setAttribute("aTint", new THREE.BufferAttribute(fb.tints, 3))
  fieldGeo.setAttribute("aFlux", new THREE.BufferAttribute(fb.flux, 1))
  const fieldMat = new THREE.ShaderMaterial({
    vertexShader: FIELD_VERT,
    fragmentShader: FIELD_FRAG,
    transparent: true,
    depthWrite: false,
    depthTest: false,
    blending: THREE.CustomBlending,
    blendEquation: THREE.AddEquation,
    blendSrc: THREE.OneFactor,
    blendDst: THREE.OneFactor,
    uniforms: {
      uTime: { value: 0 },
      uPixelRatio: { value: dprState.value },
      uSizeBase: { value: CONFIG.sweep.fieldSize },
      uRefDist: { value: 6 },
      uTwinkle: { value: 1 },
      uReveal: { value: 0 },
      uExposure: { value: CONFIG.lighting.exposure },
      uTintMul: { value: new THREE.Color(1, 1, 1) },
    },
  })
  const fieldPts = new THREE.Points(fieldGeo, fieldMat)
  fieldPts.frustumCulled = false
  scene.add(fieldPts)

  const coarse = window.matchMedia("(pointer: coarse)").matches
  const reduceMql = window.matchMedia("(prefers-reduced-motion: reduce)")
  let reduced = reduceMql.matches

  let time = 0
  let heroProgress = 0
  let heroVisible = true
  let docHidden = document.visibilityState === "hidden"
  let contextLost = false
  let raf = 0
  let prevNow = 0
  let pulseSeg = -1
  let emaFrameMs = 16
  let govState: "warmup" | "measure" = "warmup"
  let govCount = 0
  let lastStepDown = 0

  let surfaceW = 1
  let surfaceH = 1
  const pointerTarget = { x: 9, y: 9 }
  const pointerCur = { x: 9, y: 9 }
  const rect = { left: 0, top: 0, width: 1, height: 1 }

  const materials = [starMat, lineMat, fieldMat]
  const geometries = [starGeo, lineGeo, fieldGeo]
  if (hazeMat) materials.push(hazeMat)

  const accentInk = new THREE.Color("#6a3bd4")
  const isLight = () => document.documentElement.getAttribute("data-theme") === "light"

  const applyTheme = () => {
    const light = isLight()
    starMat.uniforms.uMode.value = light ? 1 : 0
    fieldMat.uniforms.uTintMul.value.setScalar(light ? 0.6 : 1)
    lineMat.uniforms.uLine.value = light ? accentInk : lineColor
    lineMat.uniforms.uHighlight.value = light ? accentInk : highlight
    const dst = light ? THREE.OneMinusSrcAlphaFactor : THREE.OneFactor
    for (const m of materials) {
      m.blendDst = dst
      m.needsUpdate = true
    }
    if (reduced) step(0)
  }

  const applyComposition = () => {
    const aspect = surfaceW / surfaceH
    const visH = 2 * baseCamZ * Math.tan(fovHalfRad)
    const visW = visH * aspect
    const hr = heroEl.getBoundingClientRect()
    const nr = host.getBoundingClientRect()
    const ndcX = (((nr.left + nr.width / 2) - (hr.left + hr.width / 2)) / Math.max(1, hr.width)) * 2
    const ndcY = -((((nr.top + nr.height / 2) - (hr.top + hr.height / 2)) / Math.max(1, hr.height)) * 2)
    root.position.set((ndcX * visW) / 2, (ndcY * visH) / 2, 0)
  }

  const applySize = () => {
    surfaceW = Math.max(1, heroEl.clientWidth)
    surfaceH = Math.max(1, heroEl.clientHeight)
    const aspect = surfaceW / surfaceH

    camera.aspect = aspect
    camera.updateProjectionMatrix()
    renderer.setSize(surfaceW, surfaceH)

    const res = renderer.getDrawingBufferSize(new THREE.Vector2())
    lineMat.uniforms.uResolution.value.copy(res)
    lineMat.uniforms.uHalfPx.value = CONFIG.lines.widthPx * dprState.value
    lineMat.uniforms.uFeatherPx.value = CONFIG.lines.featherPx * dprState.value
    starMat.uniforms.uPixelRatio.value = dprState.value
    fieldMat.uniforms.uPixelRatio.value = dprState.value
    starMat.uniforms.uAspect.value = aspect

    baseCamZ = FIG_SCALE / Math.tan(fovHalfRad) / tier.fill
    camera.position.z = baseCamZ
    starMat.uniforms.uRefDist.value = baseCamZ
    fieldMat.uniforms.uRefDist.value = baseCamZ
    applyComposition()

    if (reduced) step(0)
  }

  const drag = {
    state: "idle" as DragState,
    rawYaw: 0,
    rawPitch: 0,
    vYaw: 0,
    vPitch: 0,
    yaw: 0,
    pitch: 0,
    idleFor: 0,
    id: null as number | null,
    sx: 0,
    sy: 0,
    lx: 0,
    ly: 0,
    lt: 0,
    captured: false,
    pointerDown: false,
  }

  const radPerPx = () =>
    (CONFIG.drag.sensitivity * Math.PI * 0.8) /
    Math.min(Math.max(1, host.clientWidth), Math.max(1, host.clientHeight))

  const updateCursor = (grabbing: boolean) => {
    host.style.cursor = reduced && !coarse ? "default" : grabbing ? "grabbing" : coarse ? "default" : "grab"
  }

  const onPointerDown = (e: PointerEvent) => {
    if (reduced) return
    if (e.pointerType === "mouse" && e.button !== 0) return
    if (drag.id !== null) return
    drag.id = e.pointerId
    drag.pointerDown = true
    drag.sx = e.clientX
    drag.sy = e.clientY
    drag.vYaw = 0
    drag.vPitch = 0
    drag.rawYaw = drag.yaw
    drag.rawPitch = drag.pitch
    drag.state = "idle"
    drag.idleFor = 0
  }

  const onDragMove = (e: PointerEvent) => {
    if (reduced) return
    if (e.pointerId !== drag.id) return
    if (!drag.captured) {
      if (Math.hypot(e.clientX - drag.sx, e.clientY - drag.sy) < CONFIG.drag.deadzonePx) return
      drag.captured = true
      drag.state = "dragging"
      try {
        host.setPointerCapture(e.pointerId)
      } catch {
      }
      drag.lx = e.clientX
      drag.ly = e.clientY
      drag.lt = e.timeStamp
      updateCursor(true)
      return
    }
    const k = radPerPx()
    const dx = e.clientX - drag.lx
    const dy = e.clientY - drag.ly
    const dts = Math.max(1, e.timeStamp - drag.lt) / 1000
    drag.rawYaw += dx * k
    if (e.pointerType !== "touch") drag.rawPitch += dy * k
    drag.vYaw += ((dx * k) / dts - drag.vYaw) * 0.35
    drag.vPitch += (((e.pointerType !== "touch" ? dy * k : 0) / dts) - drag.vPitch) * 0.35
    drag.lx = e.clientX
    drag.ly = e.clientY
    drag.lt = e.timeStamp
  }

  const onDragUp = () => {
    if (drag.state === "dragging") {
      const speed = Math.hypot(drag.vYaw, drag.vPitch)
      drag.state = speed > CONFIG.drag.minFling ? "inertia" : "idle"
      drag.idleFor = 0
    }
    drag.id = null
    drag.captured = false
    drag.pointerDown = false
    updateCursor(false)
  }

  const onPointerLeave = () => {
    pointerTarget.x = 9
    pointerTarget.y = 9
  }

  const onPointerMove = (e: PointerEvent) => {
    pointerTarget.x = ((e.clientX - rect.left) / Math.max(1, rect.width)) * 2 - 1
    pointerTarget.y = -(((e.clientY - rect.top) / Math.max(1, rect.height)) * 2 - 1)
  }

  let scrollQueued = false
  const readRect = () => {
    const r = heroEl.getBoundingClientRect()
    rect.left = r.left
    rect.top = r.top
    rect.width = r.width
    rect.height = r.height
  }

  const applyScroll = () => {
    readRect()
    heroProgress = clamp01(-rect.top / Math.max(1, rect.height))
  }

  const onScroll = () => {
    if (scrollQueued) return
    scrollQueued = true
    requestAnimationFrame(() => {
      scrollQueued = false
      applyScroll()
    })
  }

  const sway = CONFIG.sway
  const swayYawW = THREE.MathUtils.degToRad(sway.yawDeg)
  const swayPitchW = THREE.MathUtils.degToRad(sway.pitchDeg)
  const TWO_PI = Math.PI * 2

  const step = (dt: number) => {
    time += dt

    const c = CONFIG.drag
    const maxY = THREE.MathUtils.degToRad(c.maxYaw)
    const maxP = THREE.MathUtils.degToRad(c.maxPitch)
    if (drag.state === "inertia") {
      const f = Math.exp(-c.friction * dt)
      drag.vYaw *= f
      drag.vPitch *= f
      drag.rawYaw += drag.vYaw * dt
      drag.rawPitch += drag.vPitch * dt
      if (Math.hypot(drag.vYaw, drag.vPitch) < c.stopSpeed) {
        drag.state = "idle"
        drag.idleFor = 0
      }
    } else if (drag.state === "idle" && !drag.pointerDown) {
      drag.idleFor += dt
      if (c.returnToFront && drag.idleFor > c.returnDelay) {
        const e = 1 - Math.exp(-c.returnRate * dt)
        drag.rawYaw += (0 - drag.rawYaw) * e
        drag.rawPitch += (0 - drag.rawPitch) * e
      }
    }
    drag.rawYaw = Math.max(-maxY * 1.6, Math.min(maxY * 1.6, drag.rawYaw))
    drag.rawPitch = Math.max(-maxP * 1.6, Math.min(maxP * 1.6, drag.rawPitch))
    drag.yaw = softClamp(drag.rawYaw, maxY)
    drag.pitch = softClamp(drag.rawPitch, maxP)

    let swayYaw = 0
    let swayPitch = 0
    if (!reduced && dt > 0) {
      swayYaw = Math.sin((time * TWO_PI) / sway.periodsSec[0]) * swayYawW
      swayPitch = Math.sin((time * TWO_PI) / sway.periodsSec[1]) * swayPitchW
    }
    pivot.rotation.set(drag.pitch + swayPitch, drag.yaw + swayYaw, 0)
    fieldPts.rotation.set(
      pivot.rotation.x * CONFIG.parallax.fieldFollow,
      pivot.rotation.y * CONFIG.parallax.fieldFollow,
      0,
    )

    const hasPointer = pointerTarget.x < 8 && !coarse && !reduced && dt > 0
    if (hasPointer) {
      if (pointerCur.x > 8) pointerCur.x = pointerTarget.x
      const e = 1 - Math.exp(-CONFIG.parallax.damping * dt)
      pointerCur.x += (pointerTarget.x - pointerCur.x) * e
      pointerCur.y += (pointerTarget.y - pointerCur.y) * e
    }

    starMat.uniforms.uTime.value = time
    starMat.uniforms.uReveal.value = revealCurve(time)
    starMat.uniforms.uTwinkle.value = reduced || heroProgress > 0.4 ? 0 : 1
    starMat.uniforms.uPointerNDC.value.set(hasPointer ? pointerCur.x : 9, hasPointer ? pointerCur.y : 9)
    starMat.uniforms.uExposure.value = CONFIG.lighting.exposure * (1 - heroProgress * 0.7)

    lineMat.uniforms.uTrace.value = traceCurve(time)
    lineMat.uniforms.uPulseEnabled.value = pulseSeg >= 0 && !reduced ? 1 : 0
    lineMat.uniforms.uPulse.value.set(pulseSeg, pulseHead(time))

    fieldMat.uniforms.uTime.value = time
    fieldMat.uniforms.uReveal.value = clamp01((time - CONFIG.reveal.fieldDelay) / CONFIG.reveal.fieldSec)
    fieldMat.uniforms.uTwinkle.value = reduced || heroProgress > 0.4 ? 0 : 1

    if (hazeMat) {
      hazeMat.uniforms.uAlpha.value =
        CONFIG.lighting.hazeAlpha * (1 + CONFIG.haze.wob * Math.sin((time * TWO_PI) / CONFIG.haze.periodSec)) * (1 - heroProgress)
    }

    camera.position.x = hasPointer ? pointerCur.x * CONFIG.parallax.camera : 0
    camera.position.y = hasPointer ? -pointerCur.y * CONFIG.parallax.camera : 0
    camera.position.z = baseCamZ + heroProgress * 1.4
    camera.lookAt(0, 0, 0)

    renderer.render(scene, camera)
  }

  const revealCurve = (t: number) => (reduced ? 1 : Math.pow(clamp01(t / CONFIG.reveal.starsSec), 0.6))
  const traceCurve = (t: number) =>
    reduced ? 1 : clamp01((t - CONFIG.reveal.starsSec * 0.5) / CONFIG.reveal.linesSec)

  const pulseHead = (t: number) => {
    if (pulseSeg < 0 || reduced) return -1
    const ph = ((t - 1) % CONFIG.pulse.periodSec) / CONFIG.pulse.periodSec
    return ph >= 0 && ph <= 0.35 ? ph / 0.35 : -1
  }

  const pickPulseSegment = () => {
    if (!CONFIG.pulse.enabled || reduced) {
      pulseSeg = -1
      return
    }
    pulseSeg = (pulseSeg + 2) % LIBRA_LINES.length
  }

  let lastPulseChange = 0
  const updatePulse = (now: number) => {
    if (time - lastPulseChange > CONFIG.pulse.periodSec) {
      lastPulseChange = time
      pickPulseSegment()
    }
    void now
  }

  const tick = () => {
    raf = requestAnimationFrame(tick)
    if (!heroVisible || docHidden || contextLost) {
      prevNow = 0
      return
    }
    const now = performance.now()
    const dt = prevNow ? Math.min((now - prevNow) / 1000, 0.05) : 0.016
    prevNow = now

    if (govState === "warmup") {
      govCount++
      if (govCount >= CONFIG.quality.warmupFrames) {
        govState = "measure"
        govCount = 0
        emaFrameMs = 16
      }
    } else {
      if (dt > 0) emaFrameMs += (dt * 1000 - emaFrameMs) * 0.05
      govCount++
      if (govCount >= CONFIG.quality.sampleFrames && now - lastStepDown > CONFIG.quality.recheckMs) {
        govCount = 0
        if (emaFrameMs > CONFIG.quality.frameMs && dprState.value > 1) {
          dprState.value = Math.max(1, dprState.value - CONFIG.quality.dprStep)
          renderer.setPixelRatio(dprState.value)
          applySize()
          lastStepDown = now
        }
      }
    }

    updatePulse(now)
    step(dt)
  }

  const startLoop = () => {
    if (raf || reduced) return
    prevNow = 0
    time = 0
    lastPulseChange = 0
    pulseSeg = -1
    raf = requestAnimationFrame(tick)
  }

  const stopLoop = () => {
    if (raf) cancelAnimationFrame(raf)
    raf = 0
    prevNow = 0
  }

  const applyMotionMode = () => {
    if (reduced) {
      stopLoop()
      drag.state = "idle"
      drag.rawYaw = 0
      drag.rawPitch = 0
      drag.yaw = 0
      drag.pitch = 0
      pivot.rotation.set(0, 0, 0)
      fieldPts.rotation.set(0, 0, 0)
      step(0)
    } else {
      startLoop()
    }
  }

  let resizeQueued = false
  const resizeObserver = new ResizeObserver(() => {
    if (resizeQueued) return
    resizeQueued = true
    requestAnimationFrame(() => {
      resizeQueued = false
      applySize()
      readRect()
    })
  })
  resizeObserver.observe(heroEl)
  resizeObserver.observe(host)

  const io = new IntersectionObserver(
    entries => {
      heroVisible = entries[0].isIntersecting
      if (heroVisible) prevNow = 0
    },
    { threshold: 0 },
  )
  io.observe(heroEl)

  const onVisibility = () => {
    docHidden = document.visibilityState === "hidden"
    if (!docHidden) prevNow = 0
  }
  const onContextLost = (e: Event) => {
    e.preventDefault()
    contextLost = true
    prevNow = 0
  }
  const onContextRestored = () => {
    contextLost = false
    prevNow = 0
  }

  document.addEventListener("visibilitychange", onVisibility)
  reduceMql.addEventListener("change", onReduceChange)

  const themeObs = new MutationObserver(() => applyTheme())
  themeObs.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] })
  window.addEventListener("scroll", onScroll, { passive: true })
  window.addEventListener("pointermove", onPointerMove, { passive: true })
  window.addEventListener("blur", onDragUp)
  host.addEventListener("pointerdown", onPointerDown)
  host.addEventListener("pointermove", onDragMove)
  heroEl.addEventListener("pointerleave", onPointerLeave)
  window.addEventListener("pointerup", onDragUp)
  window.addEventListener("pointercancel", onDragUp)
  canvas.addEventListener("webglcontextlost", onContextLost, false)
  canvas.addEventListener("webglcontextrestored", onContextRestored, false)

  function onReduceChange() {
    reduced = reduceMql.matches
    applyMotionMode()
  }

  readRect()
  applySize()
  applyTheme()
  applyMotionMode()

  const destroy = () => {
    if (active && active.host === host) active = null
    stopLoop()
    resizeObserver.disconnect()
    io.disconnect()
    themeObs.disconnect()
    document.removeEventListener("visibilitychange", onVisibility)
    reduceMql.removeEventListener("change", onReduceChange)
    window.removeEventListener("scroll", onScroll)
    window.removeEventListener("pointermove", onPointerMove)
    window.removeEventListener("blur", onDragUp)
    host.removeEventListener("pointerdown", onPointerDown)
    host.removeEventListener("pointermove", onDragMove)
    heroEl.removeEventListener("pointerleave", onPointerLeave)
    window.removeEventListener("pointerup", onDragUp)
    window.removeEventListener("pointercancel", onDragUp)
    canvas.removeEventListener("webglcontextlost", onContextLost)
    canvas.removeEventListener("webglcontextrestored", onContextRestored)
    for (const g of geometries) g.dispose()
    for (const m of materials) m.dispose()
    renderer.dispose()
    canvas.remove()
    heroEl.style.removeProperty("isolation")
  }

  active = { host, destroy }
  return active
}

export const libraDebug = {
  stars: PRIMARY_LIBRA_STARS,
  lines: LIBRA_LINES,
  assertShape() {
    const sep = (a: PrimaryKey, b: PrimaryKey) => {
      const A = PRIMARY_LIBRA_STARS[a].v
      const B = PRIMARY_LIBRA_STARS[b].v
      return (Math.acos(A[0] * B[0] + A[1] * B[1] + A[2] * B[2]) * 180) / Math.PI
    }
    const want: [PrimaryKey, PrimaryKey, number][] = [
      ["theta", "gamma", 4.8109],
      ["gamma", "beta", 7.0505],
      ["beta", "alpha2", 9.2134],
      ["alpha2", "sigma", 9.7403],
      ["sigma", "gamma", 12.8238],
    ]
    for (const [a, b, w] of want) {
      const got = sep(a, b)
      console.assert(Math.abs(got - w) < 0.05, `${a}-${b} separation ≈ ${w}°`, got)
    }
    console.assert(LIBRA_LINES.length === 5, "exactly five figure segments")
    const ys = PRIMARY_ORDER.map(k => PRIMARY_SCENE[k].y)
    const h = Math.max(...ys) - Math.min(...ys)
    console.assert(Math.abs(h - 3.2) < 0.1, "figure height ≈ 3.2 scene units", h)
  },
}