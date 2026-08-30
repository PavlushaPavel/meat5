import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { Screen } from '../ui/Screen'
import { Scene } from '../ui/Scene'
import { Panel } from '../ui/Panel'
import { ReadingScrim } from '../ui/Bridge'
import { VideoBlock } from '../ui/VideoBlock'
import { Button } from '../ui/Button'
import { BottomBar } from '../ui/BottomBar'
import { CTA, BEFORE_VIDEO_1 } from '../content/copy'
import { config } from '../config'
import { useProgress } from '../store/progress'
import { DUR, EASE_OUT, prefersReducedMotion } from '../lib/motion'
import { asset } from '../lib/asset'

/** Сколько кадр держит каждую из трёх карточек, мс — раскрытие идёт само,
 * тапать по нему не нужно (SPEC.md §7: маршрут не показывается заранее). */
const CARD_HOLD = [1500, 1500, 2100]

/**
 * Экран 2. Первый эксперимент.
 *
 * ДОРОГОЙ МОУШН №2: створки расходятся, жёлтый свет заливает кадр. Открытие
 * города здесь НЕ повторяем — двери открылись, человек уже внутри.
 *
 * Мост читается ТЕКСТОМ: три карточки BEFORE_VIDEO_1.cards раскрываются
 * ПО ОДНОЙ в одном и том же месте кадра (сменяют друг друга, а не
 * складываются в список — увидеть все три сразу означало бы оглавление),
 * затем удар — punch, крупно, с переносом строки. Только после этого
 * появляется кнопка «Разобраться».
 */
export function Lab1Screen({ onNext }: { onNext: () => void }) {
  const { mark, video_1_completed, review, clearReview } = useProgress()
  const seekTo = review?.step === 'lab1' ? review.at : undefined
  const [phase, setPhase] = useState<'bridge' | 'video'>(video_1_completed ? 'video' : 'bridge')
  const [step, setStep] = useState(() => (prefersReducedMotion() ? BEFORE_VIDEO_1.cards.length : 0))
  const video1 = { url: config.video1Url, duration: config.videoDurations.v1, poster: config.videoPosters.v1 }

  useEffect(() => {
    if (seekTo === undefined) return
    setPhase('video')
    return () => clearReview()
  }, [seekTo, clearReview])

  // Три карточки сменяют друг друга сами; на последней держится удар — до тех
  // пор, пока человек не нажмёт «Разобраться».
  useEffect(() => {
    if (phase !== 'bridge') return
    if (step >= BEFORE_VIDEO_1.cards.length) return
    const t = window.setTimeout(() => setStep((s) => s + 1), CARD_HOLD[step])
    return () => window.clearTimeout(t)
  }, [phase, step])

  const punchReady = step >= BEFORE_VIDEO_1.cards.length

  return (
    <Screen bare>
      {/* Без `still`: кадр дышит, как и остальные сцены воронки — иначе
          верхние две трети экрана, пока карточки моста ещё не появились,
          читаются как замёршая фотография, а не как кино (DESIGN.md §5). */}
      <Scene src={asset('world/lab-interior.webp')} />
      <Doors />
      {phase === 'bridge' && <ReadingScrim />}

      <div className="relative z-20 flex flex-1 flex-col px-[var(--gutter)] pt-sp5 pb-sp4">
        {phase === 'bridge' ? (
          <>
            <div className="flex-1" />
            <AnimatePresence mode="wait">
              {!punchReady ? (
                <motion.div
                  key={`card-${step}`}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8, transition: { duration: 0.15 } }}
                  transition={{ duration: DUR.scene, ease: EASE_OUT }}
                  className="mb-sp3"
                >
                  <Panel>
                    <p
                      className={
                        step < 2
                          ? 'display-m text-ink'
                          : 'text-[16px] leading-relaxed text-ink-2'
                      }
                    >
                      {BEFORE_VIDEO_1.cards[step]}
                    </p>
                  </Panel>
                </motion.div>
              ) : (
                <motion.p
                  key="punch"
                  initial={{ opacity: 0, y: 14, filter: 'blur(8px)' }}
                  animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                  transition={{ duration: DUR.scene, ease: EASE_OUT }}
                  className="display-xl on-scene mb-sp3 whitespace-pre-line text-ink"
                >
                  {BEFORE_VIDEO_1.punch}
                </motion.p>
              )}
            </AnimatePresence>
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
                video={video1}
                protocolNo="01"
                title="Кому мы продаём"
                seekTo={seekTo}
                eventPrefix="video1"
                onProgress={(share) => {
                  mark('video_1_started', true)
                  mark('video_1_progress', share)
                  mark('video_1_seconds', share * video1.duration)
                }}
                onCompleted={() => mark('video_1_completed', true)}
              />
            </div>
          </motion.div>
        )}
      </div>

      <BottomBar>
        {phase === 'bridge' ? (
          <Button disabled={!punchReady} onClick={() => setPhase('video')}>
            {CTA.figureOut}
          </Button>
        ) : (
          <Button disabled={!video_1_completed} onClick={onNext}>
            {video_1_completed ? 'Забрать награду' : 'Сначала протокол 01'}
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
