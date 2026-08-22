import { cn } from '../lib/cn'
import { QUIZ_LIVES } from '../store/progress'

/** Пять делений. Потеря — деление гаснет; кадр отдаёт красным на уровне экрана. */
export function Lives({ left }: { left: number }) {
  return (
    <div className="flex items-center gap-sp1" role="status" aria-label={`Жизней осталось: ${left}`}>
      {Array.from({ length: QUIZ_LIVES }, (_, i) => (
        <span
          key={i}
          aria-hidden
          className={cn(
            'h-[3px] w-6 rounded-full transition-colors duration-[var(--t-ui)] ease-e-out',
            i < left ? 'bg-gold' : 'bg-line',
          )}
        />
      ))}
    </div>
  )
}
