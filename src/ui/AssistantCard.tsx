import { ArrowUpRight } from '@phosphor-icons/react'
import { openExternal } from '../lib/telegram'
import { cn } from '../lib/cn'

/**
 * Инструмент отдаём сразу, а не обещаем в конце курса (PRODUCT.md §Жёсткие правила 2).
 * Если ссылки ещё нет, карточка честно говорит об этом и не делает вид, что работает.
 */
export function AssistantCard({
  number,
  title,
  hint,
  url,
  onOpen,
}: {
  number: string
  title: string
  hint: string
  url: string
  onOpen: () => void
}) {
  const ready = Boolean(url)
  return (
    <button
      type="button"
      disabled={!ready}
      onClick={() => {
        onOpen()
        openExternal(url)
      }}
      className={cn(
        'group flex w-full items-center gap-sp3 rounded-card border border-line bg-panel p-sp4 text-left',
        'transition-transform duration-[var(--t-press)] ease-e-out',
        ready ? 'cursor-pointer active:scale-[0.98]' : 'cursor-not-allowed opacity-60',
      )}
    >
      <span
        aria-hidden
        className="label-mono grid h-11 w-11 shrink-0 place-items-center rounded-chip bg-[color-mix(in_oklab,var(--acid)_18%,transparent)] text-[13px] text-[var(--acid)]"
      >
        {number}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[17px] leading-tight font-semibold text-ink">{title}</span>
        <span className="mt-1 block text-[14px] leading-snug text-ink-2">
          {ready ? hint : 'ссылка появится здесь'}
        </span>
      </span>
      <ArrowUpRight
        size={20}
        weight="bold"
        aria-hidden
        className="shrink-0 text-ink-3 transition-colors duration-[var(--t-ui)] group-active:text-gold"
      />
    </button>
  )
}
