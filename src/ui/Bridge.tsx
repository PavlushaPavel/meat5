import { motion } from 'motion/react'
import type { BridgeBlock } from '../content/copy'
import { DUR, EASE_OUT } from '../lib/motion'
import { cn } from '../lib/cn'

/**
 * Мост между блоками воронки — читается, а не слушается.
 *
 * Три голоса в одном блоке: сказанное в полный голос, пояснение тише и реплика,
 * которой человек обычно отмахивается. Разница даётся весом и размером, а не
 * цветными плашками: это по-прежнему кадр, а не статья.
 */
export function Bridge({
  blocks,
  delay = 0,
  plate = false,
  className,
}: {
  blocks: BridgeBlock[]
  delay?: number
  /**
   * plate — мягкая подложка под самим блоком текста. Нужна на светлых кадрах
   * (ночной город со светящимися трассами), где затемнять весь кадр нельзя:
   * это кульминация, а не экран для чтения.
   */
  plate?: boolean
  className?: string
}) {
  return (
    <div className={cn('relative flex flex-col gap-sp3', className)}>
      {plate && (
        <div
          aria-hidden
          className="pointer-events-none absolute -inset-x-[var(--gutter)] -top-sp7 -bottom-sp7 -z-10"
          style={{
            background:
              'radial-gradient(140% 62% at 30% 50%, color-mix(in oklab, var(--color-ground-deep) 86%, transparent) 0%, color-mix(in oklab, var(--color-ground-deep) 62%, transparent) 42%, color-mix(in oklab, var(--color-ground-deep) 24%, transparent) 72%, transparent 100%)',
          }}
        />
      )}
      {blocks.map((block, i) => (
        <motion.div
          key={block.text}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: DUR.ui, ease: EASE_OUT, delay: delay + i * 0.07 }}
        >
          {block.kind === 'quote' ? (
            <p className="on-scene border-l-2 border-gold pl-sp3 text-[19px] leading-snug font-semibold text-ink">
              «{block.text}»
            </p>
          ) : (
            <p
              className={
                block.kind === 'lead'
                  ? 'on-scene max-w-[34ch] text-[19px] leading-snug font-semibold text-ink'
                  : 'on-scene max-w-[38ch] text-[16px] leading-relaxed text-ink-2'
              }
            >
              {block.text}
            </p>
          )}
        </motion.div>
      ))}
    </div>
  )
}

/**
 * Затемнение сцены на время чтения. Кадр остаётся, но уходит вглубь: иначе
 * пояснительный текст спорит с колбами, полосами и светом.
 */
export function ReadingScrim({ strength = 74 }: { strength?: number }) {
  return (
    <div
      aria-hidden
      className="absolute inset-0 z-10"
      style={{ background: `color-mix(in oklab, var(--color-ground) ${strength}%, transparent)` }}
    />
  )
}
