/**
 * Конфиг воронки (PRODUCT.md §20).
 *
 * Mini App НИЧЕГО не знает о конкретном кейсе: строительство бань или что угодно
 * другое живёт внутри видеофайлов. Завтра Video 3 про другой проект — меняется
 * ссылка здесь, воронка остаётся прежней.
 *
 * Пустая строка = материал ещё не прислан. Экран честно показывает плейсхолдер,
 * а не притворяется, что видео есть.
 */

export interface VideoConfig {
  /** Прямая ссылка на mp4/HLS или embed-URL. Пусто — рисуем плейсхолдер. */
  url: string
  /** Длительность для плейсхолдера и ожидания, в секундах. 0 — неизвестна. */
  duration: number
  /** Постер-кадр из public/world. */
  poster: string
}

export const config = {
  /** Экран 1: город. Голос поверх сцены. */
  cityVoiceUrl: '',

  videos: {
    v1: { url: '', duration: 0, poster: 'world/lab-interior.webp' } satisfies VideoConfig,
    v2: { url: '', duration: 0, poster: 'world/offer-bench.webp' } satisfies VideoConfig,
    v3: { url: '', duration: 0, poster: 'world/assembly.webp' } satisfies VideoConfig,
  },

  /** Ассистенты отдаются сразу после своего видео, а не в конце курса. */
  assistant1Url: '',
  assistant2Url: '',

  /** Реальный сайт, собранный внутри Video 3. Для оболочки это просто URL. */
  resultDemoUrl: '',

  /** Оффер. */
  tripwirePrice: 3990,
  fullPrice: 5990,
  checkoutUrl: '',

  /** Куда идёт человек после покупки. */
  practicumUrl: '',

  /** Приёмник событий воронки. Пусто — события только в консоль. */
  analyticsUrl: '',
} as const

export const formatPrice = (value: number): string =>
  `${value.toLocaleString('ru-RU').replace(/ /g, ' ')} ₽`
