import { motion } from 'motion/react'
import { Screen } from '../ui/Screen'
import { Scene } from '../ui/Scene'
import { Character } from '../ui/Character'
import { Button } from '../ui/Button'
import { BottomBar } from '../ui/BottomBar'
import { NodeRail } from '../ui/NodeRail'
import { RewardBlock } from '../ui/RewardBlock'
import { config } from '../config'
import { track } from '../lib/analytics'
import { openExternal } from '../lib/telegram'
import { useProgress } from '../store/progress'
import { DUR, EASE_OUT } from '../lib/motion'
import { asset } from '../lib/asset'

/**
 * Экран 3. Награда после протокола 01.
 *
 * Главное действие здесь — ЗАБРАТЬ ИНСТРУМЕНТ, и только после этого «идти
 * дальше» (§4, §22 прототипа). Инструмент отдают сразу, а не обещают в конце
 * курса: человек уже что-то получил, и дальше он читает воронку иначе.
 */
export function Reward1Screen({ onNext }: { onNext: () => void }) {
  const { mark, assistant_1_opened } = useProgress()
  const ready = Boolean(config.assistant1Url)

  return (
    <Screen bare>
      <Scene src={asset('world/offer-bench.webp')} still />
      <Character pose="calm" side="right" height="48vh" delay={0.35} />

      <div className="relative z-20 flex flex-1 flex-col px-[var(--gutter)] pt-sp6 pb-sp2">
        <p className="label-mono text-[var(--acid)]">получено</p>
        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: DUR.scene, ease: EASE_OUT, delay: 0.1 }}
          className="display-xl on-scene mt-sp2 text-ink"
        >
          Карта
          <br />
          аудитории
        </motion.h1>

        <div className="mt-sp4">
          <NodeRail step="reward1" dramatic onScene />
        </div>

        <div className="flex-1" />

        <RewardBlock
          number="01"
          title="Разбор аудитории"
          hint="Попробуй прямо сейчас на своём проекте: он соберёт ситуации покупки, барьеры и антиперсон, а решать, что забрать в работу, будешь ты."
          taken={assistant_1_opened}
          ready={ready}
          className="mt-sp4"
        />
      </div>

      <BottomBar>
        {assistant_1_opened ? (
          <Button onClick={onNext}>Идти дальше</Button>
        ) : (
          <>
            <Button
              onClick={() => {
                track('assistant1_clicked')
                mark('assistant_1_opened', true)
                if (ready) openExternal(config.assistant1Url)
              }}
            >
              Забрать ассистента
            </Button>
            <p className="mt-sp2 text-center text-[14px] leading-snug text-ink-2">
              Попробуй прямо сейчас на своём проекте.
            </p>
          </>
        )}
      </BottomBar>
    </Screen>
  )
}
