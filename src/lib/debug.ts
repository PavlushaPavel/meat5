/**
 * Режим отладки: пройти воронку не по порядку и начать заново.
 *
 * Нужен на живой ссылке, а не только локально: приложение смотрят с телефона и
 * внутри Telegram, где нет ни адресной строки, ни девтулзов.
 *
 * Включается двумя способами:
 *   1. `?debug=1` в адресе (и `?debug=0`, чтобы выключить) — для браузера;
 *   2. пять быстрых касаний левого верхнего угла — для Telegram, где адрес не набрать.
 *
 * Флаг живёт в localStorage, поэтому переживает перезагрузку и переход по шагам.
 */
const KEY = 'traffic-city-debug'

export function readDebugFlag(): boolean {
  try {
    const params = new URLSearchParams(window.location.search)
    const q = params.get('debug')
    if (q === '1') {
      localStorage.setItem(KEY, '1')
      return true
    }
    if (q === '0') {
      localStorage.removeItem(KEY)
      return false
    }
    return localStorage.getItem(KEY) === '1'
  } catch {
    return false
  }
}

export function setDebugFlag(on: boolean): void {
  try {
    if (on) localStorage.setItem(KEY, '1')
    else localStorage.removeItem(KEY)
  } catch {
    /* приватный режим — молча живём без флага */
  }
}

/**
 * Скрытый жест: пять касаний левого верхнего угла за две секунды.
 * Обычный человек так не попадёт, а с телефона включается без адресной строки.
 */
export function watchDebugGesture(onEnable: () => void): () => void {
  let taps = 0
  let timer: number | undefined

  const onPointerDown = (e: PointerEvent) => {
    const corner = e.clientX < 64 && e.clientY < 64
    if (!corner) return
    taps += 1
    window.clearTimeout(timer)
    timer = window.setTimeout(() => (taps = 0), 2000)
    if (taps >= 5) {
      taps = 0
      setDebugFlag(true)
      onEnable()
    }
  }

  window.addEventListener('pointerdown', onPointerDown)
  return () => {
    window.removeEventListener('pointerdown', onPointerDown)
    window.clearTimeout(timer)
  }
}
