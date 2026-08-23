/**
 * Девять состояний приложения (PRODUCT.md §Девять состояний).
 *
 * Сорока отдельных экранов здесь нет намеренно: всё остальное — состояния ВНУТРИ
 * этих девяти, а не новые страницы. Порядок линейный, с одной точкой возврата:
 * провал допуска отправляет человека пересматривать протоколы.
 */

export const STEPS = [
  /** 1. Пролёт по Городу трафика. Голос продаёт большую идею. */
  'city',
  /** 2. Вход в лабораторию, короткое открытие, VIDEO 1 — кому продаём. */
  'lab1',
  /** 3. Загорается «Карта аудитории», отдаём Ассистента №1. */
  'reward1',
  /** 4. Мост «АУДИТОРИЯ ✓ → ???», VIDEO 2, Ассистент №2. */
  'lab2',
  /** 5. Допуск: 12 вопросов, 5 жизней. */
  'access',
  /** 6. Последняя лаборатория, VIDEO 3 — посадка. */
  'lab3',
  /** 7. Три узла соединились: СВЯЗКА ГОТОВА + реальный сайт. */
  'bundle',
  /** 8. Оффер: Трафик Лаб. */
  'offer',
  /** 9. Доступ получен, вход в практикум. */
  'purchased',
] as const

export type StepId = (typeof STEPS)[number]

/** Названия шагов для служебных экранов. */
export const STEP_TITLE: Record<StepId, string> = {
  city: 'Город трафика',
  lab1: 'Протокол 01 — кому',
  reward1: 'Награда: карта аудитории',
  lab2: 'Протокол 02 — что сказать',
  access: 'Допуск: 12 вопросов',
  lab3: 'Протокол 03 — куда вести',
  bundle: 'Связка готова',
  offer: 'Трафик Лаб, оффер',
  purchased: 'Доступ получен',
}

/** Акт задаёт свет сцены: город холодный и синий, лаборатория тёплая и жёлтая. */
export const ACT: Record<StepId, 'city' | 'lab'> = {
  city: 'city',
  lab1: 'lab',
  reward1: 'lab',
  lab2: 'lab',
  access: 'lab',
  lab3: 'lab',
  bundle: 'city',
  offer: 'lab',
  purchased: 'lab',
}

export const nextStep = (step: StepId): StepId =>
  STEPS[Math.min(STEPS.indexOf(step) + 1, STEPS.length - 1)]

/** Три узла связки — единственный индикатор прогресса (DESIGN.md §2.9). */
export const NODES = [
  { id: 'who', label: 'КОМУ', openAt: 'reward1' },
  { id: 'what', label: 'ЧТО СКАЗАТЬ', openAt: 'lab2' },
  { id: 'where', label: 'КУДА ВЕСТИ', openAt: 'bundle' },
] as const satisfies ReadonlyArray<{ id: string; label: string; openAt: StepId }>

export function nodeState(nodeIndex: number, step: StepId): 'closed' | 'current' | 'open' {
  const openAt = STEPS.indexOf(NODES[nodeIndex].openAt)
  const now = STEPS.indexOf(step)
  if (now >= openAt) return 'open'
  const prevOpen = nodeIndex === 0 ? 0 : STEPS.indexOf(NODES[nodeIndex - 1].openAt)
  return now >= prevOpen ? 'current' : 'closed'
}
