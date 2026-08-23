import { motion } from 'motion/react'
import { NODES, nodeState, type StepId } from '../router/flow'
import { DUR, EASE_OUT } from '../lib/motion'
import { cn } from '../lib/cn'
import { Check } from '@phosphor-icons/react'

/**
 * Три узла связки — ЕДИНСТВЕННЫЙ индикатор прогресса (DESIGN.md §2.9).
 * Второй шкалы, процента или прибора в шапке быть не должно: они отбирают
 * у связки ровно тот смысл, ради которого построена воронка.
 */
export function NodeRail({
  step,
  dramatic = false,
  onScene = false,
}: {
  step: StepId
  dramatic?: boolean
  /** onScene — рейка лежит поверх фотографии и ей нужна собственная подложка. */
  onScene?: boolean
}) {
  return (
    <div
      className={cn(
        'relative flex items-stretch gap-sp1',
        onScene && 'rounded-panel bg-[color-mix(in_oklab,var(--color-ground-deep)_72%,transparent)] p-sp1 backdrop-blur-[2px]',
      )}
      aria-label="Собранная связка"
    >
      {dramatic && NODES.every((_, i) => nodeState(i, step) === 'open') && (
        <motion.span
          aria-hidden
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 0.8, ease: EASE_OUT, delay: NODES.length * 0.22 }}
          className="pointer-events-none absolute inset-x-sp2 top-1/2 z-0 h-[2px] origin-left bg-[var(--acid)] opacity-70 motion-reduce:hidden"
        />
      )}
      {NODES.map((node, idx) => {
        const state = nodeState(idx, step)
        const open = state === 'open'
        return (
          <motion.div
            key={node.id}
            initial={dramatic ? { opacity: 0, y: 10 } : false}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: DUR.scene, ease: EASE_OUT, delay: dramatic ? idx * 0.22 : 0 }}
            className={cn(
              'relative z-10 flex min-w-0 flex-1 flex-col justify-between gap-sp1 rounded-chip border px-sp2 py-sp2',
              'transition-colors duration-[var(--t-scene)]',
              open && 'border-transparent bg-[color-mix(in_oklab,var(--acid)_16%,var(--color-ground))]',
              state === 'current' && 'border-gold',
              state === 'closed' && 'border-line',
            )}
          >
            <span
              className={cn(
                'label-mono truncate text-[10px] leading-none tracking-[0.06em]',
                open ? 'text-[var(--acid)]' : state === 'current' ? 'text-gold' : 'text-ink-3',
              )}
            >
              {node.label}
            </span>
            <span className="flex h-4 items-center">
              {open ? (
                <Check size={14} weight="bold" className="text-[var(--acid)]" aria-label="открыт" />
              ) : (
                <span aria-hidden className="h-[2px] w-4 rounded-full bg-line" />
              )}
            </span>
          </motion.div>
        )
      })}
    </div>
  )
}
