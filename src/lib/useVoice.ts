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
  const [playing, setPlaying] = useState(false)
  const [duration, setDuration] = useState(totalScript)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const rafRef = useRef<number | undefined>(undefined)
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
    const now = el ? el.currentTime * 1000 : offset.current + (performance.now() - startedAt.current)
    setElapsed(Math.min(now, duration))
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
      offset.current = elapsed
    }
    // elapsed намеренно не в зависимостях: он меняется каждый кадр и перезапустил бы цикл
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing, tick])

  const toggle = useCallback(() => {
    const el = audioRef.current
    setPlaying((p) => {
      if (el) {
        if (p) el.pause()
        else void el.play()
      }
      return !p
    })
  }, [])

  /** Досмотреть сразу: пропуск не должен требовать ждать конца реплики. */
  const finish = useCallback(() => {
    audioRef.current?.pause()
    setPlaying(false)
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

  return {
    playing,
    toggle,
    finish,
    index,
    line: lines[index],
    elapsed,
    duration,
    progress: duration ? Math.min(1, elapsed / duration) : 0,
    done: elapsed >= duration && duration > 0,
    started: elapsed > 0 || playing,
  }
}
