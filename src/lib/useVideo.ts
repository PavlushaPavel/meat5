import { useCallback, useEffect, useRef, useState, type RefObject } from 'react'

/**
 * Логика собственного плеера (SPEC.md §38).
 *
 * Вынесена из VideoBlock, чтобы сам компонент оставался версткой + разметкой,
 * а весь стейт-машины (буферизация, ошибки, честный watched-share, троттлинг
 * сохранения позиции) жил в одном месте и был читаем отдельно от JSX.
 *
 * HLS.js подключается ДИНАМИЧЕСКИ (import()) и только когда встречается
 * .m3u8-ссылка, которую браузер не умеет нативно (не Safari/iOS) — §39
 * запрещает тащить тяжёлое в первый экран, а видео не на первом экране,
 * но библиотека всё равно грузится лениво, только по необходимости.
 */

export const PLAYBACK_RATES = [1, 1.25, 1.5, 2] as const
export type PlaybackRate = (typeof PLAYBACK_RATES)[number]

/** Минимальная доля просмотра, чтобы засчитать протокол честным (SPEC.md §8). */
export const COMPLETION_THRESHOLD = 0.85
/** Ниже этой секунды продолжение не предлагаем — там и предлагать нечего. */
const RESUME_MIN_SECONDS = 5
/** Не пишем позицию в стор чаще, чем раз в это время — не засоряем localStorage. */
const SAVE_INTERVAL_MS = 5000
/** Простая пауза плеера дольше этого — считаем зависанием сети, а не миганием буфера. */
const STALL_GRACE_MS = 350

export type VideoStatus = 'idle' | 'ready' | 'buffering' | 'error'

/** Screen Orientation API умеет lock/unlock не во всех типах lib.dom и не во всех браузерах. */
type OrientationLockable = ScreenOrientation & {
  lock?: (orientation: string) => Promise<void>
  unlock?: () => void
}

export interface UseVideoOptions {
  url: string
  /** Длительность из конфига (может быть 0 — неизвестна заранее). */
  configDuration: number
  /** Секунда, с которой открыть видео принудительно — выше приоритета, чем резюме. */
  seekTo?: number
  /** Сохранённая позиция из стора (video_N_seconds). */
  storedSeconds: number
  /** Досмотрено ли видео раньше — если да, резюме не предлагаем. */
  storedCompleted: boolean
  /** Пишет секунду в стор — не чаще раза в SAVE_INTERVAL_MS. */
  onSaveSeconds: (seconds: number) => void
  onStarted: () => void
  onProgress?: (share: number) => void
  onMilestone: (share: number) => void
  onCompleted: () => void
}

