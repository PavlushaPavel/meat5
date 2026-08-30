import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { useProgress } from './store/progress'
import { ACT, canEnter, nextStep, resumeStep, STEPS, type StepId } from './router/flow'
import { asset } from './lib/asset'
import { DUR, EASE_OUT } from './lib/motion'
import { initTelegram, setBackButton } from './lib/telegram'
import { readDebugFlag, watchDebugGesture } from './lib/debug'
import { track } from './lib/analytics'
import { checkPaidRedirect } from './lib/attribution'
import { DebugPanel } from './ui/DebugPanel'
import { TopBar } from './ui/TopBar'
import { Menu } from './ui/Menu'
import { ToolsSheet } from './ui/ToolsSheet'
import { MessageScreen } from './screens/MessageScreen'
import { CityScreen } from './screens/CityScreen'
import { Lab1Screen } from './screens/Lab1Screen'
import { Reward1Screen } from './screens/Reward1Screen'
import { Lab2Screen } from './screens/Lab2Screen'
import { Reward2Screen } from './screens/Reward2Screen'
import { AccessScreen } from './screens/AccessScreen'
import { Lab3Screen } from './screens/Lab3Screen'
import { BundleScreen } from './screens/BundleScreen'
import { OfferScreen } from './screens/OfferScreen'
import { PurchasedScreen } from './screens/PurchasedScreen'

export default function App() {
  const progress = useProgress()
  const { step, go } = progress
  const [debug, setDebug] = useState(readDebugFlag)
  /**
   * Постоянная навигация (ТЗ §30, §31): одно состояние на оба листа —
   * листы не стекируются, «Мои инструменты» открывается вместо меню, а не
   * поверх него, это проще для одной руки (§40).
   */
  const [navSheet, setNavSheet] = useState<'none' | 'menu' | 'tools'>('none')

  useEffect(() => {
    initTelegram()
    track('app_opened')
    // §36 доп. требование: бот шлёт человека обратно с start_param=paid после
    // подтверждённой оплаты — единственный сигнал «оплата прошла» без бэкенда.
    if (checkPaidRedirect()) {
      track('purchase_success')
      track('paid_content_started')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Скрытый жест включения отладки работает всегда: в Telegram адрес не набрать.
  useEffect(() => watchDebugGesture(() => setDebug(true)), [])

  // Акт меняет свет сцены: город холодный и синий, лаборатория тёплая и жёлтая.
  useEffect(() => {
    document.documentElement.dataset.act = ACT[step]
  }, [step])

  // Назад в Telegram: если открыт лист навигации — закрываем его первым
  // (иначе кнопка «назад» убивала бы фоновый шаг, пока человек в меню),
  // иначе — обычная логика возврата на шаг, а не закрытие приложения.
  useEffect(() => {
    if (navSheet !== 'none') return setBackButton(true, () => setNavSheet('none'))
    const index = STEPS.indexOf(step)
    if (index <= 0) return setBackButton(false)
    return setBackButton(true, () => go(STEPS[index - 1]))
  }, [step, go, navSheet])

  // Открытый лист не должен позволять скроллить сцену под затемнением.
  useEffect(() => {
    if (navSheet === 'none') return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [navSheet])

  // Новый экран всегда начинается сверху: иначе человек попадает в середину сцены.
  useEffect(() => {
    window.scrollTo({ top: 0 })
  }, [step])

  /**
   * Восстановление сессии (§33) + гейтинг (§43).
   *
   * Debug-панель ставит progress.debugUnlocked, чтобы отладочные прыжки не
   * упирались в гейтинг — иначе саму отладку нельзя было бы использовать.
   *
   * Если сохранённый step ДОСТИЖИМ по гейтингу — оставляем его как есть:
   * человек мог сознательно вернуться назад (кнопка «назад», debug), и это не
   * повод силой тащить его вперёд на resumeStep. Переводим на resumeStep
   * только когда сохранённый step недостижим (например, кто-то открыл ссылку
   * на середину воронки без соответствующего прогресса).
   */
  useEffect(() => {
    if (progress.debugUnlocked) return
    if (!canEnter(step, progress)) go(resumeStep(progress))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, progress.debugUnlocked])

  const advance = () => go(nextStep(step))
  const allowed = progress.debugUnlocked || canEnter(step, progress)

  return (
    <>
      <WideBackdrop step={step} />
      {/* TopBar живёт на всех состояниях, кроме message (DESIGN.md §8.1) —
          первый экран имитирует входящее сообщение, и служебная панель
          поверх него ломает иллюзию (ТЗ §30). */}
      {step !== 'message' && (
        <TopBar step={step} onMenu={() => setNavSheet('menu')} />
      )}
      <Menu
        open={navSheet === 'menu'}
        onClose={() => setNavSheet('none')}
        onOpenTools={() => setNavSheet('tools')}
      />
      <ToolsSheet open={navSheet === 'tools'} onClose={() => setNavSheet('none')} />
      {debug && <DebugPanel onClose={() => setDebug(false)} />}
      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.16 } }}
          transition={{ duration: DUR.ui, ease: EASE_OUT }}
        >
          {/* Вторая, независимая от disabled-кнопок проверка (§43): пока эффект
              выше не перевёл на resumeStep, экран без доступа просто не рисуем. */}
          {allowed ? render(step, advance) : null}
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
  // Та же сцена, что у city: message ещё не долетел до Трафик Лаб.
  message: 'world/city-districts.webp',
  city: 'world/city-districts.webp',
  lab1: 'world/lab-interior.webp',
  reward1: 'world/offer-bench.webp',
  lab2: 'world/offer-bench.webp',
  // Та же сцена, что у lab2: reward2 — это Lab2Screen, разрезанный пополам.
  reward2: 'world/offer-bench.webp',
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
    case 'message':
      return <MessageScreen onNext={next} />
    case 'city':
      return <CityScreen onNext={next} />
    case 'lab1':
      return <Lab1Screen onNext={next} />
    case 'reward1':
      return <Reward1Screen onNext={next} />
    case 'lab2':
      return <Lab2Screen onNext={next} />
    case 'reward2':
      return <Reward2Screen onNext={next} />
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
