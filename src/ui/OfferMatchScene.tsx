import { motion } from 'motion/react'
import { EASE_OUT, prefersReducedMotion } from '../lib/motion'
import { cn } from '../lib/cn'

/**
 * ДОРОГОЙ МОУШН — третий такт моста ко второму видео (DESIGN.md §8.4).
 *
 * Аргумент: пришли трое разных, а видят одно и то же. Поэтому сцена начинается
 * с трёх ОДИНАКОВЫХ посадочных — одинаковый серый заголовок, одинаковые строки,
 * — и только потом каждая получает свой заголовок, свой цвет и своего человека,
 * который до неё дошёл и остановился.
 *
 * Слов внутри сцены нет намеренно. Три реальные фразы приходят текстом под ней
 * и синхронизированы с переключением своей карточки (SWITCH): сцена показывает
 * «стало по-разному», строка говорит, для кого именно. Ни одного придуманного
 * слова в схеме — их место в content/copy.ts.
 *
 * Только CSS/SVG + motion. При prefers-reduced-motion всё стоит в конечном
 * положении: три разных посадочных, люди на местах, без движения.
 */

/** Когда карточка i перестаёт быть «как все». Наружу — чтобы текст шёл в такт. */
export const MATCH_SWITCH = [0.9, 1.25, 1.6] as const

const CARDS = [
  { accent: 'var(--color-gold)', lines: [82, 54] },
  { accent: 'var(--acid)', lines: [64, 88] },
  // Третий — белый, а не серый: серый почти не отличается от общего заголовка,
  // с которого начинают все три, и «стало по-разному» на нём не читается.
  { accent: 'var(--color-ink)', lines: [90, 46] },
] as const

/** Серый «общий заголовок», с которого начинают все три. */
const SAME = 'var(--color-line)'

export function OfferMatchScene({ className }: { className?: string }) {
  const reduced = prefersReducedMotion()

  return (
    <div aria-hidden className={cn('flex w-full items-end justify-between gap-sp2', className)}>
      {CARDS.map((card, i) => {
        const switchAt = MATCH_SWITCH[i]
        return (
          <div key={i} className="flex flex-1 flex-col items-center gap-sp2">
            {/* Человек: доходит до своей посадочной ровно в момент переключения. */}
            <motion.span
              className="h-[7px] w-[7px] rounded-full"
              style={{ background: card.accent }}
              initial={reduced ? { opacity: 1, y: 0 } : { opacity: 0, y: -16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={reduced ? { duration: 0 } : { duration: 0.34, ease: EASE_OUT, delay: switchAt }}
            />

            <motion.div
              className="flex w-full flex-col gap-[5px] rounded-chip border p-[7px]"
              initial={
                reduced
                  ? { borderColor: card.accent, opacity: 1 }
                  : { borderColor: 'var(--color-line)', opacity: 0, y: 10 }
              }
              animate={
                reduced
                  ? { borderColor: card.accent, opacity: 1 }
                  : {
                      opacity: 1,
                      y: 0,
                      borderColor: ['var(--color-line)', 'var(--color-line)', card.accent],
                    }
              }
              transition={
                reduced
                  ? { duration: 0 }
                  : {
                      opacity: { duration: 0.36, ease: EASE_OUT, delay: i * 0.08 },
                      y: { duration: 0.36, ease: EASE_OUT, delay: i * 0.08 },
                      borderColor: { duration: switchAt + 0.36, times: [0, switchAt / (switchAt + 0.36), 1] },
                    }
              }
              style={{ background: 'color-mix(in oklab, var(--color-ground-deep) 78%, transparent)' }}
            >
              {/* Заголовок: у всех одинаковый серый, потом у каждого свой. */}
              <motion.span
                className="h-[5px] w-[74%] rounded-pill"
                initial={reduced ? { background: card.accent } : { background: SAME }}
                animate={reduced ? { background: card.accent } : { background: [SAME, SAME, card.accent] }}
                transition={
                  reduced
                    ? { duration: 0 }
                    : { duration: switchAt + 0.3, times: [0, switchAt / (switchAt + 0.3), 1] }
                }
              />
              {/* Строки текста остаются общими: меняется обещание, а не вёрстка. */}
              {card.lines.map((width, line) => (
                <span key={line} className="h-[3px] rounded-pill bg-line" style={{ width: `${width}%` }} />
              ))}
              <span className="mt-[2px] h-[7px] w-[44%] rounded-pill bg-line" />
            </motion.div>
          </div>
        )
      })}
    </div>
  )
}
