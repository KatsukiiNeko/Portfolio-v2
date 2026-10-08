import * as THREE from "three"

/**
 * "Signal lattice" — the hero scene.
 *
 * One dark faceted core, an incomplete topology lattice, a sparse node graph,
 * three off-axis irregular orbits and a micro field. Everything tunable lives
 * in CONFIG below. Layout reads no DOM inside the animation loop; the loop is
 * delta-time driven and pauses off-screen / when the tab is hidden.
 */

export type HeroThree = { destroy: () => void }

type Tier = "desktop" | "tablet" | "mobile"
type Breakpoint = Tier
type Rng = () => number

/* ------------------------------------------------------------------ *
 * CONFIG
 * ------------------------------------------------------------------ */

const CONFIG = {
  seed: 0x516e17,

  palette: {
    core: 0x262633,
    coreFace: 0x814de5,
    shell: 0x6a5aa4,
    graph: 0xa47ef0,
    nodeHot: 0xe9e2ff,
    orbit: 0x6e30e3,
    particle: 0x9a83e6,
    key: 0xffffff,
    rim: 0x814de5,
    fill: 0x8ea6cc,
    envTop: 0x2b3044,
    envHorizon: 0x51446f,
    envBottom: 0x0a0a10,
  },

  camera: { fov: 40, z: 8.6, near: 0.1, far: 60 },

  tiers: {
    // dpr cap · nodes · particles · orbits · draw-call budget
    desktop: { dpr: 1.75, coreDetail: 1, shellNodes: 96, graphNodes: 52, particles: 560, orbits: 3, pulse: true, antialias: true, pointMul: 1 },
    tablet: { dpr: 1.5, coreDetail: 1, shellNodes: 72, graphNodes: 36, particles: 320, orbits: 3, pulse: false, antialias: true, pointMul: 1.15 },
    mobile: { dpr: 1.25, coreDetail: 0, shellNodes: 50, graphNodes: 20, particles: 160, orbits: 2, pulse: false, antialias: false, pointMul: 1.45 },
  },

  /** explicit composition per breakpoint: world offset + uniform scale */
  composition: {
    desktop: { scale: 1, x: 0.18, y: 0.04 },
    tablet: { scale: 0.94, x: 0.05, y: 0.03 },
    mobile: { scale: 0.92, x: 0, y: -0.02 },
  },

  form: {
    coreRadius: 1.12,
    coreAmp: 0.19,
    shell: { rMin: 1.62, rMax: 1.86, density: 1.25, degree: 3 },
    graph: { rMin: 1.88, rMax: 2.3, density: 1.15, degree: 3 },
    field: { rMin: 2, rMax: 3.4 },
    orbits: [
      { a: 2.16, b: 1.6, segments: 240, tilt: [1.18, 0.2, 0.05], center: [0.07, -0.06, 0.03], wobble: 0.035 },
      { a: 2.4, b: 2.16, segments: 240, tilt: [0.44, 1.34, 0.34], center: [-0.11, 0.08, -0.05], wobble: 0.022 },
      { a: 1.88, b: 1.04, segments: 240, tilt: [1.98, 0.62, -0.48], center: [0.04, 0.11, 0.07], wobble: 0.05 },
    ],
  },

  motion: {
    coreSpin: 0.042, // rad/s about the tilted axis
    coreTilt: 0.38,
    shellTilt: -0.62,
    shellSpin: -0.026, // counter-drift
    fieldSpin: 0.008,
    breatheAmp: 0.013,
    breathePeriod: 10.5, // seconds
    orbitRate: [0.05, -0.034, 0.041], // precession, per orbit
    nodeDrift: 0.03,
    fieldDrift: 0.075,
    entranceMs: 900,
  },

  /** per-layer damped parallax strength */
  parallax: {
    camera: 0.09,
    core: 0.05,
    shell: 0.1,
    graph: 0.14,
    orbits: 0.12,
    field: 0.2,
    lerp: 0.055,
  },

  proximity: { radius: 1.05, push: 0.1, glow: 0.5 },

  scroll: { fade: 0.65, depth: 1, falloff: 0.6, minIntensity: 0.35 },

  quality: { sampleFrames: 60, frameBudgetMs: 22, dprStep: 0.35 },
}

/* ------------------------------------------------------------------ *
 * small helpers (all allocation happens here, at init — never in the loop)
 * ------------------------------------------------------------------ */

