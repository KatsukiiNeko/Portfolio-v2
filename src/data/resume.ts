
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
    period: "2023-2026",
    title: "High school student",
    place: "An Khanh High school",
  },

  {
    period: "2026-2032",
    title: "College student",
    place: "Can Tho university — College of Information and Communication Technology CTU ",
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
    title: " Attend in city-level excellent student in Physics ",
    detail: "consolation prize",
  },
]

export const interests: NamedEntry[] = [
  { title: "Technology", detail: "A passion for technology and creativity." },
  { title: "Graphic design", detail: "Posters, banners and visual composition." },
  { title: "Video editing", detail: "Editing and color grading." },
]
