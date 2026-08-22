/**
 * Снимает все девять состояний и механически ищет дефекты вёрстки.
 *
 * Проверка глазами обязательна, но она пропускает то, что видно только по числам:
 * горизонтальный скролл, элемент за границей вьюпорта, контент под кнопкой действия.
 *
 * Запуск: node scripts/shots.mjs  (перед этим: npx vite preview --port 4173)
 */
import { chromium } from 'playwright'
import { mkdir } from 'node:fs/promises'

const BASE = process.env.BASE ?? 'http://localhost:4173/meat5/'
const OUT = '.review'
/** iPhone 14: самый ходовой размер, на котором это будут открывать. */
const VIEWPORT = { width: 390, height: 844 }

/** Состояние прогресса, при котором экран показывает свою основную фазу. */
const done = {
  intro_completed: true,
  video_1_completed: true,
  assistant_1_opened: true,
  video_2_completed: true,
  assistant_2_opened: true,
  quiz_completed: true,
  video_3_completed: true,
  result_site_opened: true,
}

const STATES = [
  ['1-city', { step: 'city' }],
  ['2-lab1', { step: 'lab1', ...done }],
  ['3-reward1', { step: 'reward1', ...done }],
  ['4-lab2', { step: 'lab2', ...done }],
  ['5-access', { step: 'access', ...done, quiz_completed: false }],
  ['6-lab3', { step: 'lab3', ...done }],
  ['7-bundle', { step: 'bundle', ...done, result_site_opened: false }],
  ['8-offer', { step: 'offer', ...done }],
  ['9-purchased', { step: 'purchased', ...done }],
]

await mkdir(OUT, { recursive: true })
const browser = await chromium.launch()
const problems = []

for (const [name, state] of STATES) {
  const context = await browser.newContext({ viewport: VIEWPORT, deviceScaleFactor: 2 })
  await context.addInitScript((s) => {
    localStorage.setItem('traffic-city-progress', JSON.stringify({ state: s, version: 1 }))
  }, { quiz_lives: 5, quiz_attempts: 0, missed: [], timestamps: {}, video_1_progress: 1, video_2_progress: 1, video_3_progress: 1, ...state })
  const page = await context.newPage()
  await page.goto(BASE, { waitUntil: 'networkidle' })
  // Сцены анимированы: даём кадру доиграть вход, иначе снимем полупрозрачное состояние.
  await page.waitForTimeout(1800)
  await page.screenshot({ path: `${OUT}/${name}.png`, fullPage: false })
  // Длинные экраны честно проверяем в самом низу: под кнопкой не должен остаться
  // запертым последний блок. В начале скролла контент под панелью — это норма.
  await page.evaluate(() => window.scrollTo({ top: document.body.scrollHeight }))
  await page.waitForTimeout(400)

  const found = await page.evaluate(() => {
    const out = []
    // Страж пустой страницы: без него сканер рапортует «дефектов нет» по белому
    // экрану, на котором просто нечего проверять. Так и случилось при первом прогоне.
    const root = document.getElementById('root')
    if (!root || root.childElementCount === 0 || document.body.innerText.trim().length < 10) {
      return ['ЭКРАН ПУСТОЙ: приложение не отрисовалось']
    }
    const vw = window.innerWidth
    const doc = document.scrollingElement
    if (doc && doc.scrollWidth > vw + 1) out.push(`горизонтальный скролл: ${doc.scrollWidth} > ${vw}`)

    const bar = document.querySelector('.fixed.inset-x-0.bottom-0')
    const barTop = bar ? bar.getBoundingClientRect().top : Infinity

    for (const el of document.querySelectorAll('h1, h2, p, button, li, figure, section')) {
      const r = el.getBoundingClientRect()
      if (r.width === 0 || r.height === 0) continue
      const text = (el.textContent ?? '').trim().slice(0, 42)
      if (r.right > vw + 1 || r.left < -1) out.push(`за краем экрана: «${text}» ${Math.round(r.left)}…${Math.round(r.right)}`)
      // Контент под панелью действия читается наполовину — это дефект, а не «почти видно».
      if (bar && !bar.contains(el) && r.top < barTop && r.bottom > barTop + 8 && r.height < 400)
        out.push(`заезжает под кнопку: «${text}»`)
      if (el.scrollHeight > el.clientHeight + 2 && getComputedStyle(el).overflow !== 'visible')
        out.push(`текст обрезан: «${text}»`)
    }
    return out
  })
  if (found.length) problems.push([name, found])
  await context.close()
}

await browser.close()

if (problems.length === 0) {
  console.log('Дефектов вёрстки не найдено на всех девяти состояниях.')
} else {
  for (const [name, list] of problems) {
    console.log(`\n${name}:`)
    for (const p of list) console.log('  ✗ ' + p)
  }
  process.exitCode = 1
}
