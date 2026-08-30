import { useEffect, useState } from 'react'
import { motion } from 'motion/react'
import { Screen } from '../ui/Screen'
import { Scene } from '../ui/Scene'
import { ReadingScrim } from '../ui/Bridge'
import { Button } from '../ui/Button'
import { BottomBar } from '../ui/BottomBar'
import { LinkageAssembly } from '../ui/LinkageAssembly'
import { MetaLayers } from '../ui/MetaLayers'
import { OfferCascade } from '../ui/OfferCascade'
import { CTA, LINKAGE, AFTER_SITE, META_REVEAL, TO_OFFER } from '../content/copy'
import { config } from '../config'
import { track } from '../lib/analytics'
import { openExternal } from '../lib/telegram'
import { useProgress } from '../store/progress'
import { DUR, EASE_OUT } from '../lib/motion'
import { asset } from '../lib/asset'

type Phase = 'assemble' | 'afterSite' | 'meta' | 'toOffer'

/** Разбивает строку по `\n` в JSX с <br/> — переносы в copy.ts заданы явно. */
function withBreaks(text: string) {
  const parts = text.split('\n')
  return parts.map((part, i) => (
    <span key={i}>
      {part}
      {i < parts.length - 1 && <br />}
    </span>
  ))
}

/**
 * Экран 7 (STATE09). Связка собрана → возврат после сайта → meta reveal →
 * переход к офферу (SPEC.md §22-25).
 *
 * Между демо-сайтом и ценой раньше стояло шесть нажатий на одном перегруженном
 * экране «payoff». Здесь те же четыре смысловых участка ТЗ разложены по
 * фазам с раскрытием по одному (DESIGN.md §8.5) — на каждую фазу ровно одно
 * действие внизу, ничего не потеряно, но путь короче: после возврата с сайта
 * человеку остаётся три коротких «Дальше» до экрана оффера, где цена уже видна.
 */
export function BundleScreen({ onNext }: { onNext: () => void }) {
  const { mark, result_site_opened, meta_reveal_completed } = useProgress()
  const [phase, setPhase] = useState<Phase>(() =>
    meta_reveal_completed ? 'toOffer' : result_site_opened ? 'afterSite' : 'assemble',
  )
  const [awaiting, setAwaiting] = useState(false)

  useEffect(() => {
    track('linkage_completed')
  }, [])

  useEffect(() => {
    if (phase === 'meta') track('meta_reveal_viewed')
  }, [phase])

  /**
   * §23: человек СНАЧАЛА смотрит собранный сайт и только потом возвращается
   * к обещанию. Payoff ждёт фактического возврата во вкладку, а не срабатывает
   * по клику. Telegram не всегда отдаёт это событие — рядом всегда есть ручная
   * кнопка (тот же CTA.next), и человек не может застрять.
   */
  useEffect(() => {
    if (!awaiting) return
    const back = () => {
      if (document.visibilityState !== 'visible') return
      setAwaiting(false)
      setPhase('afterSite')
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
      {phase !== 'assemble' && <ReadingScrim strength={78} />}

      <div className="relative z-20 flex flex-1 flex-col px-[var(--gutter)] pt-sp6">
        {phase === 'assemble' && (
          <div className="flex flex-1 flex-col justify-center">
            <LinkageAssembly step="bundle" />
            <motion.h1
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: DUR.scene, ease: EASE_OUT, delay: 1.7 }}
              className="display-xl mt-sp6 text-ink [text-shadow:0_4px_40px_rgba(2,6,14,0.9)]"
            >
              {LINKAGE.title}
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: DUR.scene, ease: EASE_OUT, delay: 1.85 }}
              className="on-scene mt-sp3 max-w-[38ch] text-[16px] leading-relaxed text-ink"
            >
              {LINKAGE.support}
            </motion.p>
          </div>
        )}

        {/*
          Два разных удара из ТЗ, не один абзац: первое — тихий вопрос
          (тише и мельче), второе — главный удар (крупнее, задержка больше,
          несёт вес заголовка), третье — спокойное пояснение следом. Экран
          держит единый ритм остальных фаз: блок стоит по центру свободной
          высоты между шапкой и панелью действия, а не прилипает к верху.
        */}
        {phase === 'afterSite' && (
          <div className="flex flex-1 flex-col justify-center">
            <motion.p
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: DUR.ui, ease: EASE_OUT, delay: 0.15 }}
              className="on-scene max-w-[30ch] text-[16px] leading-snug font-medium text-ink-2"
            >
              {AFTER_SITE[0].text}
            </motion.p>
            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: DUR.scene, ease: EASE_OUT, delay: 0.65 }}
              className="display-m on-scene mt-sp3 max-w-[22ch] text-ink"
            >
              {AFTER_SITE[1].text}
            </motion.p>
            <motion.p
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: DUR.ui, ease: EASE_OUT, delay: 1.15 }}
              className="on-scene mt-sp4 max-w-[38ch] text-[15px] leading-relaxed text-ink-2"
            >
              {AFTER_SITE[2].text}
            </motion.p>
          </div>
        )}

        {phase === 'meta' && (
          <div className="flex flex-1 flex-col justify-center">
            <MetaLayers layers={META_REVEAL.layers} lines={META_REVEAL.lines} />
          </div>
        )}

        {phase === 'toOffer' && (
          <div className="pb-sp4">
            <h1 className="display-xl on-scene mt-sp2 max-w-[15ch] text-ink">
              {withBreaks(TO_OFFER.title)}
            </h1>
            <p className="on-scene mt-sp3 max-w-[36ch] text-[17px] leading-snug font-semibold text-ink">
              {TO_OFFER.lead}
            </p>
            <p className="on-scene mt-sp2 max-w-[38ch] text-[15px] leading-relaxed text-ink-2">
              {TO_OFFER.support}
            </p>
            <OfferCascade cards={TO_OFFER.cards} className="mt-sp5" />
            <p className="on-scene mt-sp5 max-w-[36ch] text-[16px] leading-relaxed font-medium text-ink">
              {withBreaks(TO_OFFER.close)}
            </p>
          </div>
        )}
      </div>

      <BottomBar>
        {phase === 'assemble' &&
          (awaiting ? (
            <Button variant="secondary" onClick={() => setPhase('afterSite')}>
              {CTA.next}
            </Button>
          ) : (
            <Button
              onClick={() => {
                track('demo_site_clicked')
                mark('result_site_opened', true)
                if (!config.resultDemoUrl) {
                  setPhase('afterSite')
                  return
                }
                openExternal(config.resultDemoUrl)
                setAwaiting(true)
              }}
            >
              {CTA.seeResult}
            </Button>
          ))}

        {phase === 'afterSite' && <Button onClick={() => setPhase('meta')}>{CTA.next}</Button>}

        {phase === 'meta' && (
          <Button
            onClick={() => {
              mark('meta_reveal_completed', true)
              setPhase('toOffer')
            }}
          >
            {CTA.next}
          </Button>
        )}

        {phase === 'toOffer' && <Button onClick={onNext}>{CTA.next}</Button>}
      </BottomBar>
    </Screen>
  )
}
