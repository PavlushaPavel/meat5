import { motion } from 'motion/react'
import { EASE_OUT, prefersReducedMotion } from '../lib/motion'
import { cn } from '../lib/cn'

/**
 * ДОРОГОЙ МОУШН — мост после Видео 2 (SPEC.md §13, DESIGN.md §8.4).
 *
 * Разные объявления летят к разным людям, но каждый клик сходится на одной и
 * той же посадочной: три карточки сверху, линии стягиваются в одну точку
 * снизу. Сцена нарисована, а не пересказана абзацем. Только CSS/SVG + motion,
 * без сторонних библиотек. При prefers-reduced-motion всё сразу стоит в
 * конечном положении.
 */
const CARDS = [
  { left: '10%', top: '2%', rotate: -7 },
  { left: '60%', top: '0%', rotate: 4 },
  { left: '34%', top: '16%', rotate: -1 },
] as const

const LINE_FROM = [
  { x: 18, y: 22 },
  { x: 74, y: 12 },
  { x: 46, y: 34 },
] as const

const TARGET = { x: 50, y: 92 }

export function QuizAdsConverge({ className }: { className?: string }) {
  const reduced = prefersReducedMotion()

  return (
    <div aria-hidden className={cn('relative h-[172px] w-full', className)}>
      <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
        {LINE_FROM.map((from, i) => (
          <motion.line
            key={i}
            x1={from.x}
            y1={from.y}
            x2={TARGET.x}
            y2={TARGET.y}
            stroke="var(--color-gold)"
            strokeWidth={0.6}
            strokeLinecap="round"
            vectorEffect="non-scaling-stroke"
            initial={reduced ? { pathLength: 1, opacity: 0.55 } : { pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 0.55 }}
            transition={
              reduced ? { duration: 0 } : { duration: 0.6, ease: EASE_OUT, delay: 0.35 + i * 0.12 }
            }
          />
        ))}
      </svg>

      {CARDS.map((card, i) => (
        <motion.div
          key={i}
          className="absolute h-9 w-16 rounded-chip border border-line bg-panel/90 shadow-[0_6px_18px_-6px_rgba(0,0,0,0.6)]"
          style={{ left: card.left, top: card.top, rotate: card.rotate }}
          initial={reduced ? { opacity: 1, y: 0, scale: 1 } : { opacity: 0, y: -10, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={reduced ? { duration: 0 } : { duration: 0.4, ease: EASE_OUT, delay: i * 0.1 }}
        />
      ))}

      <motion.div
        className="absolute bottom-0 left-1/2 h-11 w-28 -translate-x-1/2 rounded-chip border-2 border-gold"
        style={{ background: 'color-mix(in oklab, var(--color-gold) 16%, transparent)' }}
        initial={reduced ? { scale: 1, opacity: 1 } : { scale: 0.7, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={reduced ? { duration: 0 } : { duration: 0.4, ease: EASE_OUT, delay: 0.9 }}
      />
    </div>
  )
}
