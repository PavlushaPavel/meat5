import { useEffect, useRef, useState } from 'react'
import { motion } from 'motion/react'
import { Screen } from '../ui/Screen'
import { Scene } from '../ui/Scene'
import { Character } from '../ui/Character'
import { Button } from '../ui/Button'
import { BottomBar } from '../ui/BottomBar'
import { CTA } from '../content/copy'
import { TRIPWIRE, OFFER_SECTIONS } from '../content/offer'
import { config, formatPrice } from '../config'
import { track } from '../lib/analytics'
import { openExternal } from '../lib/telegram'
import { useProgress } from '../store/progress'
import { DUR, EASE_OUT } from '../lib/motion'
import { asset } from '../lib/asset'

/**
 * Экран 8 (STATE10). Трафик Лаб (SPEC.md §26-28).
 *
 * Заголовок, подзаголовок, цена и главный CTA стоят СРАЗУ, без прокрутки —
 * человек приходит сюда на пике мотивации (сразу увидел готовый сайт), и
 * путь до цены не должен требовать чтения четырёх секций. Ниже — компактное
 * содержание оффера (§27, не лендинг) и второй, дублирующий CTA внизу для тех,
 * кто дочитал до конца.
 */
export function OfferScreen({ onNext }: { onNext: () => void }) {
  const mark = useProgress((s) => s.mark)

  useEffect(() => {
    track('tripwire_viewed')
    mark('tripwire_viewed', true)
  }, [mark])

  /**
   * Задача 1: пока кнопка в герое видна, липкая нижняя панель не показывается —
   * иначе на экране одновременно два одинаковых главных действия (растерянность,
   * а не выбор). Следим за видимостью через IntersectionObserver, а не за
   * числом пикселей скролла: устойчиво к смене высоты хедера/шрифтов.
   * BottomBar не размонтируется (data-bottom-bar должен остаться на месте для
   * проверочных скриптов) — вместо этого её единственная кнопка временно
   * `disabled`, и панель сама уходит вниз по уже существующей в BottomBar
   * логике скрытия недоступного действия.
   */
  const heroCtaRef = useRef<HTMLDivElement>(null)
  const [heroCtaVisible, setHeroCtaVisible] = useState(true)

  useEffect(() => {
    const el = heroCtaRef.current
    if (!el) return
    const observer = new IntersectionObserver(([entry]) => setHeroCtaVisible(entry.isIntersecting), {
      threshold: 0,
    })
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  const price = formatPrice(config.tripwirePrice)
  const buyLabel = CTA.buy.replace('{price}', price)
  const startLabel = CTA.startPracticum.replace('{price}', price)

  /**
   * Критично (§28): клик фиксирует checkout_started и открывает checkoutUrl
   * НАРУЖУ, но НЕ переводит на «доступ получен» сам по себе — покупку
   * подтверждает только возврат по ссылке с оплаченным start_param
   * (lib/attribution.ts, уже реализовано). Если checkoutUrl ещё пуст
   * (материалов оплаты пока нет), оставляем текущее поведение-заглушку —
   * маршрут можно пройти и принять целиком уже сейчас.
   */
  function buy() {
    track('tripwire_cta_clicked')
    track('checkout_started')
    mark('checkout_started', true)
    if (config.checkoutUrl) {
      openExternal(config.checkoutUrl)
      return
    }
    // Заглушка приёмки, пока чекаута нет. Отметить покупку обязательно:
    // без неё canEnter('purchased') не пустит на экран доступа и вернёт
    // человека назад в маршрут — проход воронки на этом и спотыкался.
    mark('purchased', true)
    onNext()
  }

  return (
    <Screen bare>
      <header className="relative h-[50vh] shrink-0 overflow-hidden">
        {/*
          Scene теперь сама растворяет нижний край кадра в фоне (см. Scene.tsx,
          задача 2) — отдельная затемняющая плашка здесь больше не нужна и
          только дублировала бы её работу.
        */}
        <Scene src={asset('world/lab-interior.webp')} still />
        <Character pose="calm" side="right" height="40vh" delay={0.15} bleed={false} />
        {/*
          Задача 3: заголовок поднят выше и сужен, чтобы не ложиться на лицо
          персонажа. Герой стоит справа и достаёт до ~40vh снизу хедера —
          выше pt-sp3 и уже max-w-[7ch] держат «ТРАФИК ЛАБ» в верхнем левом
          углу кадра, в стороне от лица, не уменьшая и не обрезая персонажа.
        */}
        <div className="relative z-20 px-[var(--gutter)] pt-sp3">
          <h1 className="display-xl on-scene max-w-[7ch] text-ink">{config.tripwireTitle}</h1>
        </div>
      </header>

      <div className="relative z-20 flex flex-1 flex-col px-[var(--gutter)]">
        <p className="max-w-[34ch] text-[17px] leading-snug font-semibold text-ink">
          {TRIPWIRE.subtitle}
        </p>

        <div className="mt-sp4 flex items-baseline gap-sp3">
          {/*
            Задача 4: моноширинный разряд-разделитель (неразрывный пробел из
            formatPrice) в JetBrains Mono рисуется на всю ширину знакоместа —
            цена читалась как три разных элемента. word-spacing стягивает
            именно эти пробелы между разрядами, не трогая интервал между
            цифрами внутри числа: цена остаётся одним словом, разряд — на
            своём неразрывном пробеле.
          */}
          <span
            className="font-mono text-[34px] leading-none font-semibold tabular-nums text-ink"
            style={{ wordSpacing: '-0.4em' }}
          >
            {price}
          </span>
          <span
            className="font-mono text-[17px] leading-none text-ink-3 line-through"
            style={{ wordSpacing: '-0.4em' }}
          >
            {formatPrice(config.tripwireRegularPrice)}
          </span>
        </div>
        <p className="mt-sp2 max-w-[36ch] text-[14px] leading-relaxed text-ink-2">
          {TRIPWIRE.priceNote}
        </p>

        <div ref={heroCtaRef}>
          <Button onClick={buy} className="mt-sp4">
            {buyLabel}
          </Button>
        </div>

        <section className="mt-sp6 border-t border-line pt-sp4">
          <h2 className="label-mono text-gold">Результат</h2>
          <p className="mt-sp2 max-w-[38ch] text-[16px] leading-relaxed text-ink">
            {OFFER_SECTIONS.result}
          </p>
        </section>

        <section className="mt-sp4 border-t border-line pt-sp4">
          <h2 className="label-mono text-gold">Внутри</h2>
          <div className="mt-sp3 flex flex-wrap items-center gap-x-sp2 gap-y-sp2">
            {OFFER_SECTIONS.inside.map((item, i) => (
              <motion.span
                key={item}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: DUR.ui, ease: EASE_OUT, delay: i * 0.04 }}
                className="flex items-center gap-sp2"
              >
                <span className="label-mono rounded-pill border border-line bg-[color-mix(in_oklab,var(--color-ground-deep)_80%,transparent)] px-sp3 py-[6px] text-ink">
                  {item}
                </span>
                {i < OFFER_SECTIONS.inside.length - 1 && (
                  <span aria-hidden className="text-ink-3">
                    →
                  </span>
                )}
              </motion.span>
            ))}
          </div>
        </section>

        <section className="mt-sp4 border-t border-line pt-sp4">
          <h2 className="label-mono text-gold">{OFFER_SECTIONS.extraTitle}</h2>
          <ul className="mt-sp3 flex flex-col gap-[6px]">
            {OFFER_SECTIONS.extra.map((item) => (
              <li key={item} className="flex gap-sp2 text-[15px] leading-snug text-ink">
                <span aria-hidden className="mt-[9px] h-[3px] w-[3px] shrink-0 rounded-full bg-gold" />
                <span className="max-w-[36ch]">{item}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="mt-sp4 mb-sp5 border-t border-line pt-sp4">
          <h2 className="label-mono text-gold">{OFFER_SECTIONS.formatTitle}</h2>
          <p className="mt-sp2 max-w-[38ch] text-[16px] leading-relaxed text-ink">
            {OFFER_SECTIONS.format}
          </p>
        </section>
      </div>

      <BottomBar>
        {/*
          disabled, пока видна кнопка в герое: BottomBar сама прячет панель,
          когда её единственное действие недоступно (ui/BottomBar.tsx) — тем
          же приёмом, что уже используется для «Разобраться»/«Дальше». Так в
          любой момент на экране ровно одно главное действие, а не два золотых
          рядом.
        */}
        <Button onClick={buy} disabled={heroCtaVisible}>
          {startLabel}
        </Button>
      </BottomBar>
    </Screen>
  )
}
