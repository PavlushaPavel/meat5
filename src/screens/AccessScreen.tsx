import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { Screen } from '../ui/Screen'
import { Scene } from '../ui/Scene'
import { Bridge, ReadingScrim } from '../ui/Bridge'
import { Button } from '../ui/Button'
import { BottomBar } from '../ui/BottomBar'
import { Lives } from '../ui/Lives'
import { QuizAdsConverge } from '../ui/QuizAdsConverge'
import { BRIDGE_AFTER_2, BARRIER, BARRIER_DOOR, QUIZ_UI, CTA } from '../content/copy'
import { QUIZ } from '../content/quiz'
import { track } from '../lib/analytics'
import { hapticNotify } from '../lib/telegram'
import { useProgress, QUIZ_LENGTH } from '../store/progress'
import { config } from '../config'
import { DUR, EASE_OUT, prefersReducedMotion } from '../lib/motion'
import { asset } from '../lib/asset'
import { cn } from '../lib/cn'

type Phase = 'bridge2' | 'barrier' | 'door' | 'quiz' | 'failed' | 'passed'

/** Момент живёт внутри протокола: первый — про аудиторию, второй — про предложение. */
const reviewTarget = (protocol: 1 | 2) =>
  protocol === 1
    ? { step: 'lab1' as const, videoUrl: config.video1Url }
    : { step: 'lab2' as const, videoUrl: config.video2Url }

const secondsOf = (moment: string) => {
  const [m, sec] = moment.split(':').map(Number)
  return m * 60 + (sec || 0)
}

/** Суть ошибки в карточке провала — обрезаем explain до первого предложения. */
const firstSentence = (text: string) => text.split(/(?<=[.!?])\s+/)[0] ?? text

/**
 * Фаза при монтировании считается из стора, а не начинается заново с моста:
 * человек не должен терять прогресс теста, уйдя пересмотреть момент или
 * закрыв приложение между «допуск получен» и следующим шагом.
 */
function initialPhase(p: { quiz_completed: boolean; quiz_started: boolean; quiz_lives: number }): Phase {
  if (p.quiz_completed) return 'passed'
  if (p.quiz_started && p.quiz_lives > 0) return 'quiz'
  if (p.quiz_started && p.quiz_lives === 0) return 'failed'
  return 'bridge2'
}

/**
 * Экран 5 (STATE07). Допуск в последнюю лабораторию.
 *
 * Три смысловых участка подряд, каждый со своим кадром: мост после Видео 2
 * (объявления → одна посадка), мост к тесту + дверь с правилами, сам тест
 * (12 ситуаций, 5 жизней). Провал НЕ унижает: точные моменты для пересмотра,
 * а не «пересмотрите весь курс».
 */
