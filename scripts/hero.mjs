/**
 * Проверяет ведущего на всех экранах, где он есть.
 *
 * Три раза подряд владелец возвращал одно и то же: «персонаж обрезан». Каждый
 * раз причина была разной — то маска растворяла низ, то фигура уезжала за
 * боковой край, то текстовая колонка ложилась ему на лицо. Ни сборка, ни
 * снимки, ни контраст этого не видят: макет формально корректен.
 *
 * Здесь три правила из DESIGN.md §8.8:
 *   1. фигура целиком в кадре по горизонтали — её не режет край экрана;
 *   2. низ уходит за нижнюю границу блока, а не обрывается посреди него
 *      (либо низ растворён сумерками поверх фигуры);
 *   3. НИЧЕГО не лежит на голове: полоса головы в исходнике — 3–25% высоты
 *      и 45–76% ширины, замерено по альфа-каналу обеих поз.
 *
 * Запуск: node scripts/hero.mjs  (перед этим: npx vite preview --port 4173)
 */
import { chromium } from 'playwright'

const BASE = process.env.BASE ?? 'http://localhost:4173/meat5/'
const PROGRESS_VERSION = 4
/** Три размера: правило зависит от ширины экрана, и ломается оно с краёв. */
const SIZES = [
  ['320×568 малый Android', 320, 568],
  ['390×844 iPhone 14', 390, 844],
  ['430×932 Pro Max', 430, 932],
]

/** Голова в исходнике: доля от размеров картинки (замер по альфе, оба файла). */
const HEAD = { top: 0.03, bottom: 0.25, left: 0.45, right: 0.76 }

const done = {
  intro_completed: true, city_completed: true, video_1_completed: true, assistant_1_opened: true,
  video_2_completed: true, assistant_2_opened: true, quiz_started: true, quiz_completed: true,
  video_3_completed: true, result_site_opened: true,
}

/** Экран, состояние, и — если фигура появляется по действию — что нажать. */
const STATES = [
  ['message', { step: 'message' }, ['[data-bottom-bar] button:not([disabled])']],
  ['reward1', { step: 'reward1', ...done, assistant_1_opened: false }],
  ['reward2', { step: 'reward2', ...done, assistant_2_opened: false }],
  ['offer', { step: 'offer', ...done }],
]

const browser = await chromium.launch()
const problems = []

for (const [label, width, height] of SIZES)
for (const [name, state, action] of STATES) {
  const context = await browser.newContext({ viewport: { width, height } })
  await context.addInitScript((s) => localStorage.setItem('traffic-city-progress', JSON.stringify(s)), {
    version: PROGRESS_VERSION,
    state: {
      quiz_lives: 5, quiz_attempts: 0, quiz_current_question: 0, quiz_wrong_topics: [],
      quiz_missed: [], review: null, created_at: Date.now(), updated_at: Date.now(),
      video_1_progress: 1, video_2_progress: 1, video_3_progress: 1, ...state,
    },
  })
  const page = await context.newPage()
  await page.goto(BASE, { waitUntil: 'networkidle' })
  await page.waitForTimeout(4200)
  for (const selector of action ?? []) {
    await page.locator(selector).first().click({ timeout: 15000 })
    await page.waitForTimeout(2600)
  }

  const found = await page.evaluate((HEAD) => {
    const out = []
    const img = [...document.querySelectorAll('img')].find((i) => i.src.includes('character'))
    if (!img) return ['ведущего нет на экране: проверять нечего']
    const b = img.getBoundingClientRect()

    if (b.left < -1 || b.right > innerWidth + 1)
      out.push(`фигуру режет край экрана: ${Math.round(b.left)}…${Math.round(b.right)} при ширине ${innerWidth}`)

    const head = {
      top: b.top + b.height * HEAD.top,
      bottom: b.top + b.height * HEAD.bottom,
      left: b.left + b.width * HEAD.left,
      right: b.left + b.width * HEAD.right,
    }
    for (const el of document.querySelectorAll('h1, h2, p, li, span, button')) {
      if (el.querySelector('h1, h2, p, li, button')) continue
      const text = (el.textContent ?? '').trim()
      if (!text) continue
      const q = el.getBoundingClientRect()
      if (q.width === 0 || q.height === 0) continue
      if (getComputedStyle(el).visibility === 'hidden') continue
      if (q.right < head.left || q.left > head.right || q.bottom < head.top || q.top > head.bottom) continue
      out.push(`на голове ведущего: «${text.slice(0, 34)}» ${Math.round(q.left)}…${Math.round(q.right)}`)
    }
    return out
  }, HEAD)

  if (found.length) problems.push([`${label} · ${name}`, found])
  await context.close()
}

await browser.close()

if (problems.length === 0) {
  console.log('Ведущий цел на всех экранах и размерах: край не режет, на голове ничего не лежит.')
} else {
  for (const [name, list] of problems) {
    console.log(`\n${name}:`)
    for (const p of [...new Set(list)]) console.log('  ✗ ' + p)
  }
  process.exitCode = 1
}
