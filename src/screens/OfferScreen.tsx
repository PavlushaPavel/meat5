import { useEffect } from 'react'
import { motion } from 'motion/react'
import { Screen } from '../ui/Screen'
import { Button } from '../ui/Button'
import { BottomBar } from '../ui/BottomBar'
import { Speaker } from '../ui/Speaker'
import { config, formatPrice } from '../config'
import { track } from '../lib/analytics'
import { openExternal } from '../lib/telegram'
import { useProgress } from '../store/progress'
import { DUR, EASE_OUT } from '../lib/motion'

/**
 * Экран 8. Трафик Лаб.
 *
 * Не превращаем страницу в огромный лендинг внутри Mini App: четыре блока и цена
 * (PRODUCT.md §15 прототипа). Логика продажи — «я показал весь процесс, повторять
 * мой путь целиком тебе незачем», а не «купи курс».
 */
const BLOCKS = [
  {
    title: 'Результат',
    body: 'Соберёшь и опубликуешь посадочную под свою рекламную гипотезу.',
  },
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
    <Screen>
      <div className="flex flex-1 flex-col pt-sp7">
        <div className="flex items-start gap-sp3">
          <h1 className="display-xl flex-1 text-ink">Трафик Лаб</h1>
          <Speaker size="lg" className="-mt-sp2" />
        </div>
        <p className="mt-sp3 max-w-[38ch] text-[17px] leading-relaxed text-ink-2">
          Между «я видел, как это делается» и «я спокойно собираю такую посадку на своём проекте»
          лежит куча мелочей. Я собрал их в один короткий практикум.
        </p>

        <div className="mt-sp6 flex flex-col divide-y divide-line border-y border-line">
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
        <p className="mt-sp2 max-w-[38ch] text-[15px] leading-relaxed text-ink-2">
          Ты прошёл маршрут и получил допуск, поэтому забираешь практикум за
          {' '}{formatPrice(config.tripwirePrice)}. Обычная цена — {formatPrice(config.fullPrice)}.
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
