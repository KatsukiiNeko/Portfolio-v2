/** Bracketed values are unknowns carried over from the old site — replace them, nothing here is invented. */

export interface TimelineEntry {
  period: string
  title: string
  place: string
  note?: string
}

export interface ExpertiseGroup {
  title: string
  summary: string
  items: string[]
}

export interface NamedEntry {
  title: string
  detail: string
}

export const education: TimelineEntry[] = [
  {
    period: "[Start - present]",
    title: "High school student",
    place: "[School name: add]",
    note: "Known from the existing site: a high school student from Vietnam. Add the school and dates when you want them public.",
  },
]

export const expertise: ExpertiseGroup[] = [
  {
    title: "Web Development",
    summary: "Front-end work from markup to interactive, responsive interfaces.",
    items: ["HTML", "CSS", "JavaScript", "React"],
  },
  {
    title: "Python Development",
    summary:
      "Building efficient, practical tools and automation in Python.",
    items: ["Python"],
  },
  {
    title: "Design & Visual",
    summary:
      "Technical and artistic work blended into the same projects: graphic design, video editing and color grading.",
    items: ["Photoshop", "Illustrator", "Graphic design", "Video editing", "Colorist"],
  },
]

export const achievements: NamedEntry[] = [
  {
    title: "[Achievement: add]",
    detail: "[Award, certification, competition result or academic accomplishment]",
  },
]

export const interests: NamedEntry[] = [
  { title: "Technology", detail: "A passion for technology and creativity." },
  { title: "Graphic design", detail: "Posters, banners and visual composition." },
  { title: "Video editing", detail: "Editing and color grading." },
  { title: "[Interest: add]", detail: "[Hobby, creative or personal interest]" },
]
