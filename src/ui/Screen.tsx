import type { ReactNode } from 'react'
import { cn } from '../lib/cn'

/**
 * Оболочка экрана: одна колонка, неизменные поля, место под нижнюю панель.
 *
 * Высота берётся из --tg-vh, а не из 100vh: в Telegram низ экрана занят чатом,
 * и 100vh уезжает под него вместе с кнопкой действия.
 */
export function Screen({
  children,
  className,
  bare = false,
}: {
  children: ReactNode
  className?: string
  /** bare — экран сам рисует фон во всю ширину (сцена города, кадр лаборатории). */
  bare?: boolean
}) {
  return (
    <main
      className={cn(
        'relative mx-auto flex w-full flex-col',
        'min-h-[var(--tg-vh)] max-w-[var(--app-max)]',
        !bare && 'px-[var(--gutter)]',
        className,
      )}
      style={{
        // max(): в браузере работает env(), в Telegram — присланные клиентом зоны.
        paddingTop: 'max(env(safe-area-inset-top), var(--tg-sa-top))',
        paddingBottom:
          'calc(max(env(safe-area-inset-bottom), var(--tg-sa-bottom)) + var(--tg-gap-bottom) + var(--bar-h))',
      }}
    >
      {children}
    </main>
  )
}
