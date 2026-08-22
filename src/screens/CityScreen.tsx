import { useEffect, useState } from 'react'
import { motion } from 'motion/react'
import { Screen } from '../ui/Screen'
import { Scene } from '../ui/Scene'
import { Subtitles } from '../ui/Subtitles'
import { Speaker } from '../ui/Speaker'
import { Button } from '../ui/Button'
import { BottomBar } from '../ui/BottomBar'
import { CITY_SCRIPT } from '../content/script'
import { track } from '../lib/analytics'
import { useProgress } from '../store/progress'
import { DUR, EASE_OUT } from '../lib/motion'
import { asset } from '../lib/asset'

/**
 * Экран 1. Вход в Город трафика.
 *
 * ДОРОГОЙ МОУШН №1 (DESIGN.md §6). Кадр идёт сам 60–90 секунд: камера ведёт по
 * городу, на репликах-поворотах план меняется, субтитры набегают снизу. Человек
 * не нажимает ничего каждые пять секунд — он смотрит кино.
 *
 * Последний кадр: город раскрывается и появляется закрытая лаборатория.
 */
export function CityScreen({ onNext }: { onNext: () => void }) {
  const mark = useProgress((s) => s.mark)
  const [phase, setPhase] = useState<'idle' | 'running' | 'reveal'>('idle')
  const [beat, setBeat] = useState(0)

  useEffect(() => {
    if (phase === 'running') track('city_started')
  }, [phase])

  const scenes = [asset('world/city-gate.webp'), asset('world/city-districts.webp'), asset('world/city-conversions.webp')]
  const sceneSrc = scenes[Math.min(beat, scenes.length - 1)]

  return (
    <Screen bare>
      <Scene src={phase === 'reveal' ? asset('world/lab-exterior.webp') : sceneSrc} align="top" still={phase === 'reveal'} />

      <div className="relative z-10 flex flex-1 flex-col justify-end px-[var(--gutter)] pb-sp4">
        {phase === 'idle' && (
          <motion.div {...{ initial: { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0 } }} transition={{ duration: DUR.scene, ease: EASE_OUT }}>
            <h1 className="display-xl text-balance text-ink">
              Город
              <br />
              трафика
            </h1>
            <p className="mt-sp3 max-w-[34ch] text-[16px] leading-snug text-ink-2">
              Здесь начинается маршрут. Дальше — голосом, за полторы минуты.
            </p>
          </motion.div>
        )}

        {phase !== 'idle' && (
          <div className="flex items-end gap-sp3">
            {phase === 'running' && <Speaker className="mb-sp1" />}
            <Subtitles
              lines={CITY_SCRIPT}
              running={phase === 'running'}
              onBeat={(i) => setBeat(Math.floor(i / 5))}
              onDone={() => {
                track('city_completed')
                mark('intro_completed', true)
                setPhase('reveal')
              }}
            />
          </div>
        )}

        {phase === 'reveal' && (
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: DUR.scene, ease: EASE_OUT }}
            className="mt-sp2"
          >
            <p className="label-mono text-[var(--acid)]">доступ ограничен</p>
            <h2 className="display-xl mt-sp2 text-ink">Трафик Лаб</h2>
          </motion.div>
        )}
      </div>

      <BottomBar>
        {phase === 'idle' && <Button onClick={() => setPhase('running')}>Смотреть</Button>}
        {phase === 'running' && (
          <Button
            variant="ghost"
            onClick={() => {
              track('city_completed', { skipped: true })
              mark('intro_completed', true)
              setPhase('reveal')
            }}
          >
            Пропустить
          </Button>
        )}
        {phase === 'reveal' && <Button onClick={onNext}>Войти в лабораторию</Button>}
      </BottomBar>
    </Screen>
  )
}
