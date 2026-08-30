import { useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { Bug, X } from '@phosphor-icons/react'
import { STEPS, STEP_TITLE, type StepId } from '../router/flow'
import { useProgress, QUIZ_LIVES } from '../store/progress'
import { setDebugFlag } from '../lib/debug'
import { DUR, EASE_OUT } from '../lib/motion'
import { haptic } from '../lib/telegram'
import { cn } from '../lib/cn'

/**
 * Служебная панель. Намеренно НЕ из мира воронки: серая, моноширинная, без сцен
 * и без жёлтого — чтобы её нельзя было спутать с интерфейсом продукта и чтобы
 * случайный скриншот сразу было видно.
 *
 * Живёт поверх всего, включается только в режиме отладки (lib/debug.ts).
 */
export function DebugPanel({ onClose }: { onClose: () => void }) {
  const [open, setOpen] = useState(false)
  const progress = useProgress()

  const materialsDone = progress.video_1_completed && progress.video_2_completed && progress.video_3_completed

  function jump(step: StepId) {
    haptic('light')
    // Отладочный прыжок обязан обходить гейтинг (§43) — иначе им нельзя
    // пользоваться: большинство состояний недостижимо без реального прогресса.
    progress.mark('debugUnlocked', true)
    progress.go(step)
    setOpen(false)
  }

  return (
    <>
      <button
        type="button"
        onClick={() => {
          haptic('light')
          setOpen((v) => !v)
        }}
        aria-label="Отладка"
        className={cn(
          'fixed right-3 z-[100] grid h-11 w-11 cursor-pointer place-items-center rounded-full',
          'border border-white/25 bg-black/70 text-white/80 backdrop-blur-[6px]',
          'transition-transform duration-[var(--t-press)] ease-e-out active:scale-[0.94]',
        )}
        style={{ top: 'calc(env(safe-area-inset-top) + 12px)' }}
      >
        <Bug size={20} weight="regular" />
      </button>

      <AnimatePresence>
        {open && (
          <motion.aside
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 24, transition: { duration: 0.15 } }}
            transition={{ duration: DUR.ui, ease: EASE_OUT }}
            className={cn(
              'fixed inset-x-0 bottom-0 z-[101] mx-auto max-h-[86dvh] w-full max-w-[var(--app-max)] overflow-y-auto',
              'rounded-t-[20px] border-t border-white/20 bg-[#101214] p-sp4 text-white',
            )}
            style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 20px)' }}
          >
            <header className="flex items-center justify-between gap-sp3">
              <span className="label-mono text-white/60">режим отладки</span>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Закрыть"
                className="grid h-9 w-9 cursor-pointer place-items-center rounded-full border border-white/20 text-white/70"
              >
                <X size={16} weight="bold" />
              </button>
            </header>

            <p className="label-mono mt-sp3 text-white/40">экраны</p>
            <ol className="mt-sp2 flex flex-col gap-[6px]">
              {STEPS.map((step, i) => {
                const current = progress.step === step
                return (
                  <li key={step}>
                    <button
                      type="button"
                      onClick={() => jump(step)}
                      className={cn(
                        'flex w-full cursor-pointer items-center gap-sp2 rounded-[10px] border px-sp2 py-[10px] text-left',
                        current ? 'border-white/70 bg-white/10' : 'border-white/12 hover:bg-white/5',
                      )}
                    >
                      <span className="label-mono w-6 shrink-0 text-white/40">
                        {String(i + 1).padStart(2, '0')}
                      </span>
                      <span className="min-w-0 flex-1 truncate text-[14px] text-white/90">
                        {STEP_TITLE[step]}
                      </span>
                      {current && <span className="label-mono text-[10px] text-white/50">сейчас</span>}
                    </button>
                  </li>
                )
              })}
            </ol>

            <p className="label-mono mt-sp4 text-white/40">состояние</p>
            <div className="mt-sp2 grid grid-cols-2 gap-[6px]">
              <Toggle
                label={materialsDone ? 'материалы: пройдены' : 'материалы: не пройдены'}
                on={materialsDone}
                onClick={() => {
                  const next = !materialsDone
                  progress.mark('video_1_completed', next)
                  progress.mark('video_2_completed', next)
                  progress.mark('video_3_completed', next)
                }}
              />
              <Toggle
                label={progress.quiz_completed ? 'допуск: получен' : 'допуск: нет'}
                on={progress.quiz_completed}
                onClick={() => progress.mark('quiz_completed', !progress.quiz_completed)}
              />
              <Toggle
                label={`жизни: ${progress.quiz_lives}/${QUIZ_LIVES}`}
                on={progress.quiz_lives === QUIZ_LIVES}
                onClick={() => progress.resetQuiz()}
              />
              <Toggle
                label={progress.purchased ? 'куплено: да' : 'куплено: нет'}
                on={progress.purchased}
                onClick={() => progress.mark('purchased', !progress.purchased)}
              />
            </div>

            <div className="mt-sp4 flex flex-col gap-[6px]">
              <button
                type="button"
                onClick={() => {
                  progress.reset()
                  setOpen(false)
                }}
                className="w-full cursor-pointer rounded-[10px] border border-white/25 py-[12px] text-[14px] text-white"
              >
                Начать заново с первого экрана
              </button>
              <button
                type="button"
                onClick={() => {
                  setDebugFlag(false)
                  setOpen(false)
                  onClose()
                }}
                className="w-full cursor-pointer rounded-[10px] py-[12px] text-[13px] text-white/50"
              >
                Выключить отладку
              </button>
            </div>

            <p className="label-mono mt-sp3 text-[10px] leading-relaxed text-white/30">
              включить снова: ?debug=1 в адресе либо пять касаний левого верхнего угла
            </p>
          </motion.aside>
        )}
      </AnimatePresence>
    </>
  )
}

function Toggle({ label, on, onClick }: { label: string; on: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'label-mono cursor-pointer rounded-[10px] border px-sp2 py-[10px] text-left text-[10px] leading-tight',
        on ? 'border-white/60 bg-white/10 text-white' : 'border-white/12 text-white/60',
      )}
    >
      {label}
    </button>
  )
}
