import { AnimatePresence, motion } from 'motion/react'
import { DISTRICTS, type Line } from '../content/copy'
import { cn } from '../lib/cn'

/**
 * Ненавязчивая метка района, через который сейчас летим (SPEC.md §5).
 *
 * Название берётся из словаря DISTRICTS в content/copy.ts — компонент своих
 * подписей не придумывает, но и не показывает человеку служебный ключ данных.
 */
export function CityDistrictLabel({
  district,
  className,
}: {
  district?: Line['district']
  className?: string
}) {
  return (
    <div className={cn('relative h-[14px]', className)}>
      <AnimatePresence mode="wait">
        {district && (
          <motion.span
            key={district}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.12 } }}
            transition={{ duration: 0.2 }}
            className="label-mono on-scene absolute inset-0 text-ink-3"
          >
            {DISTRICTS[district]}
          </motion.span>
        )}
      </AnimatePresence>
    </div>
  )
}
