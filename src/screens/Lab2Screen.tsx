import { useEffect, useState } from 'react'
import { motion } from 'motion/react'
import { Screen } from '../ui/Screen'
import { Scene } from '../ui/Scene'
import { ReadingScrim } from '../ui/Bridge'
import { SegmentsScene, SEGMENTS_BEATS } from '../ui/SegmentsScene'
import { VideoBlock } from '../ui/VideoBlock'
import { Button } from '../ui/Button'
import { BottomBar } from '../ui/BottomBar'
import { BRIDGE_AFTER_1, BRIDGE_AFTER_1_SCENE, CTA } from '../content/copy'
import { config } from '../config'
import { track } from '../lib/analytics'
import { useProgress } from '../store/progress'
import { DUR, EASE_OUT } from '../lib/motion'
import { asset } from '../lib/asset'

/**
 * Экран 5. Мост ко второму эксперименту + Видео 2 (STATE05, SPEC.md §10-11).
 *
 * Мост — одна из пяти дорогих сцен ТЗ (§37, сцена 2): сегменты расходятся на
 * отдельные ветки, каждая приходит к одному и тому же предложению, ветки
 * схлопываются обратно в единую линию. Текст раскрывается по ходу сцены —
 * по её тактам (SEGMENTS_BEATS), а не одним куском.
 *
 * Фаза «reward» отсюда вынесена в отдельное состояние reward2 (Reward2Screen):
 * это не «Урок 2. Офферы» и не хвост этого экрана, а самостоятельная точка
 * маршрута — ровно как reward1 после lab1. Здесь остаётся только мост и само
 * Видео 2. Фаза видео не тронута.
 */
export function Lab2Screen({ onNext }: { onNext: () => void }) {
  const { mark, video_2_completed, review, clearReview, go } = useProgress()
  const seekTo = review?.step === 'lab2' ? review.at : undefined
  // Пока review указывает сюда, единственное действие экрана — вернуть
  // человека в допуск (SPEC.md §17-18): он пришёл пересмотреть конкретный
  // момент, а не идти по воронке заново.
  const inReview = review?.step === 'lab2'
  const [phase, setPhase] = useState<'bridge' | 'video'>(video_2_completed ? 'video' : 'bridge')
  const video2 = { url: config.video2Url, duration: config.videoDurations.v2, poster: config.videoPosters.v2 }

  const bridgeDelays = [
    0.15,
    SEGMENTS_BEATS.diverge + 0.15,
    SEGMENTS_BEATS.collapse + 0.15,
    SEGMENTS_BEATS.merge + 0.3,
  ]

  useEffect(() => {
    if (phase === 'bridge') track('bridge2_viewed')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (seekTo === undefined) return
    setPhase('video')
    return () => clearReview()
  }, [seekTo, clearReview])

  return (
    <Screen bare>
      <Scene src={asset('world/offer-bench.webp')} still />
      {phase === 'bridge' && <ReadingScrim />}

      <div className="relative z-20 flex flex-1 flex-col px-[var(--gutter)] pt-sp5 pb-sp2">
        {phase === 'bridge' && (
          // Сцена и текст держатся вместе, по центру доступной высоты: без
          // этого блока и диаграмма, и строки жмутся к верху, а треть кадра
          // под ними остаётся пустой (правка по итогам осмотра скриншотов).
          <div className="flex flex-1 flex-col justify-center gap-sp5">
            <SegmentsScene
              segments={BRIDGE_AFTER_1_SCENE.segments}
              collapseLabel={BRIDGE_AFTER_1_SCENE.collapse}
            />

            <div className="flex flex-col gap-sp3">
              {BRIDGE_AFTER_1.map((block, i) => (
                <motion.p
                  key={block.text}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: DUR.ui, ease: EASE_OUT, delay: bridgeDelays[i] }}
                  className={
                    block.kind === 'quote'
                      ? 'on-scene border-l-2 border-gold pl-sp3 text-[19px] leading-snug font-semibold text-ink'
                      : block.kind === 'lead'
                        ? 'on-scene max-w-[34ch] text-[19px] leading-snug font-semibold text-ink'
                        : 'on-scene max-w-[38ch] text-[16px] leading-relaxed text-ink-2'
                  }
                >
                  {block.kind === 'quote' ? `«${block.text}»` : block.text}
                </motion.p>
              ))}
            </div>
          </div>
        )}

        {phase === 'video' && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: DUR.ui, ease: EASE_OUT }}
          >
            <h1 className="display-m on-scene max-w-[12ch] text-ink">
              Элемент второй: что ему сказать
            </h1>
            <div className="mt-sp5">
              <VideoBlock
                video={video2}
                protocolNo="02"
                title="Оффер и объявления"
                seekTo={seekTo}
                eventPrefix="video2"
                onProgress={(share) => {
                  mark('video_2_started', true)
                  mark('video_2_progress', share)
                  mark('video_2_seconds', share * video2.duration)
                }}
                onCompleted={() => mark('video_2_completed', true)}
              />
            </div>
          </motion.div>
        )}
      </div>

      <BottomBar>
        {phase === 'bridge' && <Button onClick={() => setPhase('video')}>{CTA.buildOffer}</Button>}
        {phase === 'video' && inReview && (
          <Button
            onClick={() => {
              clearReview()
              go('access')
            }}
          >
            {CTA.backToAccess}
          </Button>
        )}
        {phase === 'video' && !inReview && (
          <Button disabled={!video_2_completed} onClick={onNext}>
            {video_2_completed ? 'Забрать награду' : 'Сначала протокол 02'}
          </Button>
        )}
      </BottomBar>
    </Screen>
  )
}
