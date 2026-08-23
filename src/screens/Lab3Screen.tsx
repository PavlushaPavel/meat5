import { useState } from 'react'
import { motion } from 'motion/react'
import { Screen } from '../ui/Screen'
import { Scene } from '../ui/Scene'
import { Bridge, ReadingScrim } from '../ui/Bridge'
import { ElementReveal } from '../ui/ElementReveal'
import { VideoBlock } from '../ui/VideoBlock'
import { Button } from '../ui/Button'
import { BottomBar } from '../ui/BottomBar'
import { LAB3_BRIDGE } from '../content/script'
import { config } from '../config'
import { useProgress } from '../store/progress'
import { DUR, EASE_OUT } from '../lib/motion'
import { asset } from '../lib/asset'

/** Экран 6. Последняя лаборатория: производство посадочной страницы. */
export function Lab3Screen({ onNext }: { onNext: () => void }) {
  const { mark, video_3_completed } = useProgress()
  const [phase, setPhase] = useState<'bridge' | 'video'>(video_3_completed ? 'video' : 'bridge')

  return (
    <Screen bare>
      <Scene src={asset('world/assembly.webp')} still />
      {phase === 'bridge' && <ReadingScrim />}

      <div className="relative z-20 flex flex-1 flex-col px-[var(--gutter)] pt-sp5 pb-sp2">
        {phase === 'bridge' ? (
          <>
            <ElementReveal index="03" title="Куда его вести" />
            <Bridge blocks={LAB3_BRIDGE} delay={1.05} className="mt-sp5" />
          </>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: DUR.ui, ease: EASE_OUT }}
          >
            <h1 className="display-m on-scene max-w-[12ch] text-ink">
              Элемент третий: куда его вести
            </h1>
            <div className="mt-sp5">
              <VideoBlock
                video={config.videos.v3}
                protocolNo="03"
                title="Посадочная страница"
                eventPrefix="video3"
                onProgress={(share) => mark('video_3_progress', share)}
                onCompleted={() => mark('video_3_completed', true)}
              />
              <p className="on-scene mt-sp4 max-w-[36ch] text-[16px] leading-relaxed text-ink">
                Нам нужен не макет. Нам нужен инструмент, на который можно привести трафик.
              </p>
            </div>
          </motion.div>
        )}
      </div>

      <BottomBar>
        {phase === 'bridge' ? (
          <Button onClick={() => setPhase('video')}>Смотреть протокол 03</Button>
        ) : (
          <Button disabled={!video_3_completed} onClick={onNext}>
            {video_3_completed ? 'Посмотреть, что получилось' : 'Сначала протокол 03'}
          </Button>
        )}
      </BottomBar>
    </Screen>
  )
}
