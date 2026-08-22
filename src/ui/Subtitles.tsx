import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import type { Line } from '../content/script'
import { DUR, EASE_OUT, prefersReducedMotion } from '../lib/motion'
import { cn } from '../lib/cn'

/**
 * Голосовая сцена с крупными субтитрами.
 *
 * Человек ничего не нажимает каждые пять секунд: сцена идёт сама. Запускается
 * только по действию — автоплей со звуком запрещён (DESIGN.md §2.12) и всё равно
 * заблокирован браузерами.
 *
 * `onBeat` дёргается на репликах-поворотах: кадр в этот момент меняет план.
 */
export function Subtitles({
  lines,
  running,
  onBeat,
  onDone,
  className,
}: {
  lines: Line[]
  running: boolean
  onBeat?: (index: number) => void
  onDone: () => void
  className?: string
}) {
  const [i, setI] = useState(0)
  const timer = useRef<number | undefined>(undefined)
  const beatRef = useRef(onBeat)
  beatRef.current = onBeat

  useEffect(() => {
    if (!running) return
    const line = lines[i]
    if (!line) return
    if (line.beat) beatRef.current?.(i)
    // При reduced-motion реплики держатся дольше: движения нет, читать придётся глазами.
    const hold = prefersReducedMotion() ? line.hold * 1.25 : line.hold
    timer.current = window.setTimeout(() => {
      if (i + 1 >= lines.length) onDone()
      else setI(i + 1)
    }, hold)
    return () => window.clearTimeout(timer.current)
  }, [i, running, lines, onDone])

  const line = lines[i]

  return (
    <div className={cn('flex min-h-[132px] items-end', className)}>
      <AnimatePresence mode="wait">
        {running && line && (
          <motion.p
            key={i}
            initial={{ opacity: 0, y: 10, filter: 'blur(6px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            exit={{ opacity: 0, y: -6, filter: 'blur(4px)', transition: { duration: 0.14 } }}
            transition={{ duration: DUR.ui, ease: EASE_OUT }}
            className="text-balance text-[19px] leading-[1.4] font-medium text-ink [text-shadow:0_2px_18px_rgba(2,6,14,0.85)]"
          >
            {line.text}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  )
}
