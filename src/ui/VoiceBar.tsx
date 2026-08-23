import { Pause, Play } from '@phosphor-icons/react'
import { asset } from '../lib/asset'
import { haptic } from '../lib/telegram'
import { cn } from '../lib/cn'

/** Форма волны фиксирована: случайные высоты на каждый рендер дёргали бы дорожку. */
const WAVE = [
  6, 10, 16, 22, 14, 9, 18, 26, 30, 21, 13, 8, 12, 19, 27, 33, 24, 16, 10, 14,
  20, 28, 34, 25, 17, 11, 15, 23, 31, 26, 18, 12, 9, 14, 21, 29, 22, 15, 10, 7,
]

/**
 * Голосовое сообщение сцены — как в самом Telegram: аватар говорящего, play,
 * дорожка и время. Человек сам решает, когда начать, и видит, сколько осталось.
 */
export function VoiceBar({
  playing,
  progress,
  elapsed,
  duration,
  onToggle,
  className,
}: {
  playing: boolean
  progress: number
  elapsed: number
  duration: number
  onToggle: () => void
  className?: string
}) {
  const remaining = Math.max(0, duration - elapsed)
  return (
    <div
      className={cn(
        'flex items-center gap-sp3 rounded-pill border border-line py-sp1 pr-sp4 pl-sp1',
        'bg-[color-mix(in_oklab,var(--color-ground-deep)_80%,transparent)] backdrop-blur-[6px]',
        className,
      )}
    >
      <img
        src={asset('world/character-avatar.webp')}
        alt=""
        aria-hidden
        className="h-12 w-12 shrink-0 rounded-full border border-line object-cover"
      />

      <button
        type="button"
        onClick={() => {
          haptic('light')
          onToggle()
        }}
        aria-label={playing ? 'Пауза' : 'Слушать'}
        className={cn(
          'grid h-12 w-12 shrink-0 cursor-pointer place-items-center rounded-full bg-gold',
          'transition-transform duration-[var(--t-press)] ease-e-out active:scale-[0.94]',
        )}
      >
        {playing ? (
          <Pause size={20} weight="fill" className="text-ink-on-gold" />
        ) : (
          <Play size={20} weight="fill" className="ml-[2px] text-ink-on-gold" />
        )}
      </button>

      <div className="flex min-w-0 flex-1 items-center gap-[3px]" aria-hidden>
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
  )
}

function formatTime(ms: number): string {
  const total = Math.round(ms / 1000)
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`
}
