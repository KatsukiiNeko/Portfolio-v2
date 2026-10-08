import { useState } from "react"
import { AnimatePresence } from "motion/react"
import Section from "./Section"
import ProjectCard from "./ProjectCard"
import ProjectModal from "./ProjectModal"
import { projects } from "../data/projects"
import type { Project } from "../data/projects"

const categories = ["all", ...new Set(projects.map(p => p.category))]

const label = (value: string) =>
  value === "all" ? "All" : value.charAt(0).toUpperCase() + value.slice(1)

export default function Experience() {
  const [filter, setFilter] = useState("all")
  const [active, setActive] = useState<Project | null>(null)

  const shown =
    filter === "all"
      ? projects
      : projects.filter(
          p =>
            p.category === filter ||
            p.tags.some(tag => tag.toLowerCase() === filter),
        )

  return (
    <Section
      id="experience"
      title="Experience"
      intro="Projects and practical work: filter by field, open a card for details."
    >
      <div className="mb-8 flex flex-wrap gap-2" role="group" aria-label="Filter projects">
        {categories.map(category => (
          <button
            key={category}
            type="button"
            onClick={() => setFilter(category)}
            aria-pressed={filter === category}
            className={`rounded-control border px-4 py-2.5 text-sm font-medium transition duration-200 ${
              filter === category
                ? "border-accent bg-accent text-white"
                : "border-border text-foreground-muted hover:border-accent hover:text-foreground"
            }`}
          >
            {label(category)}
          </button>
        ))}
      </div>

      {shown.length === 0 ? (
        <p className="py-10 text-center text-foreground-muted">
          Nothing in this category yet.
        </p>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <AnimatePresence mode="popLayout">
            {shown.map(project => (
              <ProjectCard key={project.id} project={project} onOpen={setActive} />
            ))}
          </AnimatePresence>
        </div>
      )}

      <ProjectModal project={active} onClose={() => setActive(null)} />
    </Section>
  )
}
