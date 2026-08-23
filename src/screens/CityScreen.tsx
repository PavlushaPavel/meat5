import { useEffect } from 'react'
import { motion } from 'motion/react'
import { Screen } from '../ui/Screen'
import { Scene } from '../ui/Scene'
import { Subtitles } from '../ui/Subtitles'
import { VoiceBar } from '../ui/VoiceBar'
import { Character } from '../ui/Character'
import { NodeRail } from '../ui/NodeRail'
import { Button } from '../ui/Button'
import { BottomBar } from '../ui/BottomBar'
import { BIG_PROMISE, CITY_SCRIPT } from '../content/script'
import { config } from '../config'
import { useVoice } from '../lib/useVoice'
import { track } from '../lib/analytics'
import { useProgress } from '../store/progress'
import { DUR, EASE_OUT } from '../lib/motion'
import { asset } from '../lib/asset'

/**
 * Экран 1. Вход в Город трафика.
 *
 * ДОРОГОЙ МОУШН №1: камера идёт по городу непрерывно, кадры не переключаются
 * рывком, а перетекают друг в друга на репликах-поворотах.
 *
 * Большое обещание стоит ТЕКСТОМ, а не только в голосе: «Пропустить» нажмут
 * многие, и человек не должен уйти в лабораторию, не поняв, ради чего всё это.
 */
const FRAMES = ['world/city-gate.webp', 'world/city-districts.webp', 'world/city-conversions.webp']

export function CityScreen({ onNext }: { onNext: () => void }) {
  const mark = useProgress((s) => s.mark)
  const voice = useVoice(CITY_SCRIPT, config.voice.city || undefined)
  const revealed = voice.done
  const frame = Math.min(Math.floor(voice.index / 5), FRAMES.length - 1)

  useEffect(() => {
    if (voice.playing) track('city_started')
  }, [voice.playing])

  useEffect(() => {
    if (!revealed) return
    track('city_completed')
    mark('intro_completed', true)
  }, [revealed, mark])

  return (
    <Screen bare>
      {revealed ? (
        <Scene src={asset('world/lab-exterior.webp')} align="top" still />
      ) : (
        <CityFlight frame={frame} />
      )}
      {!revealed && <Character height="56vh" delay={0.15} />}

      <div className="relative z-20 flex flex-1 flex-col px-[var(--gutter)] pt-sp5">
        <motion.h1
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: DUR.scene, ease: EASE_OUT }}
          className="display-xl on-scene max-w-[7ch] text-ink"
        >
          {revealed ? 'Трафик Лаб' : 'Город трафика'}
        </motion.h1>

        {/* Кадр у закрытой лаборатории: сюда попадают и те, кто дослушал,
            и те, кто нажал «Пропустить». Обещание обязано быть здесь. */}
        {revealed && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: DUR.scene, ease: EASE_OUT, delay: 0.1 }}
            className="relative mt-sp4"
          >
            {/* Подложка: обещание лежит на светящемся городе и без неё тонет. */}
            <div
              aria-hidden
              className="pointer-events-none absolute -inset-x-[var(--gutter)] -top-sp4 -bottom-sp6 -z-10"
              style={{
                background:
                  'linear-gradient(to bottom, color-mix(in oklab, var(--color-ground-deep) 55%, transparent) 0%, color-mix(in oklab, var(--color-ground-deep) 86%, transparent) 45%, color-mix(in oklab, var(--color-ground-deep) 78%, transparent) 100%)',
              }}
            />
            <span className="label-mono inline-block rounded-chip border border-alert/60 bg-[color-mix(in_oklab,var(--color-ground-deep)_80%,transparent)] px-sp2 py-[6px] text-alert backdrop-blur-[4px]">
              доступ ограничен
            </span>

            <p className="on-scene mt-sp4 max-w-[30ch] text-[19px] leading-snug font-semibold text-ink">
              {BIG_PROMISE.headline}
            </p>
            <p className="on-scene mt-sp3 max-w-[38ch] text-[15px] leading-relaxed text-ink-2">
              {BIG_PROMISE.support}
            </p>

            <p className="on-scene mt-sp4 max-w-[32ch] text-[15px] leading-relaxed text-ink">
              За дверью три элемента рекламной связки. Ни один пока не открыт.
            </p>
            <div className="mt-sp3">
              <NodeRail step="city" onScene />
            </div>
          </motion.div>
        )}

        <div className="flex-1" />

        {!revealed && (
          <>
            {voice.started ? (
              <Subtitles line={voice.line} className="mb-sp4" />
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: DUR.scene, ease: EASE_OUT, delay: 0.25 }}
                className="relative mb-sp4"
              >
                <div
                  aria-hidden
                  className="pointer-events-none absolute -inset-x-[var(--gutter)] -top-sp6 -bottom-sp5 -z-10"
                  style={{
                    background:
                      'linear-gradient(to bottom, transparent 0%, color-mix(in oklab, var(--color-ground-deep) 78%, transparent) 32%, color-mix(in oklab, var(--color-ground-deep) 90%, transparent) 100%)',
                  }}
                />
                <p className="on-scene max-w-[26ch] text-[22px] leading-[1.24] font-semibold text-ink">
                  {BIG_PROMISE.headline}
                </p>
                <p className="on-scene mt-sp3 max-w-[34ch] text-[15px] leading-relaxed text-ink-2">
                  {BIG_PROMISE.listen}
                </p>
              </motion.div>
            )}

            <VoiceBar
              playing={voice.playing}
              progress={voice.progress}
              remaining={voice.remaining}
              rate={voice.rate}
              onToggle={voice.toggle}
              onCycleRate={voice.cycleRate}
              className="mb-sp4"
            />
          </>
        )}
      </div>

      <BottomBar>
        {revealed ? (
          <Button onClick={onNext}>Войти в лабораторию</Button>
        ) : (
          <Button variant="ghost" onClick={voice.finish}>
            Пропустить
          </Button>
        )}
      </BottomBar>
    </Screen>
  )
}

/**
 * Пролёт по городу: кадры не сменяются рывком, а перетекают, и каждый всё это
 * время медленно наезжает. Получается движение камеры, а не слайдшоу.
 */
function CityFlight({ frame }: { frame: number }) {
  return (
    <div className="absolute inset-0 z-0 overflow-hidden">
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
            'linear-gradient(to bottom, color-mix(in oklab, var(--color-ground-deep) 78%, transparent) 0%, color-mix(in oklab, var(--color-ground-deep) 24%, transparent) 30%, color-mix(in oklab, var(--color-ground-deep) 46%, transparent) 58%, var(--color-ground) 92%)',
        }}
      />
    </div>
  )
}
