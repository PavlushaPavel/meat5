import { useEffect, useState } from 'react'
import { motion } from 'motion/react'
import { Screen } from '../ui/Screen'
import { NodeRail } from '../ui/NodeRail'
import { Scene } from '../ui/Scene'
import { ReadingScrim } from '../ui/Bridge'
import { OfferMatchScene, MATCH_SWITCH } from '../ui/OfferMatchScene'
import { VideoBlock } from '../ui/VideoBlock'
import { Button } from '../ui/Button'
import { BottomBar } from '../ui/BottomBar'
import { BRIDGE_TO_VIDEO_2, CTA } from '../content/copy'
import { config } from '../config'
import { track } from '../lib/analytics'
import { useProgress } from '../store/progress'
import { DUR, EASE_OUT } from '../lib/motion'
import { asset } from '../lib/asset'

/**
 * Экран 5. Мост ко второму эксперименту + Видео 2 (STATE05, SPEC.md §10-11).
 *
 * Мост — одна из пяти дорогих сцен ТЗ (§37, сцена 2). Текст владельца от
 * 02.09.2026 длиннее прежнего и держится на повороте: «первый элемент есть» →
 * «это пока не деньги» → «каждый должен увидеть своё». Класть его одним куском
 * нельзя: пятнадцать строк на экране — это уже не мост, а статья (DESIGN.md
 * §8.5). Поэтому три такта, на каждом одно действие внизу.
 *
 * Такт «не деньги» намеренно почти пустой: удар стоит один, вокруг воздух.
 * Такт «трое» несёт сцену — три одинаковые посадочные становятся разными, и
 * фразы приходят синхронно с переключением своей карточки.
 *
 * Фаза «reward» отсюда вынесена в отдельное состояние reward2 (Reward2Screen):
 * это не «Урок 2. Офферы» и не хвост этого экрана, а самостоятельная точка
 * маршрута — ровно как reward1 после lab1. Здесь остаётся только мост и само
 * Видео 2. Фаза видео не тронута.
 */
type Phase = 'have' | 'money' | 'cases' | 'video'

/** Реплика моста: три голоса, как в ui/Bridge.tsx. */
function bridgeClass(kind: 'lead' | 'note' | 'quote') {
  return kind === 'lead'
    ? 'on-scene max-w-[34ch] text-[clamp(17px,2.4vh,19px)] leading-snug font-semibold text-ink'
    : 'on-scene max-w-[38ch] text-[clamp(14px,2vh,16px)] leading-relaxed text-ink-2'
}

