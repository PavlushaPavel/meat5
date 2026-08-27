import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { useProgress } from './store/progress'
import { ACT, nextStep, STEPS, type StepId } from './router/flow'
import { asset } from './lib/asset'
import { DUR, EASE_OUT } from './lib/motion'
import { initTelegram, setBackButton } from './lib/telegram'
import { readDebugFlag, watchDebugGesture } from './lib/debug'
import { DebugPanel } from './ui/DebugPanel'
import { CityScreen } from './screens/CityScreen'
import { Lab1Screen } from './screens/Lab1Screen'
import { Reward1Screen } from './screens/Reward1Screen'
import { Lab2Screen } from './screens/Lab2Screen'
import { AccessScreen } from './screens/AccessScreen'
import { Lab3Screen } from './screens/Lab3Screen'
import { BundleScreen } from './screens/BundleScreen'
import { OfferScreen } from './screens/OfferScreen'
import { PurchasedScreen } from './screens/PurchasedScreen'

export default function App() {
  const step = useProgress((s) => s.step)
  const go = useProgress((s) => s.go)
  const [debug, setDebug] = useState(readDebugFlag)

  useEffect(() => {
    initTelegram()
  }, [])

  // Скрытый жест включения отладки работает всегда: в Telegram адрес не набрать.
  useEffect(() => watchDebugGesture(() => setDebug(true)), [])

  // Акт меняет свет сцены: город холодный и синий, лаборатория тёплая и жёлтая.
  useEffect(() => {
    document.documentElement.dataset.act = ACT[step]
  }, [step])

  // Назад в Telegram: возвращаемся на шаг, а не закрываем приложение.
  useEffect(() => {
    const index = STEPS.indexOf(step)
    if (index <= 0) return setBackButton(false)
    return setBackButton(true, () => go(STEPS[index - 1]))
  }, [step, go])

  // Новый экран всегда начинается сверху: иначе человек попадает в середину сцены.
  useEffect(() => {
    window.scrollTo({ top: 0 })
  }, [step])

  const advance = () => go(nextStep(step))

  return (
    <>
      <WideBackdrop step={step} />
      {debug && <DebugPanel onClose={() => setDebug(false)} />}
      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.16 } }}
          transition={{ duration: DUR.ui, ease: EASE_OUT }}
        >
          {render(step, advance)}
        </motion.div>
      </AnimatePresence>
    </>
  )
}

/**
 * Кадр текущей сцены во всю ширину окна.
 *
 * Приложение свёрстано под телефон и живёт колонкой 460px. На ноутбуке вокруг
 * колонки оставалась пустая почти чёрная плоскость — мир обрывался по краям.
 * Здесь тот же кадр расфокусирован и приглушён, поэтому окно принадлежит миру,
 * а внимание остаётся в колонке. На телефоне слой не рендерится вовсе.
 */
const BACKDROP: Record<StepId, string> = {
  city: 'world/city-districts.webp',
  lab1: 'world/lab-interior.webp',
  reward1: 'world/offer-bench.webp',
  lab2: 'world/offer-bench.webp',
  access: 'world/access-door.webp',
  lab3: 'world/assembly.webp',
  bundle: 'world/city-conversions.webp',
  offer: 'world/lab-interior.webp',
  purchased: 'world/assembly.webp',
}

function WideBackdrop({ step }: { step: StepId }) {
  return (
    // z-0, а не -z-10: заливка html/body рисуется поверх потомков с отрицательным
    // z-index и полностью съедает этот слой. Уже наступали на это со сценами.
    <div aria-hidden className="fixed inset-0 z-0 hidden overflow-hidden sm:block">
      <img
        src={asset(BACKDROP[step])}
        alt=""
        className="h-full w-full scale-110 object-cover blur-[26px]"
      />
      <div
        className="absolute inset-0"
        style={{ background: 'color-mix(in oklab, var(--color-ground) 78%, transparent)' }}
      />
    </div>
  )
}

function render(step: StepId, next: () => void) {
  switch (step) {
    case 'city':
      return <CityScreen onNext={next} />
    case 'lab1':
      return <Lab1Screen onNext={next} />
    case 'reward1':
      return <Reward1Screen onNext={next} />
    case 'lab2':
      return <Lab2Screen onNext={next} />
    case 'access':
      return <AccessScreen onNext={next} />
    case 'lab3':
      return <Lab3Screen onNext={next} />
    case 'bundle':
      return <BundleScreen onNext={next} />
    case 'offer':
      return <OfferScreen onNext={next} />
    case 'purchased':
      return <PurchasedScreen />
  }
}
