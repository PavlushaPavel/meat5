import { motion } from 'motion/react'
import { EASE_OUT, prefersReducedMotion } from '../lib/motion'
import { cn } from '../lib/cn'

/**
 * Результат Видео 1, показанный движением, а не подписью (SPEC.md §9).
 *
 * Хаотичный поток людей стягивается в три понятные группы. Это не одна из
 * пяти дорогих сцен ТЗ (§37) — она контейнерная и лёгкая (DESIGN.md §8.4),
 * поэтому чистый SVG + позиционные CSS/motion-переходы, без частиц и 3D.
 *
 * Живёт прямо в кадре: без рамки-коробки и без собственной подложки — это
 * не отладочный виджет со счётчиком, а атмосфера сцены. Глубина — мягким
 * цветным свечением под каждой группой (offset-тень, DESIGN.md §2.11) и
 * коротким смазанным следом на каждой точке, летящей к своей группе.
 */
const CLUSTERS = [
  { cx: 54, cy: 40, color: 'var(--acid)' },
  { cx: 150, cy: 40, color: 'var(--color-gold)' },
  { cx: 246, cy: 40, color: 'var(--color-ink-2)' },
] as const

const DOTS_PER_CLUSTER = 6

/** Стартовые точки — намеренно вразнобой, это и есть «хаотичная аудитория». */
const SCATTER: readonly (readonly [number, number])[] = [
  [22, 6], [96, 10], [168, 4], [238, 8], [280, 18], [10, 44],
  [66, 70], [122, 66], [190, 72], [254, 66], [292, 48], [40, 28],
  [112, 32], [200, 28], [270, 36], [80, 52], [160, 56], [222, 52],
]

export function RewardAudienceScene({ className }: { className?: string }) {
  const reduced = prefersReducedMotion()

  return (
    <div aria-hidden className={cn('relative aspect-[300/76] w-full', className)}>
      {/* Глубина: мягкое цветное зарево под каждой будущей группой, со
          смещением вниз — это свет, а не декоративная тень без смысла. */}
      {CLUSTERS.map((cluster, i) => (
        <motion.div
          key={i}
          className="pointer-events-none absolute rounded-full blur-xl"
          style={{
            left: `${(cluster.cx / 300) * 100}%`,
            top: `${(cluster.cy / 76) * 100}%`,
            width: 64,
            height: 64,
            marginLeft: -32,
            marginTop: -20,
            background: cluster.color,
            boxShadow: `0 10px 26px -4px ${cluster.color}`,
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: reduced ? 0.22 : [0, 0.3, 0.22] }}
          transition={{ duration: reduced ? 0 : 1.1, ease: EASE_OUT, delay: reduced ? 0 : 0.5 }}
        />
      ))}

      <svg viewBox="0 0 300 76" className="absolute inset-0 h-full w-full overflow-visible">
        {SCATTER.map((scatter, i) => {
          const cluster = CLUSTERS[Math.floor(i / DOTS_PER_CLUSTER)]
          const within = i % DOTS_PER_CLUSTER
          const angle = (within / DOTS_PER_CLUSTER) * Math.PI * 2
          const radius = 10 + (within % 3) * 2
          const target: [number, number] = [
            cluster.cx + Math.cos(angle) * radius,
            cluster.cy + Math.sin(angle) * radius,
          ]
          const start = reduced ? target : scatter
          const r = 2.6 + (within % 3) * 0.6
          const delay = reduced ? 0 : 0.1 + within * 0.05

          return (
            <g key={i}>
              {/* Смазанный след движения: короткий отрезок от старта к цели,
                  гаснущий, как только точка долетает. */}
              {!reduced && (
                <motion.line
                  x1={start[0]}
                  y1={start[1]}
                  x2={target[0]}
                  y2={target[1]}
                  stroke={cluster.color}
                  strokeWidth={1}
                  strokeLinecap="round"
                  initial={{ opacity: 0.5, pathLength: 0 }}
                  animate={{ opacity: 0, pathLength: 1 }}
                  transition={{ duration: 0.9, ease: EASE_OUT, delay }}
                />
              )}
              <motion.circle
                r={r}
                fill={cluster.color}
                initial={{ cx: start[0], cy: start[1], opacity: 0.4 }}
                animate={{ cx: target[0], cy: target[1], opacity: 0.95 }}
                transition={{ duration: reduced ? 0 : 0.9, ease: EASE_OUT, delay }}
              />
            </g>
          )
        })}
      </svg>
    </div>
  )
}