export function AccessScreen({ onNext }: { onNext: () => void }) {
  const {
    quiz_lives,
    quiz_started,
    quiz_completed,
    quiz_current_question,
    quiz_missed,
    quiz_reviewed,
    loseLife,
    resetQuiz,
    mark,
    sendToReview,
  } = useProgress()

  const [phase, setPhase] = useState<Phase>(() =>
    initialPhase({ quiz_completed, quiz_started, quiz_lives }),
  )
  const reduced = prefersReducedMotion()

  // Текущий вопрос живёт в сторе (quiz_current_question), а не в локальном
  // состоянии: иначе уход пересмотреть момент или закрытие приложения
  // откатывает человека на первый вопрос.
  const index = quiz_current_question
  const question = QUIZ[index] ?? QUIZ[0]
  const [picked, setPicked] = useState<number | null>(null)

  useEffect(() => {
    // Считается «интро теста», только если человек реально на него попал,
    // а не восстановился сразу в середине или после теста.
    if (phase === 'bridge2') track('quiz_intro_viewed')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    // Этот же вопрос уже мог быть отвечен неверно до ухода на пересмотр —
    // тогда quiz_missed хранит его момент, и здесь сразу показывается
    // состояние «уже отвечено», а не даётся выбрать снова.
    setPicked(quiz_missed.includes(question.moment) ? -1 : null)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index])

  function answer(option: number) {
    if (picked !== null) return
    setPicked(option)
    const right = option === question.correct
    if (right) {
      hapticNotify('success')
      track('quiz_answer_correct', { index, moment: question.moment })
      return
    }
    hapticNotify('error')
    track('quiz_answer_wrong', { index, moment: question.moment })
    track('quiz_life_lost')
    loseLife(question.moment, String(question.protocol))
  }

  function advance() {
    const wasWrong = picked !== question.correct
    if (wasWrong && quiz_lives <= 0) {
      track('quiz_failed', { index })
      setPhase('failed')
      return
    }
    if (index + 1 >= QUIZ_LENGTH) {
      track('quiz_completed')
      mark('quiz_completed', true)
      setPhase('passed')
      return
    }
    mark('quiz_current_question', index + 1)
  }

  function retry() {
    track('quiz_retry')
    resetQuiz()
    mark('quiz_current_question', 0)
    setPhase('quiz')
  }

  /** Отправляет пересмотреть конкретный момент — тот протокол, где он живёт. */
  function goReview(moment: string) {
    const q = QUIZ.find((item) => item.moment === moment)
    sendToReview(reviewTarget(q?.protocol ?? 1).step, secondsOf(moment), moment)
  }

  // «Добрать базу» ведёт на первый ЕЩЁ не пересмотренный момент — иначе
  // второй и третий отмеченные моменты человек не увидит никогда (SPEC.md §18).
  const nextReviewMoment = quiz_missed.find((moment) => !quiz_reviewed.includes(moment))

  return (
    <Screen bare>
      <Scene src={asset('world/access-door.webp')} still />

      {phase === 'bridge2' && (
        <motion.div
          aria-hidden
          className="absolute inset-0 z-10"
          style={{ background: 'color-mix(in oklab, var(--color-ground) 90%, transparent)' }}
          initial={{ opacity: 1 }}
          animate={{ opacity: 0.55 }}
          transition={reduced ? { duration: 0 } : { duration: 1.4, ease: EASE_OUT, delay: 0.9 }}
        />
      )}
      {(phase === 'barrier' || phase === 'door') && <ReadingScrim />}
      {(phase === 'quiz' || phase === 'failed') && (
        <div
          aria-hidden
          className="absolute inset-0 z-10"
          style={{ background: 'color-mix(in oklab, var(--color-ground) 82%, transparent)' }}
        />
      )}

      <div className="relative z-20 flex flex-1 flex-col px-[var(--gutter)] pt-sp6">
        {phase === 'bridge2' && (
          <div className="flex flex-1 flex-col justify-center">
            <QuizAdsConverge />
            <Bridge blocks={BRIDGE_AFTER_2} delay={0.9} className="mt-sp5" />
          </div>
        )}

        {phase === 'barrier' && (
          <div className="flex flex-1 flex-col justify-center">
            <Bridge blocks={BARRIER} delay={0.1} />
          </div>
        )}

        {phase === 'door' && (
          <div className="flex flex-1 flex-col justify-center">
            {/*
              Зачем дверь заперта. Без этих двух строк экран объявляет правила
              экзамена, но не отвечает на вопрос «а почему меня вообще
              проверяют». Стоят перед самой дверью и перед кнопкой — в точке,
              где человек решает, идти ли (см. комментарий у BARRIER_DOOR).
            */}
            <motion.p
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: DUR.ui, ease: EASE_OUT }}
              className="on-scene max-w-[36ch] text-[16px] leading-relaxed text-ink-2"
            >
              {BARRIER_DOOR.why}
            </motion.p>
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: DUR.scene, ease: EASE_OUT, delay: 0.5 }}
              className="on-scene mt-sp3 max-w-[34ch] border-l-2 border-gold pl-sp3 text-[19px] leading-snug font-semibold text-ink"
            >
              «{BARRIER_DOOR.challenge}»
            </motion.p>
            <motion.h1
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: DUR.scene, ease: EASE_OUT, delay: 1.15 }}
              className="display-m on-scene mt-sp6 max-w-[12ch] text-ink"
            >
              {BARRIER_DOOR.title}
            </motion.h1>
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: DUR.ui, ease: EASE_OUT, delay: 1.3 }}
              className="mt-sp4 flex items-center gap-sp2"
            >
              {BARRIER_DOOR.facts.map((fact) => (
                <span
                  key={fact}
                  className="label-mono rounded-pill border border-line bg-[color-mix(in_oklab,var(--color-ground-deep)_82%,transparent)] px-sp2 py-[6px] text-ink"
                >
                  {fact}
                </span>
              ))}
            </motion.div>
            <motion.p
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: DUR.ui, ease: EASE_OUT, delay: 1.45 }}
              className="on-scene mt-sp4 max-w-[34ch] text-[15px] leading-relaxed whitespace-pre-line text-ink-2"
            >
              {BARRIER_DOOR.hint}
            </motion.p>
          </div>
        )}

        {phase === 'quiz' && (
          <>
            <div className="flex items-center justify-between gap-sp3">
              <span className="label-mono text-ink-3">
                {QUIZ_UI.counter.replace('{n}', String(index + 1)).replace('{total}', String(QUIZ_LENGTH))}
              </span>
              <Lives left={quiz_lives} />
            </div>

            {/*
              Панель действия исчезает, пока ответ не выбран (BottomBar.tsx),
              так что низ экрана не может быть точкой опоры композиции.
              Вопрос и варианты вместо этого сами занимают кадр: они
              центрированы во всей свободной высоте между счётчиком и
              панелью, и внутри — просторный ритм (крупные плитки ответов,
              воздух между ними), а не компактный список с пустотой вокруг.
            */}
            <div className="flex flex-1 flex-col justify-center">
              <AnimatePresence mode="wait">
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8, transition: { duration: 0.14 } }}
                  transition={{ duration: DUR.ui, ease: EASE_OUT }}
                  className="mt-sp6"
                >
                  <p className="text-[18px] leading-relaxed text-ink">{question.situation}</p>

                  <div className="mt-sp5 flex flex-col gap-sp3">
                    {question.options.map((option, i) => {
                      const isCorrect = i === question.correct
                      const chosen = picked === i
                      return (
                        <button
                          key={option}
                          type="button"
                          // Стабильная зацепка для проверок: по тексту варианта
                          // цепляться нельзя — его правит заказчик.
                          data-quiz-option={i}
                          disabled={picked !== null}
                          onClick={() => answer(i)}
                          className={cn(
                            'w-full min-h-[44px] rounded-chip border px-sp3 py-sp4 text-left text-[15px] leading-snug',
                            'transition-colors duration-[var(--t-ui)] ease-e-out',
                            picked === null && 'cursor-pointer border-line bg-panel text-ink active:scale-[0.99]',
                            picked !== null &&
                              isCorrect &&
                              'border-[var(--acid)] bg-[color-mix(in_oklab,var(--acid)_14%,transparent)] text-ink',
                            picked !== null &&
                              chosen &&
                              !isCorrect &&
                              'border-alert bg-[color-mix(in_oklab,var(--color-alert)_14%,transparent)] text-ink',
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
                      {picked === question.correct ? (
                        <>
                          <p className="label-mono text-[var(--acid)]">{QUIZ_UI.correct}</p>
                          <p className="mt-sp2 text-[15px] leading-relaxed text-ink-2">{question.explain}</p>
                        </>
                      ) : (
                        <>
                          <p className="text-[15px] leading-relaxed text-ink-2">{question.explain}</p>
                          {/*
                            Кнопку показываем всегда, даже пока ссылки на видео нет.
                            Иначе разбор ошибки обрывается на полуслове, а вернуться
                            в допуск человеку всё равно есть чем — там своя кнопка.
                          */}
                          {(
                            <button
                              type="button"
                              onClick={() => goReview(question.moment)}
                              className="label-mono mt-sp3 min-h-[44px] cursor-pointer rounded-chip border border-gold px-sp2 py-[8px] text-gold transition-transform duration-[var(--t-press)] ease-e-out active:scale-[0.97]"
                            >
                              {CTA.quizReview.replace('{moment}', question.moment)}
                            </button>
                          )}
                        </>
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
            <h1 className="display-m text-ink">{QUIZ_UI.failTitle}</h1>
            <p className="mt-sp3 max-w-[38ch] text-[16px] leading-relaxed text-ink-2">{QUIZ_UI.failLead}</p>
            <p className="mt-sp1 max-w-[38ch] text-[15px] leading-relaxed text-ink-3">{QUIZ_UI.failHint}</p>

            <ul className="mt-sp4 flex flex-col gap-sp2 overflow-y-auto">
              {quiz_missed.map((moment) => {
                const q = QUIZ.find((item) => item.moment === moment)
                if (!q) return null
                const reviewed = quiz_reviewed.includes(moment)
                return (
                  <li key={moment}>
                    <button
                      type="button"
                      onClick={() => goReview(moment)}
                      className={cn(
                        'flex w-full min-h-[44px] cursor-pointer flex-col gap-[2px] rounded-chip border border-line px-sp3 py-sp2 text-left',
                        reviewed && 'opacity-50',
                      )}
                    >
                      <span className="label-mono text-gold">
                        протокол {q.protocol} — {moment}
                        {reviewed && ' · пересмотрено'}
                      </span>
                      <span className="text-[14px] leading-snug text-ink-2">{firstSentence(q.explain)}</span>
                    </button>
                  </li>
                )
              })}
            </ul>
          </div>
        )}

        {phase === 'passed' && <AccessGranted />}
      </div>

      <BottomBar>
        {phase === 'bridge2' && <Button onClick={() => setPhase('barrier')}>{CTA.next}</Button>}
        {phase === 'barrier' && <Button onClick={() => setPhase('door')}>{CTA.next}</Button>}
        {phase === 'door' && (
          <Button
            onClick={() => {
              track('quiz_started')
              mark('quiz_started', true)
              setPhase('quiz')
            }}
          >
            {CTA.getAccess}
          </Button>
        )}
        {phase === 'quiz' && (
          <Button disabled={picked === null} onClick={advance}>
            {CTA.quizNext}
          </Button>
        )}
        {phase === 'failed' && (
          <div className="flex flex-col gap-sp2">
            {/*
              Пока остался хоть один непросмотренный момент, «Добрать базу» —
              главное действие. Когда все моменты пересмотрены, главным
              становится «Попробовать ещё раз» (SPEC.md §18) — вести «Добрать
              базу» больше некуда.
            */}
            {nextReviewMoment ? (
              <>
                <Button onClick={() => goReview(nextReviewMoment)}>{CTA.quizCatchUp}</Button>
                <Button variant="secondary" onClick={retry}>
                  {CTA.quizRetry}
                </Button>
              </>
            ) : (
              <Button onClick={retry}>{CTA.quizRetry}</Button>
            )}
          </div>
        )}
        {phase === 'passed' && <Button onClick={onNext}>{CTA.next}</Button>}
      </BottomBar>
    </Screen>
  )
}

/**
 * ДОРОГОЙ МОУШН — допуск получен (SPEC.md §19, DESIGN.md §8.4): сканирование,
 * затем дверь уходит в стороны, и только потом приходит текст. При
 * prefers-reduced-motion сцена сразу стоит в конечном состоянии.
 */
function AccessGranted() {
  const reduced = prefersReducedMotion()
  const [stage, setStage] = useState<'scan' | 'open' | 'done'>(reduced ? 'done' : 'scan')

  useEffect(() => {
    if (reduced) return
    const t1 = window.setTimeout(() => setStage('open'), 500)
    const t2 = window.setTimeout(() => setStage('done'), 1350)
    return () => {
      window.clearTimeout(t1)
      window.clearTimeout(t2)
    }
  }, [reduced])

  return (
    <div className="flex flex-1 flex-col justify-center">
      {!reduced && (
        <div aria-hidden className="pointer-events-none fixed inset-0 z-30 overflow-hidden">
          {stage === 'scan' && (
            <motion.div
              initial={{ top: '-4%', opacity: 0.95 }}
              animate={{ top: '104%', opacity: 0.95 }}
              transition={{ duration: 0.5, ease: EASE_OUT }}
              className="absolute inset-x-0 h-[3px]"
              style={{
                background: 'linear-gradient(90deg, transparent, var(--acid), transparent)',
                boxShadow: '0 0 24px 4px var(--acid)',
              }}
            />
          )}
          {stage === 'open' && (
            <>
              <motion.div
                initial={{ x: 0 }}
                animate={{ x: '-100%' }}
                transition={{ duration: 0.85, ease: EASE_OUT }}
                className="absolute top-0 left-0 h-full w-1/2 bg-ground-deep"
                style={{ boxShadow: '8px 0 60px -10px rgba(200,245,60,0.4)' }}
              />
              <motion.div
                initial={{ x: 0 }}
                animate={{ x: '100%' }}
                transition={{ duration: 0.85, ease: EASE_OUT }}
                className="absolute top-0 right-0 h-full w-1/2 bg-ground-deep"
                style={{ boxShadow: '-8px 0 60px -10px rgba(200,245,60,0.4)' }}
              />
            </>
          )}
        </div>
      )}

      {stage === 'done' && (
        <>
          <motion.h1
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: DUR.scene, ease: EASE_OUT }}
            className="display-xl on-scene text-ink"
          >
            {QUIZ_UI.passTitle}
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: DUR.ui, ease: EASE_OUT, delay: 0.18 }}
            className="on-scene mt-sp4 max-w-[36ch] text-[15px] leading-relaxed text-ink-2"
          >
            {QUIZ_UI.passHint}
          </motion.p>
        </>
      )}
    </div>
  )
}
