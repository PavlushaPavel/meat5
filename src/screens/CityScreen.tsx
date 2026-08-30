import { useState } from 'react'
import { motion } from 'motion/react'
import { Screen } from '../ui/Screen'
import { Scene } from '../ui/Scene'
import { Panel } from '../ui/Panel'
import { Button } from '../ui/Button'
import { BottomBar } from '../ui/BottomBar'
import { CTA, CITY } from '../content/copy'
import { track } from '../lib/analytics'
import { useProgress } from '../store/progress'
import { DUR, EASE_OUT } from '../lib/motion'
import { asset } from '../lib/asset'

/**
 * Экран 2. Город трафика, вход в первый этап (STATE02, SPEC.md §6).
 *
 * Короткая сцена без единого слова голоса (голос во всём приложении звучит
 * ровно один раз, в MessageScreen): знакомый район Директа, поток трафика
 * выходит из него и уходит дальше — карточка и подпись доводят эту мысль
 * текстом, а не голосом.
 *
 * По нажатию кнопки — не мгновенная смена экрана, а закрывающиеся створки:
 * тот же визуальный язык, что открывает лабораторию в Lab1Screen, но в
 * обратную сторону. Только после того как створки сомкнутся, роутер получает
 * onNext() — вход в Трафик Лаб читается как одно движение, а не как обрыв кадра.
 */
export function CityScreen({ onNext }: { onNext: () => void }) {
  const mark = useProgress((s) => s.mark)
  const [leaving, setLeaving] = useState(false)

  const handleFindElement = () => {
    if (leaving) return
    mark('city_completed', true)
    track('lab_entered')
    setLeaving(true)
  }

  return (
    <Screen bare>
      <Scene src={asset('world/city-districts.webp')} align="top" />

      <div className="relative z-20 flex flex-1 flex-col px-[var(--gutter)] pt-sp5">
        <div className="flex-1" />

        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: DUR.scene, ease: EASE_OUT }}
        >
          <Panel className="on-scene">
            <p className="display-m text-ink">{CITY.card}</p>
            <p className="mt-sp3 whitespace-pre-line text-[15px] leading-relaxed text-ink-2">
              {CITY.support}
            </p>
          </Panel>
        </motion.div>
      </div>

      <BottomBar>
        <Button disabled={leaving} onClick={handleFindElement}>
          {CTA.findElement}
        </Button>
      </BottomBar>

      {leaving && <ClosingDoors onDone={onNext} />}
    </Screen>
  )
}

/** Створки лаборатории, но навстречу друг другу: закрывают кадр перед переходом. */
function ClosingDoors({ onDone }: { onDone: () => void }) {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-50 overflow-hidden">
      {(['left', 'right'] as const).map((side, i) => (
        <motion.div
          key={side}
          initial={{ x: side === 'left' ? '-100%' : '100%' }}
          animate={{ x: '0%' }}
          transition={{ duration: 0.5, ease: EASE_OUT, delay: 0.04 }}
          onAnimationComplete={i === 0 ? onDone : undefined}
          className="absolute top-0 h-full w-1/2 bg-ground-deep motion-reduce:hidden"
          style={{
            [side]: 0,
            boxShadow:
              side === 'left'
                ? '8px 0 60px -10px rgba(249,183,6,0.35)'
                : '-8px 0 60px -10px rgba(249,183,6,0.35)',
          }}
        />
      ))}
    </div>
  )
}
