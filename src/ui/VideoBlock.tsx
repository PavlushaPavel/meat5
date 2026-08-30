import { useCallback, useEffect, useRef, useState } from 'react'
import { ArrowClockwise, Play, Warning } from '@phosphor-icons/react'
import type { VideoConfig } from '../config'
import { track, trackOnce, type FunnelEvent } from '../lib/analytics'
import { haptic } from '../lib/telegram'
import { cn } from '../lib/cn'
import { asset } from '../lib/asset'
import { useVideo } from '../lib/useVideo'
import { VideoControls } from './VideoControls'
import { useProgress } from '../store/progress'

const CONTROLS_HIDE_MS = 2600

/**
 * Протокол (видео) воронки — собственный плеер (SPEC.md §38).
 *
 * Видео хостится нами самими (mp4/HLS на своём CDN), поэтому плеер — не чужой
 * SDK и не нативные `controls`, а полностью свой: разметка ниже, логика — в
 * lib/useVideo.ts. Пока в config нет url — честный плейсхолдер, а не серый
 * прямоугольник и не пересказ содержания текстом.
 *
 * Прогресс 25/50/75 уходит в аналитику один раз за сессию: по нему видно,
 * на какой минуте люди отваливаются. Completion (§8) выставляется не по
 * нативному `ended`, а по фактически просмотренной доле (`video.played`) —
 * перемотка ползунком в конец без честного просмотра не засчитывается.
 */
