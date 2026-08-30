/**
 * Прогресс человека (SPEC.md §32).
 *
 * Хранится локально и переживает закрытие Mini App: человек возвращается ровно
 * туда, где остановился, а не начинает город заново. Названия полей — ровно
 * как в §32, их читает аналитика и с ними же будет синхронизироваться бэкенд,
 * когда появится.
 *
 * Сверх списка §32 в сторе есть несколько дополнительных полей — см. комментарии
 * прямо у них ниже.
 */
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { resumeStep, type StepId } from '../router/flow'

export const QUIZ_LIVES = 5
export const QUIZ_LENGTH = 12

export interface ProgressState {
  // ---- §32, дословно -------------------------------------------------
  user_id: number | null
  intro_started: boolean
  intro_completed: boolean
  city_completed: boolean
  video_1_started: boolean
  video_1_progress: number
  video_1_completed: boolean
  assistant_1_opened: boolean
  video_2_started: boolean
  video_2_progress: number
  video_2_completed: boolean
  assistant_2_opened: boolean
  quiz_started: boolean
  quiz_current_question: number
  quiz_lives: number
  quiz_attempts: number
  quiz_wrong_topics: string[]
  quiz_completed: boolean
  video_3_started: boolean
  video_3_progress: number
  video_3_completed: boolean
  result_site_opened: boolean
  meta_reveal_completed: boolean
  tripwire_viewed: boolean
  checkout_started: boolean
  purchased: boolean
  created_at: number
  updated_at: number

  // ---- сверх §32 -------------------------------------------------------
  /** Текущее состояние маршрута — нужно роутеру, в §32 такого поля нет. */
  step: StepId
  /**
   * Позиция внутри видео в секундах. video_N_progress — это доля 0..1 для
   * аналитики (§35), а восстанавливать позицию плеера по доле нельзя: доля
   * плывёт при смене длительности файла. Для честного resume нужны секунды.
   */
  video_1_seconds: number
  video_2_seconds: number
  video_3_seconds: number
  /** Таймкоды моментов, на которых человек ошибся в тесте (было: `missed`). */
  quiz_missed: string[]
  /** Куда и на какую секунду вернуть человека по кнопке «пересмотреть момент». */
  review: { step: StepId; at: number } | null
  /**
   * Обход гейтинга (SPEC.md §43) из DebugPanel. Намеренно НЕ персистится:
   * это разовый прыжок для отладки в текущей вкладке, а не постоянное
   * состояние аккаунта — иначе однажды включённая отладка тихо отключила бы
   * проверку доступа навсегда.
   */
  debugUnlocked: boolean

  go: (step: StepId) => void
  sendToReview: (step: StepId, at: number) => void
  clearReview: () => void
  mark: <K extends keyof ProgressState>(key: K, value: ProgressState[K]) => void
  /** Пишет и в quiz_missed (таймкод), и в quiz_wrong_topics (тема; без темы — тот же таймкод). */
  loseLife: (moment: string, topic?: string) => void
  resetQuiz: () => void
  reset: () => void
}

type PersistedData = Omit<
  ProgressState,
  'go' | 'mark' | 'sendToReview' | 'clearReview' | 'loseLife' | 'resetQuiz' | 'reset' | 'debugUnlocked'
>

function createInitial(): PersistedData {
  const now = Date.now()
  return {
    step: 'message',
    user_id: null,
    intro_started: false,
    intro_completed: false,
    city_completed: false,
    video_1_started: false,
    video_1_progress: 0,
    video_1_seconds: 0,
    video_1_completed: false,
    assistant_1_opened: false,
    video_2_started: false,
    video_2_progress: 0,
    video_2_seconds: 0,
    video_2_completed: false,
    assistant_2_opened: false,
    quiz_started: false,
    quiz_current_question: 0,
    quiz_lives: QUIZ_LIVES,
    quiz_attempts: 0,
    quiz_wrong_topics: [],
    quiz_missed: [],
    quiz_completed: false,
    video_3_started: false,
    video_3_progress: 0,
    video_3_seconds: 0,
    video_3_completed: false,
    result_site_opened: false,
    meta_reveal_completed: false,
    tripwire_viewed: false,
    checkout_started: false,
    purchased: false,
    review: null,
    created_at: now,
    updated_at: now,
  }
}

/** Форма стора версии 1 (до переименования полей под §32). */
interface LegacyStateV1 {
  step?: string
  intro_completed?: boolean
  video_1_progress?: number
  video_1_completed?: boolean
  assistant_1_opened?: boolean
  video_2_progress?: number
  video_2_completed?: boolean
  assistant_2_opened?: boolean
  quiz_attempts?: number
  quiz_lives?: number
  quiz_completed?: boolean
  video_3_progress?: number
  video_3_completed?: boolean
  result_site_opened?: boolean
  offer_viewed?: boolean
  checkout_started?: boolean
  purchased?: boolean
  missed?: string[]
  review?: { step: string; at: number } | null
}

