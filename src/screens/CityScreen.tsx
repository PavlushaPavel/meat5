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
import { CITY_SCRIPT } from '../content/script'
import { config } from '../config'
import { useVoice } from '../lib/useVoice'
import { track } from '../lib/analytics'
import { useProgress } from '../store/progress'
import { DUR, EASE_OUT } from '../lib/motion'
import { asset } from '../lib/asset'

/**
 * Экран 1. Вход в Город трафика.
 *
 * ДОРОГОЙ МОУШН №1. Сцена идёт сама 60–90 секунд после того, как человек нажал
 * play на голосовом. Слои кадра: город → ведущий на переднем плане → текст поверх
 * всего. Перекрытие — приём: заголовок и субтитры ЛОЖАТСЯ на кадр и на фигуру.
 */
export function CityScreen({ onNext }: { onNext: () => void }) {
  const mark = useProgress((s) => s.mark)
  const voice = useVoice(CITY_SCRIPT, config.voice.city || undefined)
  const revealed = voice.done

  useEffect(() => {
    if (voice.playing) track('city_started')
  }, [voice.playing])

  useEffect(() => {
    if (!revealed) return
    track('city_completed')
    mark('intro_completed', true)
  }, [revealed, mark])

  // План меняется на репликах-поворотах: камера идёт по городу.
  const scenes = [
    asset('world/city-gate.webp'),
    asset('world/city-districts.webp'),
    asset('world/city-conversions.webp'),
  ]
  const sceneSrc = revealed
    ? asset('world/lab-exterior.webp')
    : scenes[Math.min(Math.floor(voice.index / 5), scenes.length - 1)]

  return (
    <Screen bare>
      <Scene src={sceneSrc} align="top" still={revealed} />
      {!revealed && <Character height="58vh" delay={0.15} />}

      <div className="relative z-20 flex flex-1 flex-col px-[var(--gutter)] pt-sp5">
        <motion.h1
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: DUR.scene, ease: EASE_OUT }}
          className="display-xl on-scene max-w-[7ch] text-ink"
        >
          {revealed ? 'Трафик Лаб' : 'Город трафика'}
        </motion.h1>

        {/* Кадр «доступ ограничен» раньше был пустым: заголовок и кнопка на фото.
            Теперь он показывает, ЧТО за дверью — три элемента связки, все закрытые. */}
        {revealed && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: DUR.scene, ease: EASE_OUT, delay: 0.1 }}
            className="mt-sp4"
          >
            <span className="label-mono inline-block rounded-chip border border-alert/60 bg-[color-mix(in_oklab,var(--color-ground-deep)_80%,transparent)] px-sp2 py-[6px] text-alert backdrop-blur-[4px]">
              доступ ограничен
            </span>

            <p className="on-scene mt-sp4 max-w-[32ch] text-[17px] leading-snug text-ink">
              За дверью три элемента рекламной связки. Ни один пока не открыт.
            </p>

            <div className="mt-sp4">
              <NodeRail step="city" onScene />
            </div>
          </motion.div>
        )}

        <div className="flex-1" />

        {!revealed && (
          <>
            <Subtitles
              line={voice.started ? voice.line : undefined}
              hint="Включай голос — дальше полторы минуты про то, что здесь будет происходить."
              className="mb-sp4"
            />
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
