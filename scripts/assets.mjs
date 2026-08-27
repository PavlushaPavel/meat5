/**
 * Конвейер ассетов: assets-src → public/world.
 *
 * Исходники — кадры заказчика и сгенерированные сцены по 2.5–7 МБ. Отдавать такое
 * в Telegram нельзя: приложение открывают с телефона по мобильной сети. Здесь всё
 * приводится к одной ширине и жмётся в webp.
 *
 * Запуск: node scripts/assets.mjs
 */
import sharp from 'sharp'
import { mkdir } from 'node:fs/promises'

const OUT = 'public/world'
/** 460 CSS-пикселей макета × 2 (Retina) — больше на телефоне не видно. */
const SCENE_WIDTH = 920
const QUALITY = 72

/** Сцены: имя в public ← файл исходника. */
const SCENES = [
  ['city-gate', 'ref2.png'],
  ['city-districts', 'ref1.png'],
  ['city-conversions', 'ref3.png'],
  ['lab-exterior', 'lab-exterior.png'],
  // Лаборатория — не химическая: здесь производят рекламные связки, поэтому
  // на кадрах ноутбуки, дашборды и макеты страниц, а в проёме виден сам город.
  ['lab-interior', 'lab2-interior.png'],
  ['offer-bench', 'lab2-bench.jpg'],
  ['access-door', 'access-door.png'],
  ['assembly', 'lab2-assembly.png'],
]

/**
 * Персонаж прислан одним файлом с двумя кадрами. Режем на два портрета:
 * левый — спокойный, правый — указывает пальцем.
 */
const PORTRAITS = [
  ['character-calm', { left: 0.06, width: 0.42 }],
  ['character-point', { left: 0.5, width: 0.44 }],
]

await mkdir(OUT, { recursive: true })

for (const [name, file] of SCENES) {
  const out = `${OUT}/${name}.webp`
  const info = await sharp(`assets-src/${file}`)
    .resize({ width: SCENE_WIDTH, withoutEnlargement: true })
    .webp({ quality: QUALITY })
    .toFile(out)
  console.log(`${out}  ${info.width}×${info.height}  ${(info.size / 1024).toFixed(0)} КБ`)
}

const src = sharp('assets-src/ref4.png')
const meta = await src.metadata()
for (const [name, box] of PORTRAITS) {
  const out = `${OUT}/${name}.webp`
  const info = await sharp('assets-src/ref4.png')
    .extract({
      left: Math.round(meta.width * box.left),
      top: 0,
      width: Math.round(meta.width * box.width),
      height: meta.height,
    })
    .resize({ width: 520, withoutEnlargement: true })
    .webp({ quality: 78 })
    .toFile(out)
  console.log(`${out}  ${info.width}×${info.height}  ${(info.size / 1024).toFixed(0)} КБ`)
}
