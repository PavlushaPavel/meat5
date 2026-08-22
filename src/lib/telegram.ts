/**
 * Мост к Telegram Mini Apps SDK.
 *
 * Бота от BotFather ещё нет, поэтому приложение ОБЯЗАНО работать и как обычная
 * веб-страница: каждый вызов здесь безопасен, когда `window.Telegram` отсутствует.
 * Ни один экран не имеет права дёргать SDK напрямую — только через этот модуль.
 */

type HapticStyle = 'light' | 'medium' | 'heavy' | 'rigid' | 'soft'
type NotificationType = 'error' | 'success' | 'warning'

interface TelegramWebApp {
  ready: () => void
  expand: () => void
  close: () => void
  viewportStableHeight?: number
  colorScheme?: string
  themeParams?: Record<string, string>
  initDataUnsafe?: { user?: { id: number; first_name?: string; language_code?: string } }
  setHeaderColor?: (color: string) => void
  setBackgroundColor?: (color: string) => void
  disableVerticalSwipes?: () => void
  openLink?: (url: string, options?: { try_instant_view?: boolean }) => void
  openTelegramLink?: (url: string) => void
  onEvent?: (event: string, handler: () => void) => void
  offEvent?: (event: string, handler: () => void) => void
  BackButton?: { show: () => void; hide: () => void; onClick: (cb: () => void) => void; offClick: (cb: () => void) => void }
  HapticFeedback?: {
    impactOccurred: (style: HapticStyle) => void
    notificationOccurred: (type: NotificationType) => void
    selectionChanged: () => void
  }
}

declare global {
  interface Window {
    Telegram?: { WebApp?: TelegramWebApp }
  }
}

const wa = (): TelegramWebApp | undefined => window.Telegram?.WebApp

export const isTelegram = (): boolean => Boolean(wa()?.initDataUnsafe?.user || wa()?.viewportStableHeight)

/** Высота видимой области: в Telegram нижняя часть экрана занята чатом. */
function syncViewport() {
  const h = wa()?.viewportStableHeight
  document.documentElement.style.setProperty('--tg-vh', h ? `${h}px` : '100dvh')
}

export function initTelegram(): void {
  const app = wa()
  if (!app) return
  app.ready()
  app.expand()
  // Свайп вниз внутри Mini App закрывает окно — для воронки это потеря прогресса.
  app.disableVerticalSwipes?.()
  app.setHeaderColor?.('#050D1B')
  app.setBackgroundColor?.('#050D1B')
  syncViewport()
  app.onEvent?.('viewportChanged', syncViewport)
}

export function haptic(style: HapticStyle = 'light'): void {
  wa()?.HapticFeedback?.impactOccurred(style)
}

export function hapticNotify(type: NotificationType): void {
  wa()?.HapticFeedback?.notificationOccurred(type)
}

/** Внешние ссылки: в Telegram открываем через SDK, в браузере — новой вкладкой. */
export function openExternal(url: string): void {
  const app = wa()
  if (app?.openTelegramLink && /^https:\/\/t\.me\//.test(url)) {
    app.openTelegramLink(url)
    return
  }
  if (app?.openLink) {
    app.openLink(url)
    return
  }
  window.open(url, '_blank', 'noopener,noreferrer')
}

export function setBackButton(visible: boolean, onClick?: () => void): () => void {
  const bb = wa()?.BackButton
  if (!bb) return () => {}
  if (visible) {
    bb.show()
    if (onClick) bb.onClick(onClick)
  } else {
    bb.hide()
  }
  return () => {
    if (onClick) bb.offClick(onClick)
    bb.hide()
  }
}

export function telegramUserId(): number | null {
  return wa()?.initDataUnsafe?.user?.id ?? null
}
