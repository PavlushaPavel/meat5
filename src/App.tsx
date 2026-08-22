import { useEffect } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { useProgress } from './store/progress'
import { ACT, nextStep, STEPS, type StepId } from './router/flow'
import { DUR, EASE_OUT } from './lib/motion'
import { initTelegram, setBackButton } from './lib/telegram'
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

  useEffect(() => {
    initTelegram()
  }, [])

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
