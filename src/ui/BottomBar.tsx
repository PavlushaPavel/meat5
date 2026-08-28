import type { ReactNode } from 'react'

/**
 * Панель действия. Фиксирована, но экран уже зарезервировал под неё место
 * (см. Screen): контент не заезжает под кнопку и не прячется за ней.
 */
export function BottomBar({ children }: { children: ReactNode }) {
  return (
    <div
      data-bottom-bar
      className="fixed inset-x-0 z-40 mx-auto w-full max-w-[var(--app-max)] px-[var(--gutter)]"
      style={{
        // Низ окна и низ видимой области — разные вещи: в Telegram под окном
        // остаётся чат, и кнопка, прижатая к bottom:0, оказывается вне экрана.
        bottom: 'var(--tg-gap-bottom)',
        paddingBottom: 'calc(max(env(safe-area-inset-bottom), var(--tg-sa-bottom)) + 16px)',
      }}
    >
      {/* Растушёвка к фону: кнопка не висит на резкой границе поверх сцены. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 -z-10 h-[140px]"
        style={{
          background:
            'linear-gradient(to top, var(--color-ground) 38%, color-mix(in oklab, var(--color-ground) 70%, transparent) 72%, transparent)',
        }}
      />
      {children}
    </div>
  )
}
