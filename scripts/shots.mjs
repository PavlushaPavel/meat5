/**
 * Снимает все одиннадцать состояний и механически ищет дефекты вёрстки.
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

/** Состояние прогресса, при котором экран показывает свою основную фазу (SPEC.md §32). */
const done = {
  intro_completed: true,
  city_completed: true,
  video_1_completed: true,
  assistant_1_opened: true,
  video_2_completed: true,
  assistant_2_opened: true,
  quiz_started: true,
  quiz_completed: true,
  video_3_completed: true,
  result_site_opened: true,
}

/**
 * Сообщение снимаем дважды: карточка до нажатия и пролёт по городу во время реплики.
 * Действие — список селекторов: часть состояний состоит из нескольких фаз подряд,
 * и до нужного кадра надо дойти теми же кнопками, что нажимает человек.
 */
const LISTEN = ['button:has-text("Прослушать сообщение")']

const STATES = [
  ['1-message', { step: 'message' }],
  ['1b-message-voice', { step: 'message' }, LISTEN],
  ['2-city', { step: 'city', ...done }],
  ['3-lab1-bridge', { step: 'lab1', ...done, video_1_completed: false }],
  ['3b-lab1-video', { step: 'lab1', ...done }],
  ['4-reward1', { step: 'reward1', ...done, assistant_1_opened: false }],
  ['5-lab2-bridge', { step: 'lab2', ...done, video_2_completed: false }],
  ['5b-lab2-video', { step: 'lab2', ...done }],
  ['6-reward2', { step: 'reward2', ...done, assistant_2_opened: false }],
  ['7-access-barrier', { step: 'access', ...done, quiz_completed: false, quiz_started: false }],
  ['7b-access-door', { step: 'access', ...done, quiz_completed: false, quiz_started: false }, ['button:has-text("Дальше")', 'button:has-text("Дальше")']],
  ['7c-quiz', { step: 'access', ...done, quiz_completed: false, quiz_started: true }],
  ['8-lab3-bridge', { step: 'lab3', ...done, video_3_completed: false }],
  ['8b-lab3-video', { step: 'lab3', ...done }],
  ['9-bundle-assemble', { step: 'bundle', ...done, result_site_opened: false }],
  ['9b-bundle-payoff', { step: 'bundle', ...done }],
  ['10-offer', { step: 'offer', ...done }],
  ['11-purchased', { step: 'purchased', ...done, purchased: true }],
]

await mkdir(OUT, { recursive: true })
const browser = await chromium.launch()
const problems = []

for (const [name, state, action] of STATES) {
  const context = await browser.newContext({ viewport: VIEWPORT, deviceScaleFactor: 2 })
  await context.addInitScript((s) => {
    localStorage.setItem('traffic-city-progress', JSON.stringify({ state: s, version: 2 }))
  }, {
    quiz_lives: 5,
    quiz_attempts: 0,
    quiz_current_question: 0,
    quiz_wrong_topics: [],
    quiz_missed: [],
    review: null,
    created_at: Date.now(),
    updated_at: Date.now(),
    video_1_progress: 1,
    video_2_progress: 1,
    video_3_progress: 1,
    ...state,
  })
  const page = await context.newPage()
  await page.goto(BASE, { waitUntil: 'networkidle' })
  // Сцены анимированы: даём кадру доиграть вход, иначе снимем полупрозрачное состояние.
  // Сцены раскрываются волной: снимок раньше времени поймает полупрозрачное
  // промежуточное состояние, а не кадр, который увидит человек.
  await page.waitForTimeout(4200)
  for (const selector of action ?? []) {
    // Фазы раскрываются анимацией: кнопка появляется не сразу и сначала выключена.
    const button = page.locator(selector).first()
    await button.waitFor({ state: 'visible', timeout: 15000 })
    await button.click({ timeout: 15000 })
    await page.waitForTimeout(2200)
  }
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

    const bar = document.querySelector('[data-bottom-bar]')
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
  console.log('Дефектов вёрстки не найдено на всех одиннадцати состояниях.')
} else {
  for (const [name, list] of problems) {
    console.log(`\n${name}:`)
    for (const p of list) console.log('  ✗ ' + p)
  }
  process.exitCode = 1
}
