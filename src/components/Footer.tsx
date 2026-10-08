import { profile } from "../data/profile"

export default function Footer() {
  return (
    <footer className="border-t border-border bg-surface py-10">
      <div className="container-page flex flex-col items-center gap-5 text-center">
        <p className="text-sm text-foreground-muted">
          © {new Date().getFullYear()} {profile.fullName}. All rights reserved.
        </p>

        <ul className="flex gap-3" aria-label="Social media links">
          {profile.socials.map(social => (
            <li key={social.label}>
              <a
                href={social.href}
                aria-label={social.label}
                rel="noopener noreferrer"
                target="_blank"
                className="flex size-10 items-center justify-center rounded-control border border-border bg-background text-foreground-muted transition duration-200 ease-standard hover:-translate-y-0.5 hover:border-accent hover:bg-accent hover:text-white"
              >
                <i className={social.icon} aria-hidden="true" />
              </a>
            </li>
          ))}
        </ul>
      </div>
    </footer>
  )
}
