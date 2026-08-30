import { AnimatePresence, motion } from 'motion/react'
import type { Line } from '../content/copy'
import { DUR, EASE_OUT } from '../lib/motion'
import { cn } from '../lib/cn'

/**
 * Субтитры сцены.
 *
 * Крупные и поверх кадра — включая персонажа. Перекрытие здесь приём, а не дефект:
 * так это и работает в кино. Читаемость держим не отступами, а собственной
 * подложкой и тенью текста, чтобы буквы не растворялись в светящемся городе.
 */
export function Subtitles({
  line,
  hint,
  className,
}: {
  line?: Line
  /** Подсказка до старта голоса: та же подложка, тише голосом. */
  hint?: string
  className?: string
}) {
  return (
    <div className={cn('relative', className)}>
      {/* Подложка под текстом: мягкое затемнение ровно под блоком реплики. */}
      <div
        aria-hidden
        className="pointer-events-none absolute -inset-x-[var(--gutter)] -top-sp6 -bottom-sp5"
        style={{
          background:
            'linear-gradient(to bottom, transparent 0%, color-mix(in oklab, var(--color-ground-deep) 62%, transparent) 30%, color-mix(in oklab, var(--color-ground-deep) 78%, transparent) 100%)',
        }}
      />
      {!line && hint && (
        <p className="relative max-w-[26ch] text-[19px] leading-snug font-medium text-ink [text-shadow:0_2px_24px_rgba(2,6,14,0.95)]">
          {hint}
        </p>
      )}
      <AnimatePresence mode="wait">
        {line && (
          <motion.p
            key={line.text}
            initial={{ opacity: 0, y: 14, filter: 'blur(8px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            exit={{ opacity: 0, y: -8, filter: 'blur(5px)', transition: { duration: 0.15 } }}
            transition={{ duration: DUR.ui, ease: EASE_OUT }}
            className={cn(
              'relative text-balance text-[24px] leading-[1.24] font-semibold tracking-[-0.01em] text-ink',
              '[text-shadow:0_2px_28px_rgba(2,6,14,0.95),0_0_2px_rgba(2,6,14,0.9)]',
            )}
          >
            {line.text}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  )
}
