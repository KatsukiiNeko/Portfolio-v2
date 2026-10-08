import type { ReactNode } from "react"
import Reveal from "./Reveal"

interface SectionProps {
  id: string
  title: string
  intro?: ReactNode
  children: ReactNode
}

export default function Section({ id, title, intro, children }: SectionProps) {
  return (
    <section id={id} className="scroll-mt-24 border-t border-border py-20 md:py-28">
      <div className="container-page">
        <Reveal>
          <h2 className="font-display text-section font-extrabold tracking-tight text-balance">
            {title}
          </h2>
          {intro && (
            <p className="mt-4 max-w-[65ch] text-lead text-foreground-muted">{intro}</p>
          )}
        </Reveal>
        <div className="mt-10 md:mt-14">{children}</div>
      </div>
    </section>
  )
}