function makeRng(seed: number): Rng {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

type Lobe = { x: number; y: number; z: number; freq: number; amp: number; phase: number }

/** a handful of random directional sine lobes = cheap seeded value noise */
function makeLobes(rng: Rng, count: number): Lobe[] {
  const lobes: Lobe[] = []
  for (let i = 0; i < count; i++) {
    const z = rng() * 2 - 1
    const t = rng() * Math.PI * 2
    const r = Math.sqrt(Math.max(0, 1 - z * z))
    lobes.push({
      x: r * Math.cos(t),
      y: r * Math.sin(t),
      z,
      freq: 1.8 + i * 1.7,
      amp: (rng() - 0.5) * 0.17 * (1 / (1 + i * 0.6)),
      phase: rng() * Math.PI * 2,
    })
  }
  return lobes
}

function lobesAt(lobes: Lobe[], x: number, y: number, z: number): number {
  let s = 0
  for (let i = 0; i < lobes.length; i++) {
    const l = lobes[i]
    s += l.amp * Math.sin((x * l.x + y * l.y + z * l.z) * l.freq + l.phase)
  }
  return s
}

/* ------------------------------------------------------------------ *
 * geometry builders
 * ------------------------------------------------------------------ */

/** faceted, deliberately asymmetric polyhedron from a seeded displacement */
function createCoreGeometry(rng: Rng, detail: number): THREE.BufferGeometry {
  const lobes = makeLobes(rng, 4)
  const geo = new THREE.IcosahedronGeometry(CONFIG.form.coreRadius, detail)
  const pos = geo.attributes.position as THREE.BufferAttribute

  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i)
    const y = pos.getY(i)
    const z = pos.getZ(i)
    const len = Math.hypot(x, y, z) || 1
    const dx = x / len
    const dy = y / len
    const dz = z / len
    const n = Math.max(-1, Math.min(1, lobesAt(lobes, dx, dy, dz) / 0.17))
    const r = CONFIG.form.coreRadius * (1 + n * CONFIG.form.coreAmp)
    // non-uniform scale: the silhouette is never symmetric
    pos.setXYZ(i, dx * r * 1.11, dy * r * 0.89, dz * r)
  }
  pos.needsUpdate = true
  geo.computeVertexNormals()
  return geo
}

/** 1-2 camera-facing faces lifted off the core to fake per-face emissive */
function createEmissiveGeometry(src: THREE.BufferGeometry, rng: Rng): THREE.BufferGeometry | null {
  const pos = src.attributes.position as THREE.BufferAttribute
  const faceCount = pos.count / 3
  const a = new THREE.Vector3()
  const b = new THREE.Vector3()
  const c = new THREE.Vector3()
  const ab = new THREE.Vector3()
  const ac = new THREE.Vector3()
  const n = new THREE.Vector3()
  const centres: number[] = []

  for (let f = 0; f < faceCount; f++) {
    a.fromBufferAttribute(pos, f * 3)
    b.fromBufferAttribute(pos, f * 3 + 1)
    c.fromBufferAttribute(pos, f * 3 + 2)
    ab.subVectors(b, a)
    ac.subVectors(c, a)
    n.crossVectors(ab, ac).normalize()
    if (n.z > 0.3) centres.push(f)
  }
  if (centres.length < 2) return null

  const first = centres[Math.floor(rng() * centres.length)]
  a.fromBufferAttribute(pos, first * 3)
  let best = centres[0]
  let bestD = -1
  for (const f of centres) {
    b.fromBufferAttribute(pos, f * 3)
    const d = a.distanceToSquared(b)
    if (f !== first && d > bestD) {
      bestD = d
      best = f
    }
  }

  const out = new Float32Array(18)
  let o = 0
  for (const f of [first, best]) {
    a.fromBufferAttribute(pos, f * 3)
    b.fromBufferAttribute(pos, f * 3 + 1)
    c.fromBufferAttribute(pos, f * 3 + 2)
    ab.subVectors(b, a)
    ac.subVectors(c, a)
    n.crossVectors(ab, ac).normalize()
    for (const v of [a, b, c]) {
      out[o++] = v.x + n.x * 0.025
      out[o++] = v.y + n.y * 0.025
      out[o++] = v.z + n.z * 0.025
    }
  }

  const geo = new THREE.BufferGeometry()
  geo.setAttribute("position", new THREE.BufferAttribute(out, 3))
  return geo
}

type Graph = { positions: Float32Array; edges: Float32Array }

/**
 * Points on an uneven shell + greedy nearest-neighbour edges under a max
 * distance and max degree cap. Used twice: dense/dim for the topology shell,
 * sparse/bright for the node graph.
 */
