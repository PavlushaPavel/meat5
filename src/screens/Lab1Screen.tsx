import { useState } from 'react'
import { motion } from 'motion/react'
import { Screen } from '../ui/Screen'
import { Scene } from '../ui/Scene'
import { ElementReveal } from '../ui/ElementReveal'
import { Bridge, ReadingScrim } from '../ui/Bridge'
import { VideoBlock } from '../ui/VideoBlock'
import { Button } from '../ui/Button'
import { BottomBar } from '../ui/BottomBar'
import { LAB1_BRIDGE } from '../content/script'
import { config } from '../config'
import { track } from '../lib/analytics'
import { useProgress } from '../store/progress'
import { DUR, EASE_OUT } from '../lib/motion'
import { asset } from '../lib/asset'

/**
 * Экран 2. Первый эксперимент.
 *
 * ДОРОГОЙ МОУШН №2: створки расходятся, жёлтый свет заливает кадр. Открытие
 * города здесь НЕ повторяем — двери открылись, человек уже внутри.
 *
 * Мост читается ТЕКСТОМ, а не голосом: второй голосовой подряд превращает вход
 * в лабораторию в ещё одно ожидание, вместо того чтобы дать делать. На центральном
 * экране в этот момент проявляется первый неизвестный элемент связки.
 */
export function Lab1Screen({ onNext }: { onNext: () => void }) {
  const { mark, video_1_completed } = useProgress()
  const [phase, setPhase] = useState<'bridge' | 'video'>(video_1_completed ? 'video' : 'bridge')

  return (
    <Screen bare>
      <Scene src={asset('world/lab-interior.webp')} still />
      <Doors />
      {phase === 'bridge' && <ReadingScrim />}

      <div className="relative z-20 flex flex-1 flex-col px-[var(--gutter)] pt-sp5 pb-sp4">
        {phase === 'bridge' ? (
          <>
            <ElementReveal index="01" title="Кому мы продаём" />

            <Bridge blocks={LAB1_BRIDGE} delay={1.05} className="mt-sp5" />
          </>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: DUR.ui, ease: EASE_OUT }}
          >
            <h1 className="display-m on-scene max-w-[12ch] text-ink">Элемент первый: кому мы продаём</h1>
            <div className="mt-sp5">
              <VideoBlock
                video={config.videos.v1}
                protocolNo="01"
                title="Кому мы продаём"
                eventPrefix="video1"
                onProgress={(share) => mark('video_1_progress', share)}
                onCompleted={() => mark('video_1_completed', true)}
              />
            </div>
          </motion.div>
        )}
      </div>

      <BottomBar>
        {phase === 'bridge' ? (
          <Button onClick={() => setPhase('video')}>Смотреть протокол 01</Button>
        ) : (
          <Button
            disabled={!video_1_completed}
            onClick={() => {
              track('lab_entered', { after: 'video1' })
              onNext()
            }}
          >
            {video_1_completed ? 'Забрать ассистента' : 'Сначала протокол 01'}
          </Button>
        )}
      </BottomBar>
    </Screen>
  )
}

/** Створки лаборатории. Уходят один раз и больше не мешают. */
function Doors() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 z-20 overflow-hidden">
      {(['left', 'right'] as const).map((side) => (
        <motion.div
          key={side}
          initial={{ x: 0 }}
          animate={{ x: side === 'left' ? '-100%' : '100%' }}
          transition={{ duration: 1.1, ease: EASE_OUT, delay: 0.15 }}
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
