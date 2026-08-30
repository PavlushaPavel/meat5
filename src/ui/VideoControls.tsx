import { useRef, useState } from 'react'
import {
  ArrowsIn,
  ArrowsOut,
  Pause,
  Play,
  SpeakerHigh,
  SpeakerX,
} from '@phosphor-icons/react'
import { cn } from '../lib/cn'
import { haptic } from '../lib/telegram'
import type { PlaybackRate } from '../lib/useVideo'

/**
 * Свои контролы плеера (SPEC.md §38) — вместо нативных `controls`, у которых
 * разный вид в разных вебвью и которые не умеют закрывать §8 (честный watched-share).
 * Все цели не меньше 44×44 (DESIGN.md, мобильный тач).
 */
export function VideoControls({
  visible,
  playing,
  currentTime,
  duration,
  muted,
  rate,
  fullscreen,
  onTogglePlay,
  onSeek,
  onCycleRate,
  onToggleMute,
  onToggleFullscreen,
  className,
}: {
  visible: boolean
  playing: boolean
  currentTime: number
  duration: number
  muted: boolean
  rate: PlaybackRate
  fullscreen: boolean
  onTogglePlay: () => void
  onSeek: (seconds: number) => void
  onCycleRate: () => void
  onToggleMute: () => void
  onToggleFullscreen: () => void
  className?: string
}) {
  const trackRef = useRef<HTMLDivElement>(null)
  const [dragging, setDragging] = useState(false)
  const [dragTime, setDragTime] = useState(0)

  const hasDuration = duration > 0 && Number.isFinite(duration)
  const shownTime = dragging ? dragTime : currentTime
  const share = hasDuration ? Math.min(1, Math.max(0, shownTime / duration)) : 0

  const timeFromPointer = (clientX: number): number => {
    const track = trackRef.current
    if (!track || !hasDuration) return 0
    const rect = track.getBoundingClientRect()
    const ratio = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width))
    return ratio * duration
  }

  const startDrag = (clientX: number) => {
    if (!hasDuration) return
    setDragging(true)
    setDragTime(timeFromPointer(clientX))
  }
  const moveDrag = (clientX: number) => {
    if (!dragging) return
    setDragTime(timeFromPointer(clientX))
  }
  const endDrag = () => {
    if (!dragging) return
    setDragging(false)
    onSeek(dragTime)
  }

  return (
    <div
      className={cn(
        'pointer-events-none absolute inset-x-0 bottom-0 flex flex-col gap-sp1 px-sp2 pb-sp2 pt-sp5',
        'bg-gradient-to-t from-[color-mix(in_oklab,var(--color-ground-deep)_85%,transparent)] to-transparent',
        'transition-opacity duration-[var(--t-ui)] ease-e-out',
        visible ? 'opacity-100' : 'opacity-0',
        className,
      )}
    >
      <div
        ref={trackRef}
        role="slider"
        aria-label="Позиция воспроизведения"
        aria-valuemin={0}
        aria-valuemax={hasDuration ? Math.round(duration) : 0}
        aria-valuenow={Math.round(shownTime)}
        tabIndex={hasDuration ? 0 : -1}
        onPointerDown={(e) => {
          if (!hasDuration) return
          ;(e.target as Element).setPointerCapture?.(e.pointerId)
          startDrag(e.clientX)
        }}
        onPointerMove={(e) => moveDrag(e.clientX)}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onKeyDown={(e) => {
          if (!hasDuration) return
          if (e.key === 'ArrowRight') onSeek(Math.min(duration, currentTime + 5))
          else if (e.key === 'ArrowLeft') onSeek(Math.max(0, currentTime - 5))
        }}
        className="pointer-events-auto relative flex h-11 w-full cursor-pointer items-center touch-none"
      >
        <span className="absolute inset-x-0 h-[3px] rounded-pill bg-[color-mix(in_oklab,var(--color-ink)_25%,transparent)]" />
        <span
          className="absolute left-0 h-[3px] rounded-pill bg-gold"
          style={{ width: `${share * 100}%` }}
        />
        <span
          aria-hidden
          className="absolute h-3 w-3 -translate-x-1/2 rounded-full bg-gold shadow-[0_0_0_3px_color-mix(in_oklab,var(--color-ground-deep)_60%,transparent)]"
          style={{ left: `${share * 100}%` }}
        />
      </div>

      <div className="pointer-events-auto flex items-center gap-sp1">
        <button
          type="button"
          onClick={() => {
            haptic('light')
            onTogglePlay()
          }}
          aria-label={playing ? 'Пауза' : 'Смотреть'}
          className="grid h-11 w-11 shrink-0 cursor-pointer place-items-center rounded-full text-ink transition-transform duration-[var(--t-press)] ease-e-out active:scale-[0.9]"
        >
          {playing ? (
            <Pause size={20} weight="fill" />
          ) : (
            <Play size={20} weight="fill" className="ml-[2px]" />
          )}
        </button>

        <span className="label-mono min-w-0 shrink-0 tabular-nums text-ink-2">
          {formatTime(shownTime)} / {hasDuration ? formatTime(duration) : '--:--'}
        </span>

        <span className="flex-1" />

        <button
          type="button"
          onClick={() => {
            haptic('light')
            onCycleRate()
          }}
          aria-label={`Скорость ${formatRate(rate)}, переключить`}
          className={cn(
            'label-mono grid h-11 min-w-11 shrink-0 cursor-pointer place-items-center rounded-pill border px-sp2 tabular-nums transition-colors duration-[var(--t-ui)]',
            rate === 1 ? 'border-line text-ink-2' : 'border-gold text-gold',
          )}
        >
          {formatRate(rate)}
        </button>

        <button
          type="button"
          onClick={() => {
            haptic('light')
            onToggleMute()
          }}
          aria-label={muted ? 'Включить звук' : 'Выключить звук'}
          className="grid h-11 w-11 shrink-0 cursor-pointer place-items-center text-ink transition-transform duration-[var(--t-press)] ease-e-out active:scale-[0.9]"
        >
          {muted ? <SpeakerX size={19} /> : <SpeakerHigh size={19} />}
        </button>

        <button
          type="button"
          onClick={() => {
            haptic('light')
            onToggleFullscreen()
          }}
          aria-label={fullscreen ? 'Выйти из полноэкранного режима' : 'На весь экран'}
          className="grid h-11 w-11 shrink-0 cursor-pointer place-items-center text-ink transition-transform duration-[var(--t-press)] ease-e-out active:scale-[0.9]"
        >
          {fullscreen ? <ArrowsIn size={19} /> : <ArrowsOut size={19} />}
        </button>
      </div>
    </div>
  )
}

function formatRate(rate: number): string {
  return `${Number.isInteger(rate) ? rate : rate.toFixed(2).replace(/0$/, '')}×`
}

function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds)) return '--:--'
  const total = Math.max(0, Math.round(seconds))
  const m = Math.floor(total / 60)
  const s = total % 60
  return `${m}:${String(s).padStart(2, '0')}`
}
