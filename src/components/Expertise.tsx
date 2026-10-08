import Section from "./Section"
import Reveal from "./Reveal"
import { expertise } from "../data/resume"

export default function Expertise() {
  return (
    <Section
      id="expertise"
      title="Expertise"
      intro="Main technical fields and the technologies behind them."
    >
      <div className="divide-y divide-border border-y border-border">
        {expertise.map((group, i) => (
          <Reveal key={group.title} delay={i * 0.06}>
            <div className="grid gap-3 py-7 md:grid-cols-[minmax(0,15rem)_1fr] md:gap-10">
              <h3 className="font-display text-xl font-bold text-foreground">
                {group.title}
              </h3>
              <div>
                <p className="max-w-[65ch] text-foreground-muted">{group.summary}</p>
                <ul className="mt-4 flex flex-wrap gap-2">
                  {group.items.map(item => (
                    <li
                      key={item}
                      className="rounded-control border border-border bg-surface px-2.5 py-1 font-mono text-xs text-foreground-muted"
                    >
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </Reveal>
        ))}
      </div>
    </Section>
  )
}
