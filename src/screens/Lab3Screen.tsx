import { useState } from 'react'
import { motion } from 'motion/react'
import { Screen } from '../ui/Screen'
import { Scene } from '../ui/Scene'
import { Subtitles } from '../ui/Subtitles'
import { VideoBlock } from '../ui/VideoBlock'
import { Button } from '../ui/Button'
import { BottomBar } from '../ui/BottomBar'
import { LAB3_SCRIPT } from '../content/script'
import { config } from '../config'
import { useProgress } from '../store/progress'
import { DUR, EASE_OUT } from '../lib/motion'
import { asset } from '../lib/asset'

/** Экран 6. Последняя лаборатория: производство посадочной страницы. */
export function Lab3Screen({ onNext }: { onNext: () => void }) {
  const { mark, video_3_completed } = useProgress()
  const [phase, setPhase] = useState<'intro' | 'video'>(video_3_completed ? 'video' : 'intro')

  return (
    <Screen bare>
      <Scene src={asset('world/assembly.webp')} still />

      <div className="relative z-10 flex flex-1 flex-col px-[var(--gutter)] pt-sp6">
        <h1 className="display-m text-ink">
          Элемент третий:
          <br />
          куда его вести
        </h1>

        {phase === 'intro' ? (
          <Subtitles lines={LAB3_SCRIPT} running onDone={() => setPhase('video')} className="mt-sp5 flex-1" />
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: DUR.ui, ease: EASE_OUT }}
            className="mt-sp5"
          >
            <VideoBlock
              video={config.videos.v3}
              protocolNo="03"
              title="Посадочная страница"
              eventPrefix="video3"
              onProgress={(share) => mark('video_3_progress', share)}
              onCompleted={() => mark('video_3_completed', true)}
            />
            <p className="mt-sp4 max-w-[40ch] text-[16px] leading-relaxed text-ink-2">
              Нам нужен не макет. Нам нужен инструмент, на который можно привести трафик.
            </p>
          </motion.div>
        )}
      </div>

      <BottomBar>
        {phase === 'intro' ? (
          <Button variant="ghost" onClick={() => setPhase('video')}>
            Пропустить
          </Button>
        ) : (
          <Button disabled={!video_3_completed} onClick={onNext}>
            {video_3_completed ? 'Посмотреть, что получилось' : 'Сначала протокол 03'}
          </Button>
        )}
      </BottomBar>
    </Screen>
  )
}
