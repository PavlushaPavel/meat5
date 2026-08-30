import { useState } from 'react'
import { motion } from 'motion/react'
import { DUR, EASE_OUT, prefersReducedMotion } from '../lib/motion'
import { cn } from '../lib/cn'

/**
 * Переход к офферу (SPEC.md §25): двенадцать карточек раскрываются волной,
 * а не столбиком — задержка растёт по диагонали строка+колонка, а не по
 * порядковому номеру, поэтому глаз читает их наплывом, а не списком сверху вниз.
 */
export function OfferCascade({ cards, className }: { cards: readonly string[]; className?: string }) {
  const [reduced] = useState(prefersReducedMotion)
  const cols = 3

  return (
    <div className={cn('flex flex-wrap gap-sp2', className)}>
      {cards.map((card, i) => {
        const wave = Math.floor(i / cols) + (i % cols)
        return (
          <motion.span
            key={card}
            initial={reduced ? false : { opacity: 0, y: 10, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: DUR.ui, ease: EASE_OUT, delay: reduced ? 0 : wave * 0.09 }}
            className="label-mono rounded-pill border border-line bg-[color-mix(in_oklab,var(--color-ground-deep)_80%,transparent)] px-sp3 py-[8px] text-ink-2"
          >
            {card}
          </motion.span>
        )
      })}
    </div>
  )
}
