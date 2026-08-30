import { useState } from 'react'
import { motion } from 'motion/react'
import { Screen } from '../ui/Screen'
import { Scene } from '../ui/Scene'
import { Bridge, ReadingScrim } from '../ui/Bridge'
import { NodeRail } from '../ui/NodeRail'
import { VideoBlock } from '../ui/VideoBlock'
import { Button } from '../ui/Button'
import { BottomBar } from '../ui/BottomBar'
import { CTA, BRIDGE_BEFORE_3 } from '../content/copy'
import { config } from '../config'
import { useProgress } from '../store/progress'
import { DUR, EASE_OUT } from '../lib/motion'
import { asset } from '../lib/asset'

/**
 * Экран 6 (STATE08). Мост перед Видео 3 + сам протокол (SPEC.md §20-21).
 *
 * За открывшейся дверью — единственное место во всём маршруте, где все три
 * узла связки показаны целиком (DESIGN.md §8.2, исключение): КОМУ и ЧТО
 * СКАЗАТЬ уже открыты, КУДА ВЕСТИ — ещё нет. Это и есть содержание сцены,
 * поэтому NodeRail здесь не служебный индикатор в углу, а главный элемент
 * кадра. Пропа «показать все названия целиком» у NodeRail ещё нет (его
 * переписывают отдельно) — компонент вызван как есть, он и так не скрывает
 * подписи узлов.
 */
export function Lab3Screen({ onNext }: { onNext: () => void }) {
  const { mark, video_3_completed } = useProgress()
  const [phase, setPhase] = useState<'bridge' | 'video'>(video_3_completed ? 'video' : 'bridge')
  const video3 = { url: config.video3Url, duration: config.videoDurations.v3, poster: config.videoPosters.v3 }

  return (
    <Screen bare>
      <Scene src={asset('world/assembly.webp')} still />
      {phase === 'bridge' && <ReadingScrim />}

      <div className="relative z-20 flex flex-1 flex-col px-[var(--gutter)] pt-sp5 pb-sp2">
        {phase === 'bridge' ? (
          <>
            <div className="mt-sp3">
              <NodeRail step="lab3" dramatic onScene />
            </div>
            <Bridge blocks={BRIDGE_BEFORE_3} delay={0.75} className="mt-sp6" />
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
                video={video3}
                protocolNo="03"
                title="Посадочная страница"
                eventPrefix="video3"
                onProgress={(share) => {
                  mark('video_3_started', true)
                  mark('video_3_progress', share)
                  mark('video_3_seconds', share * video3.duration)
                }}
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
          <Button onClick={() => setPhase('video')}>{CTA.bringToLead}</Button>
        ) : (
          <Button disabled={!video_3_completed} onClick={onNext}>
            {CTA.next}
          </Button>
        )}
      </BottomBar>
    </Screen>
  )
}
