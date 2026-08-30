import { Play } from '@phosphor-icons/react'
import { asset } from '../lib/asset'
import { cn } from '../lib/cn'
import { MESSAGE } from '../content/copy'

/** Форма волны фиксирована и статична: сообщение ещё не звучало, играть нечему. */
const WAVE = [
  6, 11, 18, 13, 22, 15, 9, 19, 27, 20, 12, 8, 16, 24, 14, 10, 20, 28, 17, 11,
  15, 23, 19, 9, 13,
]

/**
 * Имитация входящего сообщения Telegram (SPEC.md §4, DESIGN.md §8.1).
 *
 * До нажатия play это ЕДИНСТВЕННОЕ содержимое экрана: отправитель, аватар,
 * карточка голосового с иконкой воспроизведения, длительностью и статичной
 * дорожкой. Иконка play здесь декоративная — настоящее действие живёт в
 * золотой кнопке снизу (DESIGN.md §8.1: «иконка play внутри полосы главным
 * действием быть не может»).
 *
 * Карточка стоит поверх самого яркого кадра воронки — развязки «Город
 * трафика» (полировка по ТЗ, задача 4): имя отправителя раньше падало прямо
 * на надпись арки, текст на тексте. Локальный скрим под карточкой (не по
 * всему экрану — только своя подложка, DESIGN.md §6.1) держит имя и время
 * читаемыми при любой яркости кадра, а сама карточка плотнее и материальнее:
 * это сообщение в мессенджере, у него есть своя поверхность и тень со
 * смещением (запрет №11 — свечения без offset не в счёт).
 */
export function MessageCard({ className }: { className?: string }) {
  return (
    <div className={cn('relative', className)}>
      {/* Локальный, не на весь экран: гасит яркость развязки ровно под
          именем и карточкой, а не превращает весь кадр в подложку. */}
      <div
        aria-hidden
        className="pointer-events-none absolute -inset-x-sp2 -top-sp3 -bottom-sp2 -z-10 rounded-card"
        style={{
          background:
            'linear-gradient(to top, color-mix(in oklab, var(--color-ground-deep) 92%, transparent) 0%, color-mix(in oklab, var(--color-ground-deep) 70%, transparent) 55%, transparent 100%)',
        }}
      />

      <div className="flex items-center gap-sp2">
        <img
          src={asset('world/character-avatar.webp')}
          alt=""
          aria-hidden
          className="h-10 w-10 shrink-0 rounded-full border border-line object-cover"
        />
        <span className="on-scene text-[15px] font-semibold text-ink">{MESSAGE.sender}</span>
      </div>

      <div className="mt-sp3 flex items-center gap-sp2 rounded-panel border border-line bg-panel px-sp3 py-sp3 shadow-[0_10px_28px_-12px_rgba(2,6,14,0.75)]">
        <span
          aria-hidden
          className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-gold"
        >
          <Play size={18} weight="fill" className="ml-[2px] text-ink-on-gold" />
        </span>

        <div className="flex min-w-0 flex-1 items-center gap-[2px]" aria-hidden>
          {WAVE.map((h, i) => (
            <span key={i} className="w-[2px] shrink-0 rounded-full bg-line" style={{ height: `${h}px` }} />
          ))}
        </div>

        <span className="label-mono shrink-0 text-ink-2">0:00 / {MESSAGE.fallbackDuration}</span>
      </div>
    </div>
  )
}
