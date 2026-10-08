import Reveal from "./Reveal"
import type { NamedEntry } from "../data/resume"

export default function EntryList({ entries }: { entries: NamedEntry[] }) {
  return (
    <div className="grid gap-8 sm:grid-cols-2 lg:gap-10">
      {entries.map((entry, i) => {
        const pending = entry.title.includes("[")
        return (
          <Reveal key={entry.title} delay={i * 0.06}>
            <h3
              className={`font-display text-lg font-bold ${
                pending ? "text-foreground-muted italic" : "text-foreground"
              }`}
            >
              {entry.title}
            </h3>
            <p
              className={`mt-1.5 max-w-[52ch] text-sm ${
                pending ? "text-foreground-muted italic" : "text-foreground-muted"
              }`}
            >
              {entry.detail}
            </p>
          </Reveal>
        )
      })}
    </div>
  )
}