export function useVideo(ref: RefObject<HTMLVideoElement | null>, opts: UseVideoOptions) {
  const {
    url,
    configDuration,
    seekTo,
    storedSeconds,
    storedCompleted,
    onSaveSeconds,
    onStarted,
    onProgress,
    onMilestone,
    onCompleted,
  } = opts

  const hasVideo = Boolean(url)

  const [started, setStarted] = useState(false)
  const startedRef = useRef(false)
  const [playing, setPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(configDuration || 0)
  const [muted, setMuted] = useState(false)
  const [rate, setRate] = useState<PlaybackRate>(1)
  const [status, setStatus] = useState<VideoStatus>('idle')
  const [fullscreen, setFullscreen] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)

  // Предложение продолжить с места — считается один раз при монтировании,
  // до того как человек успел что-то нажать.
  const [resumeAt] = useState<number | null>(() => {
    if (!hasVideo || storedCompleted || seekTo !== undefined) return null
    return storedSeconds > RESUME_MIN_SECONDS ? storedSeconds : null
  })
  const [resumeDismissed, setResumeDismissed] = useState(false)

  const lastSaveRef = useRef(0)
  const completedRef = useRef(false)
  const hlsRef = useRef<import('hls.js').default | null>(null)
  const stallTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [reloadNonce, setReloadNonce] = useState(0)

  // ---- подключение источника: hls.js только когда правда нужен ------------
  useEffect(() => {
    const el = ref.current
    if (!el || !hasVideo) return
    let cancelled = false

    setStatus('idle')
    completedRef.current = false

    const isM3u8 = url.endsWith('.m3u8')
    const nativeHls = isM3u8 && el.canPlayType('application/vnd.apple.mpegurl') !== ''

    const resumeIfWasPlaying = () => {
      if (startedRef.current) void el.play().catch(() => {})
    }

    if (!isM3u8 || nativeHls) {
      el.src = url
      if (reloadNonce > 0) resumeIfWasPlaying()
    } else {
      void import('hls.js').then(({ default: Hls }) => {
        if (cancelled) return
        if (Hls.isSupported()) {
          const hls = new Hls()
          hlsRef.current = hls
          hls.loadSource(url)
          hls.attachMedia(el)
          hls.on(Hls.Events.ERROR, (_evt, data) => {
            if (data.fatal) setStatus('error')
          })
          if (reloadNonce > 0) resumeIfWasPlaying()
        } else {
          // Ни MSE, ни нативной поддержки нет — честно показываем ошибку,
          // а не немой чёрный прямоугольник.
          setStatus('error')
        }
      })
    }

    return () => {
      cancelled = true
      if (hlsRef.current) {
        hlsRef.current.destroy()
        hlsRef.current = null
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasVideo, url, reloadNonce])

  // ---- принудительный seekTo (пересмотр момента) — приоритет над резюме ---
  useEffect(() => {
    const el = ref.current
    if (!el || !hasVideo || seekTo === undefined) return
    const onReady = () => {
      el.currentTime = seekTo
      setStarted(true)
      startedRef.current = true
      void el.play()
    }
    if (el.readyState >= 1) onReady()
    else el.addEventListener('loadedmetadata', onReady, { once: true })
    return () => el.removeEventListener('loadedmetadata', onReady)
  }, [hasVideo, seekTo, ref])

  // ---- watched-share: суммируем el.played, а не доверяем currentTime -----
  const watchedShare = useCallback((el: HTMLVideoElement): number => {
    const dur = el.duration
    if (!dur || !Number.isFinite(dur)) return 0
    let watched = 0
    for (let i = 0; i < el.played.length; i++) {
      watched += el.played.end(i) - el.played.start(i)
    }
    return Math.min(1, watched / dur)
  }, [])

  // ---- события медиа-элемента ---------------------------------------------
  useEffect(() => {
    const el = ref.current
    if (!el || !hasVideo) return

    const clearStallTimer = () => {
      if (stallTimerRef.current) {
        clearTimeout(stallTimerRef.current)
        stallTimerRef.current = null
      }
    }

    const onLoadedMeta = () => {
      if (el.duration && Number.isFinite(el.duration)) setDuration(el.duration)
      setStatus('ready')
    }

    const onTime = () => {
      setCurrentTime(el.currentTime)
      if (!el.duration || !Number.isFinite(el.duration)) return

      const share = el.currentTime / el.duration
      onProgress?.(share)
      onMilestone(share)

      const now = Date.now()
      if (now - lastSaveRef.current >= SAVE_INTERVAL_MS) {
        lastSaveRef.current = now
        onSaveSeconds(el.currentTime)
      }
    }

    const onPlay = () => {
      setPlaying(true)
      setStatus('ready')
      setNotice(null)
    }
    const onPause = () => {
      setPlaying(false)
      // Сохраняем позицию сразу на паузе — человек мог закрыть Mini App следом.
      onSaveSeconds(el.currentTime)
    }

    const finishIfEarned = () => {
      if (completedRef.current) return
      const share = watchedShare(el)
      if (share >= COMPLETION_THRESHOLD) {
        completedRef.current = true
        onCompleted()
      } else {
        setNotice('Досмотрите протокол честно — перемотка в конец не засчитывается.')
      }
    }

    const onEnded = () => {
      setPlaying(false)
      finishIfEarned()
    }

    const onWaiting = () => {
      clearStallTimer()
      stallTimerRef.current = setTimeout(() => setStatus('buffering'), STALL_GRACE_MS)
    }
    const onStalled = onWaiting
    const onPlaying = () => {
      clearStallTimer()
      setStatus('ready')
    }
    const onCanPlay = () => {
      clearStallTimer()
      setStatus((s) => (s === 'buffering' ? 'ready' : s))
    }
    const onError = () => {
      clearStallTimer()
      setStatus('error')
    }

    el.addEventListener('loadedmetadata', onLoadedMeta)
    el.addEventListener('timeupdate', onTime)
    el.addEventListener('play', onPlay)
    el.addEventListener('pause', onPause)
    el.addEventListener('ended', onEnded)
    el.addEventListener('waiting', onWaiting)
    el.addEventListener('stalled', onStalled)
    el.addEventListener('playing', onPlaying)
    el.addEventListener('canplay', onCanPlay)
    el.addEventListener('error', onError)
    return () => {
      clearStallTimer()
      el.removeEventListener('loadedmetadata', onLoadedMeta)
      el.removeEventListener('timeupdate', onTime)
      el.removeEventListener('play', onPlay)
      el.removeEventListener('pause', onPause)
      el.removeEventListener('ended', onEnded)
      el.removeEventListener('waiting', onWaiting)
      el.removeEventListener('stalled', onStalled)
      el.removeEventListener('playing', onPlaying)
      el.removeEventListener('canplay', onCanPlay)
      el.removeEventListener('error', onError)
    }
  }, [hasVideo, ref, onProgress, onMilestone, onSaveSeconds, onCompleted, watchedShare])

  // ---- fullscreen change (в т.ч. системный выход по Esc/жесту) -----------
  useEffect(() => {
    const onChange = () => {
      const isFullscreen = Boolean(document.fullscreenElement)
      setFullscreen(isFullscreen)
      if (!isFullscreen) {
        try {
          const orientation = screen.orientation as OrientationLockable | undefined
          orientation?.unlock?.()
        } catch {
          // игнорируем — не всякий браузер это умеет
        }
      }
    }
    document.addEventListener('fullscreenchange', onChange)
    return () => document.removeEventListener('fullscreenchange', onChange)
  }, [])

  // ---- сохранить позицию при размонтировании (уход с экрана) -------------
  useEffect(
    () => () => {
      const el = ref.current
      if (el && hasVideo && el.currentTime > 0) onSaveSeconds(el.currentTime)
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  )

  const play = useCallback(
    (fromSeconds?: number) => {
      const el = ref.current
      if (!el) return
      if (fromSeconds !== undefined) el.currentTime = fromSeconds
      void el.play()
    },
    [ref],
  )

  const begin = useCallback(
    (fromSeconds?: number) => {
      setStarted(true)
      startedRef.current = true
      setResumeDismissed(true)
      onStarted()
      if (hasVideo) play(fromSeconds)
      // Без файла материал ещё не прислан — вызывающий (VideoBlock) сам
      // засчитывает протокол напрямую через onCompleted, минуя эту функцию:
      // здесь у нас нет доступа к «сырому» пропу onCompleted, только к его
      // обёртке с аналитикой, а фиктивный просмотр не должен слать
      // `*_completed` в аналитику наравне с честным.
    },
    [hasVideo, onStarted, play],
  )

  const togglePlay = useCallback(() => {
    const el = ref.current
    if (!el) return
    if (el.paused) void el.play()
    else el.pause()
  }, [ref])

  const seek = useCallback(
    (seconds: number) => {
      const el = ref.current
      if (!el) return
      el.currentTime = Math.max(0, Math.min(seconds, el.duration || seconds))
      setCurrentTime(el.currentTime)
    },
    [ref],
  )

  const cycleRate = useCallback(() => {
    const el = ref.current
    if (!el) return
    const idx = PLAYBACK_RATES.indexOf(rate)
    const next = PLAYBACK_RATES[(idx + 1) % PLAYBACK_RATES.length]
    el.playbackRate = next
    setRate(next)
  }, [ref, rate])

  const toggleMute = useCallback(() => {
    const el = ref.current
    if (!el) return
    el.muted = !el.muted
    setMuted(el.muted)
  }, [ref])

  const toggleFullscreen = useCallback(() => {
    const el = ref.current
    const container = el?.parentElement
    if (!el) return
    if (document.fullscreenElement) {
      void document.exitFullscreen()
      return
    }
    if (container?.requestFullscreen) {
      void container
        .requestFullscreen()
        .then(() => {
          // Лучшее из возможного: где Screen Orientation API есть — сразу горизонтально.
          // Не поддерживается почти нигде на iOS, поэтому ошибку тихо проглатываем.
          const orientation = screen.orientation as OrientationLockable | undefined
          void orientation?.lock?.('landscape').catch(() => {})
        })
        .catch(() => {
          // Фолбэк на iPhone: полноэкранный режим есть только у самого <video>.
          const withIosFullscreen = el as HTMLVideoElement & { webkitEnterFullscreen?: () => void }
          withIosFullscreen.webkitEnterFullscreen?.()
        })
    } else {
      const withIosFullscreen = el as HTMLVideoElement & { webkitEnterFullscreen?: () => void }
      withIosFullscreen.webkitEnterFullscreen?.()
    }
  }, [ref])

  const retry = useCallback(() => {
    setStatus('idle')
    // Меняет зависимость эффекта источника — переустанавливает и <video src>,
    // и hls.js-инстанс заново, а не просто дёргает .load() на пустом месте.
    setReloadNonce((n) => n + 1)
  }, [])

  return {
    hasVideo,
    started,
    playing,
    currentTime,
    duration,
    muted,
    rate,
    status,
    fullscreen,
    notice,
    resumeAt: resumeDismissed ? null : resumeAt,
    begin,
    togglePlay,
    seek,
    cycleRate,
    toggleMute,
    toggleFullscreen,
    retry,
  }
}