function createGraph(
  rng: Rng,
  count: number,
  rMin: number,
  rMax: number,
  density: number,
  maxDegree: number,
): Graph {
  const lobes = makeLobes(rng, 3)
  const golden = Math.PI * (3 - Math.sqrt(5))
  const mid = (rMin + rMax) / 2
  const half = (rMax - rMin) / 2
  const pos = new Float32Array(count * 3)

  for (let i = 0; i < count; i++) {
    const y = 1 - (i / Math.max(1, count - 1)) * 2
    const rad = Math.sqrt(Math.max(0, 1 - y * y))
    const th = golden * i + rng() * 0.14
    let dx = Math.cos(th) * rad + (rng() - 0.5) * 0.08
    let dy = y + (rng() - 0.5) * 0.08
    let dz = Math.sin(th) * rad + (rng() - 0.5) * 0.08
    const len = Math.hypot(dx, dy, dz) || 1
    dx /= len
    dy /= len
    dz /= len
    const n = Math.max(-1, Math.min(1, lobesAt(lobes, dx, dy, dz) / 0.15))
    const r = mid + n * half
    pos[i * 3] = dx * r
    pos[i * 3 + 1] = dy * r
    pos[i * 3 + 2] = dz * r
  }

  const maxDist = Math.sqrt((4 * Math.PI * mid * mid) / count) * density

  // candidate pairs sorted by distance, accepted greedily under the caps
  type Pair = { d: number; i: number; j: number }
  const pairs: Pair[] = []
  for (let i = 0; i < count; i++) {
    for (let j = i + 1; j < count; j++) {
      const dx = pos[i * 3] - pos[j * 3]
      const dy = pos[i * 3 + 1] - pos[j * 3 + 1]
      const dz = pos[i * 3 + 2] - pos[j * 3 + 2]
      const d = Math.sqrt(dx * dx + dy * dy + dz * dz)
      if (d < maxDist) pairs.push({ d, i, j })
    }
  }
  pairs.sort((p, q) => p.d - q.d)

  const deg = new Uint8Array(count)
  const edgeList: number[] = []
  for (const p of pairs) {
    if (deg[p.i] >= maxDegree || deg[p.j] >= maxDegree) continue
    deg[p.i]++
    deg[p.j]++
    edgeList.push(p.i, p.j)
  }

  const edges = new Float32Array(edgeList.length * 6)
  for (let e = 0; e < edgeList.length; e++) {
    const node = edgeList[e]
    edges[e * 6] = pos[node * 3]
    edges[e * 6 + 1] = pos[node * 3 + 1]
    edges[e * 6 + 2] = pos[node * 3 + 2]
    const other = edgeList[e ^ 1]
    edges[e * 6 + 3] = pos[other * 3]
    edges[e * 6 + 4] = pos[other * 3 + 1]
    edges[e * 6 + 5] = pos[other * 3 + 2]
  }

  return { positions: pos, edges }
}

type OrbitSpec = (typeof CONFIG.form.orbits)[number]

function orbitPoint(spec: OrbitSpec, th: number, out: THREE.Vector3): THREE.Vector3 {
  const r =
    1 +
    spec.wobble * Math.sin(th * 3 + spec.tilt[0]) +
    spec.wobble * 0.6 * Math.sin(th * 5 - spec.tilt[1])
  return out.set(Math.cos(th) * spec.a * r, Math.sin(th) * spec.b * r, 0)
}

function createOrbitGeometry(spec: OrbitSpec, segments: number): THREE.BufferGeometry {
  const arr = new Float32Array((segments + 1) * 3)
  const v = new THREE.Vector3()
  for (let i = 0; i <= segments; i++) {
    orbitPoint(spec, (i / segments) * Math.PI * 2, v)
    arr[i * 3] = v.x
    arr[i * 3 + 1] = v.y
    arr[i * 3 + 2] = v.z
  }
  const geo = new THREE.BufferGeometry()
  geo.setAttribute("position", new THREE.BufferAttribute(arr, 3))
  return geo
}

/* ------------------------------------------------------------------ *
 * shaders — one program serves nodes, particles and the data pulse
 * ------------------------------------------------------------------ */

const POINT_VERT = /* glsl */ `
  attribute float aSeed;
  attribute float aSize;
  attribute float aBright;

  uniform float uTime;
  uniform float uAmp;
  uniform float uScale;
  uniform float uSizeMul;
  uniform vec3 uPointer;
  uniform float uProx;
  uniform float uRadius;
  uniform float uPush;
  uniform float uGlow;
  uniform vec3 uColor;
  uniform vec3 uHot;

  varying vec3 vColor;
  varying float vAlpha;

  void main() {
    float ph = aSeed * 6.28318;
    vec3 p = position;
    p += vec3(
      sin(uTime * 0.21 + ph),
      cos(uTime * 0.17 + ph * 1.43),
      sin(uTime * 0.13 + ph * 2.11)
    ) * uAmp;

    vec4 wp = modelMatrix * vec4(p, 1.0);
    float d = distance(wp.xyz, uPointer);
    float prox = smoothstep(uRadius, 0.0, d) * uProx;
    wp.xyz += normalize(wp.xyz - uPointer + vec3(1e-4)) * prox * uPush;

    vec4 mv = viewMatrix * wp;
    gl_Position = projectionMatrix * mv;
    gl_PointSize = aSize * uSizeMul * uScale / max(0.001, -mv.z);

    vColor = mix(uColor, uHot, aBright);
    vAlpha = 0.3 + 0.5 * aSeed + aBright * 0.4 + prox * uGlow;
  }
`

