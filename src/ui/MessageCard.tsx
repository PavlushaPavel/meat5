import { motion } from 'motion/react'
import { Play } from '@phosphor-icons/react'
import { asset } from '../lib/asset'
import { cn } from '../lib/cn'
import { haptic } from '../lib/telegram'
import { CTA, MESSAGE } from '../content/copy'
import { EASE_OUT } from '../lib/motion'

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
 * дорожкой. Кружок play — настоящая кнопка (правка владельца: в мессенджере
 * жмут именно по нему, а не по золотой кнопке снизу): он вызывает ровно то
 * же действие, что и золотая кнопка (`onPlay`, приходит от экрана как
 * `voice.toggle`) — одно действие, два входа, логика не дублируется. Область
 * нажатия 44×44 (`h-11 w-11`), у самой золотой кнопки снизу остаётся то же
 * действие как более заметный, но не единственный вход.
 *
 * Карточка стоит поверх самого яркого кадра воронки — развязки «Город
 * трафика» (полировка по ТЗ, задача 4): имя отправителя раньше падало прямо
 * на надпись арки, текст на тексте. Локальный скрим под карточкой (не по
 * всему экрану — только своя подложка, DESIGN.md §6.1) держит имя и время
 * читаемыми при любой яркости кадра, а сама карточка плотнее и материальнее:
 * это сообщение в мессенджере, у него есть своя поверхность и тень со
 * смещением (запрет №11 — свечения без offset не в счёт).
 *
 * `pulse` — короткая недорогая вспышка по контуру карточки в момент прихода
 * сообщения (правка владельца, задача 2): один раз затухающее кольцо, без
 * мигания. Экран решает, показывать ли её (выключена при
 * `prefers-reduced-motion` — движение гасится, тактильный отклик остаётся).
 */
export function MessageCard({
  className,
  onPlay,
  pulse = false,
}: {
  className?: string
  onPlay?: () => void
  pulse?: boolean
}) {
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

      {/* Приход сообщения: одно затухающее кольцо по контуру карточки, не
          мигает и не повторяется — проигрывается один раз при монтировании. */}
      {pulse && (
        <motion.div
          aria-hidden
          // По вертикали подложка выходит за карточку, по горизонтали — нет:
          // отрицательный inset по бокам на 430px вылезал за окно и давал
          // горизонтальный скролл на всей странице.
          className="pointer-events-none absolute inset-x-0 -inset-y-sp2 -z-20 rounded-card motion-reduce:hidden"
          initial={{ opacity: 0.6, scale: 0.97 }}
          animate={{ opacity: 0, scale: 1.05 }}
          transition={{ duration: 0.9, ease: EASE_OUT }}
          style={{ boxShadow: '0 0 0 1.5px color-mix(in oklab, var(--color-gold) 60%, transparent)' }}
        />
      )}

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
        <button
          type="button"
          onClick={() => {
            haptic('medium')
            onPlay?.()
          }}
          aria-label={CTA.listen}
          className={cn(
            'grid h-11 w-11 shrink-0 cursor-pointer place-items-center rounded-full bg-gold',
            'transition-transform duration-[var(--t-press)] ease-e-out active:scale-[0.94]',
          )}
        >
          <Play size={18} weight="fill" className="ml-[2px] text-ink-on-gold" />
        </button>

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
