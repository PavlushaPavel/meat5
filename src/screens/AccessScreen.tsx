import { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { Screen } from '../ui/Screen'
import { Scene } from '../ui/Scene'
import { Bridge, ReadingScrim } from '../ui/Bridge'
import { Button } from '../ui/Button'
import { BottomBar } from '../ui/BottomBar'
import { Lives } from '../ui/Lives'
import { BARRIER, BARRIER_RULES } from '../content/script'
import { QUIZ } from '../content/quiz'
import { track } from '../lib/analytics'
import { hapticNotify } from '../lib/telegram'
import { useProgress, QUIZ_LENGTH, QUIZ_LIVES } from '../store/progress'

const QUIZ_LIVES_LABEL = QUIZ_LIVES
import { DUR, EASE_OUT } from '../lib/motion'
import { asset } from '../lib/asset'
import { cn } from '../lib/cn'

type Phase = 'barrier' | 'quiz' | 'failed' | 'passed'

/**
 * Экран 5. Допуск в последнюю лабораторию: 12 ситуаций, 5 жизней.
 *
 * ДОРОГОЙ МОУШН №3 — «ДОПУСК ПОЛУЧЕН»: печать, вспышка кислоты, дверь уходит вверх.
 *
 * Провал НЕ унижает: «где-то мы слишком быстро проскочили базу» плюс точные
 * моменты для пересмотра. Никакого «пересмотрите весь курс».
 */
export function AccessScreen({ onNext }: { onNext: () => void }) {
  const { quiz_lives, missed, loseLife, resetQuiz, mark } = useProgress()
  const [phase, setPhase] = useState<Phase>('barrier')
  const [index, setIndex] = useState(0)
  const [picked, setPicked] = useState<number | null>(null)

  const question = QUIZ[index]

  function answer(option: number) {
    if (picked !== null) return
    setPicked(option)
    const right = option === question.correct
    if (right) {
      hapticNotify('success')
      return
    }
    hapticNotify('error')
    track('quiz_question_failed', { index, moment: question.moment })
    track('quiz_life_lost')
    loseLife(question.moment)
  }

  function advance() {
    const wasWrong = picked !== question.correct
    setPicked(null)
    if (wasWrong && quiz_lives <= 0) {
      track('quiz_failed', { index })
      setPhase('failed')
      return
    }
    if (index + 1 >= QUIZ_LENGTH) {
      track('quiz_passed')
      mark('quiz_completed', true)
      setPhase('passed')
      return
    }
    setIndex(index + 1)
  }

  return (
    <Screen bare>
      <Scene src={asset('world/access-door.webp')} still />
      {phase === 'barrier' && <ReadingScrim />}
      {(phase === 'quiz' || phase === 'failed') && (
        <div
          aria-hidden
          className="absolute inset-0 z-10"
          style={{ background: 'color-mix(in oklab, var(--color-ground) 82%, transparent)' }}
        />
      )}

      <div className="relative z-20 flex flex-1 flex-col px-[var(--gutter)] pt-sp6">
        {phase === 'barrier' && (
          <>
            <span className="label-mono inline-block self-start rounded-chip border border-alert/60 bg-[color-mix(in_oklab,var(--color-ground-deep)_80%,transparent)] px-sp2 py-[6px] text-alert">
              доступ закрыт
            </span>
            <h1 className="display-m on-scene mt-sp3 max-w-[11ch] text-ink">Допуск в лабораторию</h1>

            <Bridge blocks={BARRIER} delay={0.15} className="mt-sp4" />

            {/* Правила до первого вопроса: человек должен понимать, во что заходит. */}
            <ul className="mt-sp5 flex flex-col gap-sp2 border-t border-line pt-sp4">
              {BARRIER_RULES.map((rule, i) => (
                <li key={rule} className="flex gap-sp3">
                  <span className="label-mono w-6 shrink-0 pt-[3px] text-gold">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <span className="on-scene max-w-[36ch] text-[15px] leading-relaxed text-ink-2">
                    {rule}
                  </span>
                </li>
              ))}
            </ul>

            <div className="mt-sp4 mb-sp2 flex items-center gap-sp2">
              {[`${QUIZ_LENGTH} ситуаций`, `${QUIZ_LIVES_LABEL} жизней`].map((chip) => (
                <span
                  key={chip}
                  className="label-mono rounded-pill border border-line bg-[color-mix(in_oklab,var(--color-ground-deep)_82%,transparent)] px-sp2 py-[6px] text-ink"
                >
                  {chip}
                </span>
              ))}
            </div>
          </>
        )}

        {phase === 'quiz' && (
          <>
            <div className="flex items-center justify-between gap-sp3">
              <span className="label-mono text-ink-3">
                {String(index + 1).padStart(2, '0')} / {QUIZ_LENGTH}
              </span>
              <Lives left={quiz_lives} />
            </div>

            <div className="flex flex-1 flex-col justify-center">
            <AnimatePresence mode="wait">
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8, transition: { duration: 0.14 } }}
                transition={{ duration: DUR.ui, ease: EASE_OUT }}
                className="mt-sp5"
              >
                <p className="text-[17px] leading-relaxed text-ink">{question.situation}</p>

                <div className="mt-sp4 flex flex-col gap-sp2">
                  {question.options.map((option, i) => {
                    const isCorrect = i === question.correct
                    const chosen = picked === i
                    return (
                      <button
                        key={option}
                        type="button"
                        disabled={picked !== null}
                        onClick={() => answer(i)}
                        className={cn(
                          'w-full rounded-chip border px-sp3 py-sp3 text-left text-[15px] leading-snug',
                          'transition-colors duration-[var(--t-ui)] ease-e-out',
                          picked === null && 'cursor-pointer border-line bg-panel text-ink active:scale-[0.99]',
                          picked !== null && isCorrect && 'border-[var(--acid)] bg-[color-mix(in_oklab,var(--acid)_14%,transparent)] text-ink',
                          picked !== null && chosen && !isCorrect && 'border-alert bg-[color-mix(in_oklab,var(--color-alert)_14%,transparent)] text-ink',
                          picked !== null && !chosen && !isCorrect && 'border-line text-ink-3',
                        )}
                      >
                        {option}
                      </button>
                    )
                  })}
                </div>

                {picked !== null && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: DUR.ui, ease: EASE_OUT }}
                    className="mt-sp4 rounded-panel border border-line bg-panel p-sp3"
                  >
                    <p className="text-[15px] leading-relaxed text-ink-2">{question.explain}</p>
                    {picked !== question.correct && (
                      <p className="label-mono mt-sp2 text-gold">
                        пересмотреть момент {question.moment}
                      </p>
                    )}
                  </motion.div>
                )}
              </motion.div>
            </AnimatePresence>
            </div>
          </>
        )}

        {phase === 'failed' && (
          <div className="flex flex-1 flex-col justify-center">
            <h1 className="display-m text-ink">Где-то мы слишком быстро проскочили базу</h1>
            <p className="mt-sp4 max-w-[38ch] text-[16px] leading-relaxed text-ink-2">
              Я отметил места, на которых были ошибки. Разберись с ними — и возвращайся.
              Доступ к последнему протоколу пока закрыт.
            </p>
            <ul className="mt-sp4 flex flex-col gap-sp2">
              {missed.map((moment) => (
                <li key={moment} className="label-mono flex items-center gap-sp2 text-gold">
                  <span aria-hidden className="h-px w-6 bg-gold" />
                  момент {moment}
                </li>
              ))}
            </ul>
          </div>
        )}

        {phase === 'passed' && <AccessGranted />}
      </div>

      <BottomBar>
        {phase === 'barrier' && (
          <Button
            onClick={() => {
              track('quiz_started')
              setPhase('quiz')
            }}
          >
            Получить допуск
          </Button>
        )}
        {phase === 'quiz' && (
          <Button disabled={picked === null} onClick={advance}>
            {picked === null ? 'Выбери решение' : 'Дальше'}
          </Button>
        )}
        {phase === 'failed' && (
          <Button
            onClick={() => {
              resetQuiz()
              setIndex(0)
              setPicked(null)
              setPhase('quiz')
            }}
          >
            Пройти ещё раз
          </Button>
        )}
        {phase === 'passed' && <Button onClick={onNext}>В последнюю лабораторию</Button>}
      </BottomBar>
    </Screen>
  )
}

/** ДОРОГОЙ МОУШН №3: печать ставится, кадр коротко вспыхивает кислотой. */
function AccessGranted() {
  return (
    <div className="flex flex-1 flex-col justify-center">
      <motion.div
        initial={{ scale: 1.35, opacity: 0, rotate: -8 }}
        animate={{ scale: 1, opacity: 1, rotate: -3 }}
        transition={{ duration: 0.5, ease: EASE_OUT }}
        className="self-start rounded-chip border-2 border-[var(--acid)] px-sp3 py-sp2"
      >
        <span className="label-mono text-[var(--acid)]">допуск получен</span>
      </motion.div>
      <motion.h1
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: DUR.scene, ease: EASE_OUT, delay: 0.25 }}
        className="display-xl mt-sp5 text-ink"
      >
        Дверь
        <br />
        открыта
      </motion.h1>
      <motion.div
        aria-hidden
        initial={{ opacity: 0.9 }}
        animate={{ opacity: 0 }}
        transition={{ duration: 0.8, ease: EASE_OUT }}
        className="pointer-events-none fixed inset-0 -z-10 bg-[var(--acid)] motion-reduce:hidden"
      />
    </div>
  )
}