const POINT_FRAG = /* glsl */ `
  uniform float uAlpha;
  varying vec3 vColor;
  varying float vAlpha;

  void main() {
    vec2 c = gl_PointCoord - vec2(0.5);
    float d = dot(c, c);
    if (d > 0.25) discard;
    float a = 1.0 - smoothstep(0.02, 0.25, d);
    gl_FragColor = vec4(vColor, clamp(a * vAlpha, 0.0, 1.0) * uAlpha);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`

function createPointMaterial(opts: {
  color: THREE.Color
  hot: THREE.Color
  amp: number
  alpha: number
  sizeMul: number
}): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    vertexShader: POINT_VERT,
    fragmentShader: POINT_FRAG,
    transparent: true,
    depthWrite: false,
    uniforms: {
      uTime: { value: 0 },
      uAmp: { value: opts.amp },
      uScale: { value: 256 },
      uSizeMul: { value: opts.sizeMul },
      uPointer: { value: new THREE.Vector3(999, 999, 999) },
      uProx: { value: 0 },
      uRadius: { value: CONFIG.proximity.radius },
      uPush: { value: CONFIG.proximity.push },
      uGlow: { value: CONFIG.proximity.glow },
      uColor: { value: opts.color },
      uHot: { value: opts.hot },
      uAlpha: { value: opts.alpha },
    },
  })
}

function createPoints(
  positions: Float32Array,
  sizes: Float32Array,
  seeds: Float32Array,
  bright: Float32Array,
  material: THREE.ShaderMaterial,
): THREE.Points {
  const geo = new THREE.BufferGeometry()
  geo.setAttribute("position", new THREE.BufferAttribute(positions, 3))
  geo.setAttribute("aSize", new THREE.BufferAttribute(sizes, 1))
  geo.setAttribute("aSeed", new THREE.BufferAttribute(seeds, 1))
  geo.setAttribute("aBright", new THREE.BufferAttribute(bright, 1))
  const pts = new THREE.Points(geo, material)
  pts.frustumCulled = false // shader drift can leave the authored bounding sphere
  return pts
}

function linePositions(graph: Graph): Float32Array {
  return graph.edges
}

/* ------------------------------------------------------------------ *
 * init
 * ------------------------------------------------------------------ */

let active: { host: HTMLElement; destroy: () => void } | null = null

function pickTier(): Tier {
  const w = window.innerWidth
  if (w < 768) return "mobile"
  if (w < 1100) return "tablet"
  return "desktop"
}

function pickBreakpoint(): Breakpoint {
  const w = window.innerWidth
  if (w >= 1024) return "desktop"
  if (w >= 768) return "tablet"
  return "mobile"
}

