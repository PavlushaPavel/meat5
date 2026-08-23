import { useEffect, useRef, useState } from 'react'
import { Play } from '@phosphor-icons/react'
import type { VideoConfig } from '../config'
import { track, trackOnce, type FunnelEvent } from '../lib/analytics'
import { haptic } from '../lib/telegram'
import { cn } from '../lib/cn'
import { asset } from '../lib/asset'

/**
 * Протокол (видео) воронки.
 *
 * Видео ещё не прислано, поэтому по умолчанию здесь ЧЕСТНЫЙ плейсхолдер с
 * правильной пропорцией, а не серый прямоугольник и не пересказ содержания
 * текстом. Как только в config появится url — блок сам станет плеером,
 * ничего в экранах менять не нужно.
 *
 * Прогресс 25/50/75 уходит в аналитику один раз за сессию: по нему видно,
 * на какой минуте люди отваливаются.
 */
export function VideoBlock({
  video,
  protocolNo,
  title,
  eventPrefix,
  onProgress,
  onCompleted,
}: {
  video: VideoConfig
  protocolNo: string
  title: string
  eventPrefix: 'video1' | 'video2' | 'video3'
  onProgress?: (share: number) => void
  onCompleted: () => void
}) {
  const ref = useRef<HTMLVideoElement>(null)
  const [started, setStarted] = useState(false)
  const hasVideo = Boolean(video.url)

  useEffect(() => {
    const el = ref.current
    if (!el || !hasVideo) return
    const onTime = () => {
      if (!el.duration) return
      const share = el.currentTime / el.duration
      onProgress?.(share)
      if (share >= 0.25) trackOnce(`${eventPrefix}_25` as FunnelEvent)
      if (share >= 0.5) trackOnce(`${eventPrefix}_50` as FunnelEvent)
      if (share >= 0.75) trackOnce(`${eventPrefix}_75` as FunnelEvent)
    }
    const onEnd = () => {
      track(`${eventPrefix}_completed` as FunnelEvent)
      onCompleted()
    }
    el.addEventListener('timeupdate', onTime)
    el.addEventListener('ended', onEnd)
    return () => {
      el.removeEventListener('timeupdate', onTime)
      el.removeEventListener('ended', onEnd)
    }
  }, [hasVideo, eventPrefix, onProgress, onCompleted])

  return (
    <figure className="m-0">
      <div
        className={cn(
          'relative aspect-video w-full overflow-hidden rounded-panel border border-line bg-ground-deep',
        )}
      >
        {hasVideo ? (
          <video
            ref={ref}
            src={video.url}
            poster={asset(video.poster)}
            playsInline
            controls={started}
            className="h-full w-full object-cover"
          />
        ) : (
          <div
            aria-hidden
            className="absolute inset-0 opacity-[0.5]"
            style={{
              backgroundImage:
                'repeating-linear-gradient(135deg, color-mix(in oklab, var(--color-line) 55%, transparent) 0 1px, transparent 1px 9px)',
            }}
          />
        )}

        {!started && (
          <button
            type="button"
            onClick={() => {
              haptic('medium')
              setStarted(true)
              track(`${eventPrefix}_started` as FunnelEvent)
              if (hasVideo) void ref.current?.play()
              // Без файла считаем протокол просмотренным: воронку нельзя запирать
              // на материале, которого ещё нет.
              else onCompleted()
            }}
            className="absolute inset-0 grid cursor-pointer place-items-center bg-[color-mix(in_oklab,var(--color-ground-deep)_45%,transparent)] transition-colors duration-[var(--t-ui)] hover:bg-[color-mix(in_oklab,var(--color-ground-deep)_30%,transparent)]"
            aria-label={`Смотреть: ${title}`}
          >
            <span className="grid h-16 w-16 place-items-center rounded-full bg-gold transition-transform duration-[var(--t-press)] ease-e-out active:scale-[0.94]">
              <Play size={24} weight="fill" className="ml-[2px] text-ink-on-gold" />
            </span>
          </button>
        )}
      </div>

      <figcaption className="mt-sp2 flex items-baseline justify-between gap-sp2 [text-shadow:0_2px_16px_rgba(2,6,14,0.95),0_0_2px_rgba(2,6,14,0.9)]">
        <span className="label-mono text-ink-2">протокол {protocolNo}</span>
        <span className="label-mono text-ink-2">
          {hasVideo ? (video.duration ? formatDuration(video.duration) : '--:--') : 'материал будет здесь'}
        </span>
      </figcaption>
    </figure>
  )
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = Math.round(seconds % 60)
  return `${m}:${String(s).padStart(2, '0')}`
}
