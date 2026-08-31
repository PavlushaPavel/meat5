import { motion } from 'motion/react'
import { asset } from '../lib/asset'
import { DUR, EASE_OUT } from '../lib/motion'
import { cn } from '../lib/cn'

/**
 * Персонаж на переднем плане.
 *
 * Он именно на переднем плане и крупный: это ведущий, а не иконка. Фигура
 * вырезана с альфой и стоит НА НИЖНЕМ КРАЕ кадра — так она читается как часть
 * сцены, а не как наклейка.
 *
 * Поднимать фигуру над низом нельзя. Пробовали: снятая с земли, она висит
 * посреди экрана, а её низ приходится растворять маской — и человек видит ровно
 * то, на что жалуется, «улетел вверх и всё равно обрезан». Если внизу не
 * хватает места, двигать надо ТЕКСТ, а не ведущего.
 */
export function Character({
  className,
  side = 'right',
  height = '62vh',
  delay = 0,
  pose = 'point',
  bleed = true,
  pin = false,
}: {
  className?: string
  side?: 'left' | 'right'
  height?: string
  delay?: number
  /** point — указывает и говорит; calm — с ноутбуком, когда отдаёт инструмент. */
  pose?: 'point' | 'calm'
  /**
   * bleed — фигура уходит за боковой край, как часть сцены. Выключается там,
   * где ведущий сам является содержанием кадра (экран продажи): там он должен
   * быть виден целиком, иначе выглядит обрезанным, а не встроенным в мир.
   */
  bleed?: boolean
  /**
   * pin — фигура держится за НИЗ ВИДИМОГО ЭКРАНА (как BottomBar), а не за низ
   * `main`. На экранах с длинным содержимым `main` может вырасти выше
   * вьюпорта — тогда «привязанная ко дну контейнера» фигура утекает вниз
   * вместе с ним, и лицо, которое лежит у самого верха картинки, оказывается
   * далеко под текстом или под панелью действия. Экраны наград (Reward1/2) —
   * ровно этот случай: там ведущий одновременно крупный и должен читаться
   * лицом, поэтому его вертикальная позиция не должна зависеть от того,
   * сколько текста легло выше него.
   */
  pin?: boolean
}) {
  return (
    // Клип-слой: фигура намеренно уходит за край кадра, но страница от этого
    // не должна получать горизонтальный скролл.
    <div
      className={cn(
        'pointer-events-none z-10 overflow-hidden',
        pin ? 'fixed inset-x-0 top-0 mx-auto w-full max-w-[var(--app-max)]' : 'absolute inset-0',
      )}
      style={pin ? { bottom: 'var(--tg-gap-bottom)' } : undefined}
    >
      <motion.img
        src={asset(pose === 'calm' ? 'world/character-calm.webp' : 'world/character-point.webp')}
        alt=""
        aria-hidden
        initial={{ opacity: 0, y: 28, scale: 1.02 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: DUR.scene, ease: EASE_OUT, delay }}
        className={cn(
          'absolute bottom-0 max-w-none select-none',
          'drop-shadow-[0_24px_60px_rgba(2,6,14,0.85)]',
          side === 'right' ? (bleed ? '-right-[8%]' : 'right-0') : bleed ? '-left-[8%]' : 'left-0',
          className,
        )}
        style={{ height }}
      />
    </div>
  )
}
