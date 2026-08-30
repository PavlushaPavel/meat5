import { motion } from 'motion/react'
import { Screen } from '../ui/Screen'
import { Scene } from '../ui/Scene'
import { Subtitles } from '../ui/Subtitles'
import { CityAccent } from '../ui/CityAccent'
import { CityDistrictLabel } from '../ui/CityDistrictLabel'
import { MessageCard } from '../ui/MessageCard'
import { VoiceBar } from '../ui/VoiceBar'
import { Character } from '../ui/Character'
import { Button } from '../ui/Button'
import { BottomBar } from '../ui/BottomBar'
import { CTA, CITY_SCRIPT, type Line } from '../content/copy'
import { config } from '../config'
import { useVoice } from '../lib/useVoice'
import { track, trackOnce } from '../lib/analytics'
import { useProgress } from '../store/progress'
import { DUR, EASE_OUT } from '../lib/motion'
import { asset } from '../lib/asset'
import { useEffect } from 'react'

/**
 * Экран 1. Входящее сообщение (STATE01, SPEC.md §4–§5, DESIGN.md §8.1).
 *
 * Три фазы одного экрана, а не три раздельных состояния маршрута:
 *
 * A — idle. До нажатия play на кадре нет НИЧЕГО, кроме имитации сообщения
 *     Telegram: отправитель, аватар, статичная карточка голосового. Никакого
 *     заголовка и обещания — это ровно то, что запрещает DESIGN.md §8.1.
 * B — voice. Играет единственное голосовое во всём приложении (SPEC.md §2) и
 *     одновременно идёт cinematic-пролёт по Городу трафика: субтитры, акценты,
 *     метка района. Человек ничего не нажимает — сцена идёт сама, только пауза
 *     /mute/replay/скорость остаются доступны.
 * C — done. Голос отыгран. Единственное действие — «Войти»: после него голос
 *     в приложении больше никогда не звучит (весь остальной маршрут читается).
 */

/** Кадры пролёта в порядке появления: приветственная арка → районы → холм
 * конверсий → дверь Трафик Лаб. Мало кадров — сцена всё равно движется, потому
 * что каждый снимок сам по себе медленно дышит (ken burns), а districts несёт
 * основную часть монолога. */
const FRAMES = ['world/city-gate.webp', 'world/city-districts.webp', 'world/city-conversions.webp', 'world/lab-exterior.webp']

function frameForLine(index: number, district?: Line['district']): string {
  if (index === 0) return FRAMES[0]
  if (district === 'conversions') return FRAMES[2]
  if (district === 'lab') return FRAMES[3]
  return FRAMES[1]
}

export function MessageScreen({ onNext }: { onNext: () => void }) {
  const mark = useProgress((s) => s.mark)
  const introStarted = useProgress((s) => s.intro_started)
  const voice = useVoice(CITY_SCRIPT, config.introAudioUrl || undefined)
  const phase: 'idle' | 'voice' | 'done' = !voice.started ? 'idle' : voice.done ? 'done' : 'voice'
  const frame = FRAMES.indexOf(frameForLine(voice.index, voice.line?.district))

  useEffect(() => {
    track('intro_message_viewed')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (!voice.playing) return
    if (!introStarted) mark('intro_started', true)
    trackOnce('intro_audio_started')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [voice.playing])

  useEffect(() => {
    if (voice.progress >= 0.25) trackOnce('intro_audio_25')
    if (voice.progress >= 0.5) trackOnce('intro_audio_50')
    if (voice.progress >= 0.75) trackOnce('intro_audio_75')
  }, [voice.progress])

  useEffect(() => {
    if (!voice.done) return
    track('intro_audio_completed')
    mark('intro_completed', true)
    // Дальше человек сам решает, когда войти (Фаза C, CTA.enter) — маршрут не
    // переключается автоматически.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [voice.done])

  return (
    <Screen bare>
      <CityFlight frame={frame} active={phase !== 'idle'} />
      {phase !== 'idle' && <Character height="54vh" delay={0.1} />}

      <div className="relative z-20 flex flex-1 flex-col px-[var(--gutter)] pt-sp5">
        {phase !== 'idle' && (
          <CityDistrictLabel district={voice.line?.district} className="mb-sp1" />
        )}

        <div className="flex-1" />

        {phase === 'idle' && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: DUR.scene, ease: EASE_OUT }}
            className="mb-sp4"
          >
            <MessageCard />
          </motion.div>
        )}

        {phase === 'voice' &&
          (voice.line?.accent ? (
            <CityAccent text={voice.line.accent} className="mb-sp4" />
          ) : (
            <Subtitles line={voice.line} className="mb-sp4" />
          ))}

        {phase === 'voice' && (
          <VoiceBar
            playing={voice.playing}
            progress={voice.progress}
            remaining={voice.remaining}
            rate={voice.rate}
            muted={voice.muted}
            onToggle={voice.toggle}
            onCycleRate={voice.cycleRate}
            onToggleMute={voice.toggleMute}
            onReplay={voice.replay}
            className="mb-sp4"
          />
        )}
      </div>

      <BottomBar>
        {phase === 'idle' && <Button onClick={voice.toggle}>{CTA.listen}</Button>}
        {phase === 'done' && <Button onClick={onNext}>{CTA.enter}</Button>}
      </BottomBar>
    </Screen>
  )
}

/**
 * Пролёт по городу: кадры не сменяются рывком, а перетекают, и каждый всё это
 * время медленно наезжает. Получается движение камеры, а не слайдшоу.
 *
 * До начала голосового (Фаза A) кадр стоит неподвижно на арке — это фон
 * карточки сообщения, а не ещё один рассказ поверх него.
 */
function CityFlight({ frame, active }: { frame: number; active: boolean }) {
  return (
    <div className="absolute inset-0 z-0 overflow-hidden">
      {!active ? (
        <Scene src={asset(FRAMES[0])} still />
      ) : (
        <>
          {FRAMES.map((src, i) => (
            <motion.img
              key={src}
              src={asset(src)}
              alt=""
              aria-hidden
              decoding="async"
              initial={{ opacity: i === 0 ? 1 : 0, scale: 1.04, y: '0%' }}
              animate={
                i === frame
                  ? { opacity: 1, scale: 1.16, y: '-4%' }
                  : { opacity: 0, scale: 1.04, y: '0%' }
              }
              transition={{
                opacity: { duration: 1.2, ease: EASE_OUT },
                scale: { duration: 26, ease: 'linear' },
                y: { duration: 26, ease: 'linear' },
              }}
              className="absolute inset-0 h-full w-full object-cover object-top will-change-transform motion-reduce:!scale-100 motion-reduce:!translate-y-0"
            />
          ))}
          <div
            aria-hidden
            className="absolute inset-0"
            style={{
              background:
                'linear-gradient(to bottom, color-mix(in oklab, var(--color-ground-deep) 62%, transparent) 0%, color-mix(in oklab, var(--color-ground-deep) 12%, transparent) 26%, color-mix(in oklab, var(--color-ground-deep) 34%, transparent) 62%, color-mix(in oklab, var(--color-ground) 88%, transparent) 100%)',
            }}
          />
        </>
      )}
    </div>
  )
}