export function initHeroThree(host: HTMLElement): HeroThree | null {
  // idempotent: a second call never creates a second canvas or loop
  if (active) {
    if (active.host === host) return active
    active.destroy()
    active = null
  }

  const tierName = pickTier()
  const tier = CONFIG.tiers[tierName]
  const rng = makeRng(CONFIG.seed + tierName.length)
  const disposables: { dispose(): void }[] = []

  let renderer: THREE.WebGLRenderer
  try {
    renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: tier.antialias,
      powerPreference: "high-performance",
      stencil: false,
      depth: true,
    })
  } catch {
    return null // WebGL unavailable → static CSS fallback, page unaffected
  }

  let dpr = Math.min(window.devicePixelRatio || 1, tier.dpr)
  renderer.setPixelRatio(dpr)
  renderer.setClearColor(0x000000, 0)
  renderer.outputColorSpace = THREE.SRGBColorSpace
  renderer.toneMapping = THREE.ACESFilmicToneMapping
  renderer.toneMappingExposure = 1.15

  const canvas = renderer.domElement
  canvas.style.pointerEvents = "none"
  canvas.style.touchAction = "pan-y" // vertical gestures must still scroll
  canvas.style.display = "block"
  host.appendChild(canvas)

  const scene = new THREE.Scene()
  const camera = new THREE.PerspectiveCamera(CONFIG.camera.fov, 1, CONFIG.camera.near, CONFIG.camera.far)
  camera.position.set(0, 0, CONFIG.camera.z)

  /* ---- environment + lighting -------------------------------------- */

  const envData = new Uint8Array(16 * 8 * 4)
  const top = new THREE.Color(CONFIG.palette.envTop)
  const horizon = new THREE.Color(CONFIG.palette.envHorizon)
  const bottom = new THREE.Color(CONFIG.palette.envBottom)
  for (let y = 0; y < 8; y++) {
    const v = y / 7 // 0 = top row
    const c = v < 0.5 ? top.clone().lerp(horizon, v * 2) : horizon.clone().lerp(bottom, (v - 0.5) * 2)
    for (let x = 0; x < 16; x++) {
      const i = (y * 16 + x) * 4
      envData[i] = Math.round(c.r * 255)
      envData[i + 1] = Math.round(c.g * 255)
      envData[i + 2] = Math.round(c.b * 255)
      envData[i + 3] = 255
    }
  }
  const envSource = new THREE.DataTexture(envData, 16, 8, THREE.RGBAFormat)
  envSource.mapping = THREE.EquirectangularReflectionMapping
  envSource.colorSpace = THREE.SRGBColorSpace
  envSource.needsUpdate = true

  const pmrem = new THREE.PMREMGenerator(renderer)
  const envTarget = pmrem.fromEquirectangular(envSource)
  scene.environment = envTarget.texture
  scene.environmentIntensity = 0.95
  envSource.dispose()
  pmrem.dispose()

  const key = new THREE.DirectionalLight(CONFIG.palette.key, 1.9)
  key.position.set(4, 5, 6)
  const rim = new THREE.DirectionalLight(CONFIG.palette.rim, 3.1)
  rim.position.set(-4.5, -1.5, -4)
  const fill = new THREE.DirectionalLight(CONFIG.palette.fill, 0.62)
  fill.position.set(3, -3.5, 5)
  scene.add(key, rim, fill)

  /* ---- layer groups ------------------------------------------------ */

  const root = new THREE.Group()
  const gCore = new THREE.Group()
  const gShell = new THREE.Group()
  const gGraph = new THREE.Group()
  const gOrbits = new THREE.Group()
  const gField = new THREE.Group()
  root.add(gCore, gShell, gGraph, gOrbits, gField)
  scene.add(root)

  /* core ------------------------------------------------------------- */
  const coreGeo = createCoreGeometry(rng, tier.coreDetail)
  const coreMat = new THREE.MeshStandardMaterial({
    color: CONFIG.palette.core,
    metalness: 0.5,
    roughness: 0.38,
    flatShading: true,
    envMapIntensity: 1.1,
  })
  const core = new THREE.Mesh(coreGeo, coreMat)
  gCore.add(core)
  disposables.push(coreGeo, coreMat)

  const faceGeo = createEmissiveGeometry(coreGeo, rng)
  if (faceGeo) {
    const faceMat = new THREE.MeshBasicMaterial({
      color: CONFIG.palette.coreFace,
      transparent: true,
      opacity: 0.22,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    })
    gCore.add(new THREE.Mesh(faceGeo, faceMat))
    disposables.push(faceGeo, faceMat)
  }

  /* topology shell — edges only, roughly half the lattice pruned ----- */
  const shellGraph = createGraph(
    makeRng(CONFIG.seed + 1),
    tier.shellNodes,
    CONFIG.form.shell.rMin,
    CONFIG.form.shell.rMax,
    CONFIG.form.shell.density,
    CONFIG.form.shell.degree,
  )
  const shellGeo = new THREE.BufferGeometry()
  shellGeo.setAttribute("position", new THREE.BufferAttribute(linePositions(shellGraph), 3))
  const shellMat = new THREE.LineBasicMaterial({
    color: CONFIG.palette.shell,
    transparent: true,
    opacity: 0.13,
    depthWrite: false,
  })
  gShell.add(new THREE.LineSegments(shellGeo, shellMat))
  disposables.push(shellGeo, shellMat)

  /* node graph ------------------------------------------------------- */
  const graph = createGraph(
    makeRng(CONFIG.seed + 2),
    tier.graphNodes,
    CONFIG.form.graph.rMin,
    CONFIG.form.graph.rMax,
    CONFIG.form.graph.density,
    CONFIG.form.graph.degree,
  )
  const edgeGeo = new THREE.BufferGeometry()
  edgeGeo.setAttribute("position", new THREE.BufferAttribute(linePositions(graph), 3))
  const edgeMat = new THREE.LineBasicMaterial({
    color: CONFIG.palette.graph,
    transparent: true,
    opacity: 0.38,
    depthWrite: false,
  })
  gGraph.add(new THREE.LineSegments(edgeGeo, edgeMat))
  disposables.push(edgeGeo, edgeMat)

  const n = tier.graphNodes
  const nodeSize = new Float32Array(n)
  const nodeSeed = new Float32Array(n)
  const nodeBright = new Float32Array(n)
  const hotA = Math.floor(rng() * n)
  const hotB = Math.floor(rng() * n)
  for (let i = 0; i < n; i++) {
    nodeSize[i] = 0.085 + rng() * 0.05
    nodeSeed[i] = rng()
    nodeBright[i] = i === hotA || i === hotB ? 1 : 0
  }
  const nodeMat = createPointMaterial({
    color: new THREE.Color(CONFIG.palette.graph),
    hot: new THREE.Color(CONFIG.palette.nodeHot),
    amp: CONFIG.motion.nodeDrift,
    alpha: 0.95,
    sizeMul: tier.pointMul,
  })
  const nodePoints = createPoints(graph.positions, nodeSize, nodeSeed, nodeBright, nodeMat)
  gGraph.add(nodePoints)
  disposables.push(nodePoints.geometry, nodeMat)

  /* orbits — irregular, off-centre, each precessing at its own rate --- */
  const orbitSegs = tierName === "mobile" ? 120 : 240
  const orbitGroups: THREE.Group[] = []
  const orbitLines: THREE.Line[] = []
  for (let i = 0; i < tier.orbits; i++) {
    const spec = CONFIG.form.orbits[i]
    const geo = createOrbitGeometry(spec, orbitSegs)
    const mat = new THREE.LineBasicMaterial({
      color: CONFIG.palette.orbit,
      transparent: true,
      opacity: 0.5,
      depthWrite: false,
    })
    const line: THREE.Line = new THREE.Line(geo, mat)
    const grp = new THREE.Group()
    grp.position.set(spec.center[0], spec.center[1], spec.center[2])
    grp.rotation.set(spec.tilt[0], spec.tilt[1], spec.tilt[2])
    grp.add(line)
    gOrbits.add(grp)
    orbitGroups.push(grp)
    orbitLines.push(line)
    disposables.push(geo, mat)
  }

  /* one data pulse riding the first orbit ---------------------------- */
  let pulse: THREE.Points | null = null
  let pulseAttr: THREE.BufferAttribute | null = null
  if (tier.pulse && orbitGroups.length) {
    const pMat = createPointMaterial({
      color: new THREE.Color(CONFIG.palette.orbit),
      hot: new THREE.Color(CONFIG.palette.nodeHot),
      amp: 0,
      alpha: 1,
      sizeMul: tier.pointMul * 1.6,
    })
    pulse = createPoints(
      new Float32Array(3),
      new Float32Array([0.13]),
      new Float32Array([1]),
      new Float32Array([1]),
      pMat,
    )
    pulseAttr = pulse.geometry.attributes.position as THREE.BufferAttribute
    orbitGroups[0].add(pulse)
    disposables.push(pulse.geometry, pMat)
  }

  /* micro field ------------------------------------------------------ */
  const m = tier.particles
  const fPos = new Float32Array(m * 3)
  const fSize = new Float32Array(m)
  const fSeed = new Float32Array(m)
  const fBright = new Float32Array(m)
  const fieldRng = makeRng(CONFIG.seed + 3)
  const v = new THREE.Vector3()
  for (let i = 0; i < m; i++) {
    const z = fieldRng() * 2 - 1
    const th = fieldRng() * Math.PI * 2
    const rad = Math.sqrt(Math.max(0, 1 - z * z))
    const r = CONFIG.form.field.rMin + fieldRng() * (CONFIG.form.field.rMax - CONFIG.form.field.rMin)
    v.set(rad * Math.cos(th) * r, z * r * 0.8, rad * Math.sin(th) * r)
    fPos[i * 3] = v.x
    fPos[i * 3 + 1] = v.y
    fPos[i * 3 + 2] = v.z
    fSize[i] = 0.045 + fieldRng() * 0.04
    fSeed[i] = fieldRng()
    fBright[i] = 0
  }
  const fieldMat = createPointMaterial({
    color: new THREE.Color(CONFIG.palette.particle),
    hot: new THREE.Color(CONFIG.palette.particle),
    amp: CONFIG.motion.fieldDrift,
    alpha: 0.7,
    sizeMul: tier.pointMul,
  })
  const field = createPoints(fPos, fSize, fSeed, fBright, fieldMat)
  gField.add(field)
  disposables.push(field.geometry, fieldMat)

  const pointMaterials = [nodeMat, fieldMat]
  if (pulse) pointMaterials.push(pulse.material as THREE.ShaderMaterial)

  /* ---- sizing / composition ---------------------------------------- */

  const applySize = () => {
    const w = Math.max(1, host.clientWidth)
    const h = Math.max(1, host.clientHeight)
    camera.aspect = w / h
    camera.updateProjectionMatrix()
    renderer.setSize(w, h)
    const scale = renderer.domElement.height * 0.5
    for (const mat of pointMaterials) mat.uniforms.uScale.value = scale
    if (reduced) step(0) // static mode must still re-render on resize
  }

  const applyComposition = () => {
    const c = CONFIG.composition[pickBreakpoint()]
    root.position.set(c.x, c.y, 0)
    root.scale.setScalar(c.scale)
  }

  /* ---- state ------------------------------------------------------- */

  const coarse = window.matchMedia("(pointer: coarse)").matches
  const reduceMql = window.matchMedia("(prefers-reduced-motion: reduce)")
  let reduced = reduceMql.matches

  let time = 0
  let progress = 0
  let intensity = 1
  let pointerCur = { x: 0, y: 0 }
  let pointerTarget = { x: 0, y: 0 }
  let pointerNdc = { x: 0, y: 0 }
  let rect = { left: 0, top: 0, width: 1, height: 1 }
  let heroVisible = true
  let docHidden = document.visibilityState === "hidden"
  let contextLost = false
  let raf = 0
  let prevNow = 0
  let entranceAt = performance.now()
  let entranceApplied = false

  const ndc = new THREE.Vector3()
  const rayDir = new THREE.Vector3()
  const pointerWorld = new THREE.Vector3(999, 999, 999)

  const heroEl = (host.closest("#hero") as HTMLElement | null) ?? host
  const baseZ = CONFIG.camera.z

  /* ---- interaction -------------------------------------------------- */

  const applyMotionMode = () => {
    const proxOn = !coarse && !reduced ? 1 : 0
    for (const mat of pointMaterials) mat.uniforms.uProx.value = proxOn
    if (reduced) {
      stopLoop()
      canvas.style.transition = "none"
      canvas.style.opacity = "1"
      step(0)
    } else {
      entranceAt = performance.now()
      entranceApplied = false
      canvas.style.transition = reduced ? "none" : `opacity ${CONFIG.motion.entranceMs}ms ease-out`
      canvas.style.opacity = "0"
      requestAnimationFrame(() => {
        canvas.style.opacity = "1"
      })
      startLoop()
    }
  }

  const onPointerMove = (e: PointerEvent) => {
    pointerTarget.x = (e.clientX / window.innerWidth - 0.5) * 2
    pointerTarget.y = (e.clientY / window.innerHeight - 0.5) * 2
    pointerNdc.x = ((e.clientX - rect.left) / Math.max(1, rect.width)) * 2 - 1
    pointerNdc.y = -(((e.clientY - rect.top) / Math.max(1, rect.height)) * 2 - 1)
  }

  /* ---- scroll (rAF-throttled, no per-frame layout reads) ------------- */

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
    const h = Math.max(1, rect.height)
    progress = Math.min(1, Math.max(0, -rect.top / h))
    intensity = Math.max(CONFIG.scroll.minIntensity, 1 - CONFIG.scroll.falloff * progress)

    const now = performance.now()
    if (reduced) return
    if (now - entranceAt < CONFIG.motion.entranceMs) return
    if (!entranceApplied) {
      entranceApplied = true
      canvas.style.transition = "none"
    }
    canvas.style.opacity = String(1 - CONFIG.scroll.fade * progress)
  }

  const onScroll = () => {
    if (scrollQueued) return
    scrollQueued = true
    requestAnimationFrame(() => {
      scrollQueued = false
      applyScroll()
    })
  }

  /* ---- one frame ----------------------------------------------------- */

  const P = CONFIG.parallax
  const M = CONFIG.motion

  const step = (dt: number) => {
    time += dt * intensity

    const px = coarse || reduced ? 0 : pointerCur.x
    const py = coarse || reduced ? 0 : pointerCur.y

    if (!coarse && !reduced) {
      pointerCur.x += (pointerTarget.x - pointerCur.x) * P.lerp
      pointerCur.y += (pointerTarget.y - pointerCur.y) * P.lerp
    }

    // core: slow spin about a tilted axis + breathing
    gCore.rotation.set(M.coreTilt + py * P.core, time * M.coreSpin + px * P.core, 0)
    const breathe = 1 + Math.sin((time * Math.PI * 2) / M.breathePeriod) * M.breatheAmp
    gCore.scale.setScalar(breathe)

    // shell: counter-drift, different speed and tilt
    gShell.rotation.set(M.shellTilt + py * P.shell, -time * Math.abs(M.shellSpin) + px * P.shell, 0)

    // graph: parallax only — the shader drift does the moving
    gGraph.rotation.set(py * P.graph, px * P.graph, 0)

    // orbits: parallax on the group, precession on each path
    gOrbits.rotation.set(py * P.orbits, px * P.orbits, 0)
    for (let i = 0; i < orbitGroups.length; i++) {
      const spec = CONFIG.form.orbits[i]
      orbitGroups[i].rotation.set(spec.tilt[0], spec.tilt[1] + time * M.orbitRate[i], spec.tilt[2])
    }

    // field: parallax + a barely-there turn
    gField.rotation.set(py * P.field, time * M.fieldSpin + px * P.field, 0)

    // camera: damped parallax and a slight depth shift while scrolling
    camera.position.set(px * P.camera, -py * P.camera, baseZ + progress * CONFIG.scroll.depth)
    camera.lookAt(0, 0, 0)

    // proximity: pointer projected onto the plane at core depth
    if (!coarse && !reduced) {
      ndc.set(pointerNdc.x, pointerNdc.y, 0.5).unproject(camera)
      rayDir.copy(ndc).sub(camera.position).normalize()
      const denom = rayDir.z
      if (Math.abs(denom) > 1e-5) {
        const tPlane = (0 - camera.position.z) / denom
        pointerWorld.copy(camera.position).addScaledVector(rayDir, tPlane)
      }
    } else {
      pointerWorld.set(999, 999, 999)
    }

    for (const mat of pointMaterials) {
      mat.uniforms.uTime.value = time
      mat.uniforms.uPointer.value.copy(pointerWorld)
    }

    if (pulse && pulseAttr) {
      const spec = CONFIG.form.orbits[0]
      orbitPoint(spec, (time * 0.07 * Math.PI * 2) % (Math.PI * 2), v)
      pulseAttr.setXYZ(0, v.x, v.y, v.z)
      pulseAttr.needsUpdate = true
    }

    renderer.render(scene, camera)
  }

  /* ---- loop, visibility, adaptive quality ---------------------------- */

  const startLoop = () => {
    if (raf || reduced) return
    prevNow = 0
    const tick = () => {
      raf = requestAnimationFrame(tick)
      if (!heroVisible || docHidden || contextLost) {
        prevNow = 0 // no time jump on resume
        return
      }
      const now = performance.now()
      let dt = prevNow ? (now - prevNow) / 1000 : 0.016
      prevNow = now
      dt = Math.min(dt, 0.05)

      if (!perfDone) {
        perfTime += dt * 1000
        perfFrames++
        if (perfFrames >= CONFIG.quality.sampleFrames) {
          perfDone = true
          if (perfTime / perfFrames > CONFIG.quality.frameBudgetMs && dpr > 1) {
            dpr = Math.max(1, dpr - CONFIG.quality.dprStep)
            renderer.setPixelRatio(dpr)
            applySize()
          }
        }
      }

      step(dt)
    }
    raf = requestAnimationFrame(tick)
  }

  const stopLoop = () => {
    if (raf) cancelAnimationFrame(raf)
    raf = 0
    prevNow = 0
  }

  let perfFrames = 0
  let perfTime = 0
  let perfDone = false

  /* ---- observers / listeners ---------------------------------------- */

  let resizeQueued = false
  const resizeObserver = new ResizeObserver(() => {
    if (resizeQueued) return
    resizeQueued = true
    requestAnimationFrame(() => {
      resizeQueued = false
      applySize()
      applyComposition()
      readRect()
    })
  })
  resizeObserver.observe(host)

  const io = new IntersectionObserver(
    entries => {
      heroVisible = entries[0].isIntersecting
      if (heroVisible) prevNow = 0
    },
    { threshold: 0 },
  )
  io.observe(host)

  const onVisibility = () => {
    docHidden = document.visibilityState === "hidden"
    if (!docHidden) prevNow = 0
  }
  document.addEventListener("visibilitychange", onVisibility)

  const onContextLost = (e: Event) => {
    e.preventDefault()
    contextLost = true
    prevNow = 0
  }
  const onContextRestored = () => {
    contextLost = false
    prevNow = 0
  }
  canvas.addEventListener("webglcontextlost", onContextLost, false)
  canvas.addEventListener("webglcontextrestored", onContextRestored, false)

  const onReduceChange = () => {
    reduced = reduceMql.matches
    applyMotionMode()
  }
  reduceMql.addEventListener("change", onReduceChange)

  if (!coarse) window.addEventListener("pointermove", onPointerMove, { passive: true })
  window.addEventListener("scroll", onScroll, { passive: true })

  /* ---- boot ---------------------------------------------------------- */

  applySize()
  applyComposition()
  readRect()

  const destroy = () => {
    if (active && active.host === host) active = null
    stopLoop()
    resizeObserver.disconnect()
    io.disconnect()
    window.removeEventListener("scroll", onScroll)
    document.removeEventListener("visibilitychange", onVisibility)
    reduceMql.removeEventListener("change", onReduceChange)
    if (!coarse) window.removeEventListener("pointermove", onPointerMove)
    canvas.removeEventListener("webglcontextlost", onContextLost)
    canvas.removeEventListener("webglcontextrestored", onContextRestored)
    envTarget.dispose()
    for (const d of disposables) d.dispose()
    renderer.dispose()
    canvas.remove()
  }

  active = { host, destroy }
  applyMotionMode()
  return active
}
