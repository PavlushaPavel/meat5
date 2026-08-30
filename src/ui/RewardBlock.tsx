import { ArrowUpRight } from '@phosphor-icons/react'
import { motion } from 'motion/react'
import { DUR, EASE_OUT } from '../lib/motion'
import { cn } from '../lib/cn'

/**
 * Инструмент, который отдают ЗДЕСЬ И СЕЙЧАС.
 *
 * По прототипу (§4, §22) это главное действие экрана награды, а «идти дальше» —
 * следующий шаг, который появляется после. Поэтому инструмент занимает кадр,
 * а не лежит вторичной карточкой сбоку: иначе человек проходит мимо подарка,
 * и вся взаимность, ради которой он выдан, не срабатывает.
 *
 * `title`/`hint` приходят целиком из copy.ts (REWARD_1.tool/toolHint или
 * REWARD_2.tool/toolHint) — экран не сочиняет собственную подпись поверх них.
 */
export function RewardBlock({
  number,
  title,
  hint,
  taken,
  ready,
  className,
}: {
  number: string
  title: string
  hint: string
  taken: boolean
  ready: boolean
  className?: string
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: DUR.scene, ease: EASE_OUT, delay: 0.15 }}
      className={cn(
        'rounded-card border bg-panel p-sp4',
        taken ? 'border-[var(--acid)]/60' : 'border-line',
        className,
      )}
    >
      <div className="flex items-center gap-sp3">
        <span
          className={cn(
            'label-mono grid h-12 w-12 shrink-0 place-items-center rounded-chip text-[13px]',
            ready
              ? 'bg-[color-mix(in_oklab,var(--acid)_18%,transparent)] text-[var(--acid)]'
              : 'bg-raised text-ink-2',
          )}
        >
          {number}
        </span>
        <p className="min-w-0 flex-1 text-[19px] leading-tight font-semibold text-ink">{title}</p>
        {taken && <ArrowUpRight size={20} weight="bold" aria-hidden className="shrink-0 text-[var(--acid)]" />}
      </div>

      <p className="mt-sp3 max-w-[36ch] text-[15px] leading-relaxed text-ink-2">
        {ready ? hint : 'Ссылка на инструмент появится здесь — материал ещё не подключён.'}
      </p>
    </motion.div>
  )
}
