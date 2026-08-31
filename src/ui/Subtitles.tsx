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
      {/* Подложка под текстом. Тяжёлый край сверху, растворение книзу: реплика
          стоит в небе над городом, и затемнение продолжает верх кадра, а не
          кладёт тёмную полосу на каску ведущего, который стоит ниже. */}
      <div
        aria-hidden
        className="pointer-events-none absolute -inset-x-[var(--gutter)] -top-sp7 -bottom-sp5"
        style={{
          background:
            'linear-gradient(to bottom, color-mix(in oklab, var(--color-ground-deep) 72%, transparent) 0%, color-mix(in oklab, var(--color-ground-deep) 58%, transparent) 62%, transparent 100%)',
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
              // Кегль привязан к ВЫСОТЕ экрана, а не только к ширине: реплика
              // стоит над ведущим, и на коротком экране лишняя строка съезжает
              // ему на каску. 2.9vh даёт 24px на обычном телефоне и 19px там,
              // где места действительно нет.
              'relative text-balance text-[clamp(19px,2.9vh,24px)] leading-[1.24] font-semibold tracking-[-0.01em] text-ink',
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
