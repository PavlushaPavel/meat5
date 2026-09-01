/**
 * Проверяет сам тест как содержимое, а не как вёрстку.
 *
 * Зачем. Верный ответ во всех двенадцати вопросах стоял ВТОРЫМ. Это не
 * опечатка и не мелочь: тест из двенадцати ситуаций проходился, не читая
 * условие, — достаточно двенадцать раз ткнуть в среднюю строку. Ни типы, ни
 * сборка, ни снимки такого не видят: данные формально корректны.
 *
 * Запуск: node scripts/quiz.mjs
 */
import { readFileSync } from 'node:fs'

const source = readFileSync(new URL('../src/content/quiz.ts', import.meta.url), 'utf8')

const LENGTH = 12
const correct = [...source.matchAll(/^\s{4}correct:\s*(\d)/gm)].map((m) => Number(m[1]))
const options = [...source.matchAll(/^\s{4}options:\s*\[([\s\S]*?)^\s{4}\]/gm)].map(
  (m) => (m[1].match(/^\s*'/gm) ?? []).length,
)
const moments = [...source.matchAll(/^\s{4}moment:\s*'([^']*)'/gm)].map((m) => m[1])
const protocols = [...source.matchAll(/^\s{4}protocol:\s*(\d)/gm)].map((m) => Number(m[1]))

const problems = []
const require_ = (ok, message) => { if (!ok) problems.push(message) }

require_(correct.length === LENGTH, `вопросов ${correct.length}, а должно быть ${LENGTH} (SPEC §15)`)
require_(options.length === LENGTH, `списков вариантов ${options.length}, а вопросов ${correct.length}`)
require_(moments.length === LENGTH, `таймкодов ${moments.length}, а вопросов ${correct.length}`)

options.forEach((count, i) => {
  require_(count >= 3, `вопрос ${i + 1}: вариантов ${count}, нужно минимум 3`)
  require_(correct[i] < count, `вопрос ${i + 1}: верный ответ ${correct[i]} за пределами списка из ${count}`)
})

// Ключ не должен быть предсказуемым: ни одна позиция не тянет половину теста.
const byPosition = correct.reduce((acc, position) => acc.set(position, (acc.get(position) ?? 0) + 1), new Map())
for (const [position, count] of byPosition) {
  require_(
    count <= Math.ceil(LENGTH / 2),
    `позиция ${position} держит ${count} верных ответов из ${LENGTH}: тест проходится, не читая условие`,
  )
}

// И не должен идти полосой: три одинаковые позиции подряд человек замечает.
for (let i = 2; i < correct.length; i++) {
  require_(
    !(correct[i] === correct[i - 1] && correct[i] === correct[i - 2]),
    `вопросы ${i - 1}–${i + 1}: верный ответ три раза подряд на позиции ${correct[i]}`,
  )
}

const seen = new Set()
moments.forEach((moment, i) => {
  require_(/^\d{2}:\d{2}$/.test(moment), `вопрос ${i + 1}: таймкод «${moment}» не в формате мм:сс`)
  require_(!seen.has(moment), `таймкод ${moment} повторяется: пересмотр приведёт в одно место из двух разных ошибок`)
  seen.add(moment)
})

protocols.forEach((protocol, i) => {
  require_(protocol === 1 || protocol === 2, `вопрос ${i + 1}: протокол ${protocol}, а их два`)
})

if (problems.length === 0) {
  const spread = [...byPosition.entries()].sort().map(([p, c]) => `${p}→${c}`).join(', ')
  console.log(`Тест в порядке: ${LENGTH} вопросов, ключ разложен по позициям (${spread}).`)
} else {
  console.log('ТЕСТ:\n')
  for (const problem of problems) console.log('  ✗ ' + problem)
  process.exitCode = 1
}
