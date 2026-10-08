export interface Social {
  label: string
  href: string
  icon: string
}

export const profile = {
  displayName: "Katsukii Neko",
  fullName: "Nguyen Phuong Minh Tan",
  roles: ["Graphic Design", "Python Development", "Web Development"],
  location: "Vietnam",
  dateOfBirth: "14/10/2008",
  intro:
    "My name is Nguyen Phuong Minh Tan, and I am a high school student from Vietnam with a passion for technology and creativity. As a junior Python and web developer, I create efficient and innovative solutions. I also have experience as a graphic designer, video editor, and colorist, blending technical and artistic skills into my projects.",
  socials: [
    {
      label: "LinkedIn",
      href: "https://www.linkedin.com/in/katsukii-neko-undefined-7a38a040b/",
      icon: "fab fa-linkedin-in",
    },
    {
      label: "GitHub",
      href: "https://github.com/KatsukiiNeko",
      icon: "fab fa-github",
    },
    {
      label: "Twitter",
      href: "https://x.com/tatsuya_ng?s=21",
      icon: "fab fa-twitter",
    },
  ] satisfies Social[],
}