/**
 * version 1 → 2: старые ключи `missed`, `offer_viewed`, `timestamps` переносятся
 * в новую схему без потери прогресса у тех, кто уже открывал приложение.
 * `step` не мапится таблицей 1:1 (в v1 не было `message` и `reward2` как
 * отдельных состояний) — вместо этого он пересчитывается через resumeStep
 * по уже восстановленным флагам, той же функцией, что решает обычный resume.
 */
function migrate(persisted: unknown, version: number): PersistedData {
  if (version >= 2) return persisted as PersistedData
  const old = (persisted ?? {}) as LegacyStateV1
  const now = Date.now()
  const next: PersistedData = {
    ...createInitial(),
    user_id: null,
    intro_started: Boolean(old.intro_completed),
    intro_completed: Boolean(old.intro_completed),
    city_completed: Boolean(old.intro_completed),
    video_1_started: Boolean(old.video_1_progress) || Boolean(old.video_1_completed),
    video_1_progress: old.video_1_progress ?? 0,
    video_1_completed: Boolean(old.video_1_completed),
    assistant_1_opened: Boolean(old.assistant_1_opened),
    video_2_started: Boolean(old.video_2_progress) || Boolean(old.video_2_completed),
    video_2_progress: old.video_2_progress ?? 0,
    video_2_completed: Boolean(old.video_2_completed),
    assistant_2_opened: Boolean(old.assistant_2_opened),
    quiz_started: Boolean(old.quiz_attempts) || Boolean(old.quiz_completed),
    quiz_lives: old.quiz_lives ?? QUIZ_LIVES,
    quiz_attempts: old.quiz_attempts ?? 0,
    quiz_missed: old.missed ?? [],
    quiz_completed: Boolean(old.quiz_completed),
    video_3_started: Boolean(old.video_3_progress) || Boolean(old.video_3_completed),
    video_3_progress: old.video_3_progress ?? 0,
    video_3_completed: Boolean(old.video_3_completed),
    result_site_opened: Boolean(old.result_site_opened),
    tripwire_viewed: Boolean(old.offer_viewed),
    checkout_started: Boolean(old.checkout_started),
    purchased: Boolean(old.purchased),
    review: (old.review as PersistedData['review']) ?? null,
    created_at: now,
    updated_at: now,
  }
  next.step = resumeStep(next as ProgressState)
  return next
}

export const useProgress = create<ProgressState>()(
  persist(
    (set) => {
      // Единственное место, где трогается updated_at: любое изменение стора
      // проходит через эту обёртку, а не через ручные присваивания в экшенах.
      const setP = (
        patch: Partial<ProgressState> | ((s: ProgressState) => Partial<ProgressState>),
      ) =>
        set((s) => ({
          ...(typeof patch === 'function' ? patch(s) : patch),
          updated_at: Date.now(),
        }))

      return {
        ...createInitial(),
        debugUnlocked: false,

        go: (step) => setP({ step }),

        sendToReview: (step, at) => setP({ review: { step, at }, step }),

        clearReview: () => setP({ review: null }),

        mark: (key, value) => setP({ [key]: value }) as void,

        loseLife: (moment, topic) =>
          setP((s) => ({
            quiz_lives: Math.max(0, s.quiz_lives - 1),
            quiz_missed: s.quiz_missed.includes(moment) ? s.quiz_missed : [...s.quiz_missed, moment],
            quiz_wrong_topics: s.quiz_wrong_topics.includes(topic ?? moment)
              ? s.quiz_wrong_topics
              : [...s.quiz_wrong_topics, topic ?? moment],
          })),

        /** Провал не унижает: человек уходит пересмотреть отмеченные места и возвращается. */
        resetQuiz: () =>
          setP((s) => ({
            quiz_lives: QUIZ_LIVES,
            quiz_attempts: s.quiz_attempts + 1,
            quiz_missed: [],
            quiz_wrong_topics: [],
          })),

        reset: () => setP({ ...createInitial(), debugUnlocked: false }),
      }
    },
    {
      name: 'traffic-city-progress',
      version: 2,
      migrate: migrate as (persisted: unknown, version: number) => ProgressState,
      // debugUnlocked нарочно не сохраняется — см. комментарий у поля.
      partialize: (s): ProgressState => {
        const { debugUnlocked: _debugUnlocked, ...rest } = s
        return { ...rest, debugUnlocked: false }
      },
    },
  ),
)
