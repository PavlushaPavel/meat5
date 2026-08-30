import { motion } from 'motion/react'
import { EASE_OUT, prefersReducedMotion } from '../lib/motion'
import { cn } from '../lib/cn'

/**
 * Результат Видео 2 (SPEC.md §12): те же три группы, но теперь каждая
 * получает СВОЁ предложение — в отличие от моста после Видео 1, где всем
 * доставалось одно и то же (ui/SegmentsScene.tsx). Разница даётся формой и
 * цветом метки над группой, без единой лишней надписи.
 *
 * Не входит в пять дорогих сцен ТЗ (§37) — контейнерная, лёгкая (DESIGN.md
 * §8.4). Живёт прямо в кадре без рамки-коробки: свечение под каждой группой
 * и разная плотность точек дают глубину вместо бордера и подложки.
 */
const CLUSTERS = [
  { cx: 54, cy: 58, color: 'var(--acid)' },
  { cx: 150, cy: 58, color: 'var(--gold)' },
  { cx: 246, cy: 58, color: 'var(--ink-2)' },
] as const

const PEOPLE_PER_CLUSTER = 5

export function RewardOffersScene({ className }: { className?: string }) {
  const reduced = prefersReducedMotion()
  const markDelay = (i: number) => (reduced ? 0 : 0.5 + i * 0.24)

  return (
    <div aria-hidden className={cn('relative aspect-[300/86] w-full', className)}>
      {CLUSTERS.map((cluster, i) => (
        <motion.div
          key={i}
          className="pointer-events-none absolute rounded-full blur-xl"
          style={{
            left: `${(cluster.cx / 300) * 100}%`,
            top: `${(cluster.cy / 86) * 100}%`,
            width: 68,
            height: 68,
            marginLeft: -34,
            marginTop: -24,
            background: cluster.color,
            boxShadow: `0 10px 28px -4px ${cluster.color}`,
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: reduced ? 0.24 : [0, 0.32, 0.24] }}
          transition={{ duration: reduced ? 0 : 1.1, ease: EASE_OUT, delay: markDelay(i) }}
        />
      ))}

      <svg viewBox="0 0 300 86" className="absolute inset-0 h-full w-full overflow-visible">
        {CLUSTERS.map((cluster, ci) => (
          <g key={ci}>
            {Array.from({ length: PEOPLE_PER_CLUSTER }, (_, i) => {
              const angle = (i / PEOPLE_PER_CLUSTER) * Math.PI * 2
              const radius = 11 + (i % 3) * 2
              const x = cluster.cx + Math.cos(angle) * radius
              const y = cluster.cy + Math.sin(angle) * radius
              const r = 2.4 + (i % 3) * 0.5
              return (
                <motion.circle
                  key={i}
                  cx={x}
                  cy={y}
                  r={r}
                  fill={cluster.color}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 0.55 }}
                  transition={{ duration: reduced ? 0 : 0.4, ease: EASE_OUT, delay: reduced ? 0 : 0.1 }}
                />
              )
            })}

            <motion.line
              x1={cluster.cx}
              y1={cluster.cy - 24}
              x2={cluster.cx}
              y2={cluster.cy - 15}
              stroke={cluster.color}
              strokeWidth={1.5}
              initial={{ pathLength: reduced ? 1 : 0, opacity: reduced ? 0.6 : 0 }}
              animate={{ pathLength: 1, opacity: 0.6 }}
              transition={{ duration: reduced ? 0 : 0.3, ease: EASE_OUT, delay: markDelay(ci) - 0.1 }}
            />

            {/* Метка предложения — своя форма на каждой группе: не одна и та же,
                а три разных, ровно то, чем этот экран отличается от моста. */}
            {ci === 0 && (
              <motion.circle
                cx={cluster.cx}
                cy={cluster.cy - 32}
                r={6.5}
                fill={cluster.color}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: reduced ? 0 : 0.4, ease: EASE_OUT, delay: markDelay(ci) }}
              />
            )}
            {ci === 1 && (
              <motion.rect
                x={cluster.cx - 5.5}
                y={cluster.cy - 37.5}
                width={11}
                height={11}
                fill={cluster.color}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: reduced ? 0 : 0.4, ease: EASE_OUT, delay: markDelay(ci) }}
              />
            )}
            {ci === 2 && (
              <motion.polygon
                points={`${cluster.cx},${cluster.cy - 39} ${cluster.cx - 7},${cluster.cy - 27} ${cluster.cx + 7},${cluster.cy - 27}`}
                fill={cluster.color}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: reduced ? 0 : 0.4, ease: EASE_OUT, delay: markDelay(ci) }}
              />
            )}
          </g>
        ))}
      </svg>
    </div>
  )
}
