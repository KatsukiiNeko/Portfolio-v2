import { useState, type FormEvent } from "react"
import emailjs from "@emailjs/browser"
import Section from "./Section"
import Button from "./Button"

const SERVICE = "service_r8x6wci"
const TEMPLATE = "template_kfgnjuq"
const PUBLIC_KEY = "CYnilZhs-1QRVzITw"

const fields = [
  { name: "name", label: "Your name", type: "text", autoComplete: "name" },
  { name: "email", label: "Your email", type: "email", autoComplete: "email" },
  { name: "title", label: "Subject", type: "text", autoComplete: "off" },
] as const

type Status = "idle" | "sending" | "sent" | "error"

export default function Contact() {
  const [status, setStatus] = useState<Status>("idle")

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = e.currentTarget
    const time = form.elements.namedItem("time") as HTMLInputElement
    time.value = new Date().toLocaleString()

    setStatus("sending")
    try {
      await emailjs.sendForm(SERVICE, TEMPLATE, form, { publicKey: PUBLIC_KEY })
      setStatus("sent")
      form.reset()
    } catch {
      setStatus("error")
    }
  }

  if (status === "sent") {
    return (
      <Section id="contact" title="Contact">
        <div className="max-w-xl" aria-live="polite">
          <i className="fas fa-check-circle text-4xl text-accent-text" aria-hidden="true" />
          <h3 className="mt-4 font-display text-xl font-bold">Message sent!</h3>
          <p className="mt-2 text-foreground-muted">
            Thank you. I'll get back to you soon.
          </p>
          <button
            type="button"
            onClick={() => setStatus("idle")}
            className="mt-4 inline-flex h-11 items-center text-sm font-semibold text-accent-text underline underline-offset-4"
          >
            Send another message
          </button>
        </div>
      </Section>
    )
  }

  return (
    <Section
      id="contact"
      title="Contact"
      intro="Have a project in mind or just want to chat? Drop me a message and I'll get back to you as soon as possible."
    >
      <form onSubmit={onSubmit} className="flex max-w-xl flex-col gap-5" noValidate={false}>
        <input type="hidden" name="time" />

        {fields.map(field => (
          <div key={field.name} className="flex flex-col gap-2">
            <label
              htmlFor={field.name}
              className="font-mono text-xs tracking-wide text-foreground-muted uppercase"
            >
              {field.label}
            </label>
            <input
              id={field.name}
              name={field.name}
              type={field.type}
              required
              autoComplete={field.autoComplete}
              className="rounded-control border border-border-strong bg-surface px-4 py-3 text-foreground transition-colors duration-200 outline-none placeholder:text-foreground-muted focus:border-accent"
            />
          </div>
        ))}

        <div className="flex flex-col gap-2">
          <label
            htmlFor="message"
            className="font-mono text-xs tracking-wide text-foreground-muted uppercase"
          >
            Your message
          </label>
          <textarea
            id="message"
            name="message"
            required
            rows={5}
            className="resize-none rounded-control border border-border-strong bg-surface px-4 py-3 text-foreground transition-colors duration-200 outline-none focus:border-accent"
          />
        </div>

        <div aria-live="polite">
          {status === "error" && (
            <p className="text-sm text-red-400">
              Failed to send. Please try again later.
            </p>
          )}
        </div>

        <Button type="submit" className="self-start">
          <i className="fas fa-paper-plane" aria-hidden="true" />
          {status === "sending" ? "Sending…" : "Send Message"}
        </Button>
      </form>
    </Section>
  )
}
