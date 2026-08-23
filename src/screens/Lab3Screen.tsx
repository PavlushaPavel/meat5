import { useState } from 'react'
import { motion } from 'motion/react'
import { Screen } from '../ui/Screen'
import { Scene } from '../ui/Scene'
import { Subtitles } from '../ui/Subtitles'
import { VoiceBar } from '../ui/VoiceBar'
import { Character } from '../ui/Character'
import { useVoice } from '../lib/useVoice'
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
  const voice = useVoice(LAB3_SCRIPT, config.voice.lab3 || undefined)
  const [phase, setPhase] = useState<'intro' | 'video'>(video_3_completed ? 'video' : 'intro')

  return (
    <Screen bare>
      <Scene src={asset('world/assembly.webp')} still />
      {phase === 'intro' && <Character height="52vh" side="left" delay={0.2} />}

      <div className="relative z-20 flex flex-1 flex-col px-[var(--gutter)] pt-sp6">
        <h1 className="display-m max-w-[12ch] text-ink [text-shadow:0_4px_36px_rgba(2,6,14,0.9)]">
          Элемент третий:
          <br />
          куда его вести
        </h1>

        {phase === 'intro' ? (
          <>
            <div className="flex-1" />
            <Subtitles line={voice.started ? voice.line : undefined} className="mb-sp4" />
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
            <p className="on-scene mt-sp4 max-w-[40ch] text-[16px] leading-relaxed text-ink">
              Нам нужен не макет. Нам нужен инструмент, на который можно привести трафик.
            </p>
          </motion.div>
        )}
      </div>

      <BottomBar>
        {phase === 'intro' ? (
          <Button
            variant="ghost"
            onClick={() => {
              voice.finish()
              setPhase('video')
            }}
          >
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
