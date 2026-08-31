/**
 * Ищет обращения к несуществующим токенам оформления.
 *
 * Зачем отдельная проверка. Браузер на `var(--gold)`, когда объявлен
 * `--color-gold`, не ругается — он молча пропускает свойство. Элемент
 * остаётся на экране, но без цвета: заливка не применяется, свечение не
 * появляется, иконка превращается в пустой прямоугольник. Ни сборка, ни
 * типы, ни снимки этого не видят — дефект замечает только человек, и то
 * не сразу. Ровно так три сцены в проекте месяц простояли выцветшими.
 *
 * Запуск: node scripts/tokens.mjs
 */
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join, extname } from 'node:path'

const STYLES = ['src/styles/tokens.css', 'src/styles/globals.css']
const CODE_ROOT = 'src'
const CODE_EXT = new Set(['.ts', '.tsx', '.css'])

/** Всё, что объявлено в стилях: `--имя:` где угодно, включая блоки актов. */
const declared = new Set(
  STYLES.flatMap((file) => [...readFileSync(file, 'utf8').matchAll(/(--[a-z0-9-]+)\s*:/g)].map((m) => m[1])),
)

function walk(dir) {
  return readdirSync(dir).flatMap((entry) => {
    const full = join(dir, entry)
    return statSync(full).isDirectory() ? walk(full) : CODE_EXT.has(extname(entry)) ? [full] : []
  })
}

/** Комментарии не код: в них имена токенов встречаются в объяснениях. */
const withoutComments = (source) =>
  source.replace(/\/\*[\s\S]*?\*\//g, (block) => block.replace(/[^\n]/g, ' '))

const problems = []
for (const file of walk(CODE_ROOT)) {
  const source = withoutComments(readFileSync(file, 'utf8'))
  const lines = source.split('\n')
  lines.forEach((line, index) => {
    // Объявление собственного свойства в этой же строке — не обращение.
    for (const match of line.matchAll(/var\((--[a-z0-9-]+)/g)) {
      if (declared.has(match[1])) continue
      problems.push(`${file}:${index + 1}  ${match[1]}`)
    }
  })
}

if (problems.length === 0) {
  console.log('Все токены оформления существуют.')
} else {
  console.log('НЕСУЩЕСТВУЮЩИЕ ТОКЕНЫ — свойство молча не применится:\n')
  for (const problem of problems) console.log(`  ✗ ${problem}`)
  console.log(`\nВсего: ${problems.length}. Проверьте имя в src/styles/tokens.css.`)
  process.exitCode = 1
}
