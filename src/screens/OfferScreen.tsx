import { useEffect } from 'react'
import { motion } from 'motion/react'
import { Screen } from '../ui/Screen'
import { Scene } from '../ui/Scene'
import { Character } from '../ui/Character'
import { Button } from '../ui/Button'
import { BottomBar } from '../ui/BottomBar'
import { config, formatPrice } from '../config'
import { track } from '../lib/analytics'
import { openExternal } from '../lib/telegram'
import { useProgress } from '../store/progress'
import { DUR, EASE_OUT } from '../lib/motion'
import { asset } from '../lib/asset'

/**
 * Экран 8. Трафик Лаб.
 *
 * Не лендинг внутри Mini App: кадр-шапка, четыре блока и цена (§15 прототипа).
 * Продаёт человек, а не плашка, поэтому сверху он сам — в полный кадр, как на
 * референсе, а не портретом-марочкой.
 */
const BLOCKS = [
  { title: 'Результат', body: 'Соберёшь и опубликуешь посадочную под свою рекламную гипотезу.' },
  {
    title: 'Что внутри',
    body: 'Референсы → структура → постановка задачи ИИ → skills → визуалы → код → аналитика → публикация.',
  },
  {
    title: 'Что получишь',
    body: 'Уроки, готовые инструкции, рабочие схемы и файлы, которые можно сразу поставить себе.',
  },
]

export function OfferScreen({ onNext }: { onNext: () => void }) {
  const mark = useProgress((s) => s.mark)

  useEffect(() => {
    track('tripwire_viewed')
    mark('offer_viewed', true)
  }, [mark])

  return (
    <Screen bare>
      {/* Кадр-шапка: сцена, фигура и заголовок живут в одном блоке и скроллятся вместе. */}
      <header className="relative h-[54vh] shrink-0 overflow-hidden">
        <Scene src={asset('world/lab-interior.webp')} still />
        <Character pose="calm" side="right" height="46vh" delay={0.15} />
        <div className="relative z-20 px-[var(--gutter)] pt-sp6">
          <h1 className="display-xl on-scene max-w-[8ch] text-ink">Трафик Лаб</h1>
        </div>
        {/* Растушёвка к контенту, чтобы кадр не обрывался линией. */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 bottom-0 z-20 h-24"
          style={{ background: 'linear-gradient(to top, var(--color-ground), transparent)' }}
        />
      </header>

      <div className="relative z-20 flex flex-1 flex-col px-[var(--gutter)]">
        <p className="max-w-[38ch] text-[17px] leading-relaxed text-ink-2">
          Между «я видел, как это делается» и «я спокойно собираю такую посадку на своём проекте»
          лежит куча мелочей. Я собрал их в один короткий практикум.
        </p>

        <div className="mt-sp5 flex flex-col divide-y divide-line border-y border-line">
          {BLOCKS.map((block, i) => (
            <motion.section
              key={block.title}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: DUR.ui, ease: EASE_OUT, delay: i * 0.06 }}
              className="py-sp4"
            >
              <h2 className="label-mono text-gold">{block.title}</h2>
              <p className="mt-sp2 max-w-[40ch] text-[16px] leading-relaxed text-ink">{block.body}</p>
            </motion.section>
          ))}
        </div>

        <div className="mt-sp5 flex items-baseline gap-sp3">
          <span className="font-mono text-[34px] leading-none font-semibold tabular-nums text-ink">
            {formatPrice(config.tripwirePrice)}
          </span>
          <span className="font-mono text-[17px] leading-none text-ink-3 line-through">
            {formatPrice(config.fullPrice)}
          </span>
        </div>
        <p className="mt-sp2 mb-sp5 max-w-[38ch] text-[15px] leading-relaxed text-ink-2">
          Ты прошёл маршрут и получил допуск, поэтому забираешь практикум за{' '}
          {formatPrice(config.tripwirePrice)}. Обычная цена — {formatPrice(config.fullPrice)}.
        </p>
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
            // Оплаты ещё нет: не делаем вид, что она есть, и не тупим на кнопке.
            onNext()
          }}
        >
          Собрать свою посадку — {formatPrice(config.tripwirePrice)}
        </Button>
      </BottomBar>
    </Screen>
  )
}
