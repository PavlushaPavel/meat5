import { motion } from 'motion/react'
import { Screen } from '../ui/Screen'
import { Scene } from '../ui/Scene'
import { Character } from '../ui/Character'
import { Button } from '../ui/Button'
import { BottomBar } from '../ui/BottomBar'
import { NodeRail } from '../ui/NodeRail'
import { AssistantCard } from '../ui/AssistantCard'
import { config } from '../config'
import { track } from '../lib/analytics'
import { useProgress } from '../store/progress'
import { DUR, EASE_OUT } from '../lib/motion'
import { asset } from '../lib/asset'

/**
 * Экран 3. Награда после протокола 01.
 *
 * Инструмент отдаём здесь и сейчас, а не обещаем в конце курса: человек уже
 * что-то получил, и это меняет всё дальнейшее чтение воронки.
 */
export function Reward1Screen({ onNext }: { onNext: () => void }) {
  const mark = useProgress((s) => s.mark)

  return (
    <Screen bare>
      <Scene src={asset('world/offer-bench.webp')} still />
      <Character pose="calm" side="right" height="44vh" delay={0.35} />

      <div className="relative z-20 flex flex-1 flex-col px-[var(--gutter)] pt-sp6 pb-sp2">
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: DUR.ui, ease: EASE_OUT }}
          className="label-mono text-[var(--acid)]"
        >
          получено
        </motion.p>

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

        <div className="mt-sp5">
          <NodeRail step="reward1" dramatic />
        </div>

        <p className="on-scene mt-sp5 max-w-[34ch] text-[16px] leading-relaxed text-ink">
          Первый модуль лаборатории загорелся. Дальше — инструмент, который делает эту работу
          за тебя.
        </p>

        {/* Распорка: карточка прижата к низу, чтобы не закрывать лицо ведущего. */}
        <div className="flex-1" />

        <div className="mt-sp4">
          <AssistantCard
            number="01"
            title="Разбор аудитории"
            hint="Попробуй прямо сейчас на своём проекте"
            url={config.assistant1Url}
            onOpen={() => {
              track('assistant1_clicked')
              mark('assistant_1_opened', true)
            }}
          />
        </div>
      </div>

      <BottomBar>
        <Button onClick={onNext}>Идти дальше</Button>
      </BottomBar>
    </Screen>
  )
}
