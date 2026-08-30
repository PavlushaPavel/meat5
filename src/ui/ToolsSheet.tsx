import { Check, Lock } from '@phosphor-icons/react'
import { SheetShell } from './Menu'
import { NAV } from '../content/copy'
import { config } from '../config'
import { useProgress } from '../store/progress'
import { openExternal, haptic } from '../lib/telegram'
import { track } from '../lib/analytics'
import { cn } from '../lib/cn'

/**
 * «Мои инструменты» (ТЗ §31): отдельный лист, открывается из Menu.
 *
 * Открыт App.tsx только когда `assistant_1_opened` — до первого unlock самого
 * пункта в меню нет, так что этот лист физически не может появиться раньше.
 *
 * Открытые пункты ведут по тем же ссылкам конфига, что и экраны награды
 * (Reward1Screen/Reward2Screen/BundleScreen), тем же способом — openExternal.
 * Пустая ссылка в конфиге — материал не подключён, это показывается честно,
 * а не тихой мёртвой кнопкой.
 */
export function ToolsSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { assistant_1_opened, assistant_2_opened, result_site_opened } = useProgress()

  return (
    <SheetShell open={open} onClose={onClose} ariaLabel={NAV.tools.title}>
      <p className="label-mono text-ink-3">{NAV.tools.title}</p>
      <div className="mt-sp2 flex flex-col gap-[6px]">
        <ToolRow
          label={NAV.tools.assistant1}
          unlocked={assistant_1_opened}
          url={config.assistant1Url}
          onOpen={() => {
            track('assistant1_clicked')
            openExternal(config.assistant1Url)
          }}
        />
        <ToolRow
          label={NAV.tools.assistant2}
          unlocked={assistant_2_opened}
          url={config.assistant2Url}
          onOpen={() => {
            track('assistant2_clicked')
            openExternal(config.assistant2Url)
          }}
        />
        {result_site_opened && (
          <ToolRow
            label={NAV.tools.demo}
            unlocked
            url={config.resultDemoUrl}
            onOpen={() => {
              track('demo_site_clicked')
              openExternal(config.resultDemoUrl)
            }}
          />
        )}
      </div>
    </SheetShell>
  )
}

function ToolRow({
  label,
  unlocked,
  url,
  onOpen,
}: {
  label: string
  unlocked: boolean
  url: string
  onOpen: () => void
}) {
  const ready = unlocked && Boolean(url)
  const note = unlocked ? (url ? null : 'материал ещё не подключён') : NAV.tools.locked

  return (
    <button
      type="button"
      disabled={!ready}
      onClick={() => {
        if (!ready) return
        haptic('light')
        onOpen()
      }}
      className={cn(
        'flex min-h-[56px] w-full cursor-pointer items-center gap-sp3 rounded-chip px-sp3 text-left',
        'transition-colors duration-[var(--t-press)] ease-e-out',
        ready ? 'text-ink active:bg-raised' : 'cursor-not-allowed text-ink-3',
      )}
    >
      <span
        className={cn(
          'grid h-9 w-9 shrink-0 place-items-center rounded-full border',
          unlocked
            ? 'border-transparent bg-[color-mix(in_oklab,var(--acid)_18%,transparent)] text-[var(--acid)]'
            : 'border-line text-ink-3',
        )}
        aria-hidden
      >
        {unlocked ? <Check size={16} weight="bold" /> : <Lock size={16} weight="regular" />}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[16px] leading-snug font-medium">{label}</span>
        {note && <span className="label-mono mt-1 block text-[10px] text-ink-3">{note}</span>}
      </span>
    </button>
  )
}
