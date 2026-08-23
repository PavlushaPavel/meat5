import { useEffect, useState } from 'react'
import { motion } from 'motion/react'
import { Screen } from '../ui/Screen'
import { Scene } from '../ui/Scene'
import { Bridge } from '../ui/Bridge'
import { Button } from '../ui/Button'
import { BottomBar } from '../ui/BottomBar'
import { NodeRail } from '../ui/NodeRail'
import { BUNDLE_TEXT, META_REVEAL } from '../content/script'
import { config } from '../config'
import { track } from '../lib/analytics'
import { openExternal } from '../lib/telegram'
import { useProgress } from '../store/progress'
import { DUR, EASE_OUT } from '../lib/motion'
import { asset } from '../lib/asset'

/**
 * Экран 7. Связка собрана.
 *
 * ДОРОГОЙ МОУШН №4: три узла соединяются линией, кадр выдыхает.
 * Здесь же замыкается самое начало: человек пришёл больше зарабатывать, не работая
 * кратно больше, — и именно это ему возвращают словами, а не «поздравляем».
 */
export function BundleScreen({ onNext }: { onNext: () => void }) {
  const { mark, result_site_opened } = useProgress()
  const [phase, setPhase] = useState<'assemble' | 'payoff'>(result_site_opened ? 'payoff' : 'assemble')
  const [awaiting, setAwaiting] = useState(false)

  /**
   * §13 прототипа: человек СНАЧАЛА смотрит собранный сайт и только потом
   * возвращается к обещанию. Поэтому payoff ждёт фактического возвращения во
   * вкладку, а не срабатывает по клику. Telegram не всегда отдаёт это событие —
   * поэтому рядом всегда есть ручная кнопка, и человек не может застрять.
   */
  useEffect(() => {
    if (!awaiting) return
    const back = () => {
      if (document.visibilityState !== 'visible') return
      setAwaiting(false)
      setPhase('payoff')
    }
    document.addEventListener('visibilitychange', back)
    window.addEventListener('focus', back)
    return () => {
      document.removeEventListener('visibilitychange', back)
      window.removeEventListener('focus', back)
    }
  }, [awaiting])

  return (
    <Screen bare>
      <Scene src={asset('world/city-conversions.webp')} align="top" />

      <div className="relative z-20 flex flex-1 flex-col px-[var(--gutter)] pt-sp6">
        {phase === 'assemble' && (
          <>
            <NodeRail step="bundle" dramatic onScene />
            <motion.h1
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: DUR.scene, ease: EASE_OUT, delay: 0.75 }}
              className="display-xl mt-sp5 text-ink [text-shadow:0_4px_40px_rgba(2,6,14,0.9)]"
            >
              Связка
              <br />
              готова
            </motion.h1>
            <Bridge blocks={BUNDLE_TEXT} delay={1.1} plate className="mt-sp5" />
          </>
        )}

        {phase === 'payoff' && (
          <div className="flex flex-1 flex-col justify-center py-sp6">
            <h1 className="display-m on-scene text-balance text-ink">
              Не брать на себя больше работы. Брать под контроль больше результата.
            </h1>
            <p className="on-scene mt-sp4 max-w-[40ch] text-[16px] leading-relaxed text-ink-2">
              Ты пришёл больше зарабатывать — не за счёт того, чтобы больше пахать. Сейчас ты
              увидел, как взять под контроль ещё один кусок результата. Большую часть тяжёлой
              работы при этом сделали ИИ-инструменты.
            </p>

            <div className="mt-sp6 border-t border-line pt-sp4">
              {META_REVEAL.map((line, i) => (
                <motion.p
                  key={line}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: DUR.ui, ease: EASE_OUT, delay: 0.1 + i * 0.08 }}
                  className="mt-sp2 max-w-[40ch] text-[15px] leading-relaxed text-ink-3"
                >
                  {line}
                </motion.p>
              ))}
            </div>
          </div>
        )}
      </div>

      <BottomBar>
        {phase === 'assemble' ? (
          awaiting ? (
            <Button variant="secondary" onClick={() => setPhase('payoff')}>
              Посмотрел — вернуться
            </Button>
          ) : (
            <Button
              onClick={() => {
                track('demo_site_clicked')
                mark('result_site_opened', true)
                if (!config.resultDemoUrl) {
                  setPhase('payoff')
                  return
                }
                openExternal(config.resultDemoUrl)
                setAwaiting(true)
              }}
            >
              Посмотреть результат
            </Button>
          )
        ) : (
          <Button onClick={onNext}>Что дальше</Button>
        )}
      </BottomBar>
    </Screen>
  )
}
