import Section from "./Section"
import Reveal from "./Reveal"
import { education } from "../data/resume"

export default function Education() {
  return (
    <Section id="education" title="Education">
      <ol className="border-l border-border pl-6 md:pl-10">
        {education.map(entry => (
          <Reveal key={entry.title} className="relative pb-10 last:pb-0">
            <span
              aria-hidden="true"
              className="absolute top-2 -left-[calc(1.5rem+4px)] size-2 rounded-full bg-accent md:-left-[calc(2.5rem+4px)]"
            />
            <p className="font-mono text-xs tracking-wide text-foreground-muted uppercase">
              {entry.period}
            </p>
            <h3 className="mt-1 font-display text-xl font-bold text-foreground">
              {entry.title}
            </h3>
            <p className="mt-1 text-sm text-foreground-muted">{entry.place}</p>
            {entry.note && (
              <p className="mt-3 max-w-[65ch] text-sm text-foreground-muted italic">
                {entry.note}
              </p>
            )}
          </Reveal>
        ))}
      </ol>
    </Section>
  )
}
