/**
 * Конфиг воронки (SPEC.md §34).
 *
 * Mini App НИЧЕГО не знает о конкретном кейсе: ниша живёт исключительно внутри
 * видеофайлов и нигде не упоминается в коде. Завтра Video 3 про другой проект —
 * меняется ссылка здесь, воронка остаётся прежней.
 *
 * Пустая строка = материал ещё не прислан. Экран честно показывает плейсхолдер,
 * а не притворяется, что видео есть.
 *
 * Имена ниже — ровно как в §34 ТЗ. Субтитры вступительного голосового
 * (`introSubtitles` из §34) физически лежат в content/copy.ts (`CITY_SCRIPT`) —
 * этот файл сейчас переписывает другой человек, поэтому здесь их не дублируем.
 */

export const config = {
  // ---- §34, дословно ---------------------------------------------------
  introAudioUrl: '',
  video1Url: '',
  video2Url: '',
  video3Url: '',
  assistant1Url: '',
  assistant2Url: '',
  resultDemoUrl: '',
  tripwireTitle: 'ТРАФИК ЛАБ',
  tripwirePrice: 3990,
  tripwireRegularPrice: 5990,
  checkoutUrl: '',
  // quiz: живёт в content/quiz.ts (QUIZ) — не дублируем здесь тот же список.

  // ---- сверх §34 --------------------------------------------------------
  /** Куда идёт человек после покупки. В §34 такого поля нет. */
  practicumUrl: '',
  /** Приёмник событий воронки. Пусто — события только в консоль. В §34 нет. */
  analyticsUrl: '',
  /**
   * Постеры и длительности видео. §34 описывает только сами URL строками —
   * структуру вокруг них ТЗ не задаёт, поэтому она вынесена в отдельные
   * объекты, а video1Url/video2Url/video3Url остаются простыми строками,
   * как того требует §34.
   */
  videoPosters: {
    v1: 'world/lab-interior.webp',
    v2: 'world/offer-bench.webp',
    v3: 'world/assembly.webp',
  },
  videoDurations: {
    v1: 0,
    v2: 0,
    v3: 0,
  },
  /**
   * Короткий код в `start_param`, которым бот помечает переход из «оплата
   * прошла» (SPEC.md §36, §28). Нет в §34 — наше решение для attribution.ts.
   */
  paidStartParam: 'paid',
} as const

/** Форма одного видео для VideoBlock — собирается из полей config в screens. */
export interface VideoConfig {
  /** Прямая ссылка на mp4/HLS или embed-URL. Пусто — рисуем плейсхолдер. */
  url: string
  /** Длительность для плейсхолдера и ожидания, в секундах. 0 — неизвестна. */
  duration: number
  /** Постер-кадр из public/world. */
  poster: string
}

export const formatPrice = (value: number): string =>
  `${value.toLocaleString('ru-RU').replace(/ /g, ' ')} ₽`
