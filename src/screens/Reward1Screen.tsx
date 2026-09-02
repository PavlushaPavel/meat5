import { useEffect } from 'react'
import { motion } from 'motion/react'
import { Check } from '@phosphor-icons/react'
import { Screen } from '../ui/Screen'
import { Scene } from '../ui/Scene'
import { Character } from '../ui/Character'
import { Button } from '../ui/Button'
import { BottomBar } from '../ui/BottomBar'
import { NodeRail } from '../ui/NodeRail'
import { RewardBlock } from '../ui/RewardBlock'
import { RewardAudienceScene } from '../ui/RewardAudienceScene'
import { REWARD_1, CTA } from '../content/copy'
import { config } from '../config'
import { track } from '../lib/analytics'
import { openExternal } from '../lib/telegram'
import { useProgress } from '../store/progress'
import { DUR, EASE_OUT } from '../lib/motion'
import { asset } from '../lib/asset'

/** Такты раскрытия: экран не вываливает всё сразу (DESIGN.md §8.5). */
const BEAT = { node: 0.75, lead: 1.2, punch: 1.85, tool: 2.3 } as const

/**
 * Экран 3. Награда после протокола 01 (STATE04, SPEC.md §9).
 *
 * Сцена показывает результат Видео 1 движением: хаотичная аудитория стягивается
 * в понятные группы, и только после этого загорается узел «Кому». Главное
 * действие здесь — ЗАБРАТЬ ИНСТРУМЕНТ, и только после этого «идти дальше»
 * (§4, §22 прототипа): инструмент отдают сразу, человек уже что-то получил.
 */
export function Reward1Screen({ onNext }: { onNext: () => void }) {
  const { mark, assistant_1_opened } = useProgress()
  const ready = Boolean(config.assistant1Url)

  useEffect(() => {
    track('assistant1_viewed')
  }, [])

  return (
    <Screen bare>
      <Scene src={asset('world/offer-bench.webp')} still />
      {/*
        bleed выключен: с ним фигура уезжала на 8% за правый край, и ведущему
        срезало плечо с ноутбуком прямо границей экрана. Теперь он целиком в
        кадре.

        48vh и колонка min(190px, 52vw) — не подобранные на глаз числа, а
        решение одного неравенства: голова в исходнике начинается на 45%
        ширины фигуры, значит её левый край стоит на `ширина экрана −
        0.404 × высота`, и текст обязан заканчиваться раньше. На 320px это
        209px, на 430px — 249px; колонка в обоих случаях остаётся левее.
        Проверяется постоянно: scripts/hero.mjs (DESIGN.md §8.8).
      */}
      <Character pose="calm" side="right" height="48vh" delay={0.35} bleed={false} pin />

      <div className="relative z-20 flex flex-1 flex-col px-[var(--gutter)] pt-sp5 pb-sp2">
        <RewardAudienceScene />

        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: DUR.scene, ease: EASE_OUT, delay: BEAT.node }}
          className="display-xl on-scene mt-sp4 flex items-center gap-sp2 text-ink"
        >
          {REWARD_1.node}
          <Check size={26} weight="bold" className="text-[var(--acid)]" aria-hidden />
        </motion.h1>

        <div className="mt-sp3">
          <NodeRail step="reward1" dramatic onScene />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: DUR.scene, ease: EASE_OUT, delay: BEAT.lead }}
          className="mt-sp4 max-w-[min(190px,52vw)]"
        >
          <p className="on-scene text-[16px] leading-relaxed text-ink">{REWARD_1.lead}</p>
          <ul className="mt-sp2 flex flex-col gap-1">
            {REWARD_1.items.map((item) => (
              <li key={item} className="on-scene flex items-start gap-sp2 text-[15px] leading-snug text-ink-2">
                <span aria-hidden className="mt-[9px] h-[3px] w-[3px] shrink-0 rounded-full bg-[var(--acid)]" />
                {item}
              </li>
            ))}
          </ul>
        </motion.div>

        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: DUR.scene, ease: EASE_OUT, delay: BEAT.punch }}
          className="on-scene mt-sp4 max-w-[min(190px,52vw)] rounded-card border border-[var(--acid)]/50 bg-[color-mix(in_oklab,var(--color-ground-deep)_74%,transparent)] px-sp3 py-sp3 text-[17px] leading-snug font-semibold text-ink backdrop-blur-[2px]"
        >
          {REWARD_1.punch}
        </motion.p>

        <div className="flex-1" />

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: DUR.scene, ease: EASE_OUT, delay: BEAT.tool }}
        >
          <RewardBlock
            number="01"
            title={REWARD_1.tool}
            hint={REWARD_1.toolHint}
            taken={assistant_1_opened}
            ready={ready}
            className="mt-sp4"
          />
        </motion.div>
      </div>

      <BottomBar>
        {assistant_1_opened ? (
          <Button variant="secondary" onClick={onNext}>
            {CTA.next}
          </Button>
        ) : (
          <Button
            onClick={() => {
              track('assistant1_clicked')
              mark('assistant_1_opened', true)
              if (ready) openExternal(config.assistant1Url)
            }}
          >
            {CTA.takeAssistant}
          </Button>
        )}
      </BottomBar>
    </Screen>
  )
}
