import { lazy, Suspense } from "react"
import Button from "./Button"
import Reveal from "./Reveal"
import { profile } from "../data/profile"

const HeroScene = lazy(() => import("../three/HeroScene"))

export default function Hero() {
  return (
    <section
      id="hero"
      className="relative flex min-h-[100svh] scroll-mt-24 items-center pt-32 pb-20"
    >
      <div className="container-page grid items-center gap-12 lg:grid-cols-2">
        <div>
          <Reveal>
            <h1 className="font-display text-display font-extrabold leading-[1.05] tracking-tight text-balance">
              {profile.displayName}
            </h1>
          </Reveal>

          <Reveal delay={0.08}>
            <p className="mt-5 flex flex-wrap gap-x-3 text-base text-foreground-muted sm:text-lg">
              {profile.roles.map((role, i) => (
                <span key={role}>
                  {i > 0 && <span className="mr-3 text-foreground-muted">/</span>}
                  {role}
                </span>
              ))}
            </p>
          </Reveal>

          <Reveal delay={0.16}>
            <div className="mt-9 flex flex-wrap gap-3">
              <Button href="#experience">
                <i className="fas fa-folder-open" aria-hidden="true" /> View Work
              </Button>
              <Button href="#contact" variant="ghost">
                <i className="fas fa-paper-plane" aria-hidden="true" /> Get in Touch
              </Button>
            </div>
          </Reveal>
        </div>

        <div className="flex justify-center lg:justify-end">
          <Suspense fallback={null}>
            <HeroScene />
          </Suspense>
        </div>
      </div>
    </section>
  )
}
