/**
 * Проход всей воронки кликами, как её проходит человек.
 *
 * Остальные проверки смотрят на состояния по отдельности, подставляя прогресс
 * в localStorage. Это удобно, но лживо: так не видно, доходит ли человек из
 * первого состояния в последнее НА САМОМ ДЕЛЕ. Критерий готовности из ТЗ §45
 * звучит именно так — «пользователь может полностью пройти маршрут».
 *
 * Скрипт нажимает то же, что нажал бы человек: главную кнопку внизу, play
 * внутри видео, вариант ответа в тесте. И печатает, что видно на каждом шаге —
 * по этому списку сразу видно, не пропал ли мост и не встал ли маршрут.
 *
 * Запуск: node scripts/walk.mjs
 * На живой версии: BASE=https://pavlushapavel.github.io/meat5/ node scripts/walk.mjs
 */
import { chromium } from 'playwright'
import { mkdir, readFile } from 'node:fs/promises'

/**
 * Ключ к тесту берём из того же файла, который читает приложение.
 *
 * Скрипт проверяет проходимость маршрута, а не сдаёт экзамен: перебором
 * двенадцати вопросов он не прошёл бы никогда, и до оффера мы бы не добрались.
 * Путь «ошибся → пересмотрел момент → пересдал» проверяется отдельно.
 */
const quizSource = await readFile(new URL('../src/content/quiz.ts', import.meta.url), 'utf8')
const ANSWERS = [...quizSource.matchAll(/^\s*correct:\s*(\d)/gm)].map((m) => Number(m[1]))

const BASE = process.env.BASE ?? 'http://localhost:4173/meat5/'
const OUT = '.review/walk'
/** Максимум шагов. Запас на провал теста и пересдачу: маршрут длиннее — значит он зациклился. */
const LIMIT = 140
/** Сцены раскрываются волной: снимаем и читаем экран, когда он доигран. */
const SETTLE = 5200

await mkdir(OUT, { recursive: true })
const browser = await chromium.launch()
const context = await browser.newContext({ viewport: { width: 390, height: 844 } })
const page = await context.newPage()
await page.goto(BASE, { waitUntil: 'networkidle' })

const seen = []
/** Сколько раз уже видели этот экран: по этому счётчику перебираем варианты. */
const tries = new Map()
let stuck = null

for (let i = 1; i <= LIMIT; i++) {
  await page.waitForTimeout(SETTLE)

  const step = await page.evaluate(() => {
    try {
      return JSON.parse(localStorage.getItem('traffic-city-progress')).state.step
    } catch {
      return 'старт'
    }
  })
  const text = (await page.evaluate(() => document.body.innerText)).replace(/\n+/g, ' | ')
  const lives = await page.evaluate(() => {
    try {
      return JSON.parse(localStorage.getItem('traffic-city-progress')).state.quiz_lives
    } catch {
      return '?'
    }
  })
  console.log(`${String(i).padStart(2, '0')} [${step}|${lives}] ${text.slice(0, 130)}`)
  await page.screenshot({ path: `${OUT}/${String(i).padStart(2, '0')}-${step}.png` })
  seen.push(step)

  if (step === 'purchased') {
    console.log('\nМаршрут пройден целиком: от входящего сообщения до доступа.')
    break
  }

  // Один и тот же экран, увиденный дважды, значит прошлый выбор никуда не привёл.
  // Тогда пробуем другое: другой вариант ответа в тесте, другую кнопку на панели.
  // Без этого обход зацикливается там же, где зациклился бы живой человек.
  const signature = `${step}|${text.slice(0, 80)}`
  const seenBefore = tries.get(signature) ?? 0
  tries.set(signature, seenBefore + 1)

  const options = page.locator('main button:not([disabled])')
  const barButtons = page.locator('[data-bottom-bar] button:not([disabled])')
  const play = page.locator('button[aria-label^="Смотреть"]').first()

  let moved = false

  // Вопрос теста: варианты перебираются, а не выбирается вечно первый — иначе
  // маршрут не проверить дальше допуска.
  const question = text.match(/ВОПРОС (\d+) \/ \d+/)
  if (question) {
    // Варианты после ответа остаются на экране и остаются кликабельными, поэтому
    // «ответить» и «идти дальше» различаем по нижней панели: пока ответа нет,
    // кнопка «Дальше» выключена и панель пуста.
    const answered = (await barButtons.count()) > 0
    const right = ANSWERS[Number(question[1]) - 1]
    if (!answered && right !== undefined && (await options.count()) > right) {
      await options.nth(right).click({ timeout: 6000 }).catch(() => {})
      moved = true
    }
  }

  if (!moved) {
    try {
      await play.waitFor({ state: 'visible', timeout: 1500 })
      await play.click({ timeout: 6000 })
      moved = true
    } catch {
      /* видео на этом экране нет */
    }
  }

  if (!moved) {
    try {
      await barButtons.first().waitFor({ state: 'visible', timeout: 20000 })
      const count = await barButtons.count()
      // На повторе берём соседнюю кнопку: на экране провала это «попробовать
      // ещё раз» вместо «добрать базу», и обход выходит из круга.
      await barButtons.nth(Math.min(seenBefore, count - 1)).click({ timeout: 6000 })
      moved = true
    } catch {
      /* активной кнопки нет */
    }
  }

  if (!moved) {
    try {
      await options.first().waitFor({ state: 'visible', timeout: 1500 })
      await options.first().click({ timeout: 6000 })
      moved = true
    } catch {
      /* нажимать нечего */
    }
  }

  if (!moved) {
    stuck = step
    break
  }
}

await browser.close()

if (stuck) {
  console.log(`\nМАРШРУТ ВСТАЛ на состоянии «${stuck}»: нажимать нечего.`)
  process.exitCode = 1
} else if (!seen.includes('purchased')) {
  console.log(`\nМаршрут не дошёл до конца за ${LIMIT} шагов. Последнее состояние: ${seen.at(-1)}.`)
  process.exitCode = 1
}
