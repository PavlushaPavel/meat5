/**
 * Измеритель читаемости текста поверх фотографии.
 *
 * Глазами «плохо читается» — это мнение. Здесь считается число: берём рамку
 * каждого текстового блока, прячем сам текст, снимаем чистый фон под ним и
 * считаем контраст по WCAG между цветом текста и тем, что реально под ним.
 *
 * Порог: 4.5:1 для основного текста, 3:1 для крупного (≥24px или ≥19px жирного).
 *
 * Запуск: node scripts/contrast.mjs [состояние ...]
 */
import { chromium } from 'playwright'
import { mkdir } from 'node:fs/promises'
import sharp from 'sharp'

const BASE = process.env.BASE ?? 'http://localhost:4173/meat5/'
/**
 * Версия схемы прогресса. ОБЯЗАНА совпадать с persist в store/progress.ts:
 * при несовпадении сохранённое состояние отбрасывается миграцией, и проверка
 * молча смотрит не на тот экран, а на первый.
 */
const PROGRESS_VERSION = 4

const OUT = '.review'
const VIEWPORT = { width: 390, height: 844 }

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

/** Каждая фаза экрана мерится отдельно: текст на них лежит на разных кадрах. */
const BAR = '[data-bottom-bar] button:not([disabled])'
const PLAY = BAR
const STATES = {
  '1-message': [{ step: 'message' }],
  '1b-message-voice': [{ step: 'message' }, PLAY],
  '2-city': [{ step: 'city', ...done }],
  '3-lab1-bridge': [{ step: 'lab1', ...done, video_1_completed: false }],
  '3b-lab1-video': [{ step: 'lab1', ...done }],
  '4-reward1': [{ step: 'reward1', ...done, assistant_1_opened: false }],
  '5-lab2-bridge': [{ step: 'lab2', ...done, video_2_completed: false }],
  '5b-lab2-video': [{ step: 'lab2', ...done }],
  '6-reward2': [{ step: 'reward2', ...done, assistant_2_opened: false }],
  '7-access-barrier': [{ step: 'access', ...done, quiz_completed: false, quiz_started: false }],
  // До двери — два нажатия подряд, как у человека; сам тест засеваем флагом.
  '7b-access-door': [{ step: 'access', ...done, quiz_completed: false, quiz_started: false }, [BAR, BAR]],
  '7c-quiz': [{ step: 'access', ...done, quiz_completed: false, quiz_started: true }],
  '8-lab3-bridge': [{ step: 'lab3', ...done, video_3_completed: false }],
  '8b-lab3-video': [{ step: 'lab3', ...done }],
  '9-bundle-assemble': [{ step: 'bundle', ...done, result_site_opened: false }],
  '9b-bundle-payoff': [{ step: 'bundle', ...done }],
  // Слои и переход к офферу — тоже отдельные кадры одного состояния: текст на
  // них лежит на другой подложке, и мерить его надо отдельно.
  '9c-bundle-meta': [{ step: 'bundle', ...done }, [BAR]],
  '9d-bundle-to-offer': [{ step: 'bundle', ...done, meta_reveal_completed: true }],
  '10-offer': [{ step: 'offer', ...done }],
  '11-purchased': [{ step: 'purchased', ...done, purchased: true }],
}

const luminance = ([r, g, b]) => {
  const f = (v) => {
    const c = v / 255
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
  }
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b)
}
const ratio = (a, b) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x)
  return (hi + 0.05) / (lo + 0.05)
}
const parseRgb = (css) => css.match(/\d+(\.\d+)?/g).slice(0, 3).map(Number)

await mkdir(OUT, { recursive: true })
const browser = await chromium.launch()
const names = process.argv.slice(2).length ? process.argv.slice(2) : Object.keys(STATES)
let failures = 0

