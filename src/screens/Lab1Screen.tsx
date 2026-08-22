import { useState } from 'react'
import { motion } from 'motion/react'
import { Screen } from '../ui/Screen'
import { Scene } from '../ui/Scene'
import { Subtitles } from '../ui/Subtitles'
import { VideoBlock } from '../ui/VideoBlock'
import { Button } from '../ui/Button'
import { BottomBar } from '../ui/BottomBar'
import { LAB1_SCRIPT } from '../content/script'
import { config } from '../config'
import { track } from '../lib/analytics'
import { useProgress } from '../store/progress'
import { DUR, EASE_OUT } from '../lib/motion'
import { asset } from '../lib/asset'

/**
 * Экран 2. Первый эксперимент.
 *
 * ДОРОГОЙ МОУШН №2: створки расходятся, жёлтый свет заливает кадр. Открытие
 * города здесь НЕ повторяем — двери уже открылись, человек внутри.
 */
export function Lab1Screen({ onNext }: { onNext: () => void }) {
  const { mark, video_1_completed } = useProgress()
  const [phase, setPhase] = useState<'intro' | 'video'>(video_1_completed ? 'video' : 'intro')

  return (
    <Screen bare>
      <Scene src={asset('world/lab-interior.webp')} still />
      {/* Створки: расходятся один раз, на входе в лабораторию. */}
      <Doors />

      <div className="relative z-10 flex flex-1 flex-col px-[var(--gutter)] pt-sp6">
        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: DUR.scene, ease: EASE_OUT, delay: 0.5 }}
          className="display-m text-ink"
        >
          Элемент первый:
          <br />
          кому мы продаём
        </motion.h1>

        {phase === 'intro' ? (
          <Subtitles
            lines={LAB1_SCRIPT}
            running
            onDone={() => setPhase('video')}
            className="mt-sp5 flex-1"
          />
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: DUR.ui, ease: EASE_OUT }}
            className="mt-sp5"
          >
            <VideoBlock
              video={config.videos.v1}
              protocolNo="01"
              title="Кому мы продаём"
              eventPrefix="video1"
              onProgress={(share) => mark('video_1_progress', share)}
              onCompleted={() => mark('video_1_completed', true)}
            />
          </motion.div>
        )}
      </div>

      <BottomBar>
        {phase === 'intro' ? (
          <Button variant="ghost" onClick={() => setPhase('video')}>
            Пропустить
          </Button>
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
            boxShadow: side === 'left' ? '8px 0 60px -10px rgba(249,183,6,0.35)' : '-8px 0 60px -10px rgba(249,183,6,0.35)',
          }}
        />
      ))}
    </div>
  )
}