export function VideoBlock({
  video,
  protocolNo,
  title,
  eventPrefix,
  onProgress,
  onCompleted,
  seekTo,
  subtitlesUrl,
  nextVideoUrl,
}: {
  video: VideoConfig
  protocolNo: string
  title: string
  eventPrefix: 'video1' | 'video2' | 'video3'
  onProgress?: (share: number) => void
  onCompleted: () => void
  /** Секунда, с которой открыть протокол: приход по кнопке «пересмотреть момент». */
  seekTo?: number
  /** Необязательная дорожка субтитров .vtt. Нет ссылки — ничего не рисуем. */
  subtitlesUrl?: string
  /** URL следующего протокола — префетчится, когда текущий досмотрен больше чем наполовину. */
  nextVideoUrl?: string
}) {
  const ref = useRef<HTMLVideoElement>(null)
  const hasVideo = Boolean(video.url)

  const { storedSeconds, storedCompleted, saveSeconds } = useStoreVideoFields(eventPrefix)

  const onMilestone = useCallback(
    (share: number) => {
      if (share >= 0.25) trackOnce(`${eventPrefix}_25` as FunnelEvent)
      if (share >= 0.5) trackOnce(`${eventPrefix}_50` as FunnelEvent)
      if (share >= 0.75) trackOnce(`${eventPrefix}_75` as FunnelEvent)
    },
    [eventPrefix],
  )

  const onStarted = useCallback(() => {
    haptic('medium')
    track(`${eventPrefix}_started` as FunnelEvent)
  }, [eventPrefix])

  const onFullyCompleted = useCallback(() => {
    track(`${eventPrefix}_completed` as FunnelEvent)
    onCompleted()
  }, [eventPrefix, onCompleted])

  const player = useVideo(ref, {
    url: video.url,
    configDuration: video.duration,
    seekTo,
    storedSeconds,
    storedCompleted,
    onSaveSeconds: saveSeconds,
    onStarted,
    onProgress,
    onMilestone,
    onCompleted: onFullyCompleted,
  })

  // ---- контролы прячутся через 2.5с бездействия, возвращаются по тапу -----
  const [controlsVisible, setControlsVisible] = useState(true)
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const bumpControls = useCallback(() => {
    setControlsVisible(true)
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current)
    if (player.playing) {
      hideTimerRef.current = setTimeout(() => setControlsVisible(false), CONTROLS_HIDE_MS)
    }
  }, [player.playing])

  useEffect(() => {
    bumpControls()
    return () => {
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [player.playing])

  // ---- preload следующего протокола: только после половины текущего -------
  const prefetchedRef = useRef(false)
  useEffect(() => {
    if (!nextVideoUrl || prefetchedRef.current) return
    if (!player.duration || player.currentTime / player.duration < 0.5) return
    prefetchedRef.current = true
    const link = document.createElement('link')
    link.rel = 'prefetch'
    link.href = nextVideoUrl
    document.head.appendChild(link)
  }, [nextVideoUrl, player.currentTime, player.duration])

  return (
    <figure className="m-0">
      <div
        data-fullscreen={player.fullscreen}
        className={cn(
          'relative aspect-video w-full overflow-hidden rounded-panel border border-line bg-ground-deep',
          'data-[fullscreen=true]:aspect-auto',
        )}
        onPointerDown={() => player.started && bumpControls()}
      >
        {hasVideo ? (
          <video
            ref={ref}
            poster={asset(video.poster)}
            playsInline
            muted={player.muted}
            className="h-full w-full object-cover"
          >
            {subtitlesUrl && <track kind="subtitles" srcLang="ru" src={subtitlesUrl} default />}
          </video>
        ) : (
          <>
            <div
              aria-hidden
              className="absolute inset-0"
              style={{ background: 'var(--color-ground-deep)' }}
            />
            <div
              aria-hidden
              className="absolute inset-0 opacity-30"
              style={{
                backgroundImage:
                  'repeating-linear-gradient(135deg, color-mix(in oklab, var(--color-line) 60%, transparent) 0 1px, transparent 1px 10px)',
              }}
            />
            <div
              aria-hidden
              className="absolute inset-x-0 bottom-0 h-[6px] opacity-70"
              style={{
                backgroundImage:
                  'repeating-linear-gradient(-45deg, var(--color-gold) 0 8px, transparent 8px 16px)',
              }}
            />
          </>
        )}

        {!player.started && player.resumeAt !== null && (
          <div className="absolute inset-0 grid place-items-center bg-[color-mix(in_oklab,var(--color-ground-deep)_45%,transparent)]">
            <div className="flex flex-col items-center gap-sp3">
              <button
                type="button"
                onClick={() => player.begin(player.resumeAt ?? undefined)}
                className="flex items-center gap-sp2 rounded-pill bg-gold px-sp4 py-sp2 transition-transform duration-[var(--t-press)] ease-e-out active:scale-[0.96]"
              >
                <Play size={18} weight="fill" className="text-ink-on-gold" />
                <span className="label-mono text-ink-on-gold">
                  Продолжить с {formatDuration(player.resumeAt)}
                </span>
              </button>
              <button
                type="button"
                onClick={() => player.begin(0)}
                className="label-mono cursor-pointer text-ink-2 underline decoration-[color-mix(in_oklab,var(--color-ink-2)_50%,transparent)] underline-offset-4 transition-colors duration-[var(--t-ui)] hover:text-ink"
              >
                начать сначала
              </button>
            </div>
          </div>
        )}

        {!player.started && player.resumeAt === null && (
          <button
            type="button"
            onClick={() => {
              player.begin()
              // Без файла считаем протокол просмотренным сразу: воронку нельзя
              // запирать на материале, которого ещё нет, и нельзя принимать
              // работу без него. Вызываем «сырой» onCompleted напрямую, а не
              // обёртку с track(), иначе фиктивный просмотр попадёт в аналитику
              // наравне с честным.
              if (!hasVideo) onCompleted()
            }}
            className="absolute inset-0 grid cursor-pointer place-items-center bg-[color-mix(in_oklab,var(--color-ground-deep)_45%,transparent)] transition-colors duration-[var(--t-ui)] hover:bg-[color-mix(in_oklab,var(--color-ground-deep)_30%,transparent)]"
            aria-label={`Смотреть: ${title}`}
          >
            <span className="grid h-16 w-16 place-items-center rounded-full bg-gold transition-transform duration-[var(--t-press)] ease-e-out active:scale-[0.94]">
              <Play size={24} weight="fill" className="ml-[2px] text-ink-on-gold" />
            </span>
          </button>
        )}

        {player.started && hasVideo && player.status === 'buffering' && (
          <div className="absolute inset-0 grid place-items-center" aria-hidden>
            <span className="h-9 w-9 animate-spin rounded-full border-2 border-[color-mix(in_oklab,var(--color-ink)_30%,transparent)] border-t-gold" />
          </div>
        )}

        {player.started && hasVideo && player.status === 'error' && (
          <div className="absolute inset-0 grid place-items-center bg-[color-mix(in_oklab,var(--color-ground-deep)_75%,transparent)] px-sp4 text-center">
            <div className="flex flex-col items-center gap-sp3">
              <Warning size={28} className="text-alert" />
              <p className="label-mono max-w-[26ch] text-ink-2">
                Не получилось загрузить видео. Проверьте связь и попробуйте снова.
              </p>
              <button
                type="button"
                onClick={player.retry}
                className="flex h-11 items-center gap-sp1 rounded-pill border border-line px-sp3 text-ink transition-colors duration-[var(--t-ui)] active:scale-[0.96]"
              >
                <ArrowClockwise size={16} />
                <span className="label-mono">Повторить</span>
              </button>
            </div>
          </div>
        )}

        {player.started && hasVideo && player.notice && (
          <div className="pointer-events-none absolute inset-x-sp2 bottom-[64px] flex justify-center">
            <span className="label-mono rounded-pill bg-[color-mix(in_oklab,var(--color-ground-deep)_85%,transparent)] px-sp3 py-sp1 text-center text-ink-2">
              {player.notice}
            </span>
          </div>
        )}

        {player.started && hasVideo && (
          <VideoControls
            visible={controlsVisible || !player.playing}
            playing={player.playing}
            currentTime={player.currentTime}
            duration={player.duration}
            muted={player.muted}
            rate={player.rate}
            fullscreen={player.fullscreen}
            onTogglePlay={player.togglePlay}
            onSeek={player.seek}
            onCycleRate={player.cycleRate}
            onToggleMute={player.toggleMute}
            onToggleFullscreen={player.toggleFullscreen}
          />
        )}
      </div>

      {/*
        Подпись лежит на собственной подложке, а не на тени. Тень зависит от того,
        что оказалось за ней в кадре: замер показал 2.56:1 на тёмной сцене третьего
        протокола — читать невозможно. Подложка даёт одинаковый контраст везде.
      */}
      <figcaption className="mt-sp2 flex items-baseline justify-between gap-sp2 rounded-chip bg-[color-mix(in_oklab,var(--color-ground-deep)_82%,transparent)] px-sp2 py-1">
        <span className="label-mono text-ink">протокол {protocolNo}</span>
        <span className={cn('label-mono', hasVideo ? 'text-ink-2' : 'text-ink')}>
          {hasVideo ? (video.duration ? formatDuration(video.duration) : '--:--') : 'материал будет здесь'}
        </span>
      </figcaption>
    </figure>
  )
}

/** Читает/пишет video_N_seconds и video_N_completed по имени eventPrefix ('video1' → N=1). */
function useStoreVideoFields(eventPrefix: 'video1' | 'video2' | 'video3') {
  const storedSeconds = useProgress((s) =>
    eventPrefix === 'video1'
      ? s.video_1_seconds
      : eventPrefix === 'video2'
        ? s.video_2_seconds
        : s.video_3_seconds,
  )
  const storedCompleted = useProgress((s) =>
    eventPrefix === 'video1'
      ? s.video_1_completed
      : eventPrefix === 'video2'
        ? s.video_2_completed
        : s.video_3_completed,
  )
  const mark = useProgress((s) => s.mark)

  const saveSeconds = useCallback(
    (seconds: number) => {
      const key: 'video_1_seconds' | 'video_2_seconds' | 'video_3_seconds' =
        eventPrefix === 'video1'
          ? 'video_1_seconds'
          : eventPrefix === 'video2'
            ? 'video_2_seconds'
            : 'video_3_seconds'
      mark(key, seconds)
    },
    [eventPrefix, mark],
  )

  return { storedSeconds, storedCompleted, saveSeconds }
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = Math.round(seconds % 60)
  return `${m}:${String(s).padStart(2, '0')}`
}
