import { motion } from 'motion/react'
import { Heart, HeartBreak } from '@phosphor-icons/react'
import { EASE_OUT, prefersReducedMotion } from '../lib/motion'
import { cn } from '../lib/cn'

/**
 * Одно сердце ряда жизней (DESIGN.md §8.3).
 *
 * Полное сердце — активная жизнь, контурное — потерянная. Оба состояния — SVG
 * из @phosphor-icons/react (Heart, weight="fill"/"regular"), а не эмодзи и не
 * текстовый символ (правила проекта §4).
 *
 * `breaking` — это сердце в этот кадр как раз потеряно: единственное место в
 * приложении, где анимация обязана быть заметной (DESIGN.md §8.3). Остальные
 * сердца ряда при этом не шевелятся. При prefers-reduced-motion сердце просто
 * меняет состояние без замаха.
 */
export function QuizHeart({ alive, breaking }: { alive: boolean; breaking: boolean }) {
  const reduced = prefersReducedMotion()

  if (breaking && !reduced) {
    return (
      <motion.span
        aria-hidden
        className="relative inline-flex h-6 w-6 items-center justify-center"
        initial={{ scale: 1, rotate: 0 }}
        animate={{ scale: [1, 1.35, 0.85, 1], rotate: [0, -12, 9, -3, 0] }}
        transition={{ duration: 0.55, ease: EASE_OUT }}
      >
        <motion.span
          className="absolute inset-0"
          initial={{ opacity: 1 }}
          animate={{ opacity: [1, 1, 0] }}
          transition={{ duration: 0.55, times: [0, 0.55, 1] }}
        >
          <HeartBreak weight="fill" className="h-6 w-6 text-alert" />
        </motion.span>
        <motion.span
          className="absolute inset-0"
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 0, 1] }}
          transition={{ duration: 0.55, times: [0, 0.55, 1] }}
        >
          <Heart weight="regular" className="h-6 w-6 text-ink-3" />
        </motion.span>
      </motion.span>
    )
  }

  return (
    <span aria-hidden className="inline-flex h-6 w-6 items-center justify-center">
      <Heart weight={alive ? 'fill' : 'regular'} className={cn('h-6 w-6', alive ? 'text-gold' : 'text-ink-3')} />
    </span>
  )
}
