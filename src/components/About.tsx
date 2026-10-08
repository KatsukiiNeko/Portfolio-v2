import Section from "./Section"
import Reveal from "./Reveal"
import { profile } from "../data/profile"

const meta = [
  { label: "Full name", value: profile.fullName },
  { label: "Date of birth", value: profile.dateOfBirth },
  { label: "Location", value: profile.location },
  { label: "Field", value: "AI, Python & web engineering · graphic design" },
]

export default function About() {
  return (
    <Section id="about" title="About">
      <div className="grid gap-10 lg:grid-cols-[1.5fr_1fr] lg:gap-16">
        <Reveal>
          <p className="text-lead text-foreground-muted">{profile.intro}</p>
        </Reveal>

        <Reveal delay={0.1}>
          <dl className="divide-y divide-border border-y border-border">
            {meta.map(item => (
              <div key={item.label} className="flex justify-between gap-4 py-4">
                <dt className="font-mono text-xs tracking-wide text-foreground-muted uppercase">
                  {item.label}
                </dt>
                <dd className="text-right text-sm text-foreground">{item.value}</dd>
              </div>
            ))}
          </dl>
        </Reveal>
      </div>
    </Section>
  )
}
