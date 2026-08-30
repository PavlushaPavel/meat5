/**
 * Одиннадцать состояний приложения (SPEC.md §3).
 *
 * Сорока отдельных экранов здесь нет намеренно: всё остальное — состояния ВНУТРИ
 * этих одиннадцати, а не новые страницы. Порядок линейный, с одной точкой
 * возврата: провал допуска отправляет человека пересматривать протоколы.
 */
import type { ProgressState } from '../store/progress'

export const STEPS = [
  /** 1. STATE01 — входящее сообщение: голосовое + пролёт по городу. */
  'message',
  /** 2. STATE02 — Город трафика, вход в первый этап. */
  'city',
  /** 3. STATE03 — карточки перед Видео 1 + само Видео 1. */
  'lab1',
  /** 4. STATE04 — результат Видео 1, Ассистент №1. */
  'reward1',
  /** 5. STATE05 — мост после Видео 1 + Видео 2. */
  'lab2',
  /** 6. STATE06 — результат Видео 2, Ассистент №2. */
  'reward2',
  /** 7. STATE07 — мосты к тесту + сам тест (12 вопросов, 5 жизней). */
  'access',
  /** 8. STATE08 — мост перед Видео 3 + само Видео 3. */
  'lab3',
  /** 9. STATE09 — сборка связки, демо-сайт, meta reveal. */
  'bundle',
  /** 10. STATE10 — оффер «Трафик Лаб», checkout. */
  'offer',
  /** 11. STATE11 — доступ получен, вход в практикум. */
  'purchased',
] as const

export type StepId = (typeof STEPS)[number]

/** Названия шагов для служебных экранов. */
export const STEP_TITLE: Record<StepId, string> = {
  message: 'Входящее сообщение',
  city: 'Город трафика',
  lab1: 'Протокол 01 — кому',
  reward1: 'Награда: карта аудитории',
  lab2: 'Протокол 02 — что сказать',
  reward2: 'Награда: офферы и объявления',
  access: 'Допуск: 12 вопросов',
  lab3: 'Протокол 03 — куда вести',
  bundle: 'Связка готова',
  offer: 'Трафик Лаб, оффер',
  purchased: 'Доступ получен',
}

/** Акт задаёт свет сцены: город холодный и синий, лаборатория тёплая и жёлтая. */
export const ACT: Record<StepId, 'city' | 'lab'> = {
  message: 'city',
  city: 'city',
  lab1: 'lab',
  reward1: 'lab',
  lab2: 'lab',
  reward2: 'lab',
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
  { id: 'what', label: 'ЧТО СКАЗАТЬ', openAt: 'reward2' },
  { id: 'where', label: 'КУДА ВЕСТИ', openAt: 'bundle' },
] as const satisfies ReadonlyArray<{ id: string; label: string; openAt: StepId }>

export function nodeState(nodeIndex: number, step: StepId): 'closed' | 'current' | 'open' {
  const openAt = STEPS.indexOf(NODES[nodeIndex].openAt)
  const now = STEPS.indexOf(step)
  if (now >= openAt) return 'open'
  const prevOpen = nodeIndex === 0 ? 0 : STEPS.indexOf(NODES[nodeIndex - 1].openAt)
  return now >= prevOpen ? 'current' : 'closed'
}

/**
 * Восстановление сессии (SPEC.md §33).
 *
 * Сверху вниз, первое совпадение выигрывает. Чистая функция: не читает и не
 * пишет стор, только решает, куда вернуть человека по уже сохранённому прогрессу.
 */
export function resumeStep(p: ProgressState): StepId {
  if (p.purchased) return 'purchased'
  if (p.video_3_completed) return 'bundle'
  if (p.quiz_completed) return 'lab3'
  if (p.quiz_started && !p.quiz_completed) return 'access'
  if (p.video_2_completed && !p.assistant_2_opened) return 'reward2'
  if (p.video_2_completed) return 'access'
  if (p.video_1_completed && !p.assistant_1_opened) return 'reward1'
  if (p.video_1_completed) return 'lab2'
  if (p.intro_completed) return 'city'
  return 'message'
}

/**
 * Логика доступа (SPEC.md §43).
 *
 * Вторая, независимая проверка поверх disabled-кнопок: даже если человек
 * подделает URL/localStorage и попадёт на шаг напрямую, экран его не пустит,
 * если предыдущий обязательный этап не пройден.
 */
export function canEnter(step: StepId, p: ProgressState): boolean {
  switch (step) {
    case 'message':
      return true
    case 'city':
      return p.intro_completed
    case 'lab1':
      return p.intro_completed
    case 'reward1':
      return p.video_1_completed
    case 'lab2':
      return p.video_1_completed
    case 'reward2':
      return p.video_2_completed
    case 'access':
      return p.video_2_completed
    case 'lab3':
      return p.quiz_completed
    case 'bundle':
      return p.video_3_completed
    case 'offer':
      return p.video_3_completed
    case 'purchased':
      return p.purchased
  }
}
