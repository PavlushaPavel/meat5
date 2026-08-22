/**
 * События воронки (PRODUCT.md §Аналитика).
 *
 * Заложены сразу и целиком: без них потом придётся гадать, где ломается воронка.
 * Пока эндпоинта нет — события копятся в буфере и печатаются в консоль.
 * Как появится приёмник, он указывается в config.analyticsUrl, и буфер поедет туда.
 */
import { config } from '../config'
import { telegramUserId } from './telegram'

export type FunnelEvent =
  | 'city_started'
  | 'city_completed'
  | 'lab_entered'
  | 'video1_started' | 'video1_25' | 'video1_50' | 'video1_75' | 'video1_completed'
  | 'assistant1_clicked'
  | 'video2_started' | 'video2_25' | 'video2_50' | 'video2_75' | 'video2_completed'
  | 'assistant2_clicked'
  | 'quiz_started' | 'quiz_question_failed' | 'quiz_life_lost' | 'quiz_failed' | 'quiz_passed'
  | 'video3_started' | 'video3_25' | 'video3_50' | 'video3_75' | 'video3_completed'
  | 'demo_site_clicked'
  | 'tripwire_viewed'
  | 'checkout_clicked'
  | 'purchase_completed'

interface Entry {
  event: FunnelEvent
  ts: number
  props?: Record<string, unknown>
  uid: number | null
}

const buffer: Entry[] = []
const sentOnce = new Set<FunnelEvent>()

export function track(event: FunnelEvent, props?: Record<string, unknown>): void {
  const entry: Entry = { event, ts: Date.now(), props, uid: telegramUserId() }
  buffer.push(entry)
  if (import.meta.env.DEV) console.info('[funnel]', event, props ?? '')
  if (!config.analyticsUrl) return
  // keepalive: событие «checkout_clicked» уходит, даже если человек тут же ушёл на оплату.
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
