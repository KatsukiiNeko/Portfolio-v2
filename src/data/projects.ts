export type ProjectCategory = "design" | "web" | "python" | "javascript"

export interface Project {
  id: number
  title: string
  category: ProjectCategory
  image?: string
  tags: string[]
  description: string
  liveUrl?: string
  githubUrl?: string
}

export const projects: Project[] = [
  {
    id: 1,
    title: "Anime Banner Design — Kaoruko Waguri",
    category: "design",
    image: "/assets/images/Kaoru.webp",
    tags: ["Anime", "Photoshop", "Illustrator"],
    description:
      "Custom anime banner with vibrant artwork and dynamic character illustrations.",
  },
  {
    id: 2,
    title: "Anime Banner Design — Shiina Mahiru",
    category: "design",
    image: "/assets/images/shiina.webp",
    tags: ["Anime", "Illustrator", "Banner"],
    description:
      "Stylized banner design with editorial composition and bold type.",
  },
  {
    id: 3,
    title: "Portfolio Website",
    category: "web",
    image: "/assets/images/web.png",
    tags: ["HTML", "CSS", "JavaScript"],
    description:
      "Responsive personal portfolio with Three.js hero, dark mode, and project filtering.",
    liveUrl: "https://portfolio-umber-omega-rpj2m7tiqj.vercel.app/",
    githubUrl: "https://github.com/KatsukiiNeko/",
  },
  {
    id: 4,
    title: " Basalt",
    category: "web",
    image: "/assets/images/basalt.webp",
    tags: ["web", "react", "DB"],
    description:
      "Basalt is a clean recode of the Money Vault financial tracker. This fork strips out unnecessary complexity, reorganizes the logic, and prioritizes readable, well-structured code that's easy to follow and modify. ",
    githubUrl: "https://github.com/KatsukiiNeko/Personal-financial-managment",
    liveUrl: "https://basalt-finance.vercel.app/",
  },
  {
    id: 5,
    title: "Wallpapper Anime Design — umi Asanagi",
    category: "design",
    image: "/assets/images/Umi_Asanagi.webp",
    tags: ["Photoshop", "Illustrator", "Banner"],
    description:
      "Personal fan art exploring anime poster design. The project focuses on composition, color harmony, and visual hierarchy using layered character renders, graphic elements, and a sky-inspired theme.",
  },
]