export function Lab2Screen({ onNext }: { onNext: () => void }) {
  const { mark, video_2_completed, review, clearReview, go } = useProgress()
  const seekTo = review?.step === 'lab2' ? review.at : undefined
  // Пока review указывает сюда, единственное действие экрана — вернуть
  // человека в допуск (SPEC.md §17-18): он пришёл пересмотреть конкретный
  // момент, а не идти по воронке заново.
  const inReview = review?.step === 'lab2'
  const [phase, setPhase] = useState<Phase>(video_2_completed ? 'video' : 'have')
  const video2 = { url: config.video2Url, duration: config.videoDurations.v2, poster: config.videoPosters.v2 }


  useEffect(() => {
    if (phase !== 'video') track('bridge2_viewed')
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
      {phase !== 'video' && <ReadingScrim />}

      <div className="relative z-20 flex flex-1 flex-col px-[var(--gutter)] pt-sp5 pb-sp2">
        {/*
          Такт 1. Узел «Кому» закрыт — это и есть «первый элемент есть».
          Строка «Но есть одна проблема.» стоит последней и тише остальных:
          она не объясняет, она открывает дверь следующему такту.
        */}
        {phase === 'have' && (
          <div className="flex flex-1 flex-col justify-center gap-sp5">
            <NodeRail step="lab2" dramatic onScene />
            <div className="flex flex-col gap-sp3">
              {BRIDGE_TO_VIDEO_2.have.map((block, i) => (
                <motion.p
                  key={block.text}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: DUR.ui, ease: EASE_OUT, delay: 0.2 + i * 0.5 }}
                  className={bridgeClass(block.kind)}
                >
                  {block.text}
                </motion.p>
              ))}
            </div>
          </div>
        )}

        {/*
          Такт 2. Удар приходит один, в тишине, и только через паузу к нему
          добавляется объяснение и стаккато из четырёх слов. Если показать всё
          сразу, «Это пока не деньги» станет первой строкой абзаца, а не ударом.
        */}
        {phase === 'money' && (
          <div className="flex flex-1 flex-col justify-center gap-sp5">
            <motion.p
              initial={{ opacity: 0, y: 16, filter: 'blur(10px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              transition={{ duration: DUR.scene, ease: EASE_OUT }}
              className="display-xl on-scene max-w-[14ch] text-ink"
            >
              {BRIDGE_TO_VIDEO_2.punch}
            </motion.p>

            <div className="flex flex-col gap-sp3">
              {BRIDGE_TO_VIDEO_2.after.map((block, i) => (
                <motion.p
                  key={block.text}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: DUR.ui, ease: EASE_OUT, delay: 0.75 + i * 0.45 }}
                  className={bridgeClass(block.kind)}
                >
                  {block.text}
                </motion.p>
              ))}
            </div>

            {/* Стаккато: четыре слова падают по одному, каждое своей репликой. */}
            <div className="flex flex-wrap gap-sp2">
              {BRIDGE_TO_VIDEO_2.steps.map((step, i) => (
                <motion.span
                  key={step}
                  initial={{ opacity: 0, y: 8, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ duration: DUR.ui, ease: EASE_OUT, delay: 1.75 + i * 0.22 }}
                  className="label-mono rounded-chip border border-line bg-[color-mix(in_oklab,var(--color-ground-deep)_78%,transparent)] px-sp2 py-[7px] text-ink backdrop-blur-[2px]"
                >
                  {step}
                </motion.span>
              ))}
            </div>
          </div>
        )}

        {/*
          Такт 3. Три одинаковые посадочные становятся разными, и каждая фраза
          приходит ровно в тот момент, когда своя карточка перестаёт быть «как
          все» (MATCH_SWITCH). Сцена показывает «стало по-разному», строка
          говорит, для кого именно.
        */}
        {phase === 'cases' && (
          // Такт самый плотный из трёх: сцена плюс пять реплик. Кегли привязаны
          // к высоте экрана — на 568px без этого финальная строка про деньги
          // уезжала под кнопку, а она здесь и есть вывод.
          <div className="flex flex-1 flex-col justify-center gap-sp4">
            <OfferMatchScene />

            <div className="flex flex-col gap-sp2">
              {BRIDGE_TO_VIDEO_2.cases.map((line, i) => (
                <motion.p
                  key={line}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: DUR.ui, ease: EASE_OUT, delay: MATCH_SWITCH[i] }}
                  className="on-scene max-w-[38ch] text-[clamp(13px,1.85vh,15px)] leading-snug text-ink-2"
                >
                  {line}
                </motion.p>
              ))}
            </div>

            <div className="flex flex-col gap-sp2">
              {BRIDGE_TO_VIDEO_2.close.map((block, i) => (
                <motion.p
                  key={block.text}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: DUR.ui, ease: EASE_OUT, delay: 2.2 + i * 0.35 }}
                  className={bridgeClass(block.kind)}
                >
                  {block.text}
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
        {phase === 'have' && <Button onClick={() => setPhase('money')}>{CTA.next}</Button>}
        {phase === 'money' && <Button onClick={() => setPhase('cases')}>{CTA.next}</Button>}
        {phase === 'cases' && <Button onClick={() => setPhase('video')}>{CTA.buildOffer}</Button>}
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
