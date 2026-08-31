import { AnimatePresence, motion } from 'motion/react'
import { DUR, EASE_OUT } from '../lib/motion'
import { cn } from '../lib/cn'

/**
 * Ключевая фраза, становящаяся частью Города трафика (SPEC.md §5).
 *
 * Не строка субтитра — крупная типографика поверх кадра, ровно там же, где
 * обычно стоят субтитры. Акцент и обычный субтитр никогда не показываются
 * одновременно: экран решает, что показать, до рендера этого компонента.
 *
 * Ширина меры сознательно расширена (было 9ch): на самых длинных фразах
 * сценария («Нужно лучше отвечать за результат») узкая колонка рвала текст
 * на 4 строки крупного дисплейного кегля, и блок вырастал настолько, что
 * перекрывал лицо ведущего (правка владельца, задача 3). 20ch держит те же
 * фразы в 2 строках — драматизм крупной типографики остаётся, а высота блока
 * не съедает кадр.
 */
export function CityAccent({ text, className }: { text?: string; className?: string }) {
  return (
    <div className={cn('relative', className)}>
      <div
        aria-hidden
        className="pointer-events-none absolute -inset-x-[var(--gutter)] -top-sp6 -bottom-sp5"
        style={{
          background:
            'linear-gradient(to bottom, transparent 0%, color-mix(in oklab, var(--color-ground-deep) 68%, transparent) 28%, color-mix(in oklab, var(--color-ground-deep) 84%, transparent) 100%)',
        }}
      />
      <AnimatePresence mode="wait">
        {text && (
          <motion.p
            key={text}
            initial={{ opacity: 0, y: 16, filter: 'blur(10px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            exit={{ opacity: 0, y: -10, filter: 'blur(6px)', transition: { duration: 0.15 } }}
            transition={{ duration: DUR.scene, ease: EASE_OUT }}
            className="display-xl on-scene relative max-w-[20ch] text-balance text-ink"
          >
            {text}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  )
}
