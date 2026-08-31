import { motion } from 'motion/react'
import { EASE_OUT, prefersReducedMotion } from '../lib/motion'
import { cn } from '../lib/cn'

/**
 * ДОРОГОЙ МОУШН — мост после Видео 2 (SPEC.md §13, DESIGN.md §8.4).
 *
 * Аргумент сцены: объявления РАЗНЫЕ, а посадочная у всех ОДНА И ТА ЖЕ.
 * Значит и нарисовано должно быть именно это. Пустые прямоугольники ничего
 * не сообщают: три пустых окошка, сходящиеся в четвёртое пустое, читаются как
 * недогрузившийся интерфейс, а не как мысль. Поэтому у каждого объявления
 * свой акцент и своя длина строк, а посадочная одна, серая и одинаковая.
 *
 * Текста здесь нет намеренно: это не копирайт, а схема. Реальные слова живут
 * в content/copy.ts, и придумывать новые сцене не положено.
 *
 * Только CSS/SVG + motion. При prefers-reduced-motion всё стоит в конечном
 * положении без движения.
 */

/** Три объявления: свой акцент, свой наклон, свой ритм строк. */
const ADS = [
  { left: '2%', top: '0%', rotate: -6, accent: 'var(--color-gold)', lines: [78, 46] },
  { left: '56%', top: '2%', rotate: 5, accent: 'var(--acid)', lines: [62, 88] },
  { left: '29%', top: '20%', rotate: -1, accent: 'var(--color-ink-2)', lines: [88, 40] },
] as const

/** Откуда выходит линия клика — низ каждой карточки, в процентах вьюбокса. */
const LINE_FROM = [
  { x: 17, y: 26 },
  { x: 79, y: 30 },
  { x: 47, y: 48 },
] as const

const TARGET = { x: 50, y: 78 }

export function QuizAdsConverge({ className }: { className?: string }) {
  const reduced = prefersReducedMotion()

  return (
    <div aria-hidden className={cn('relative h-[218px] w-full', className)}>
      <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
        {LINE_FROM.map((from, i) => (
          <g key={i}>
            <motion.line
              x1={from.x}
              y1={from.y}
              x2={TARGET.x}
              y2={TARGET.y}
              stroke="var(--color-gold)"
              strokeWidth={0.6}
              strokeLinecap="round"
              vectorEffect="non-scaling-stroke"
              initial={reduced ? { pathLength: 1, opacity: 0.5 } : { pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 0.5 }}
              transition={
                reduced ? { duration: 0 } : { duration: 0.6, ease: EASE_OUT, delay: 0.4 + i * 0.12 }
              }
            />
            {/* Клик, уезжающий по линии к посадочной: движение делает схождение видимым. */}
            {!reduced && (
              <motion.circle
                r={1.1}
                fill="var(--color-gold)"
                initial={{ cx: from.x, cy: from.y, opacity: 0 }}
                animate={{ cx: [from.x, TARGET.x], cy: [from.y, TARGET.y], opacity: [0, 1, 0] }}
                transition={{
                  duration: 1.1,
                  ease: EASE_OUT,
                  delay: 1 + i * 0.22,
                  repeat: Infinity,
                  repeatDelay: 1.4,
                }}
              />
            )}
          </g>
        ))}
      </svg>

      {ADS.map((ad, i) => (
        <motion.div
          key={i}
          className="absolute flex h-[52px] w-[92px] flex-col gap-[5px] rounded-chip border border-line bg-panel/95 p-[7px] shadow-[0_8px_20px_-8px_rgba(0,0,0,0.7)]"
          style={{ left: ad.left, top: ad.top, rotate: ad.rotate }}
          initial={reduced ? { opacity: 1, y: 0, scale: 1 } : { opacity: 0, y: -12, scale: 0.92 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={reduced ? { duration: 0 } : { duration: 0.4, ease: EASE_OUT, delay: i * 0.12 }}
        >
          {/* Заголовок объявления — у каждого свой цвет: они РАЗНЫЕ. */}
          <span className="h-[4px] w-[62%] rounded-pill" style={{ background: ad.accent }} />
          {ad.lines.map((width, line) => (
            <span
              key={line}
              className="h-[3px] rounded-pill bg-line"
              style={{ width: `${width}%` }}
            />
          ))}
        </motion.div>
      ))}

      {/* Посадочная. Одна на всех: шапка, одинаковые строки, одна кнопка. */}
      <motion.div
        className="absolute bottom-0 left-1/2 flex w-[136px] -translate-x-1/2 flex-col gap-[5px] rounded-chip border-2 border-gold p-[8px]"
        style={{ background: 'color-mix(in oklab, var(--color-gold) 14%, var(--color-ground-deep))' }}
        initial={reduced ? { scale: 1, opacity: 1 } : { scale: 0.72, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={reduced ? { duration: 0 } : { duration: 0.45, ease: EASE_OUT, delay: 1 }}
      >
        <span className="h-[5px] w-[70%] rounded-pill bg-[var(--color-gold)] opacity-80" />
        <span className="h-[3px] w-full rounded-pill bg-line" />
        <span className="h-[3px] w-[82%] rounded-pill bg-line" />
        <span className="mt-[2px] h-[8px] w-[46%] rounded-pill bg-[var(--color-gold)]" />
      </motion.div>
    </div>
  )
}
