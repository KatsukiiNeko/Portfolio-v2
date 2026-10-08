import { MotionConfig } from "motion/react"
import Nav from "./components/Nav"
import Hero from "./components/Hero"
import About from "./components/About"
import Education from "./components/Education"
import Expertise from "./components/Expertise"
import Experience from "./components/Experience"
import EntryList from "./components/EntryList"
import Contact from "./components/Contact"
import Section from "./components/Section"
import Footer from "./components/Footer"
import { achievements, interests } from "./data/resume"

export default function App() {
  return (
    <MotionConfig reducedMotion="user">
      <a
        href="#about"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[200] focus:rounded-control focus:bg-accent focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-white"
      >
        Skip to content
      </a>

      <Nav />

      <main id="top">
        <Hero />
        <About />
        <Education />
        <Expertise />
        <Experience />
        <Section id="achievements" title="Achievements">
          <EntryList entries={achievements} />
        </Section>
        <Section id="interests" title="Interests">
          <EntryList entries={interests} />
        </Section>
        <Contact />
      </main>

      <Footer />
    </MotionConfig>
  )
}
