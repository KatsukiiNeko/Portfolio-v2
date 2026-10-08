import { useEffect, useRef, useState } from "react"
import * as THREE from "three"

export default function HeroScene() {
  const host = useRef<HTMLDivElement>(null)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    const el = host.current
    if (!el) return

    let renderer: THREE.WebGLRenderer
    try {
      renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true })
    } catch {
      setFailed(true)
      return
    }

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    const mobile = window.innerWidth < 768 || /Mobi|Android/i.test(navigator.userAgent)

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(55, 1, 0.1, 1000)
    camera.position.z = 5

    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setClearColor(0x000000, 0)
    el.appendChild(renderer.domElement)
    renderer.domElement.style.cursor = "grab"
    renderer.domElement.style.touchAction = "pan-y"

    const resize = () => {
      const w = el.clientWidth || 1
      const h = el.clientHeight || 1
      camera.aspect = w / h
      camera.updateProjectionMatrix()
      renderer.setSize(w, h)
    }
    resize()

    scene.add(new THREE.AmbientLight(0xc9b0ff, 1.6))
    const dir = new THREE.DirectionalLight(0xffffff, 2.1)
    dir.position.set(3, 5, 4)
    scene.add(dir)
    const rim = new THREE.PointLight(0xd9c7ff, 5.5, 12)
    rim.position.set(-3, -2, 2)
    scene.add(rim)

    const group = new THREE.Group()
    scene.add(group)

    const disposables: { dispose(): void }[] = []

    const icoGeo = new THREE.IcosahedronGeometry(1.1, 1)
    const icoMat = new THREE.MeshPhongMaterial({
      color: 0xb18cff,
      shininess: 80,
      transparent: true,
      opacity: 1,
      flatShading: true,
    })
    const ico = new THREE.Mesh(icoGeo, icoMat)
    group.add(ico)
    disposables.push(icoGeo, icoMat)

    const wireGeo = new THREE.IcosahedronGeometry(1.15, 1)
    const wireMat = new THREE.MeshBasicMaterial({
      color: 0xd4c2ff,
      wireframe: true,
      transparent: true,
      opacity: 0.45,
    })
    group.add(new THREE.Mesh(wireGeo, wireMat))
    disposables.push(wireGeo, wireMat)

    const torusMat = new THREE.MeshPhongMaterial({
      color: 0xa884fa,
      shininess: 100,
      transparent: true,
      opacity: 1,
    })
    const radial = mobile ? 8 : 16
    const tubular = mobile ? 40 : 80

    const torus1Geo = new THREE.TorusGeometry(1.7, 0.06, radial, tubular)
    const torus1 = new THREE.Mesh(torus1Geo, torusMat)
    torus1.rotation.x = Math.PI / 2
    group.add(torus1)

    const torus2Geo = new THREE.TorusGeometry(1.9, 0.04, radial, tubular)
    const torus2Mat = torusMat.clone()
    const torus2 = new THREE.Mesh(torus2Geo, torus2Mat)
    torus2.rotation.x = Math.PI / 3
    torus2.rotation.y = Math.PI / 5
    group.add(torus2)
    disposables.push(torus1Geo, torus2Geo, torusMat, torus2Mat)

    const count = mobile ? 60 : 160
    const positions = new Float32Array(count * 3)
    const colors = new Float32Array(count * 3)
    const color = new THREE.Color()
    for (let i = 0; i < count; i++) {
      const r = 2.2 + Math.random() * 1.4
      const theta = Math.random() * Math.PI * 2
      const phi = Math.random() * Math.PI
      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta)
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta)
      positions[i * 3 + 2] = r * Math.cos(phi)
      color.setHSL(0.72 + Math.random() * 0.1, 0.9, 0.74 + Math.random() * 0.26)
      colors[i * 3] = color.r
      colors[i * 3 + 1] = color.g
      colors[i * 3 + 2] = color.b
    }
    const pGeo = new THREE.BufferGeometry()
    pGeo.setAttribute("position", new THREE.BufferAttribute(positions, 3))
    pGeo.setAttribute("color", new THREE.BufferAttribute(colors, 3))
    const pMat = new THREE.PointsMaterial({
      size: 0.052,
      vertexColors: true,
      transparent: true,
      opacity: 1,
    })
    const particles = new THREE.Points(pGeo, pMat)
    group.add(particles)
    disposables.push(pGeo, pMat)

    // pointer parallax + drag rotation
    const pointer = { x: 0, y: 0 }
    const target = { x: 0, y: 0 }
    let dragging = false
    let prev = { x: 0, y: 0 }

    const onPointerMove = (e: PointerEvent) => {
      if (dragging) {
        target.y += (e.clientX - prev.x) * 0.008
        target.x += (e.clientY - prev.y) * 0.008
        target.x = Math.max(-1.1, Math.min(1.1, target.x))
        prev = { x: e.clientX, y: e.clientY }
        return
      }
      const rect = el.getBoundingClientRect()
      pointer.x = ((e.clientX - rect.left) / rect.width - 0.5) * 0.6
      pointer.y = ((e.clientY - rect.top) / rect.height - 0.5) * 0.6
    }
    const onPointerDown = (e: PointerEvent) => {
      dragging = true
      prev = { x: e.clientX, y: e.clientY }
      renderer.domElement.style.cursor = "grabbing"
      renderer.domElement.setPointerCapture(e.pointerId)
    }
    const onPointerUp = (e: PointerEvent) => {
      dragging = false
      renderer.domElement.style.cursor = "grab"
      if (renderer.domElement.hasPointerCapture(e.pointerId))
        renderer.domElement.releasePointerCapture(e.pointerId)
    }

    el.addEventListener("pointermove", onPointerMove)
    renderer.domElement.addEventListener("pointerdown", onPointerDown)
    renderer.domElement.addEventListener("pointerup", onPointerUp)
    renderer.domElement.addEventListener("pointercancel", onPointerUp)

    const resizeObserver = new ResizeObserver(resize)
    resizeObserver.observe(el)

    // pause the loop while off-screen
    let visible = true
    const io = new IntersectionObserver(entries => (visible = entries[0].isIntersecting))
    io.observe(el)

    let raf = 0
    let currentX = 0
    let currentY = 0
    const clock = new THREE.Clock()

    const tick = () => {
      raf = requestAnimationFrame(tick)
      if (!visible) return

      const t = clock.getElapsedTime()
      if (!dragging && !reduceMotion) {
        target.y += 0.0012
        target.x += Math.sin(t * 0.3) * 0.0003
      }

      currentX += (target.x + pointer.y * 0.4 - currentX) * 0.06
      currentY += (target.y + pointer.x * 0.4 - currentY) * 0.06
      group.rotation.x = currentX
      group.rotation.y = currentY

      if (!reduceMotion) {
        ico.scale.setScalar(1 + Math.sin(t * 1.8) * 0.018)
        torus1.rotation.z += 0.004
        torus2.rotation.z -= 0.003
        torus2.rotation.y += 0.002
        particles.rotation.y -= 0.0015
        particles.rotation.x += 0.0008
      }

      renderer.render(scene, camera)
    }
    tick()

    return () => {
      cancelAnimationFrame(raf)
      resizeObserver.disconnect()
      io.disconnect()
      el.removeEventListener("pointermove", onPointerMove)
      renderer.domElement.removeEventListener("pointerdown", onPointerDown)
      renderer.domElement.removeEventListener("pointerup", onPointerUp)
      renderer.domElement.removeEventListener("pointercancel", onPointerUp)
      disposables.forEach(d => d.dispose())
      renderer.dispose()
      renderer.domElement.remove()
    }
  }, [])

  if (failed) {
    // Static fallback: no WebGL, content never depends on the canvas.
    return (
      <div
        aria-hidden="true"
        className="aspect-square min-w-0 w-full max-w-md rounded-card border border-border bg-[radial-gradient(circle_at_30%_25%,var(--c-accent-muted),transparent_65%)]"
      />
    )
  }

  return <div ref={host} aria-hidden="true" className="aspect-square min-w-0 w-full max-w-md [@media(max-height:520px)]:max-w-[34vh]" />
}
