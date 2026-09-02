/**
 * Проверка на реальных размерах телефонов и в условиях Telegram.
 *
 * Mini App открывают не в браузере на 390px: снизу чат, сверху шапка клиента,
 * а на маленьких Android-экранах ширина уходит до 320. Здесь оба случая:
 * несколько ширин и эмуляция Telegram с его собственными безопасными зонами.
 *
 * Запуск: node scripts/devices.mjs
 */
import { chromium } from 'playwright'
import { mkdir } from 'node:fs/promises'

const BASE = process.env.BASE ?? 'http://localhost:4173/meat5/'
/**
 * Версия схемы прогресса. ОБЯЗАНА совпадать с persist в store/progress.ts:
 * при несовпадении сохранённое состояние отбрасывается миграцией, и проверка
 * молча смотрит не на тот экран, а на первый.
 */
const PROGRESS_VERSION = 4

const OUT = '.review/devices'

/** Ходовые размеры: маленький Android, iPhone SE/13 mini, iPhone 14, Pro Max. */
const SIZES = [
  ['320×568 малый Android', 320, 568],
  ['360×640 бюджетный', 360, 640],
  ['375×667 SE', 375, 667],
  ['390×844 iPhone 14', 390, 844],
  ['430×932 Pro Max', 430, 932],
]

const done = {
  intro_completed: true, city_completed: true, video_1_completed: true, assistant_1_opened: true,
  video_2_completed: true, assistant_2_opened: true, quiz_started: true, quiz_completed: true,
  video_3_completed: true, result_site_opened: true,
}
const STATES = [
  ['message', { step: 'message' }],
  ['city', { step: 'city', ...done }],
  ['lab1', { step: 'lab1', ...done, video_1_completed: false }],
  ['reward1', { step: 'reward1', ...done, assistant_1_opened: false }],
  ['lab2', { step: 'lab2', ...done }],
  // Третий такт моста — самый плотный экран воронки по количеству текста.
  ['lab2-cases', { step: 'lab2', ...done, video_2_completed: false }, ['button:has-text("Дальше")', 'button:has-text("Дальше")']],
  ['reward2', { step: 'reward2', ...done, assistant_2_opened: false }],
  ['access', { step: 'access', ...done, quiz_completed: false, quiz_started: false }],
  ['lab3', { step: 'lab3', ...done }],
  ['bundle', { step: 'bundle', ...done, result_site_opened: false }],
  // Слои и переход к офферу — фазы того же состояния, до них надо дойти кнопкой.
  ['bundle-meta', { step: 'bundle', ...done }, ['button:has-text("Дальше")']],
  ['bundle-to-offer', { step: 'bundle', ...done, meta_reveal_completed: true }],
  ['offer', { step: 'offer', ...done }],
  ['purchased', { step: 'purchased', ...done, purchased: true }],
]

/**
 * Эмуляция Telegram. Клиент отдаёт свою высоту (снизу чат) и собственные
 * безопасные зоны: env(safe-area-inset-*) внутри вебвью часто равен нулю,
 * поэтому полагаться только на него нельзя.
 */
const TELEGRAM_STUB = (vh, saTop, saBottom) => `
  window.Telegram = { WebApp: {
    ready(){}, expand(){}, disableVerticalSwipes(){},
    setHeaderColor(){}, setBackgroundColor(){}, openLink(u){}, openTelegramLink(u){},
    viewportStableHeight: ${vh}, viewportHeight: ${vh},
    initDataUnsafe: { user: { id: 1, first_name: 'Test' } },
    safeAreaInset: { top: ${saTop}, bottom: ${saBottom}, left: 0, right: 0 },
    contentSafeAreaInset: { top: ${saTop}, bottom: 0, left: 0, right: 0 },
    onEvent(){}, offEvent(){},
    BackButton: { show(){}, hide(){}, onClick(){}, offClick(){} },
    HapticFeedback: { impactOccurred(){}, notificationOccurred(){}, selectionChanged(){} },
  }}
`

