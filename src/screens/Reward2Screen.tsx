import { Fragment, useEffect } from 'react'
import { motion } from 'motion/react'
import { Check } from '@phosphor-icons/react'
import { Screen } from '../ui/Screen'
import { Scene } from '../ui/Scene'
import { Character } from '../ui/Character'
import { Button } from '../ui/Button'
import { BottomBar } from '../ui/BottomBar'
import { NodeRail } from '../ui/NodeRail'
import { RewardBlock } from '../ui/RewardBlock'
import { RewardOffersScene } from '../ui/RewardOffersScene'
import { REWARD_2, CTA } from '../content/copy'
import { config } from '../config'
import { track } from '../lib/analytics'
import { openExternal } from '../lib/telegram'
import { useProgress } from '../store/progress'
import { DUR, EASE_OUT } from '../lib/motion'
import { asset } from '../lib/asset'

/** Такты раскрытия: экран не вываливает всё сразу (DESIGN.md §8.5). */
const BEAT = { node: 0.7, lead: 1.05, formula: 1.4, tool: 3.05 } as const
const FORMULA_STEP = 0.28

/**
 * Экран 6. Результат Видео 2, Ассистент №2 (STATE06, SPEC.md §12).
 *
 * Сцена показывает результат Видео 2 движением: те же три группы, что и в
 * reward1, но теперь каждая получает СВОЁ предложение — то самое, что мост к
 * Видео 2 только обещал. Формула складывается на глазах, а не лежит абзацем.
 */
export function Reward2Screen({ onNext }: { onNext: () => void }) {
  const { mark, assistant_2_opened } = useProgress()
  const assistantReady = Boolean(config.assistant2Url)
  const formulaDone = BEAT.formula + REWARD_2.formula.length * FORMULA_STEP + 0.25

  useEffect(() => {
    track('assistant2_viewed')
  }, [])

  return (
    <Screen bare>
      <Scene src={asset('world/offer-bench.webp')} still />
      {/* См. Reward1: без bleed фигура целиком в кадре, а колонки текста
          заканчиваются до головы ведущего (DESIGN.md §8.8). */}
      <Character pose="calm" side="right" height="48vh" delay={0.35} bleed={false} pin />

      <div className="relative z-20 flex flex-1 flex-col px-[var(--gutter)] pt-sp5 pb-sp2">
        <RewardOffersScene />

        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: DUR.scene, ease: EASE_OUT, delay: BEAT.node }}
          className="display-xl on-scene mt-sp4 flex items-center gap-sp2 text-ink"
        >
          {REWARD_2.node}
          <Check size={26} weight="bold" className="text-[var(--acid)]" aria-hidden />
        </motion.h1>

        <div className="mt-sp3">
          <NodeRail step="reward2" dramatic onScene />
        </div>

        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: DUR.scene, ease: EASE_OUT, delay: BEAT.lead }}
          className="on-scene mt-sp4 max-w-[min(190px,52vw)] text-[16px] leading-relaxed text-ink"
        >
          {REWARD_2.lead}
        </motion.p>

        {/*
          Формула собирается как формула, а не как список плашек: узкая
          колонка, знаки "+"/"=" стоят по её центру МЕЖДУ строками, а не
          прибиты к правому краю широкой строки. Итоговая строка крупнее и
          светится кислотой — это ответ, а не ещё один терм.
        */}
        <div className="mt-sp4 flex w-[min(190px,52vw)] max-w-full flex-col items-stretch gap-1">
          {REWARD_2.formula.map((term, i) => (
            <Fragment key={term}>
              <motion.span
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: DUR.ui, ease: EASE_OUT, delay: BEAT.formula + i * FORMULA_STEP }}
                className="label-mono rounded-chip border border-line bg-[color-mix(in_oklab,var(--color-ground-deep)_78%,transparent)] px-sp3 py-sp2 text-center text-[12px] text-ink backdrop-blur-[2px]"
              >
                {term}
              </motion.span>
              {i < REWARD_2.formula.length - 1 && (
                <motion.span
                  aria-hidden
                  initial={{ opacity: 0, scale: 0.7 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: DUR.ui, delay: BEAT.formula + i * FORMULA_STEP + FORMULA_STEP / 2 }}
                  className="label-mono on-scene text-center text-ink"
                >
                  +
                </motion.span>
              )}
            </Fragment>
          ))}

          <motion.span
            aria-hidden
            initial={{ opacity: 0, scale: 0.7 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: DUR.ui, delay: BEAT.formula + REWARD_2.formula.length * FORMULA_STEP }}
            className="label-mono on-scene text-center text-ink"
          >
            =
          </motion.span>

          <motion.span
            initial={{ opacity: 0, y: 8, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{
              duration: DUR.scene,
              ease: EASE_OUT,
              delay: BEAT.formula + REWARD_2.formula.length * FORMULA_STEP + 0.12,
            }}
            className="label-mono rounded-chip border border-[var(--acid)]/70 bg-[color-mix(in_oklab,var(--acid)_18%,var(--color-ground))] px-sp3 py-sp3 text-center text-[13px] font-semibold text-[var(--acid)] shadow-[0_10px_28px_-8px_var(--acid)]"
          >
            {REWARD_2.formulaResult}
          </motion.span>
        </div>

        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: DUR.scene, ease: EASE_OUT, delay: formulaDone }}
          className="on-scene mt-sp4 max-w-[min(190px,52vw)] rounded-card border border-[var(--acid)]/50 bg-[color-mix(in_oklab,var(--color-ground-deep)_74%,transparent)] px-sp3 py-sp3 text-[17px] leading-snug font-semibold text-ink backdrop-blur-[2px]"
        >
          {REWARD_2.punch}
        </motion.p>

        <div className="flex-1" />

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: DUR.scene, ease: EASE_OUT, delay: BEAT.tool }}
        >
          <RewardBlock
            number="02"
            title={REWARD_2.tool}
            hint={REWARD_2.toolHint}
            taken={assistant_2_opened}
            ready={assistantReady}
            className="mt-sp4"
          />
        </motion.div>
      </div>

      <BottomBar>
        {assistant_2_opened ? (
          <Button variant="secondary" onClick={onNext}>
            {CTA.getAccess}
          </Button>
        ) : (
          <Button
            onClick={() => {
              track('assistant2_clicked')
              mark('assistant_2_opened', true)
              if (assistantReady) openExternal(config.assistant2Url)
            }}
          >
            {CTA.takeAssistant}
          </Button>
        )}
      </BottomBar>
    </Screen>
  )
}
