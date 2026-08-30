import { ArrowCounterClockwise, Pause, Play, SpeakerHigh, SpeakerSlash } from '@phosphor-icons/react'
import { haptic } from '../lib/telegram'
import { cn } from '../lib/cn'

/** Форма волны фиксирована: случайные высоты на каждый рендер дёргали бы дорожку. */
const WAVE = [
  6, 10, 16, 22, 14, 9, 18, 26, 30, 21, 13, 8, 12, 19, 27, 33, 24, 16, 10, 14,
  20, 28, 34, 25, 17, 11, 15, 23, 31, 26, 18, 12, 9, 14, 21, 29, 22, 15, 10, 7,
]

/**
 * Панель управления голосовым сообщением сцены.
 *
 * Верхняя строка несёт вес — то же, что и в самом Telegram: play/pause,
 * дорожка формы волны с заливкой по прогрессу, оставшееся время
 * моноширинным. Аватар говорящего сюда не вынесен: пока звучит голос, на
 * кадре и так стоит крупный ведущий (Character) — повторять его миниатюрой
 * в панели избыточно.
 *
 * Нижняя строка — обязательные по SPEC.md §4 mute и replay, плюс скорость по
 * кругу 1× → 1.5× → 2×. Управлением, которым пользуются один раз за всю
 * воронку, не может весить столько же, сколько сцена (полировка по ТЗ,
 * задача 3): три кнопки здесь — компактные иконки без рамок и без плашек,
 * тонкой строкой под волной, а не второй ряд крупных кнопок в рамках. Тап-
 * зона у каждой всё равно 44×44 (`h-11 w-11`) — меньше стал видимый вес, а
 * не цель; на 44px минимум тап-зоны шести элементов в одну строку на
 * телефоне (320px) всё ещё не помещаются, отсюда и остаётся вторая строка.
 */
export function VoiceBar({
  playing,
  progress,
  remaining,
  rate,
  muted,
  onToggle,
  onCycleRate,
  onToggleMute,
  onReplay,
  className,
}: {
  playing: boolean
  progress: number
  /** Сколько осталось слушать с учётом выбранной скорости, мс. */
  remaining: number
  rate: number
  muted: boolean
  onToggle: () => void
  onCycleRate: () => void
  onToggleMute: () => void
  onReplay: () => void
  className?: string
}) {
  return (
    <div
      className={cn(
        'flex flex-col gap-sp1 rounded-panel border border-line/70 px-sp2 py-sp2',
        'bg-[color-mix(in_oklab,var(--color-ground-deep)_80%,transparent)] backdrop-blur-[6px]',
        className,
      )}
    >
      <div className="flex items-center gap-sp2">
        <button
          type="button"
          onClick={() => {
            haptic('light')
            onToggle()
          }}
          aria-label={playing ? 'Пауза' : 'Слушать'}
          className={cn(
            'grid h-11 w-11 shrink-0 cursor-pointer place-items-center rounded-full bg-gold',
            'transition-transform duration-[var(--t-press)] ease-e-out active:scale-[0.94]',
          )}
        >
          {playing ? (
            <Pause size={19} weight="fill" className="text-ink-on-gold" />
          ) : (
            <Play size={19} weight="fill" className="ml-[2px] text-ink-on-gold" />
          )}
        </button>

        <div className="flex min-w-0 flex-1 items-center gap-[2px] overflow-hidden" aria-hidden>
          {WAVE.map((h, i) => {
            const filled = i / WAVE.length <= progress
            return (
              <span
                key={i}
                className={cn(
                  'w-[2px] shrink-0 rounded-full transition-colors duration-150',
                  filled ? 'bg-gold' : 'bg-line',
                )}
                style={{ height: `${h}px` }}
              />
            )
          })}
        </div>

        <span className="label-mono shrink-0 text-ink-2">{formatTime(remaining)}</span>
      </div>

      {/* Тонкая строка: те же три действия, но без рамок и без плашек —
          компактные иконки, а не второй ряд крупных кнопок (задача 3). Тап-
          зона по-прежнему 44×44 на кнопку, видимый вес просто меньше. */}
      <div className="flex items-center justify-end gap-sp1">
        <button
          type="button"
          onClick={() => {
            haptic('light')
            onToggleMute()
          }}
          aria-label={muted ? 'Включить звук' : 'Выключить звук'}
          aria-pressed={muted}
          className={cn(
            'grid h-11 w-11 shrink-0 cursor-pointer place-items-center',
            'transition-transform duration-[var(--t-press)] ease-e-out active:scale-[0.9]',
            muted ? 'text-gold' : 'text-ink-2',
          )}
        >
          {muted ? <SpeakerSlash size={16} weight="regular" /> : <SpeakerHigh size={16} weight="regular" />}
        </button>

        <button
          type="button"
          onClick={() => {
            haptic('light')
            onReplay()
          }}
          aria-label="Заново"
          className={cn(
            'grid h-11 w-11 shrink-0 cursor-pointer place-items-center text-ink-2',
            'transition-transform duration-[var(--t-press)] ease-e-out active:scale-[0.9]',
          )}
        >
          <ArrowCounterClockwise size={16} weight="regular" />
        </button>

        <button
          type="button"
          onClick={() => {
            haptic('light')
            onCycleRate()
          }}
          aria-label={`Скорость ${formatRate(rate)}, переключить`}
          className={cn(
            'label-mono grid h-11 w-11 shrink-0 cursor-pointer place-items-center tabular-nums',
            'transition-transform duration-[var(--t-press)] ease-e-out active:scale-[0.9]',
            rate === 1 ? 'text-ink-2' : 'text-gold',
          )}
        >
          {formatRate(rate)}
        </button>
      </div>
    </div>
  )
}

/** 1× и 2× пишем без дробной части: «1.0×» в интерфейсе выглядит как отладка. */
function formatRate(rate: number): string {
  return `${Number.isInteger(rate) ? rate : rate.toFixed(1)}×`
}

function formatTime(ms: number): string {
  const total = Math.round(ms / 1000)
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`
}
