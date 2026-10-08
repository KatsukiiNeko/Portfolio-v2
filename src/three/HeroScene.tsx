import { useEffect, useRef, useState } from "react"
import { initHeroThree, type HeroThree } from "./heroScene"

export default function HeroScene() {
  const host = useRef<HTMLDivElement>(null)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    const el = host.current
    if (!el) return

    let instance: HeroThree | null = null
    try {
      instance = initHeroThree(el)
    } catch {
      instance = null
    }

    if (!instance) {
      // WebGL unavailable or init threw: fall back to the CSS card.
      // The rest of the page never depends on the canvas.
      setFailed(true)
      return
    }

    return () => instance?.destroy()
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
