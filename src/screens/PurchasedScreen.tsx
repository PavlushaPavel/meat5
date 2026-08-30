import { useEffect, useState } from 'react'
import { motion } from 'motion/react'
import { Screen } from '../ui/Screen'
import { Scene } from '../ui/Scene'
import { ReadingScrim } from '../ui/Bridge'
import { Button } from '../ui/Button'
import { BottomBar } from '../ui/BottomBar'
import { CTA, PURCHASED } from '../content/copy'
import { config } from '../config'
import { track } from '../lib/analytics'
import { openExternal } from '../lib/telegram'
import { useProgress } from '../store/progress'
import { DUR, EASE_OUT } from '../lib/motion'
import { asset } from '../lib/asset'

/**
 * Экран 9 (STATE11). Доступ получен (SPEC.md §29).
 * Motion открывает новый сектор — не «спасибо за оплату», а открытая дверь.
 */
export function PurchasedScreen() {
  const mark = useProgress((s) => s.mark)
  // §36: если purchased уже true (например, attribution.ts проставил его по
  // paid start_param до монтирования этого экрана), purchase_success уже
  // отправлен — не дублируем событие.
  const [alreadyPurchased] = useState(() => useProgress.getState().purchased)

  useEffect(() => {
    if (!alreadyPurchased) track('purchase_success')
    mark('purchased', true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <Screen bare>
      <Scene src={asset('world/assembly.webp')} still />
      <ReadingScrim strength={62} />

      <div className="relative z-10 flex flex-1 flex-col justify-center px-[var(--gutter)]">
        <motion.h1
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: DUR.scene, ease: EASE_OUT }}
          className="display-xl on-scene text-ink"
        >
          {PURCHASED.title}
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: DUR.scene, ease: EASE_OUT, delay: 0.12 }}
          className="on-scene mt-sp3 max-w-[38ch] text-[16px] leading-relaxed text-ink"
        >
          {PURCHASED.support}
        </motion.p>
      </div>

      <BottomBar>
        <Button disabled={!config.practicumUrl} onClick={() => openExternal(config.practicumUrl)}>
          {CTA.start}
        </Button>
      </BottomBar>
    </Screen>
  )
}
