import { useState } from 'react'
import { motion } from 'motion/react'
import { DUR, EASE_OUT, prefersReducedMotion } from '../lib/motion'
import { cn } from '../lib/cn'

/**
 * Meta reveal (SPEC.md §24): само приложение расслаивается на слои — и только
 * потом приходит текст. Реплика заказчика работает лишь после того, как человек
 * это УВИДЕЛ, а не прочитал списком.
 *
 * Раскладка. Было: шесть одинаковых плашек в одной точке со сдвигом 32px при
 * ширине 122px — они перекрывали друг друга на три четверти, подписи ложились
 * одна на другую, и вместо слоёв получалась каша. Теперь плашки разъезжаются
 * ВЕРТИКАЛЬНО с шагом больше собственной высоты: ни одна подпись не закрыта,
 * а глубина держится сносом вправо, наклоном и убыванием масштаба.
 *
 * Движение несёт сам аргумент: сначала все шесть лежат ОДНОЙ стопкой (это одно
 * приложение), потом расходятся по одному (оно собрано из слоёв). Поэтому
 * позиция анимируется от нуля, а не появляется готовой.
 *
 * Конечное положение задано в animate, а не только в анимации: при
 * prefers-reduced-motion плашки обязаны стоять уже разъехавшимися. Раньше в этой
 * ветке они оставались в одной точке — видна была только последняя.
 */

const STEP_Y = 34
const STEP_X = 9
const PLATE_H = 46

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
  const stagger = 0.09
  const spreadFrom = 0.4
  const linesStart = reduced ? 0.1 : spreadFrom + (layers.length - 1) * stagger + DUR.scene + 0.2
  const mid = (layers.length - 1) / 2
  const height = (layers.length - 1) * STEP_Y + PLATE_H

  return (
    <div className={cn('relative', className)}>
      <div className="relative w-full" style={{ height }}>
        {layers.map((layer, i) => {
          const offset = i - mid
          return (
            <motion.div
              key={layer}
              initial={reduced ? false : { opacity: 0, x: 0, y: 0, rotate: 0, scale: 1 }}
              animate={{
                opacity: 1,
                x: offset * STEP_X,
                y: offset * STEP_Y,
                rotate: offset * 0.9,
                // Дальний слой мельче ближнего — это и есть глубина.
                scale: 1 - i * 0.018,
              }}
              transition={
                reduced
                  ? { duration: 0 }
                  : {
                      // Появляются все разом одной стопкой, разъезжаются по очереди.
                      opacity: { duration: DUR.ui, ease: EASE_OUT },
                      default: {
                        duration: DUR.scene,
                        ease: EASE_OUT,
                        delay: spreadFrom + i * stagger,
                      },
                    }
              }
              className={cn(
                'absolute flex items-center gap-sp2 rounded-panel border border-line pr-sp3',
                'bg-[color-mix(in_oklab,var(--color-panel)_92%,transparent)] backdrop-blur-[2px]',
                'shadow-[0_10px_28px_-14px_rgba(2,6,14,0.95)]',
              )}
              style={{
                top: '50%',
                left: '50%',
                width: 206,
                height: PLATE_H,
                marginTop: -PLATE_H / 2,
                marginLeft: -103,
                // Верхняя плашка ближе к зрителю — её тень ложится на нижние.
                zIndex: layers.length - i,
              }}
            >
              {/* Торец слоя: плашка — материал, а не пустой прямоугольник. */}
              <span
                className="h-full w-[6px] shrink-0 rounded-l-panel"
                style={{ background: 'var(--color-gold)', opacity: 1 - i * 0.13 }}
              />
              <span className="label-mono text-ink">{layer}</span>
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
