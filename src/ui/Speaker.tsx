import { asset } from '../lib/asset'
import { cn } from '../lib/cn'

/**
 * Лицо голоса. В сцене говорит человек, а не безымянный субтитр — портрет
 * держит доверие на тех экранах, где нет ничего, кроме текста и кадра.
 * Кадрирован из присланного файла с персонажем (scripts/assets.mjs).
 */
export function Speaker({ className, size = 'sm' }: { className?: string; size?: 'sm' | 'lg' }) {
  return (
    <div
      className={cn(
        'overflow-hidden rounded-chip border border-line bg-ground-deep',
        size === 'sm' ? 'h-14 w-12 shrink-0' : 'h-40 w-32',
        className,
      )}
    >
      <img
        src={asset('world/character-point.webp')}
        alt="Автор практикума"
        loading="lazy"
        decoding="async"
        className="h-full w-full object-cover object-top"
      />
    </div>
  )
}