for (const name of names) {
  const entry = STATES[name]
  if (!entry) continue
  const [state, action] = entry
  const context = await browser.newContext({ viewport: VIEWPORT, deviceScaleFactor: 1 })
  await context.addInitScript(
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
  const page = await context.newPage()
  await page.goto(BASE, { waitUntil: 'networkidle' })
  // Сцены раскрываются волной, самая длинная — награда: пока карточка едет,
  // её фон полупрозрачен, и замер поймает не панель, а персонажа за ней.
  await page.waitForTimeout(4200)
  // Промах по селектору НЕ проглатываем. Раньше здесь стоял .catch(() => {}),
  // и когда селектор переставал совпадать, скрипт молча мерил предыдущую фазу
  // и рапортовал зелёным: «голосовое» проверялось по неподвижной карточке, а
  // тест — по экрану барьера, до которого он даже не доходил.
  for (const selector of [action].flat().filter(Boolean)) {
    try {
      await page.locator(selector).first().click({ timeout: 15000 })
    } catch {
      const текст = await page.evaluate(() => document.body.innerText.replace(/\n+/g, ' | ').slice(0, 140))
      throw new Error(`${name}: не нажалось «${selector}». На экране: ${текст}`)
    }
    await page.waitForTimeout(2200)
  }

  // Собираем рамки и цвета видимых текстовых блоков.
  const blocks = await page.evaluate(() => {
    const out = []
    // Текст под фиксированной кнопкой мерить бессмысленно: он уезжает из-под неё
    // при прокрутке, а замер показал бы контраст с жёлтой заливкой.
    const bar = document.querySelector('[data-bottom-bar]')
    const barTop = bar ? bar.getBoundingClientRect().top : Infinity
    for (const el of document.querySelectorAll('h1, h2, p, li, span')) {
      const text = (el.textContent ?? '').trim()
      if (!text || el.querySelector('h1, h2, p, li, span')) continue
      const r = el.getBoundingClientRect()
      if (r.width < 24 || r.height < 8 || r.bottom < 0 || r.top > window.innerHeight) continue
      const cs = getComputedStyle(el)
      if (cs.visibility === 'hidden' || Number(cs.opacity) < 0.5) continue
      if (r.bottom > barTop && !bar?.contains(el)) continue
      out.push({
        text: text.slice(0, 40),
        color: cs.color,
        size: parseFloat(cs.fontSize),
        weight: Number(cs.fontWeight),
        rect: [Math.round(r.x), Math.round(r.y), Math.round(r.width), Math.round(r.height)],
      })
    }
    return out
  })

  // Прячем текст и снимаем чистый фон — иначе глифы испортят замер.
  await page.addStyleTag({
    content: 'h1,h2,p,li,span{color:transparent !important;text-shadow:none !important}',
  })
  await page.waitForTimeout(150)
  const shot = await page.screenshot()
  const { data, info } = await sharp(shot).ensureAlpha().raw().toBuffer({ resolveWithObject: true })

  console.log(`\n${name}`)
  for (const b of blocks) {
    const [x, y, w, h] = b.rect
    let r = 0, g = 0, bl = 0, n = 0
    for (let py = Math.max(0, y); py < Math.min(info.height, y + h); py += 2) {
      for (let px = Math.max(0, x); px < Math.min(info.width, x + w); px += 2) {
        const o = (py * info.width + px) * 4
        r += data[o]; g += data[o + 1]; bl += data[o + 2]; n++
      }
    }
    if (!n) continue
    const bg = [r / n, g / n, bl / n].map(Math.round)
    const fg = parseRgb(b.color)
    const cr = ratio(fg, bg)
    const large = b.size >= 24 || (b.size >= 19 && b.weight >= 600)
    const need = large ? 3 : 4.5
    const ok = cr >= need
    if (!ok) failures++
    console.log(
      `  ${ok ? '  ' : '✗ '}${cr.toFixed(2).padStart(5)}:1 (нужно ${need}) ${String(Math.round(b.size)).padStart(2)}px  «${b.text}»`,
    )
  }
  await context.close()
}

await browser.close()
console.log(failures ? `\nБлоков ниже порога: ${failures}` : '\nВесь текст проходит по контрасту.')
if (failures) process.exitCode = 1
