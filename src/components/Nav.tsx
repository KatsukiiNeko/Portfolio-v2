import { useEffect, useState } from "react"

const links = [
  { id: "about", label: "About" },
  { id: "education", label: "Education" },
  { id: "expertise", label: "Expertise" },
  { id: "experience", label: "Experience" },
  { id: "achievements", label: "Achievements" },
  { id: "interests", label: "Interests" },
  { id: "contact", label: "Contact" },
]

export default function Nav() {
  const [theme, setTheme] = useState<"dark" | "light">(
    () => (localStorage.getItem("kn-theme") as "dark" | "light") || "dark",
  )
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [active, setActive] = useState("about")

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    localStorage.setItem("kn-theme", theme)
  }, [theme])

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    onScroll()
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  useEffect(() => {
    const observer = new IntersectionObserver(
      entries =>
        entries.forEach(entry => entry.isIntersecting && setActive(entry.target.id)),
      { rootMargin: "-72px 0px -60% 0px" },
    )
    links.forEach(({ id }) => {
      const el = document.getElementById(id)
      if (el) observer.observe(el)
    })
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false)
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [])

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 h-[72px] border-b transition-colors duration-200 ${
        scrolled
          ? "border-border bg-background/85 backdrop-blur-xl"
          : "border-transparent bg-background/40 backdrop-blur-md"
      }`}
    >
      <nav
        aria-label="Main navigation"
        className="container-page flex h-full items-center justify-between gap-4"
      >
        <a
          href="#top"
          className="flex items-center gap-2.5 py-2 font-display text-lg font-extrabold tracking-tight text-foreground"
        >
          <img
            src="/assets/images/libra-icon.svg"
            alt=""
            aria-hidden="true"
            className="size-7"
          />
          Katsukii Neko
        </a>

        <ul className="hidden items-center gap-1 lg:flex">
          {links.map(link => (
            <li key={link.id}>
              <a
                href={`#${link.id}`}
                aria-current={active === link.id ? "true" : undefined}
                className={`flex min-h-11 items-center rounded-control px-3 text-sm font-medium transition-colors duration-200 ${
                  active === link.id
                    ? "bg-accent-muted text-foreground"
                    : "text-foreground-muted hover:text-foreground"
                }`}
              >
                {link.label}
              </a>
            </li>
          ))}
        </ul>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}
            className="flex size-11 items-center justify-center rounded-control border border-border bg-surface text-foreground transition-colors duration-200 hover:border-accent"
          >
            <i
              className={theme === "dark" ? "fas fa-sun" : "fas fa-moon"}
              aria-hidden="true"
            />
          </button>

          <button
            type="button"
            onClick={() => setOpen(!open)}
            aria-expanded={open}
            aria-controls="mobile-menu"
            aria-label="Toggle navigation menu"
            className="flex size-11 items-center justify-center rounded-control border border-border bg-surface text-foreground transition-colors duration-200 hover:border-accent lg:hidden"
          >
            <i
              className={open ? "fas fa-times" : "fas fa-bars"}
              aria-hidden="true"
            />
          </button>
        </div>
      </nav>

      <div
        id="mobile-menu"
        hidden={!open}
        className="max-h-[calc(100dvh-72px)] overflow-y-auto border-t border-border bg-background/95 backdrop-blur-xl lg:hidden"
      >
        <ul className="container-page py-3">
          {links.map(link => (
            <li key={link.id}>
              <a
                href={`#${link.id}`}
                onClick={() => setOpen(false)}
                className={`block rounded-control px-3 py-3 text-base ${
                  active === link.id
                    ? "bg-accent-muted text-foreground"
                    : "text-foreground-muted"
                }`}
              >
                {link.label}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </header>
  )
}
