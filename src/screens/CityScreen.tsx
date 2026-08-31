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
import { DUR, EASE_OUT, prefersReducedMotion } from '../lib/motion'
import { asset } from '../lib/asset'

/**
 * Экран 2. Город трафика, вход в первый этап (STATE02, SPEC.md §6).
 *
 * Короткая сцена без единого слова голоса (голос во всём приложении звучит
 * ровно один раз, в MessageScreen): знакомый район Директа, поток трафика
 * выходит из него и уходит дальше — карточка и подпись доводят эту мысль
 * текстом, а не голосом.
 *
 * Композиция (правка по итогам осмотра владельцем живой версии): у экрана
 * один смысловой центр. Карточка с главной мыслью стоит не в подвале экрана
 * сноской, а там, где падает взгляд — примерно на золотом сечении кадра, над
 * зданием «Яндекс Директ» с фотографии. Между сценой и панелью действия —
 * ритм из двух неравных пауз (TrafficFlow.tsx их не трогает), а не один
 * сплошной пролёт пустоты сверху и приклеенная к кнопке карточка снизу.
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
      <TrafficFlow />

      <div className="relative z-20 flex flex-1 flex-col px-[var(--gutter)] pt-sp5 pb-sp5">
        {/*
          Раньше здесь стоял один flex-1 сверху, и карточка ложилась вплотную
          к панели действия — читалась сноской. Теперь пауза разбита на две
          неравные части: сцена держит верх кадра (небо, вывеска «Город
          трафика», трасса), карточка стоит на уровне здания Директа, а под
          ней остаётся воздух до кнопки, а не резкий обрыв.
        */}
        <div className="flex-[1.3]" />

        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: DUR.scene, ease: EASE_OUT }}
        >
          <Panel className="on-scene border-gold/35 shadow-[0_20px_54px_-24px_rgba(249,183,6,0.45)]">
            <p className="display-xl text-ink">{CITY.card}</p>
            <p className="mt-sp3 max-w-[36ch] whitespace-pre-line text-[16px] leading-relaxed text-ink-2">
              {CITY.support}
            </p>
          </Panel>
        </motion.div>

        <div className="flex-1" />
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

/**
 * Поток трафика: район Директа отдаёт трассу дальше по городу, к вывеске
 * «Город трафика» — это и есть картинка мысли «Директ — только часть связки»,
 * а не декоративная подсветка. Путь приблизительно повторяет развязку с
 * референса (низ-слева, от здания Директа, вверх и направо, к башне).
 *
 * Бегущий пунктир и «летящая искра» дают движение; при уменьшенном движении
 * (prefers-reduced-motion) остаётся только неподвижная линия с градиентом —
 * мысль читается без анимации.
 */
function TrafficFlow() {
  const reduced = prefersReducedMotion()
  const path = 'M 34 738 C 108 706, 150 634, 214 552 C 282 462, 322 372, 296 268 C 276 190, 314 122, 360 46'

  return (
    <svg
      aria-hidden
      viewBox="0 0 390 844"
      preserveAspectRatio="xMidYMid slice"
      className="pointer-events-none absolute inset-0 z-[6] h-full w-full"
    >
      <defs>
        <linearGradient id="cityFlowGrad" x1="34" y1="738" x2="360" y2="46" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="var(--color-gold)" />
          <stop offset="100%" stopColor="var(--color-cold)" />
        </linearGradient>
        <filter id="cityFlowGlow" x="-80%" y="-80%" width="260%" height="260%">
          <feGaussianBlur stdDeviation="6" />
        </filter>
      </defs>

      {/* Мягкое свечение трассы — читается издалека как подсвеченная дорога,
          не спорит с текстом. Без отдельной тонкой направляющей линии:
          иначе поверх фото ложится «маршрут на карте», а не свет трассы. */}
      <path
        d={path}
        fill="none"
        stroke="url(#cityFlowGrad)"
        strokeWidth={10}
        strokeLinecap="round"
        opacity={0.22}
        filter="url(#cityFlowGlow)"
      />

      {reduced ? (
        // Без движения — но мысль остаётся: неподвижный градиентный луч.
        <path d={path} fill="none" stroke="url(#cityFlowGrad)" strokeWidth={2} strokeLinecap="round" opacity={0.6} />
      ) : (
        <>
          {/* Бегущие световые штрихи — вытянутые, а не точки: читаются как
              свет фар, идущий по трассе, а не как пунктир на карте. */}
          <motion.path
            d={path}
            fill="none"
            stroke="url(#cityFlowGrad)"
            strokeWidth={3}
            strokeLinecap="round"
            strokeDasharray="16 26"
            opacity={0.75}
            initial={{ strokeDashoffset: 0 }}
            animate={{ strokeDashoffset: -420 }}
            transition={{ duration: 3.2, ease: 'linear', repeat: Infinity }}
          />
          {/* Головная искра — чуть ярче и крупнее самого потока. */}
          <circle r={4} fill="var(--color-gold-soft)" filter="url(#cityFlowGlow)">
            <animateMotion dur="3.2s" repeatCount="indefinite" path={path} rotate="auto" />
          </circle>
        </>
      )}
    </svg>
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
