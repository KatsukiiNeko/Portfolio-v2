import { motion } from "motion/react"
import type { Project } from "../data/projects"

interface ProjectCardProps {
  project: Project
  onOpen: (project: Project) => void
}

export default function ProjectCard({ project, onOpen }: ProjectCardProps) {
  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className="group flex flex-col overflow-hidden rounded-card border border-border bg-surface transition-colors duration-200 hover:border-accent/60"
    >
      <button
        type="button"
        onClick={() => onOpen(project)}
        className="relative block aspect-[16/10] w-full overflow-hidden bg-surface-elevated"
        aria-label={`Open details for ${project.title}`}
      >
        {project.image ? (
          <img
            src={project.image}
            alt={project.title}
            loading="lazy"
            decoding="async"
            className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
          />
        ) : (
          <span className="flex h-full w-full items-center justify-center text-3xl opacity-30">
            <i className="fas fa-image" aria-hidden="true" />
          </span>
        )}
      </button>

      <div className="flex flex-1 flex-col gap-3 p-5">
        <h3 className="font-display text-lg font-bold text-foreground">
          {project.title}
        </h3>
        <p className="text-sm text-foreground-muted">{project.description}</p>

        <ul className="mt-auto flex flex-wrap gap-1.5 pt-1">
          {project.tags.map(tag => (
            <li
              key={tag}
              className="rounded-control border border-border px-2 py-0.5 font-mono text-xs text-foreground-muted"
            >
              {tag}
            </li>
          ))}
        </ul>

        <div className="flex gap-4 border-t border-border pt-3 text-sm">
          {project.liveUrl && (
            <a
              href={project.liveUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-11 items-center text-foreground-muted transition-colors hover:text-accent-text"
            >
              <i className="fas fa-external-link-alt mr-1.5" aria-hidden="true" />
              Live
            </a>
          )}
          {project.githubUrl && (
            <a
              href={project.githubUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-11 items-center text-foreground-muted transition-colors hover:text-accent-text"
            >
              <i className="fab fa-github mr-1.5" aria-hidden="true" />
              Code
            </a>
          )}
        </div>
      </div>
    </motion.article>
  )
}