async function audit(page, label, vh, insets) {
  return page.evaluate(
    ({ vh, insets }) => {
      const out = []
      const vw = window.innerWidth
      const doc = document.scrollingElement
      if (doc && doc.scrollWidth > vw + 1) out.push(`горизонтальный скролл ${doc.scrollWidth} > ${vw}`)

      const bar = document.querySelector('[data-bottom-bar]')
      if (bar) {
        const b = bar.getBoundingClientRect()
        // Панель действия обязана оставаться выше домашней полосы и чата Telegram.
        if (vh && b.bottom > vh + 1) out.push(`кнопка уходит под зону клиента: низ ${Math.round(b.bottom)} > ${vh}`)
        if (insets.bottom && b.bottom > window.innerHeight - insets.bottom + 1)
          out.push(`кнопка заходит в нижнюю безопасную зону (${insets.bottom}px)`)
      }

      for (const el of document.querySelectorAll('h1, h2, p, li, button, figure')) {
        const r = el.getBoundingClientRect()
        if (r.width === 0 || r.height === 0) continue
        const text = (el.textContent ?? '').trim().slice(0, 32)
        if (r.right > vw + 1 || r.left < -1) out.push(`за краем: «${text}» ${Math.round(r.left)}…${Math.round(r.right)}`)
        // Верхняя безопасная зона: под шапкой клиента не должно быть контента.
        if (insets.top && r.top < insets.top - 1 && r.height < 400 && text)
          out.push(`под шапкой клиента: «${text}» top=${Math.round(r.top)} < ${insets.top}`)
      }

      // Пальцевые цели: всё, по чему нажимают, — не меньше 44px.
      for (const el of document.querySelectorAll('button, a[href]')) {
        const r = el.getBoundingClientRect()
        if (r.width === 0) continue
        if (r.height < 44 || r.width < 44)
          out.push(`мелкая цель ${Math.round(r.width)}×${Math.round(r.height)}: «${(el.getAttribute('aria-label') || el.textContent || '').trim().slice(0, 24)}»`)
      }
      return out
    },
    { vh, insets },
  )
}

await mkdir(OUT, { recursive: true })
const browser = await chromium.launch()
let problems = 0

console.log('РАЗМЕРЫ ЭКРАНОВ')
for (const [label, w, h] of SIZES) {
  const found = []
  for (const [name, state, action] of STATES) {
    const ctx = await browser.newContext({ viewport: { width: w, height: h } })
    await ctx.addInitScript(
      (s) => localStorage.setItem('traffic-city-progress', JSON.stringify(s)),
      {
        // Версия — аргументом: внутри страницы внешних констант не существует.
        version: PROGRESS_VERSION,
        state: {
          quiz_lives: 5,
          quiz_attempts: 0,
          quiz_current_question: 0,
          quiz_wrong_topics: [],
          quiz_missed: [],
          review: null,
          created_at: Date.now(),
          updated_at: Date.now(),
          ...state,
        },
      },
    )
    const page = await ctx.newPage()
    await page.goto(BASE, { waitUntil: 'networkidle' })
    await page.waitForTimeout(1200)
    for (const selector of action ?? []) {
      await page.locator(selector).first().click({ timeout: 15000 })
      await page.waitForTimeout(1600)
    }
    const list = await audit(page, name, 0, { top: 0, bottom: 0 })
    if (list.length) found.push([name, list])
    if (w === 320 && name === 'access') await page.screenshot({ path: `${OUT}/320-access.png` })
    await ctx.close()
  }
  console.log(`\n  ${label}`)
  if (!found.length) console.log('    чисто')
  for (const [name, list] of found) {
    problems += list.length
    for (const p of [...new Set(list)]) console.log(`    ✗ ${name}: ${p}`)
  }
}

console.log('\nTELEGRAM: высота клиента 640 из 844, шапка 56, домашняя полоса 34')
for (const [name, state, action] of STATES) {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } })
  // Настоящий telegram-web-app.js из index.html перезаписывает window.Telegram
  // своим объектом и рапортует размеры браузера — эмуляцию он бы просто стёр.
  await ctx.route('**/telegram-web-app.js', (route) => route.abort())
  await ctx.addInitScript(TELEGRAM_STUB(640, 56, 34))
  await ctx.addInitScript(
    (s) => localStorage.setItem('traffic-city-progress', JSON.stringify(s)),
    {
      // Обёртка {version, state} обязательна: zustand не понимает плоский
      // объект и молча его выбрасывает. Здесь она когда-то потерялась — и весь
      // телеграм-раздел проверял один и тот же первый экран, рапортуя «чисто».
      version: PROGRESS_VERSION,
      state: {
        quiz_lives: 5,
        quiz_attempts: 0,
        quiz_current_question: 0,
        quiz_wrong_topics: [],
        quiz_missed: [],
        review: null,
        created_at: Date.now(),
        updated_at: Date.now(),
        ...state,
      },
    },
  )
  const page = await ctx.newPage()
  await page.goto(BASE, { waitUntil: 'networkidle' })
  await page.waitForTimeout(1200)
  for (const selector of action ?? []) {
    await page.locator(selector).first().click({ timeout: 15000 })
    await page.waitForTimeout(1600)
  }
  const list = await audit(page, name, 640, { top: 56, bottom: 34 })
  if (list.length) {
    problems += list.length
    for (const p of [...new Set(list)]) console.log(`  ✗ ${name}: ${p}`)
  }
  if (name === 'city' || name === 'offer') await page.screenshot({ path: `${OUT}/tg-${name}.png` })
  await ctx.close()
}

await browser.close()
console.log(problems ? `\nНайдено проблем: ${problems}` : '\nПроблем адаптации не найдено.')
if (problems) process.exitCode = 1
