import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { QuizHeart } from './QuizHeart'
import { QUIZ_UI } from '../content/copy'
import { QUIZ_LIVES } from '../store/progress'
import { EASE_OUT, prefersReducedMotion } from '../lib/motion'

/**
 * Пять сердец, а не пять полосок (DESIGN.md §8.3): полоска читается как
 * прогресс-бар и не создаёт ставки.
 *
 * Потеря жизни — единственное место в приложении, где анимация обязана быть
 * заметной: сердце на позиции только что потерянной жизни разбивается, рядом
 * коротко вспыхивает «-1 жизнь». Остальной ряд не шевелится.
 */
export function Lives({ left }: { left: number }) {
  const prevRef = useRef(left)
  const [brokenIndex, setBrokenIndex] = useState<number | null>(null)
  const reduced = prefersReducedMotion()

  useEffect(() => {
    const prev = prevRef.current
    prevRef.current = left
    if (left >= prev) return
    // Сердце на позиции `left` только что перешло из активного в потерянное.
    setBrokenIndex(left)
    const t = window.setTimeout(() => setBrokenIndex(null), 650)
    return () => window.clearTimeout(t)
  }, [left])

  return (
    <div className="relative flex items-center gap-sp1" role="status" aria-label={`Жизней осталось: ${left}`}>
      {Array.from({ length: QUIZ_LIVES }, (_, i) => (
        <QuizHeart key={i} alive={i < left} breaking={i === brokenIndex} />
      ))}
      <AnimatePresence>
        {brokenIndex !== null && (
          <motion.span
            aria-hidden
            initial={reduced ? { opacity: 1, y: -10 } : { opacity: 0, y: 0, scale: 0.9 }}
            animate={{ opacity: 1, y: -14, scale: 1 }}
            exit={{ opacity: 0, y: -22, transition: { duration: reduced ? 0 : 0.2 } }}
            transition={{ duration: reduced ? 0 : 0.4, ease: EASE_OUT }}
            className="label-mono pointer-events-none absolute -top-1 right-0 text-alert"
          >
            {QUIZ_UI.lifeLost}
          </motion.span>
        )}
      </AnimatePresence>
    </div>
  )
}
