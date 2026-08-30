/**
 * Атрибуция трафика (SPEC.md §36).
 *
 * ВАЖНО и не очевидно: Telegram Mini App НЕ получает utm-метки в URL. Он
 * получает единственный параметр `start_param` (Bot API, до 64 символов,
 * только A-Za-z0-9_-). Обычная query-строка utm_* работает только в веб-версии
 * и для локальной отладки — в самом Telegram её никогда не будет.
 *
 * Поэтому источников два:
 *   1. `start_param` из Telegram — короткий код вида `src-med-camp`;
 *   2. query-строка страницы (utm_source, utm_medium, utm_campaign,
 *      utm_content, utm_term, source) — для веба и отладки.
 *
 * `first_touch` пишется один раз и больше никогда не перезаписывается.
 * `last_touch` обновляется при каждом открытии. Оба живут в localStorage под
 * ключом 'traffic-lab-attribution' — ОТДЕЛЬНО от прогресса (store/progress.ts
 * персистится под своим ключом), потому что атрибуция не должна затираться
 * миграциями схемы прогресса и наоборот.
 */
import { config } from '../config'
import { telegramStartParam } from './telegram'
import { useProgress } from '../store/progress'

export interface Touch {
  source: string | null
  utm_source: string | null
  utm_medium: string | null
  utm_campaign: string | null
  utm_content: string | null
  utm_term: string | null
  at: number
}

interface AttributionStorage {
  first_touch: Touch
  last_touch: Touch
}

const STORAGE_KEY = 'traffic-lab-attribution'
const SESSION_KEY = 'traffic-lab-session'
const EMPTY_TOUCH: Omit<Touch, 'at'> = {
  source: null,
  utm_source: null,
  utm_medium: null,
  utm_campaign: null,
  utm_content: null,
  utm_term: null,
}

/** `start_param` короткого вида `src-med-camp` (до трёх частей, разделитель `-`). */
function parseStartParam(raw: string): Omit<Touch, 'at'> {
  const parts = raw.split('-')
  const fitsScheme = parts.length <= 3 && parts.every((p) => /^[A-Za-z0-9_]+$/.test(p))
  if (!fitsScheme) return { ...EMPTY_TOUCH, source: raw }
  return {
    ...EMPTY_TOUCH,
    utm_source: parts[0] ?? null,
    utm_medium: parts[1] ?? null,
    utm_campaign: parts[2] ?? null,
  }
}

function parseQuery(search: string): Omit<Touch, 'at'> {
  const params = new URLSearchParams(search)
  const get = (key: string) => params.get(key)
  return {
    source: get('source'),
    utm_source: get('utm_source'),
    utm_medium: get('utm_medium'),
    utm_campaign: get('utm_campaign'),
    utm_content: get('utm_content'),
    utm_term: get('utm_term'),
  }
}

const hasAny = (t: Omit<Touch, 'at'>): boolean =>
  Boolean(t.source || t.utm_source || t.utm_medium || t.utm_campaign || t.utm_content || t.utm_term)

/**
 * Текущий заход: query-строка предоставляет более гранулярные поля (пять
 * utm_* + source отдельно), поэтому там, где она что-то знает, она главнее;
 * недостающие поля добираются из start_param. Полей нет ни там ни там — это
 * органический/прямой заход, и touch остаётся полностью пустым.
 */
function readCurrentTouch(): Touch {
  const fromQuery = typeof window !== 'undefined' ? parseQuery(window.location.search) : { ...EMPTY_TOUCH }
  const startParam = telegramStartParam()
  // Возврат из бота после оплаты — это не источник трафика. Иначе last_touch
  // у всех купивших превращался бы в utm_source=paid и портил отчёт.
  const isPaidReturn = startParam === config.paidStartParam
  const fromStart = startParam && !isPaidReturn ? parseStartParam(startParam) : { ...EMPTY_TOUCH }

  const merged: Omit<Touch, 'at'> = hasAny(fromQuery)
    ? {
        source: fromQuery.source ?? fromStart.source,
        utm_source: fromQuery.utm_source ?? fromStart.utm_source,
        utm_medium: fromQuery.utm_medium ?? fromStart.utm_medium,
        utm_campaign: fromQuery.utm_campaign ?? fromStart.utm_campaign,
        utm_content: fromQuery.utm_content ?? fromStart.utm_content,
        utm_term: fromQuery.utm_term ?? fromStart.utm_term,
      }
    : fromStart

  return { ...merged, at: Date.now() }
}

function readStorage(): AttributionStorage | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as AttributionStorage) : null
  } catch {
    return null
  }
}

function writeStorage(data: AttributionStorage): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  } catch {
    /* приватный режим — молча живём без сохранённой атрибуции */
  }
}

/**
 * Читает/пишет first_touch и last_touch РОВНО ОДИН РАЗ за загрузку страницы
 * (модуль-синглтон), а не при каждом вызове attribution() — иначе каждый
 * рендер писал бы в localStorage.
 */
function resolveAttribution(): AttributionStorage {
  const current = readCurrentTouch()
  const existing = readStorage()
  const resolved: AttributionStorage = {
    first_touch: existing?.first_touch ?? current,
    last_touch: current,
  }
  writeStorage(resolved)
  return resolved
}

let cached: AttributionStorage | undefined

function get(): AttributionStorage {
  if (!cached) cached = resolveAttribution()
  return cached
}

/** Поля для аналитики (SPEC.md §35): utm_* и source берём из first_touch. */
export function attribution(): Omit<Touch, 'at'> {
  const { source, utm_source, utm_medium, utm_campaign, utm_content, utm_term } = get().first_touch
  return { source, utm_source, utm_medium, utm_campaign, utm_content, utm_term }
}

export function lastTouch(): Touch {
  return get().last_touch
}

/** Случайный id, живущий одну сессию (sessionStorage — переживает шаги, не переживает закрытие вкладки). */
export function sessionId(): string {
  try {
    const existing = sessionStorage.getItem(SESSION_KEY)
    if (existing) return existing
    const id = crypto.randomUUID()
    sessionStorage.setItem(SESSION_KEY, id)
    return id
  } catch {
    // Приватный режим без sessionStorage: один случайный id на весь заход,
    // не переживёт перезагрузку — это ожидаемо в таком режиме.
    return crypto.randomUUID()
  }
}

/**
 * SPEC.md §36 (доп. требование задачи 7): бот присылает человека обратно в
 * Mini App с `start_param = config.paidStartParam` ('paid' по умолчанию)
 * после того, как оплата на его стороне подтверждена. Бэкенда с вебхуками у
 * нас нет, поэтому это единственный сигнал «оплата прошла», который у нас
 * есть — как только видим его, сразу проставляем purchased=true в прогрессе.
 *
 * Возвращает true, если сработало — вызывающий код (App.tsx) на этом сигнале
 * отправляет purchase_success и paid_content_started (эти события живут в
 * lib/analytics.ts, которое сама attribution.ts не импортирует, чтобы не
 * заводить цикл analytics → attribution → analytics).
 */
export function checkPaidRedirect(): boolean {
  const startParam = telegramStartParam()
  if (!startParam || startParam !== config.paidStartParam) return false
  const progress = useProgress.getState()
  if (progress.purchased) return false // уже учли — не дублируем события
  progress.mark('purchased', true)
  return true
}
