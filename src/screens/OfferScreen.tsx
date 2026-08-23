import { useEffect } from 'react'
import { motion } from 'motion/react'
import { Screen } from '../ui/Screen'
import { Scene } from '../ui/Scene'
import { Character } from '../ui/Character'
import { Button } from '../ui/Button'
import { BottomBar } from '../ui/BottomBar'
import {
  OFFER_CLOSE,
  OFFER_GET,
  OFFER_INSIDE,
  OFFER_LEAD,
  OFFER_RESULT,
  PRICE_REASON,
} from '../content/offer'
import { config, formatPrice } from '../config'
import { track } from '../lib/analytics'
import { openExternal } from '../lib/telegram'
import { useProgress } from '../store/progress'
import { DUR, EASE_OUT } from '../lib/motion'
import { asset } from '../lib/asset'

/**
 * Экран 8. Трафик Лаб.
 *
 * Не лендинг внутри Mini App, но и не четыре строки: возражение «я и сам так
 * могу» снимается перечнем мелочей, каждая из которых стоит вечера. Порядок
 * блоков — из §15 прототипа: результат → что внутри → что получишь → цена.
 */
export function OfferScreen({ onNext }: { onNext: () => void }) {
  const mark = useProgress((s) => s.mark)

  useEffect(() => {
    track('tripwire_viewed')
    mark('offer_viewed', true)
  }, [mark])

  const reason = PRICE_REASON.replace('{full}', formatPrice(config.fullPrice)).replace(
    '{tripwire}',
    formatPrice(config.tripwirePrice),
  )

  return (
    <Screen bare>
      <header className="relative h-[46vh] shrink-0 overflow-hidden">
        <Scene src={asset('world/lab-interior.webp')} still />
        <Character pose="calm" side="right" height="40vh" delay={0.15} />
        <div className="relative z-20 px-[var(--gutter)] pt-sp6">
          <h1 className="display-xl on-scene max-w-[8ch] text-ink">Трафик Лаб</h1>
        </div>
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 bottom-0 z-20 h-24"
          style={{ background: 'linear-gradient(to top, var(--color-ground), transparent)' }}
        />
      </header>

      <div className="relative z-20 flex flex-1 flex-col px-[var(--gutter)]">
        {OFFER_LEAD.map((line, i) => (
          <p
            key={line}
            className={
              i === 0
                ? 'max-w-[38ch] text-[19px] leading-snug font-semibold text-ink'
                : 'mt-sp3 max-w-[38ch] text-[16px] leading-relaxed text-ink-2'
            }
          >
            {line}
          </p>
        ))}

        <section className="mt-sp5 border-t border-line pt-sp4">
          <h2 className="label-mono text-gold">Результат</h2>
          <p className="mt-sp2 max-w-[38ch] text-[16px] leading-relaxed text-ink">{OFFER_RESULT}</p>
        </section>

        <section className="mt-sp4 border-t border-line pt-sp4">
          <h2 className="label-mono text-gold">Что внутри</h2>
          <div className="mt-sp3 flex flex-col gap-sp3">
            {OFFER_INSIDE.map((block, i) => (
              <motion.div
                key={block.group}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: DUR.ui, ease: EASE_OUT, delay: i * 0.05 }}
              >
                <p className="label-mono text-ink-3">{block.group}</p>
                <ul className="mt-sp2 flex flex-col gap-[6px]">
                  {block.items.map((item) => (
                    <li key={item} className="flex gap-sp2 text-[15px] leading-snug text-ink">
                      <span aria-hidden className="mt-[9px] h-[3px] w-[3px] shrink-0 rounded-full bg-gold" />
                      <span className="max-w-[36ch]">{item}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
        </section>

        <section className="mt-sp4 border-t border-line pt-sp4">
          <h2 className="label-mono text-gold">Что получишь</h2>
          <p className="mt-sp2 max-w-[38ch] text-[16px] leading-relaxed text-ink">{OFFER_GET}</p>
        </section>

        <p className="mt-sp5 max-w-[38ch] text-[17px] leading-relaxed font-medium text-ink">
          {OFFER_CLOSE}
        </p>

        <div className="mt-sp5 flex items-baseline gap-sp3 border-t border-line pt-sp4">
          <span className="font-mono text-[34px] leading-none font-semibold tabular-nums text-ink">
            {formatPrice(config.tripwirePrice)}
          </span>
          <span className="font-mono text-[17px] leading-none text-ink-3 line-through">
            {formatPrice(config.fullPrice)}
          </span>
        </div>
        <p className="mt-sp2 mb-sp5 max-w-[38ch] text-[15px] leading-relaxed text-ink-2">{reason}</p>
      </div>

      <BottomBar>
        <Button
          onClick={() => {
            track('checkout_clicked')
            mark('checkout_started', true)
            if (config.checkoutUrl) {
              openExternal(config.checkoutUrl)
              return
            }
            onNext()
          }}
        >
          Собрать свою посадку — {formatPrice(config.tripwirePrice)}
        </Button>
      </BottomBar>
    </Screen>
  )
}
