import type { ReactNode } from 'react'
import { cn } from '../lib/cn'

/**
 * Кинематографичный кадр во всю ширину.
 *
 * Изображение живёт под контентом и медленно дышит (ken burns) — сцена не стоит
 * мёртвым скриншотом. Движение выключается при prefers-reduced-motion: смысл
 * кадра от этого не теряется, а тошноту он вызывать не должен.
 */
export function Scene({
  src,
  children,
  className,
  align = 'center',
  still = false,
}: {
  src: string
  children?: ReactNode
  className?: string
  align?: 'top' | 'center' | 'bottom'
  /** still — кадр стоит неподвижно (последний кадр сцены, момент решения). */
  still?: boolean
}) {
  return (
    <div className={cn('absolute inset-0 z-0 overflow-hidden', className)}>
      <img
        src={src}
        alt=""
        aria-hidden
        decoding="async"
        className={cn(
          'h-full w-full object-cover will-change-transform motion-reduce:animate-none',
          align === 'top' && 'object-top',
          align === 'bottom' && 'object-bottom',
          !still && 'animate-[breathe_24s_ease-in-out_infinite_alternate]',
        )}
      />
      {/* Затемнение под текст: без него субтитры лягут на светящиеся окна города. */}
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(to bottom, color-mix(in oklab, var(--color-ground-deep) 78%, transparent) 0%, color-mix(in oklab, var(--color-ground-deep) 24%, transparent) 30%, color-mix(in oklab, var(--color-ground-deep) 46%, transparent) 58%, var(--color-ground) 92%)',
        }}
      />
      {children}
    </div>
  )
}
