import type { ReactNode } from 'react'
import { cn } from '../lib/cn'
import { haptic } from '../lib/telegram'

type Variant = 'primary' | 'secondary' | 'ghost'

/**
 * Одна главная кнопка на экран (DESIGN.md §7). Нажатие даёт отклик за 140ms:
 * scale(0.97) + тактильный импульс — интерфейс подтверждает, что услышал.
 */
export function Button({
  children,
  onClick,
  variant = 'primary',
  disabled,
  className,
}: {
  children: ReactNode
  onClick?: () => void
  variant?: Variant
  disabled?: boolean
  className?: string
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => {
        if (disabled) return
        haptic('medium')
        onClick?.()
      }}
      className={cn(
        'label-mono relative w-full cursor-pointer select-none',
        'flex min-h-[56px] items-center justify-center gap-sp2 px-sp4',
        'rounded-chip transition-transform duration-[var(--t-press)] ease-e-out',
        'active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-40',
        variant === 'primary' && 'bg-gold text-ink-on-gold shadow-[0_6px_24px_-8px_rgba(249,183,6,0.55)]',
        variant === 'secondary' && 'border border-line bg-transparent text-ink',
        variant === 'ghost' && 'text-ink-2',
        className,
      )}
    >
      {children}
    </button>
  )
}
