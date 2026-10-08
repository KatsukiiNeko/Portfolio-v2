import { chromium } from "playwright"
import { spawn } from "node:child_process"
import { fileURLToPath } from "node:url"
import { setTimeout as sleep } from "node:timers/promises"

const PORT = 4173
const BASE = `http://localhost:${PORT}/`
const WIDTHS = [375, 390, 768, 1024, 1280, 1440]

const server = spawn("npm", ["run", "preview"], {
  stdio: "ignore",
  detached: true,
  shell: true, 
  cwd: fileURLToPath(new URL("..", import.meta.url)), 
})

const checks = []
const check = (name, ok, detail = "") => {
  checks.push({ name, ok, detail })
  console.log(`${ok ? "ok  " : "FAIL"}  ${name}${detail ? `  ${detail}` : ""}`)
}

for (let i = 0; i < 50; i++) {
  try {
    if ((await fetch(BASE)).ok) break
  } catch {
  }
  await sleep(200)
}

const browser = await chromium.launch()

try {
  for (const width of WIDTHS) {
    const page = await browser.newPage({ viewport: { width, height: 900 }, deviceScaleFactor: 2 })
    const errors = []
    page.on("console", m => m.type() === "error" && errors.push(m.text()))
    page.on("pageerror", e => errors.push(String(e)))
    await page.goto(BASE, { waitUntil: "networkidle" })
    await page.waitForTimeout(400)

    const m = await page.evaluate(() => ({
      overflow: document.documentElement.scrollWidth - innerWidth,
      h2: document.querySelectorAll("h2").length,
      header: Math.round(document.querySelector("header").getBoundingClientRect().height),
    }))

    check(
      `@${width} no horizontal overflow`,
      m.overflow <= 1,
      `overflow=${m.overflow}`,
    )
    check(`@${width} 7 section headings`, m.h2 === 7, `h2=${m.h2}`)
    check(`@${width} nav stays one line`, m.header <= 80, `h=${m.header}px`)
    check(`@${width} console clean`, errors.length === 0, errors.join(" | "))
    await page.close()
  }

  {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
    const bad = []
    page.on("response", r => r.status() >= 400 && bad.push(`${r.status()} ${r.url()}`))
    await page.goto(BASE, { waitUntil: "networkidle" })
    await page.evaluate(async () => {
      scrollTo({ top: document.body.scrollHeight, behavior: "instant" })
      await new Promise(r => setTimeout(r, 500)) 
    })

    const imgs = await page.evaluate(() =>
      [...document.images].map(i => ({ ok: i.complete && i.naturalWidth > 0, src: i.currentSrc })),
    )
    check("all images decode", imgs.every(i => i.ok), JSON.stringify(imgs.filter(i => !i.ok)))
    check("no 4xx/5xx responses", bad.length === 0, bad.join(", "))

    const cols = await page.evaluate(
      () =>
        getComputedStyle(document.querySelector("#experience .grid")).gridTemplateColumns.split(" ")
          .length,
    )
    check("project grid is 3-up at 1440", cols === 3, `cols=${cols}`)

    await page.click('button[aria-label="Switch to light theme"]')
    await page.waitForTimeout(300)
    const theme = await page.evaluate(() => ({
      attr: document.documentElement.dataset.theme,
      stored: localStorage.getItem("kn-theme"),
      bg: getComputedStyle(document.body).backgroundColor,
    }))
    check(
      "theme toggle persists",
      theme.attr === "light" && theme.stored === "light" && theme.bg === "rgb(245, 244, 248)",
      JSON.stringify(theme),
    )
    await page.close()
  }

  {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
    await page.goto(BASE, { waitUntil: "networkidle" })

    const firstCard = page.locator('button[aria-label^="Open details"]').first()
    await firstCard.click()
    await page.waitForTimeout(400)
    const opened = await page.isVisible('[role="dialog"]')
    const focused = await page.evaluate(() => !!document.activeElement?.closest('[role="dialog"]'))
    await page.keyboard.press("Escape")
    await page.waitForTimeout(400)
    const closed = !(await page.isVisible('[role="dialog"]'))
    check("modal opens", opened)
    check("modal traps focus", focused)
    check("modal closes on Escape", closed)

    const total = await page.locator("article").count()
    await page.locator('[aria-label="Filter projects"] button').nth(1).click()
    await page.waitForTimeout(500)
    const filtered = await page.locator("article").count()
    check(
      "category filter narrows the grid",
      filtered >= 1 && filtered < total,
      `${filtered}/${total} cards`,
    )
    await page.close()
  }

  for (const [width, expectMenu] of [
    [768, false],
    [1024, true],
  ]) {
    const page = await browser.newPage({ viewport: { width, height: 900 } })
    await page.goto(BASE, { waitUntil: "networkidle" })
    const menu = await page.locator("header ul").first().isVisible()
    const burger = await page
      .locator('button[aria-label="Toggle navigation menu"]')
      .isVisible()
    check(`@${width} nav collapses correctly`, menu === expectMenu && burger !== expectMenu)
    await page.close()
  }

  {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 } })
    await page.goto(BASE, { waitUntil: "networkidle" })
    const small = await page.evaluate(() =>
      [...document.querySelectorAll("button, a[href]")]
        .filter(e => e.offsetParent !== null && !e.classList.contains("sr-only"))
        .map(e => {
          const r = e.getBoundingClientRect()
          return {
            t: (e.textContent || e.ariaLabel || "").trim().slice(0, 20),
            w: Math.round(r.width),
            h: Math.round(r.height),
          }
        })
        .filter(x => x.w < 44 || x.h < 44),
    )
    check("mobile targets >= 44px", small.length === 0, JSON.stringify(small))
    await page.close()
  }

  {
    const page = await browser.newPage({
      viewport: { width: 390, height: 844 },
      isMobile: true,
      hasTouch: true,
      deviceScaleFactor: 3,
    })
    await page.goto(BASE, { waitUntil: "networkidle" })
    await page.waitForTimeout(500)

    const layout = await page.evaluate(() => {
      const canvas = document.querySelector("canvas")
      const tiny = [...document.querySelectorAll("p, li, span, a, dd, dt, h3, label")]
        .filter(e => e.offsetParent !== null && e.textContent.trim())
        .map(e => ({ t: e.textContent.trim().slice(0, 20), s: parseFloat(getComputedStyle(e).fontSize) }))
        .filter(x => x.s < 12)
      return {
        overflow: document.documentElement.scrollWidth - innerWidth,
        layoutW: innerWidth,
        tiny,
        touchAction: canvas ? getComputedStyle(canvas).touchAction : "none",
      }
    })
    check(
      "phone @dpr3 no horizontal overflow",
      layout.overflow <= 1,
      `overflow=${layout.overflow}, layoutWidth=${layout.layoutW}`,
    )
    check("phone: no text under 12px", layout.tiny.length === 0, JSON.stringify(layout.tiny.slice(0, 5)))
    check("phone: canvas allows vertical pan", layout.touchAction === "pan-y", layout.touchAction)

    const cdp = await page.context().newCDPSession(page)
    const swipe = async el => {
      await page.evaluate(() => scrollTo({ top: 0, behavior: "instant" }))
      await page.waitForTimeout(300)
      const start = await page.evaluate(() => scrollY)
      const x = el.x + el.width / 2
      const y = el.y + el.height / 2
      await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x, y }] })
      for (let i = 1; i <= 8; i++) {
        await cdp.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x, y: y - i * 25 }] })
        await new Promise(r => setTimeout(r, 25))
      }
      await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] })
      await page.waitForTimeout(600)
      return Math.abs((await page.evaluate(() => scrollY)) - start)
    }
    const control = await swipe(await page.locator("#hero h1").boundingBox())
    const overCanvas = await swipe(await page.locator("canvas").boundingBox())
    check(
      "phone: swipe over canvas scrolls the page",
      control >= 40 && overCanvas >= control * 0.6,
      `canvas=${overCanvas}px vs control=${control}px`,
    )
    await page.close()
  }

  {
    const page = await browser.newPage({
      viewport: { width: 667, height: 375 },
      isMobile: true,
      hasTouch: true,
      deviceScaleFactor: 3,
    })
    await page.goto(BASE, { waitUntil: "networkidle" })
    await page.waitForTimeout(500)

    const geo = await page.evaluate(() => ({
      vh: innerHeight,
      overflow: document.documentElement.scrollWidth - innerWidth,
      hero: Math.round(document.getElementById("hero").getBoundingClientRect().height),
    }))
    check("landscape: no horizontal overflow", geo.overflow <= 1, `overflow=${geo.overflow}`)
    check("landscape: hero within 1.75 screens", geo.hero <= geo.vh * 1.75, `${geo.hero}/${geo.vh}px`)

    await page.click('button[aria-label="Toggle navigation menu"]')
    await page.waitForTimeout(300)
    const menu = await page.evaluate(() => {
      const el = document.getElementById("mobile-menu")
      const r = el.getBoundingClientRect()
      return { open: !el.hidden && r.height > 0, bottom: Math.round(r.bottom), vh: innerHeight }
    })
    check(
      "landscape: every menu link reachable",
      menu.open && menu.bottom <= menu.vh + 1,
      `bottom=${menu.bottom} vh=${menu.vh}`,
    )
    await page.close()
  }

  {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
    await page.goto(BASE, { waitUntil: "networkidle" })
    await page.keyboard.press("Tab")
    const first = await page.evaluate(() => ({
      text: document.activeElement?.textContent?.trim(),
      visible: document.activeElement?.getBoundingClientRect().top >= 0,
    }))
    check(
      "skip link is the first tab stop",
      first.text === "Skip to content" && first.visible,
      JSON.stringify(first),
    )
    await page.close()
  }
} finally {
  await browser.close()
  try {
    process.kill(-server.pid, "SIGTERM")
  } catch {
  }
}

const failed = checks.filter(c => !c.ok)
console.log(`\n${checks.length - failed.length}/${checks.length} checks passed`)
process.exit(failed.length ? 1 : 0)
