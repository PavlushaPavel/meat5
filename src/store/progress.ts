/**
 * Прогресс человека (PRODUCT.md §19).
 *
 * Хранится локально и переживает закрытие Mini App: человек возвращается ровно
 * туда, где остановился, а не начинает город заново.
 *
 * Ключи названы как в прототипе — их читает аналитика и с ними же будет
 * синхронизироваться бэкенд, когда появится.
 */
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { StepId } from '../router/flow'

export const QUIZ_LIVES = 5
export const QUIZ_LENGTH = 12

export interface ProgressState {
  step: StepId

  intro_completed: boolean
  video_1_progress: number
  video_1_completed: boolean
  assistant_1_opened: boolean
  video_2_progress: number
  video_2_completed: boolean
  assistant_2_opened: boolean
  quiz_attempts: number
  quiz_lives: number
  quiz_completed: boolean
  video_3_progress: number
  video_3_completed: boolean
  result_site_opened: boolean
  offer_viewed: boolean
  checkout_started: boolean
  purchased: boolean

  /** Таймкоды моментов, на которых человек ошибся: их предлагаем пересмотреть. */
  missed: string[]
  timestamps: Partial<Record<string, number>>

  go: (step: StepId) => void
  mark: <K extends keyof ProgressState>(key: K, value: ProgressState[K]) => void
  loseLife: (moment: string) => void
  resetQuiz: () => void
  reset: () => void
}

const initial = {
  step: 'city' as StepId,
  intro_completed: false,
  video_1_progress: 0,
  video_1_completed: false,
  assistant_1_opened: false,
  video_2_progress: 0,
  video_2_completed: false,
  assistant_2_opened: false,
  quiz_attempts: 0,
  quiz_lives: QUIZ_LIVES,
  quiz_completed: false,
  video_3_progress: 0,
  video_3_completed: false,
  result_site_opened: false,
  offer_viewed: false,
  checkout_started: false,
  purchased: false,
  missed: [] as string[],
  timestamps: {} as Partial<Record<string, number>>,
}

export const useProgress = create<ProgressState>()(
  persist(
    (set) => ({
      ...initial,

      go: (step) =>
        set((s) => ({ step, timestamps: { ...s.timestamps, [`step_${step}`]: Date.now() } })),

      mark: (key, value) =>
        set((s) => ({ ...s, [key]: value, timestamps: { ...s.timestamps, [String(key)]: Date.now() } })),

      loseLife: (moment) =>
        set((s) => ({
          quiz_lives: Math.max(0, s.quiz_lives - 1),
          missed: s.missed.includes(moment) ? s.missed : [...s.missed, moment],
        })),

      /** Провал не унижает: человек уходит пересмотреть отмеченные места и возвращается. */
      resetQuiz: () =>
        set((s) => ({ quiz_lives: QUIZ_LIVES, quiz_attempts: s.quiz_attempts + 1, missed: [] })),

      reset: () => set({ ...initial }),
    }),
    { name: 'traffic-city-progress', version: 1 },
  ),
)
