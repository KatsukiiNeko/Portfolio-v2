import { useEffect, useRef } from "react"
import { AnimatePresence, motion } from "motion/react"
import type { Project } from "../data/projects"

interface ProjectModalProps {
  project: Project | null
  onClose: () => void
}

export default function ProjectModal({ project, onClose }: ProjectModalProps) {
  const panel = useRef<HTMLDivElement>(null)
  const returnFocus = useRef<HTMLElement | null>(null)

  useEffect(() => {
    if (!project) return

    returnFocus.current = document.activeElement as HTMLElement
    document.body.style.overflow = "hidden"
    panel.current?.focus()

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
      if (e.key !== "Tab" || !panel.current) return

      const focusable = panel.current.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
      )
      if (!focusable.length) return
      const first = focusable[0]
      const last = focusable[focusable.length - 1]

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault()
        first.focus()
      }
    }

    window.addEventListener("keydown", onKey)
    return () => {
      window.removeEventListener("keydown", onKey)
      document.body.style.overflow = ""
      returnFocus.current?.focus()
    }
  }, [project, onClose])

  return (
    <AnimatePresence>
      {project && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-5 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={onClose}
          role="dialog"
          aria-modal="true"
          aria-label={project.title}
        >
          <motion.div
            ref={panel}
            tabIndex={-1}
            role="document"
            onClick={e => e.stopPropagation()}
            initial={{ opacity: 0, y: 16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-card border border-border bg-surface p-6 outline-none sm:p-8"
          >
            {project.image && (
              <img
                src={project.image}
                alt={project.title}
                className="mb-5 aspect-[16/10] w-full rounded-control object-cover"
              />
            )}

            <h2 className="font-display text-2xl font-bold text-foreground">
              {project.title}
            </h2>
            <p className="mt-3 leading-relaxed text-foreground-muted">
              {project.description}
            </p>

            <ul className="mt-5 flex flex-wrap gap-1.5">
              {project.tags.map(tag => (
                <li
                  key={tag}
                  className="rounded-control border border-border px-2 py-0.5 font-mono text-xs text-foreground-muted"
                >
                  {tag}
                </li>
              ))}
            </ul>

            <div className="mt-6 flex flex-wrap gap-3 border-t border-border pt-5">
              {project.liveUrl && (
                <a
                  href={project.liveUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-control bg-accent px-4 py-3 text-sm font-semibold text-white transition hover:brightness-110"
                >
                  <i className="fas fa-external-link-alt" aria-hidden="true" /> Live
                </a>
              )}
              {project.githubUrl && (
                <a
                  href={project.githubUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-control border border-border px-4 py-3 text-sm font-semibold text-foreground transition hover:border-accent"
                >
                  <i className="fab fa-github" aria-hidden="true" /> Code
                </a>
              )}
              <button
                type="button"
                onClick={onClose}
                className="ml-auto inline-flex items-center gap-2 rounded-control border border-border px-4 py-3 text-sm font-semibold text-foreground-muted transition hover:border-accent hover:text-foreground"
              >
                <i className="fas fa-times" aria-hidden="true" /> Close
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
