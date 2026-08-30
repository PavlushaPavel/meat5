import { useState, type ReactNode } from 'react'
import { AnimatePresence, motion, type PanInfo } from 'motion/react'
import { CaretRight } from '@phosphor-icons/react'
import { NAV } from '../content/copy'
import { useProgress } from '../store/progress'
import { DUR, EASE_OUT, prefersReducedMotion } from '../lib/motion'
import { haptic } from '../lib/telegram'
import { cn } from '../lib/cn'

/**
 * Каркас нижнего листа: затемнение + сама панель, выезжающая снизу.
 * Общий для Menu и ToolsSheet (ТЗ §30, §31) — обе панели закрываются
 * тапом по затемнению, свайпом вниз и системной кнопкой «назад»
 * (кнопку «назад» ловит App.tsx через lib/telegram.ts).
 */
export function SheetShell({
  open,
  onClose,
  ariaLabel,
  children,
}: {
  open: boolean
  onClose: () => void
  ariaLabel: string
  children: ReactNode
}) {
  const [reduced] = useState(prefersReducedMotion)

  function handleDragEnd(_: unknown, info: PanInfo) {
    if (info.offset.y > 90 || info.velocity.y > 600) {
      haptic('light')
      onClose()
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            aria-hidden
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.15 } }}
            transition={{ duration: DUR.ui, ease: EASE_OUT }}
            className="fixed inset-0 z-40 bg-[color-mix(in_oklab,var(--color-ground-deep)_82%,transparent)]"
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={ariaLabel}
            drag={reduced ? false : 'y'}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.62 }}
            onDragEnd={handleDragEnd}
            initial={{ y: reduced ? 0 : 40, opacity: reduced ? 0 : 1 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: reduced ? 0 : 40, opacity: 0, transition: { duration: 0.15 } }}
            transition={{ duration: DUR.ui, ease: EASE_OUT }}
            className={cn(
              'fixed inset-x-0 bottom-0 z-40 mx-auto max-h-[80dvh] w-full max-w-[var(--app-max)] touch-none overflow-y-auto',
              'rounded-t-[var(--radius-panel)] border-t border-line bg-panel',
            )}
            style={{
              paddingBottom: 'calc(max(env(safe-area-inset-bottom), var(--tg-sa-bottom)) + 24px)',
            }}
          >
            <div className="flex justify-center pt-sp2">
              <span aria-hidden className="h-[4px] w-9 rounded-pill bg-line" />
            </div>
            <div className="px-[var(--gutter)] pt-sp3 pb-sp2">{children}</div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

/**
 * Меню (ТЗ §30): выезжает снизу листом, а не классический sidebar.
 * Пункты — строго NAV.menu, без единой своей строки.
 *
 * «Мои инструменты» показывается только после первого unlock
 * (`assistant_1_opened`) — до этого момента отдавать нечего.
 * «Помощь» и «Политика и документы» неактивны: реального текста и
 * документа для них в copy.ts нет, а придумывать свой запрещено —
 * честная заглушка вместо ссылки в никуда (тот же приём, что и в
 * RewardBlock/PurchasedScreen для не подключённых материалов).
 */
export function Menu({
  open,
  onClose,
  onOpenTools,
}: {
  open: boolean
  onClose: () => void
  onOpenTools: () => void
}) {
  const assistant1Opened = useProgress((s) => s.assistant_1_opened)

  return (
    <SheetShell open={open} onClose={onClose} ariaLabel={NAV.menu.resume}>
      <nav className="flex flex-col gap-[6px]">
        <MenuRow
          label={NAV.menu.resume}
          onClick={() => {
            haptic('light')
            onClose()
          }}
        />
        {assistant1Opened && (
          <MenuRow
            label={NAV.menu.tools}
            onClick={() => {
              haptic('light')
              onOpenTools()
            }}
          />
        )}
        <MenuRow label={NAV.menu.help} disabled note="материал ещё не подключён" />
        <MenuRow label={NAV.menu.docs} disabled note="материал ещё не подключён" />
      </nav>
    </SheetShell>
  )
}

function MenuRow({
  label,
  note,
  disabled,
  onClick,
}: {
  label: string
  note?: string
  disabled?: boolean
  onClick?: () => void
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={cn(
        'flex min-h-[56px] w-full cursor-pointer items-center justify-between gap-sp3 rounded-chip px-sp3 text-left',
        'transition-colors duration-[var(--t-press)] ease-e-out',
        disabled
          ? 'cursor-not-allowed text-ink-3'
          : 'text-ink active:bg-raised disabled:active:bg-transparent',
      )}
    >
      <span className="min-w-0 flex-1">
        <span className="block text-[16px] leading-snug font-medium">{label}</span>
        {note && <span className="label-mono mt-1 block text-[10px] text-ink-3">{note}</span>}
      </span>
      {!disabled && (
        <CaretRight size={16} weight="bold" aria-hidden className="shrink-0 text-ink-3" />
      )}
    </button>
  )
}
