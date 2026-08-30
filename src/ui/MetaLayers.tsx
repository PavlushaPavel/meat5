import { useState } from 'react'
import { motion } from 'motion/react'
import { DUR, EASE_OUT, prefersReducedMotion } from '../lib/motion'
import { cn } from '../lib/cn'

/**
 * Meta reveal (SPEC.md §24): само приложение расслаивается на карточки-слои,
 * разъезжающиеся в глубину, и только потом приходит текст — реплика заказчика
 * работает лишь после того, как человек это УВИДЕЛ, а не прочитал списком.
 *
 * `layers` — шесть подписей (Структура/Тексты/Визуалы/Дизайн/Сценарий/
 * Интерактив), `lines` — текст META_REVEAL.lines, приходящий следом.
 */
export function MetaLayers({
  layers,
  lines,
  className,
}: {
  layers: readonly string[]
  lines: readonly string[]
  className?: string
}) {
  const [reduced] = useState(prefersReducedMotion)
  const stagger = 0.12
  const linesStart = reduced ? 0.1 : layers.length * stagger + 0.5

  return (
    <div className={cn('relative', className)}>
      <div
        className="relative h-[176px] w-full"
        style={{ perspective: reduced ? undefined : 1000 }}
      >
        {layers.map((layer, i) => {
          const mid = (layers.length - 1) / 2
          const offset = i - mid
          return (
            <motion.div
              key={layer}
              initial={reduced ? false : { opacity: 0 }}
              animate={
                reduced
                  ? { opacity: 1 }
                  : {
                      opacity: 1,
                      x: offset * 32,
                      y: Math.abs(offset) * 8,
                      z: -i * 30,
                      rotateY: offset * -3,
                      scale: 1 - i * 0.04,
                    }
              }
              transition={{ duration: DUR.scene, ease: EASE_OUT, delay: i * stagger }}
              className={cn(
                'label-mono absolute grid h-[84px] w-[122px] place-items-center rounded-panel border px-sp2',
                'border-line bg-[color-mix(in_oklab,var(--color-ground-deep)_82%,transparent)] text-center text-ink backdrop-blur-[2px]',
              )}
              style={{
                top: '50%',
                left: '50%',
                marginTop: -42,
                marginLeft: -61,
                transformStyle: reduced ? undefined : 'preserve-3d',
              }}
            >
              {layer}
            </motion.div>
          )
        })}
      </div>

      <div className="mt-sp5 flex flex-col gap-sp2">
        {lines.map((line, i) => (
          <motion.p
            key={line}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: DUR.ui, ease: EASE_OUT, delay: linesStart + i * 0.1 }}
            className="on-scene max-w-[38ch] text-[16px] leading-relaxed text-ink"
          >
            {line}
          </motion.p>
        ))}
      </div>
    </div>
  )
}
