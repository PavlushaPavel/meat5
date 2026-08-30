/**
 * События воронки (SPEC.md §35).
 *
 * Заложены сразу и целиком: без них потом придётся гадать, где ломается воронка.
 * Пока эндпоинта нет — события копятся в буфере и печатаются в консоль.
 * Как появится приёмник, он указывается в config.analyticsUrl, и буфер поедет туда.
 *
 * §35 в тексте ТЗ называет число «44 события», но перечисленный там же список
 * имён — 46 позиций (посчитано построчно). Список ниже — точная копия имён
 * из §35, «имя в имя»: это сильнее, чем итоговое число в тексте.
 */
import { config } from '../config'
import { telegramUserId } from './telegram'
import { attribution, sessionId } from './attribution'

export type FunnelEvent =
  | 'app_opened'
  | 'intro_message_viewed'
  | 'intro_audio_started'
  | 'intro_audio_25'
  | 'intro_audio_50'
  | 'intro_audio_75'
  | 'intro_audio_completed'
  | 'city_entered'
  | 'lab_entered'
  | 'video1_started' | 'video1_25' | 'video1_50' | 'video1_75' | 'video1_completed'
  | 'assistant1_viewed'
  | 'assistant1_clicked'
  | 'bridge2_viewed'
  | 'video2_started' | 'video2_25' | 'video2_50' | 'video2_75' | 'video2_completed'
  | 'assistant2_viewed'
  | 'assistant2_clicked'
  | 'quiz_intro_viewed'
  | 'quiz_started'
  | 'quiz_answer_correct'
  | 'quiz_answer_wrong'
  | 'quiz_life_lost'
  | 'quiz_failed'
  | 'quiz_retry'
  | 'quiz_completed'
  | 'video3_started' | 'video3_25' | 'video3_50' | 'video3_75' | 'video3_completed'
  | 'linkage_completed'
  | 'demo_site_clicked'
  | 'meta_reveal_viewed'
  | 'tripwire_viewed'
  | 'tripwire_cta_clicked'
  | 'checkout_started'
  | 'purchase_success'
  /**
   * Объявлено по §35, но нигде не вызывается: без бэкенда мы не можем узнать,
   * что оплата именно НЕ прошла (провайдер платежей нам ничего не сообщает) —
   * событие ждёт появления вебхука оплаты.
   */
  | 'purchase_failed'
  | 'paid_content_started'

interface Entry {
  event: FunnelEvent
  ts: number
  props?: Record<string, unknown>
  uid: number | null
  session_id: string
  source: string | null
  utm_source: string | null
  utm_medium: string | null
  utm_campaign: string | null
  utm_content: string | null
  utm_term: string | null
}

const buffer: Entry[] = []
const sentOnce = new Set<FunnelEvent>()

export function track(event: FunnelEvent, props?: Record<string, unknown>): void {
  const attr = attribution()
  const entry: Entry = {
    event,
    ts: Date.now(),
    props,
    uid: telegramUserId(),
    session_id: sessionId(),
    source: attr.source,
    utm_source: attr.utm_source,
    utm_medium: attr.utm_medium,
    utm_campaign: attr.utm_campaign,
    utm_content: attr.utm_content,
    utm_term: attr.utm_term,
  }
  buffer.push(entry)
  if (import.meta.env.DEV) console.info('[funnel]', event, props ?? '')
  if (!config.analyticsUrl) return
  // keepalive: событие «tripwire_cta_clicked» уходит, даже если человек тут же ушёл на оплату.
  void fetch(config.analyticsUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(entry),
    keepalive: true,
  }).catch(() => {})
}

/** Для событий, которые должны сработать ровно один раз за сессию (прогресс видео). */
export function trackOnce(event: FunnelEvent, props?: Record<string, unknown>): void {
  if (sentOnce.has(event)) return
  sentOnce.add(event)
  track(event, props)
}

export function funnelLog(): Entry[] {
  return [...buffer]
}
