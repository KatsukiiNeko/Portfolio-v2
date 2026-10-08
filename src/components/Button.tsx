import type { ReactNode } from "react"

interface ButtonProps {
  href?: string
  type?: "button" | "submit"
  variant?: "primary" | "ghost"
  children: ReactNode
  className?: string
}

const base =
  "inline-flex items-center justify-center gap-2 rounded-control px-6 py-3 text-sm font-semibold transition duration-200 ease-standard"

const variants = {
  primary:
    "bg-accent text-white hover:brightness-110 hover:-translate-y-0.5 active:translate-y-0",
  ghost:
    "border border-border text-foreground hover:border-accent hover:bg-surface hover:-translate-y-0.5 active:translate-y-0",
}

export default function Button({
  href,
  type = "button",
  variant = "primary",
  children,
  className = "",
}: ButtonProps) {
  const cls = `${base} ${variants[variant]} ${className}`

  if (href) {
    return (
      <a href={href} className={cls}>
        {children}
      </a>
    )
  }

  return (
    <button type={type} className={cls}>
      {children}
    </button>
  )
}
