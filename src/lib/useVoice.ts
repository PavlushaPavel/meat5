import { useCallback, useEffect, useRef, useState } from 'react'
import type { Line } from '../content/script'

/**
 * Голосовое сообщение сцены.
 *
 * Человек жмёт play — дальше сцена идёт сама. Реплики сменяются по таймингам из
 * сценария; когда придёт настоящая озвучка, тайминги растягиваются под реальную
 * длительность файла, и переписывать сценарий не придётся.
 *
 * Автоплей не делаем: он запрещён браузерами со звуком и запрещён нами (DESIGN.md §2.12).
 */
export function useVoice(lines: Line[], audioUrl?: string) {
  const totalScript = lines.reduce((sum, l) => sum + l.hold, 0)
  const [elapsed, setElapsed] = useState(0)
  const elapsedRef = useRef(0)
  const [playing, setPlaying] = useState(false)
  const [duration, setDuration] = useState(totalScript)
  const [rate, setRate] = useState(1)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const rafRef = useRef<number | undefined>(undefined)
  const rateRef = useRef(1)
  const startedAt = useRef(0)
  const offset = useRef(0)

  // Аудио появляется позже: до тех пор сцену ведёт таймер по сценарию.
  useEffect(() => {
    if (!audioUrl) return
    const el = new Audio(audioUrl)
    audioRef.current = el
    const onMeta = () => setDuration(el.duration * 1000)
    el.addEventListener('loadedmetadata', onMeta)
    return () => {
      el.pause()
      el.removeEventListener('loadedmetadata', onMeta)
      audioRef.current = null
    }
  }, [audioUrl])

  const tick = useCallback(() => {
    const el = audioRef.current
    const now = el
      ? el.currentTime * 1000
      : offset.current + (performance.now() - startedAt.current) * rateRef.current
    elapsedRef.current = Math.min(now, duration)
    setElapsed(elapsedRef.current)
    if (now >= duration) {
      setPlaying(false)
      return
    }
    rafRef.current = requestAnimationFrame(tick)
  }, [duration])

  useEffect(() => {
    if (!playing) return
    startedAt.current = performance.now()
    rafRef.current = requestAnimationFrame(tick)
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      offset.current = elapsedRef.current
    }
  }, [playing, tick])

  /** Скорость по кругу: 1× → 1.5× → 2× → 1×. Больше двух — уже неразборчиво. */
  const cycleRate = useCallback(() => {
    setRate((prev) => {
      const next = prev === 1 ? 1.5 : prev === 1.5 ? 2 : 1
      // Переключение на ходу не должно дёргать прогресс: фиксируем накопленное.
      offset.current = elapsedRef.current
      startedAt.current = performance.now()
      rateRef.current = next
      if (audioRef.current) audioRef.current.playbackRate = next
      return next
    })
  }, [])

  const toggle = useCallback(() => {
    const el = audioRef.current
    setPlaying((p) => {
      if (el) {
        if (p) {
          el.pause()
        } else {
          el.playbackRate = rateRef.current
          void el.play()
        }
      }
      return !p
    })
  }, [])

  /** Досмотреть сразу: пропуск не должен требовать ждать конца реплики. */
  const finish = useCallback(() => {
    audioRef.current?.pause()
    setPlaying(false)
    elapsedRef.current = duration
    setElapsed(duration)
    offset.current = duration
  }, [duration])

  // Какая реплика звучит сейчас: масштабируем сценарные тайминги под реальную длину.
  const scale = duration / totalScript
  let acc = 0
  let index = 0
  for (let i = 0; i < lines.length; i++) {
    acc += lines[i].hold * scale
    if (elapsed < acc) {
      index = i
      break
    }
    index = i
  }

  /** Оставшееся время считаем с учётом скорости: на 2× ждать вдвое меньше. */
  const remaining = Math.max(0, duration - elapsed) / rate

  return {
    playing,
    toggle,
    finish,
    rate,
    cycleRate,
    remaining,
    index,
    line: lines[index],
    elapsed,
    duration,
    progress: duration ? Math.min(1, elapsed / duration) : 0,
    done: elapsed >= duration && duration > 0,
    started: elapsed > 0 || playing,
  }
}
