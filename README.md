# Portfolio v2

Personal portfolio for **Nguyen Phuong Minh Tan** (Katsukii Neko) — graphic design, Python and web development.

Rebuilt as a React + TypeScript single-page site. The previous vanilla HTML/CSS/JS implementation was
removed in this version; it remains available in git history.

## Stack

| Layer     | Choice                                     |
| --------- | ------------------------------------------ |
| UI        | React 19 + TypeScript                      |
| Build     | Vite 7                                     |
| Styling   | Tailwind CSS 4 (tokens in `src/index.css`) |
| Motion    | Motion for React                           |
| 3D        | Three.js (lazy-loaded hero scene)          |
| Email     | `@emailjs/browser`                         |

No router, no state library, no component kit. One page, eight sections.

## Getting started

```bash
npm install
npx playwright install chromium   # once, for the UI check
npm run dev                       # http://localhost:5173
```

| Command            | What it does                                        |
| ------------------ | --------------------------------------------------- |
| `npm run dev`      | Dev server with HMR                                 |
| `npm run build`    | `tsc --noEmit` then production build into `dist/`   |
| `npm run preview`  | Serves the production build                         |
| `npm run check:ui` | Headless browser acceptance checks (run `build` first) |

## Project structure

```bash
src/
├── App.tsx                 # section order + skip link
├── index.css               # design tokens, light/dark swap, base styles
├── main.tsx
├── components/
│   ├── Nav.tsx             # fixed nav, theme toggle, mobile menu, active section
│   ├── Section.tsx         # shared section shell (id, heading, intro)
│   ├── Hero.tsx            # name, roles, CTAs, lazy 3D scene
│   ├── About.tsx           # intro + metadata list
│   ├── Education.tsx       # timeline
│   ├── Expertise.tsx       # grouped fields, no percentage bars
│   ├── Experience.tsx      # project filters + grid + modal
│   ├── ProjectCard.tsx
│   ├── ProjectModal.tsx    # focus trap, Escape, scroll lock
│   ├── EntryList.tsx       # achievements / interests
│   ├── Contact.tsx         # EmailJS form with native validation
│   ├── Button.tsx
│   ├── Reveal.tsx          # whileInView entrance, honours reduced motion
│   └── Footer.tsx
├── data/
│   ├── profile.ts          # name, roles, location, intro, socials
│   ├── projects.ts         # the five real projects
│   └── resume.ts           # education, expertise, achievements, interests
└── three/
    └── HeroScene.tsx       # ported scene: dispose, DPR cap, off-screen pause
scripts/
└── ui-check.mjs            # the `npm run check:ui` checks
public/
└── assets/                 # icons + project images
```

## Editing content

All copy lives in `src/data/`. Nothing is fetched at runtime.

Bracketed values such as `[Date of birth: add]` are **placeholders** — the fact was never present in the
original site, so it was not invented. Replace or delete each one:

- `profile.dateOfBirth`
- `education[0].place` and `.period` (school name and dates)
- `achievements` (currently one placeholder entry)

Known facts (name, location, roles, intro, projects, socials) were carried over verbatim from the old site.

## Design tokens

`src/index.css` holds every color, font, radius and easing value. The theme is attribute-driven and
preserves the original contract: `<html data-theme="dark|light">` plus the `kn-theme` localStorage key.
Because every color resolves through a token, no `dark:` variants are needed.

- Display: Syne · Body: Instrument Sans · Metadata: system mono
- Single accent: `#814de5` (dark) / `#6a3bd4` (light), with a lighter `accent-text` variant so accent
  text clears WCAG AA on dark backgrounds
- Hairlines are decorative; form controls use `border-strong`, which clears WCAG 1.4.11 (3:1)

## Three.js

The hero scene is imported dynamically, so Three ships in its own chunk and never blocks first paint.
It caps device pixel ratio at 2, pauses when scrolled off screen, disposes geometry/materials/renderers
on unmount, reduces geometry on mobile, and degrades to a static gradient when WebGL is unavailable.
Animation respects `prefers-reduced-motion` (via `MotionConfig` and the scene's own media query).

## Checks

`npm run check:ui` starts `vite preview`, drives headless Chromium and asserts:

- no horizontal overflow and a clean console at 375 / 390 / 768 / 1024 / 1280 / 1440, at device pixel ratio 2
- a real phone profile (dpr 3, touch input): layout width matches the device, no text under 12px,
  canvas `touch-action: pan-y`, and a touch swipe over the hero canvas scrolling the page exactly
  like a control swipe over the heading
- a landscape phone (667x375): no overflow, every mobile-menu link reachable, hero within 1.75 screens
- no broken images or 4xx/5xx responses
- project modal opens, traps focus, closes on Escape
- category filtering, theme persistence, nav collapse breakpoints
- mobile touch targets >= 44px, skip link is the first tab stop

## Deployment

Static build — deploy `dist/` to Vercel, Netlify, GitHub Pages or Cloudflare Pages.

## License

MIT License. See `LICENSE` for details.

© 2026 Katsukii Neko. All rights reserved.
