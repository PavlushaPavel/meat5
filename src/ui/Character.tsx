import { motion } from 'motion/react'
import { asset } from '../lib/asset'
import { DUR, EASE_OUT } from '../lib/motion'
import { cn } from '../lib/cn'

/**
 * Персонаж на переднем плане.
 *
 * Он именно на переднем плане и крупный: это ведущий, а не иконка. Фигура
 * вырезана с альфой и намеренно уходит за нижний край кадра — так она читается
 * как часть сцены, а не как наклейка.
 *
 * Текст лежит ПОВЕРХ него: перекрытие здесь — приём, а не дефект.
 */
export function Character({
  className,
  side = 'right',
  height = '62vh',
  delay = 0,
}: {
  className?: string
  side?: 'left' | 'right'
  height?: string
  delay?: number
}) {
  return (
    // Клип-слой: фигура намеренно уходит за край кадра, но страница от этого
    // не должна получать горизонтальный скролл.
    <div className="pointer-events-none absolute inset-0 z-10 overflow-hidden">
      <motion.img
        src={asset('world/character-hero.webp')}
        alt=""
        aria-hidden
        initial={{ opacity: 0, y: 28, scale: 1.02 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: DUR.scene, ease: EASE_OUT, delay }}
        className={cn(
          'absolute bottom-0 max-w-none select-none',
          'drop-shadow-[0_24px_60px_rgba(2,6,14,0.85)]',
          side === 'right' ? '-right-[8%]' : '-left-[8%]',
          className,
        )}
        style={{ height }}
      />
    </div>
  )
}
