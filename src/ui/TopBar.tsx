import { DotsThree } from '@phosphor-icons/react'
import { NAV } from '../content/copy'
import { STEPS, type StepId } from '../router/flow'
import { haptic } from '../lib/telegram'
import { cn } from '../lib/cn'

/**
 * Постоянная верхняя панель (ТЗ §30).
 *
 * Живёт на всех состояниях, кроме `message`: там первый экран — имитация
 * входящего сообщения (DESIGN.md §8.1), и любой служебный элемент поверх
 * ломает иллюзию. App.tsx решает, монтировать ли эту панель для текущего
 * шага; здесь только разметка и своя логика показа.
 *
 * По-настоящему прозрачная: никакой сплошной плашки и никакой жёсткой
 * границы, которая резала бы кадр пополам. Вместо них — скрим одним
 * градиентом сверху вниз (плотнее у самого верха экрана, к нулю на нижней
 * кромке панели) и лёгкое размытие, которое гаснет вместе с ним через
 * `mask-image`: у панели нет края, есть только убывающая плотность. Сцена
 * под ней должна читаться всегда (DESIGN.md запрет №3 — `backdrop-filter`
 * только там, где под слоем реально что-то есть и его нужно приглушить, —
 * здесь это фон текущей сцены).
 *
 * Контраст логотипа и лейблов держит не заливка, а собственная мягкая тень
 * текста (`on-scene`, DESIGN.md §6.1: «читаемость держится не отступами, а
 * собственной подложкой блока и тенью текста») — так им не нужна плотная
 * плашка позади, чтобы остаться читаемыми поверх ярких участков кадра
 * (проверено на `.review/1b-message-voice.png`, светлый ночной город).
 * Счётчик и кнопка меню — свои маленькие непрозрачные чипы: у них контраст
 * не зависит от прозрачности общего скрима.
 *
 * Индикатор в центре — НЕ прогресс-бар курса и не проценты (§2 прототипа):
 * номер участка, без обозначения общего числа состояний, чтобы человек не
 * видел вперёд весь маршрут. Единственный настоящий индикатор прогресса —
 * узлы связки (NodeRail), это правило неизменно.
 *
 * Кнопки mute здесь нет: голос звучит только на первом экране (`message`),
 * а панель там не рендерится вовсе. Mute — часть голосового плеера
 * (ui/VoiceBar.tsx), а не шапки; см. отчёт по задаче для деталей решения.
 */
export function TopBar({ step, onMenu }: { step: StepId; onMenu: () => void }) {
  const index = STEPS.indexOf(step)
  const topPad = 'max(env(safe-area-inset-top), var(--tg-sa-top))'

  return (
    <header
      className="fixed inset-x-0 top-0 z-40 mx-auto w-full max-w-[var(--app-max)]"
      style={{ paddingTop: topPad }}
    >
      {/* Скрим сцены: плотнее у верхней кромки экрана, в ноль к низу панели.
          Блюр гаснет тем же градиентом через маску, а не обрывается кромкой. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 -z-10"
        style={{
          height: `calc(${topPad} + var(--top-h) + 88px)`,
          background:
            'linear-gradient(to bottom, color-mix(in oklab, var(--color-ground-deep) 80%, transparent) 0%, color-mix(in oklab, var(--color-ground-deep) 52%, transparent) 42%, color-mix(in oklab, var(--color-ground-deep) 18%, transparent) 68%, transparent 100%)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          maskImage: 'linear-gradient(to bottom, black 0%, black 42%, transparent 100%)',
          WebkitMaskImage: 'linear-gradient(to bottom, black 0%, black 42%, transparent 100%)',
        }}
      />

      <div
        className="flex items-center justify-between gap-sp3 px-[var(--gutter)]"
        style={{ height: 'var(--top-h)' }}
      >
        <span
          className="on-scene truncate text-[15px] leading-none font-bold tracking-[-0.01em] text-ink"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          {NAV.brand}
        </span>

        <div className="flex shrink-0 items-center gap-sp2">
          <span
            aria-hidden
            className="label-mono rounded-pill border border-line/70 bg-[color-mix(in_oklab,var(--color-ground-deep)_82%,transparent)] px-sp2 py-[6px] text-[11px] text-ink-3 tabular-nums"
          >
            {String(index + 1).padStart(2, '0')}
          </span>

          <button
            type="button"
            onClick={() => {
              haptic('light')
              onMenu()
            }}
            aria-label="Меню"
            className={cn(
              'grid h-11 w-11 shrink-0 cursor-pointer place-items-center rounded-full border border-line/70',
              'bg-[color-mix(in_oklab,var(--color-ground-deep)_82%,transparent)] text-ink',
              'transition-transform duration-[var(--t-press)] ease-e-out active:scale-[0.94]',
            )}
          >
            <DotsThree size={22} weight="bold" />
          </button>
        </div>
      </div>
    </header>
  )
}
