import { useState } from 'react'
import { motion } from 'motion/react'
import { Screen } from '../ui/Screen'
import { Scene } from '../ui/Scene'
import { ElementReveal } from '../ui/ElementReveal'
import { VideoBlock } from '../ui/VideoBlock'
import { Button } from '../ui/Button'
import { BottomBar } from '../ui/BottomBar'
import { LAB1_BRIDGE } from '../content/script'
import { config } from '../config'
import { track } from '../lib/analytics'
import { useProgress } from '../store/progress'
import { DUR, EASE_OUT } from '../lib/motion'
import { asset } from '../lib/asset'

/**
 * Экран 2. Первый эксперимент.
 *
 * ДОРОГОЙ МОУШН №2: створки расходятся, жёлтый свет заливает кадр. Открытие
 * города здесь НЕ повторяем — двери открылись, человек уже внутри.
 *
 * Мост читается ТЕКСТОМ, а не голосом: второй голосовой подряд превращает вход
 * в лабораторию в ещё одно ожидание, вместо того чтобы дать делать. На центральном
 * экране в этот момент проявляется первый неизвестный элемент связки.
 */
export function Lab1Screen({ onNext }: { onNext: () => void }) {
  const { mark, video_1_completed } = useProgress()
  const [phase, setPhase] = useState<'bridge' | 'video'>(video_1_completed ? 'video' : 'bridge')

  return (
    <Screen bare>
      <Scene src={asset('world/lab-interior.webp')} still />
      <Doors />
      {/* Мост читают, а не смотрят: на время чтения сцена уходит вглубь,
          иначе пояснительный текст спорит с колбами и полосами на полу. */}
      {phase === 'bridge' && (
        <div
          aria-hidden
          className="absolute inset-0 z-10"
          style={{ background: 'color-mix(in oklab, var(--color-ground) 74%, transparent)' }}
        />
      )}

      <div className="relative z-20 flex flex-1 flex-col px-[var(--gutter)] pt-sp5 pb-sp4">
        {phase === 'bridge' ? (
          <>
            <ElementReveal index="01" title="Кому мы продаём" />

            <div className="mt-sp5 flex flex-col gap-sp3">
              {LAB1_BRIDGE.map((block, i) => (
                <motion.div
                  key={block.text}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: DUR.ui, ease: EASE_OUT, delay: 1.05 + i * 0.07 }}
                >
                  {block.kind === 'quote' ? (
                    <p className="border-l-2 border-gold pl-sp3 text-[19px] leading-snug font-semibold text-ink on-scene">
                      «{block.text}»
                    </p>
                  ) : (
                    <p
                      className={
                        block.kind === 'lead'
                          ? 'on-scene max-w-[34ch] text-[19px] leading-snug font-semibold text-ink'
                          : 'on-scene max-w-[38ch] text-[16px] leading-relaxed text-ink-2'
                      }
                    >
                      {block.text}
                    </p>
                  )}
                </motion.div>
              ))}
            </div>
          </>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: DUR.ui, ease: EASE_OUT }}
          >
            <h1 className="display-m on-scene max-w-[12ch] text-ink">Элемент первый: кому мы продаём</h1>
            <div className="mt-sp5">
              <VideoBlock
                video={config.videos.v1}
                protocolNo="01"
                title="Кому мы продаём"
                eventPrefix="video1"
                onProgress={(share) => mark('video_1_progress', share)}
                onCompleted={() => mark('video_1_completed', true)}
              />
            </div>
          </motion.div>
        )}
      </div>

      <BottomBar>
        {phase === 'bridge' ? (
          <Button onClick={() => setPhase('video')}>Смотреть протокол 01</Button>
        ) : (
          <Button
            disabled={!video_1_completed}
            onClick={() => {
              track('lab_entered', { after: 'video1' })
              onNext()
            }}
          >
            {video_1_completed ? 'Забрать ассистента' : 'Сначала протокол 01'}
          </Button>
        )}
      </BottomBar>
    </Screen>
  )
}

/** Створки лаборатории. Уходят один раз и больше не мешают. */
function Doors() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 z-20 overflow-hidden">
      {(['left', 'right'] as const).map((side) => (
        <motion.div
          key={side}
          initial={{ x: 0 }}
          animate={{ x: side === 'left' ? '-100%' : '100%' }}
          transition={{ duration: 1.1, ease: EASE_OUT, delay: 0.15 }}
          className="absolute top-0 h-full w-1/2 bg-ground-deep motion-reduce:hidden"
          style={{
            [side]: 0,
            boxShadow:
              side === 'left'
                ? '8px 0 60px -10px rgba(249,183,6,0.35)'
                : '-8px 0 60px -10px rgba(249,183,6,0.35)',
          }}
        />
      ))}
    </div>
  )
}
