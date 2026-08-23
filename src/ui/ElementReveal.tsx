import { useEffect, useState } from 'react'
import { motion } from 'motion/react'
import { DUR, EASE_OUT, prefersReducedMotion } from '../lib/motion'
import { cn } from '../lib/cn'

/**
 * Центральный экран лаборатории: на нём проявляется очередной элемент связки.
 *
 * Сначала стоит неизвестное — «???». Через мгновение оно проявляется в название.
 * Это и есть открытие: человек видит, ЧТО именно он сейчас будет разбирать,
 * а не читает оглавление курса.
 */
export function ElementReveal({
  index,
  title,
  className,
}: {
  index: string
  title: string
  className?: string
}) {
  const [revealed, setRevealed] = useState(prefersReducedMotion())

  useEffect(() => {
    if (revealed) return
    const t = window.setTimeout(() => setRevealed(true), 900)
    return () => window.clearTimeout(t)
  }, [revealed])

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-panel border border-line bg-[color-mix(in_oklab,var(--color-ground-deep)_78%,transparent)]',
        'px-sp4 py-sp5 backdrop-blur-[3px]',
        className,
      )}
    >
      {/* Предупредительная полоса сверху — тот же язык, что на полу лаборатории. */}
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 h-[5px] opacity-80"
        style={{
          backgroundImage:
            'repeating-linear-gradient(-45deg, var(--color-gold) 0 8px, transparent 8px 16px)',
        }}
      />

      <span className="label-mono text-ink-3">элемент {index} из 03</span>

      <div className="mt-sp2 flex min-h-[2.4em] items-center">
        {revealed ? (
          <motion.p
            initial={{ opacity: 0, y: 8, filter: 'blur(10px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            transition={{ duration: DUR.scene, ease: EASE_OUT }}
            className="display-m text-ink"
          >
            {title}
          </motion.p>
        ) : (
          <motion.p
            aria-hidden
            animate={{ opacity: [0.35, 0.9, 0.35] }}
            transition={{ duration: 1.1, repeat: Infinity, ease: 'easeInOut' }}
            className="display-m text-ink-3"
          >
            ???
          </motion.p>
        )}
      </div>
    </div>
  )
}
