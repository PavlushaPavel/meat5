import { useState } from 'react'
import { motion } from 'motion/react'
import { Screen } from '../ui/Screen'
import { Scene } from '../ui/Scene'
import { Subtitles } from '../ui/Subtitles'
import { VoiceBar } from '../ui/VoiceBar'
import { useVoice } from '../lib/useVoice'
import { VideoBlock } from '../ui/VideoBlock'
import { Button } from '../ui/Button'
import { BottomBar } from '../ui/BottomBar'
import { NodeRail } from '../ui/NodeRail'
import { AssistantCard } from '../ui/AssistantCard'
import { BRIDGE2_SCRIPT } from '../content/script'
import { config } from '../config'
import { track } from '../lib/analytics'
import { useProgress } from '../store/progress'
import { DUR, EASE_OUT } from '../lib/motion'
import { asset } from '../lib/asset'

/**
 * Экран 4. Мост ко второму эксперименту, протокол 02 и второй инструмент.
 *
 * Это не «Урок 2. Офферы». Сначала короткая сцена «АУДИТОРИЯ ✓ → ???»: сначала
 * создаём потребность, потом даём материал. Три состояния живут ВНУТРИ экрана,
 * новых страниц не появляется.
 */
export function Lab2Screen({ onNext }: { onNext: () => void }) {
  const { mark, video_2_completed } = useProgress()
  const voice = useVoice(BRIDGE2_SCRIPT, config.voice.bridge2 || undefined)
  const [phase, setPhase] = useState<'bridge' | 'video' | 'reward'>(
    video_2_completed ? 'reward' : 'bridge',
  )

  return (
    <Screen bare>
      <Scene src={asset('world/offer-bench.webp')} still />

      <div className="relative z-20 flex flex-1 flex-col px-[var(--gutter)] pt-sp6">
        {phase === 'bridge' && (
          <>
            <div className="flex items-center gap-sp2">
              <span className="label-mono text-[var(--acid)]">аудитория ✓</span>
              <span aria-hidden className="h-px flex-1 bg-line" />
              <span className="label-mono text-ink-3">???</span>
            </div>
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
        )}

        {phase === 'video' && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: DUR.ui, ease: EASE_OUT }}
          >
            <h1 className="display-m on-scene text-ink">
              Элемент второй:
              <br />
              что ему сказать
            </h1>
            <div className="mt-sp5">
              <VideoBlock
                video={config.videos.v2}
                protocolNo="02"
                title="Оффер и объявления"
                eventPrefix="video2"
                onProgress={(share) => mark('video_2_progress', share)}
                onCompleted={() => {
                  mark('video_2_completed', true)
                  setPhase('reward')
                }}
              />
            </div>
          </motion.div>
        )}

        {phase === 'reward' && (
          <>
            <p className="label-mono text-[var(--acid)]">получено</p>
            <h1 className="display-xl on-scene mt-sp2 text-ink">Предложение</h1>
            <div className="mt-sp5">
              <NodeRail step="lab2" dramatic />
            </div>
            <div className="mt-sp5">
              <AssistantCard
                number="02"
                title="Офферы и объявления"
                hint="Работает на анализе из первого протокола"
                url={config.assistant2Url}
                onOpen={() => {
                  track('assistant2_clicked')
                  mark('assistant_2_opened', true)
                }}
              />
            </div>
            <p className="on-scene mt-sp4 max-w-[40ch] text-[16px] leading-relaxed text-ink">
              Теперь у тебя два рабочих инструмента. Осталось довести гипотезу до того, что человек
              увидит после клика.
            </p>
          </>
        )}
      </div>

      <BottomBar>
        {phase === 'bridge' && (
          <Button
            onClick={() => {
              voice.finish()
              setPhase('video')
            }}
          >
            Превратить это в предложение
          </Button>
        )}
        {phase === 'video' && (
          <Button disabled={!video_2_completed} onClick={() => setPhase('reward')}>
            {video_2_completed ? 'Забрать ассистента' : 'Сначала протокол 02'}
          </Button>
        )}
        {phase === 'reward' && <Button onClick={onNext}>Получить допуск</Button>}
      </BottomBar>
    </Screen>
  )
}
