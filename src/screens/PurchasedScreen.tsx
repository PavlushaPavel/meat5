import { useEffect } from 'react'
import { motion } from 'motion/react'
import { Screen } from '../ui/Screen'
import { Scene } from '../ui/Scene'
import { Button } from '../ui/Button'
import { BottomBar } from '../ui/BottomBar'
import { config } from '../config'
import { track } from '../lib/analytics'
import { openExternal } from '../lib/telegram'
import { useProgress } from '../store/progress'
import { DUR, EASE_OUT } from '../lib/motion'
import { asset } from '../lib/asset'

/**
 * Экран 9. После покупки лаборатория меняет состояние.
 * Не «спасибо за оплату», а открытый новый сектор.
 */
export function PurchasedScreen() {
  const mark = useProgress((s) => s.mark)

  useEffect(() => {
    track('purchase_completed')
    mark('purchased', true)
  }, [mark])

  return (
    <Screen bare>
      <Scene src={asset('world/assembly.webp')} still />

      <div className="relative z-10 flex flex-1 flex-col justify-center px-[var(--gutter)]">
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: DUR.ui, ease: EASE_OUT }}
          className="label-mono text-[var(--acid)]"
        >
          доступ получен
        </motion.p>
        <motion.h1
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: DUR.scene, ease: EASE_OUT, delay: 0.1 }}
          className="display-xl mt-sp2 text-ink"
        >
          Сектор
          <br />
          открыт
        </motion.h1>
        <p className="mt-sp4 max-w-[38ch] text-[16px] leading-relaxed text-ink-2">
          Практикум ждёт внутри. Первый шаг — собрать структуру под свою гипотезу.
        </p>
      </div>

      <BottomBar>
        <Button
          disabled={!config.practicumUrl}
          onClick={() => openExternal(config.practicumUrl)}
        >
          {config.practicumUrl ? 'Начать практикум' : 'Ссылка появится здесь'}
        </Button>
      </BottomBar>
    </Screen>
  )
}
