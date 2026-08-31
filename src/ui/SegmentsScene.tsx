import { motion, type Transition } from 'motion/react'
import { EASE_OUT, prefersReducedMotion } from '../lib/motion'
import { cn } from '../lib/cn'

/**
 * Мост после Видео 1 (SPEC.md §10) — сцена 2 из пяти дорогих сцен ТЗ (§37).
 *
 * Один поток раскалывается на сегменты, каждый доходит до ОДНОГО И ТОГО ЖЕ
 * предложения, после чего ветки схлопываются обратно в единую линию. Аргумент
 * несёт форма, а не подпись: разделили спрос — а предложение осталось одно.
 *
 * Линии светятся и живут: под каждой лежит мягкий ореол (второй, более
 * широкий и тусклый штрих того же цвета — не блюр-тень, DESIGN.md §2.11
 * запрещает цветную тень без смещения), а поверх бежит короткий яркий
 * импульс — буквальный поток данных из сегмента к общей точке.
 *
 * Не боксовая, в отличие от reward-сцен: лежит прямо на затемнённом кадре
 * (ReadingScrim), это кинематографичная сцена, а не диаграмма в панели.
 */
export const SEGMENTS_BEATS = {
  intro: 0.05,
  diverge: 0.8,
  collapse: 1.65,
  merge: 2.15,
} as const

const VB_W = 300
const VB_H = 220

const TOP = { x: 150, y: 8 }
const TRUNK_END = { x: 150, y: 46 }
const SEG_X = [36, 150, 264] as const
const SEG_Y = 104
const CTRL_Y_DIVERGE = (TRUNK_END.y + SEG_Y) / 2
const COLLAPSE = { x: 150, y: 172 }
const CTRL_Y_COLLAPSE = (SEG_Y + COLLAPSE.y) / 2
const BOTTOM = { x: 150, y: 216 }

/**
 * Одна линия = ореол снизу + чёткий штрих сверху + (если движение разрешено)
 * короткий импульс, который на loop проезжает по всей длине пути. Ореол и
 * штрих раскрываются вместе с `reveal` — тем же тактом, что и раньше.
 */
function GlowLine({
  d,
  color,
  width,
  reveal,
  reduced,
  pulseDelay,
  pulseDuration = 1.3,
  pulseGap = 0.5,
}: {
  d: string
  color: string
  width: number
  reveal: Transition
  reduced: boolean
  pulseDelay: number
  pulseDuration?: number
  pulseGap?: number
}) {
  return (
    <>
      <motion.path
        d={d}
        stroke={color}
        strokeWidth={width + 5}
        strokeLinecap="round"
        opacity={0.16}
        initial={{ pathLength: reduced ? 1 : 0 }}
        animate={{ pathLength: 1 }}
        transition={reveal}
      />
      <motion.path
        d={d}
        stroke={color}
        strokeWidth={width}
        strokeLinecap="round"
        initial={{ pathLength: reduced ? 1 : 0, opacity: reduced ? 0.95 : 0 }}
        animate={{ pathLength: 1, opacity: 0.95 }}
        transition={reveal}
      />
      {!reduced && (
        <motion.path
          d={d}
          stroke={color}
          strokeWidth={width + 1.4}
          strokeLinecap="round"
          initial={{ pathLength: 0.16, pathOffset: 0, opacity: 0 }}
          animate={{ pathLength: 0.16, pathOffset: 1, opacity: [0, 1, 1, 0] }}
          transition={{
            duration: pulseDuration,
            ease: 'linear',
            delay: pulseDelay,
            repeat: Infinity,
            repeatDelay: pulseGap,
          }}
        />
      )}
    </>
  )
}

export function SegmentsScene({
  segments,
  collapseLabel,
  className,
}: {
  segments: readonly string[]
  collapseLabel: string
  className?: string
}) {
  const reduced = prefersReducedMotion()
  const t = (delay: number, duration = 0.55): Transition => ({
    duration: reduced ? 0 : duration,
    ease: EASE_OUT,
    delay: reduced ? 0 : delay,
  })

  return (
    <div className={cn('relative aspect-[300/220] w-full', className)} aria-hidden>
      <svg viewBox={`0 0 ${VB_W} ${VB_H}`} className="absolute inset-0 h-full w-full" fill="none">
        <GlowLine
          d={`M${TOP.x},${TOP.y} L${TRUNK_END.x},${TRUNK_END.y}`}
          color="var(--color-gold)"
          width={3}
          reveal={t(SEGMENTS_BEATS.intro)}
          reduced={reduced}
          pulseDelay={SEGMENTS_BEATS.intro + 0.5}
          pulseDuration={0.8}
          pulseGap={0.6}
        />

        {SEG_X.map((x, i) => (
          <GlowLine
            key={`d${i}`}
            d={`M${TRUNK_END.x},${TRUNK_END.y} Q150,${CTRL_Y_DIVERGE} ${x},${SEG_Y}`}
            color="var(--color-gold-soft)"
            width={2.4}
            reveal={t(SEGMENTS_BEATS.intro + 0.25 + i * 0.08)}
            reduced={reduced}
            pulseDelay={SEGMENTS_BEATS.diverge + 0.45 + i * 0.22}
            pulseGap={0.7}
          />
        ))}

        {SEG_X.map((x, i) => (
          <g key={`n${i}`}>
            <motion.circle
              cx={x}
              cy={SEG_Y}
              r={13}
              fill="var(--color-gold)"
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.16 }}
              transition={t(SEGMENTS_BEATS.diverge + i * 0.06, 0.3)}
            />
            <motion.circle
              cx={x}
              cy={SEG_Y}
              r={6.5}
              fill="var(--color-gold)"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={t(SEGMENTS_BEATS.diverge + i * 0.06, 0.3)}
            />
            {!reduced && (
              <motion.circle
                cx={x}
                cy={SEG_Y}
                r={6.5}
                fill="none"
                stroke="var(--color-gold)"
                strokeWidth={1.4}
                initial={{ opacity: 0 }}
                animate={{ r: [6.5, 16], opacity: [0.5, 0] }}
                transition={{
                  duration: 1.8,
                  ease: EASE_OUT,
                  delay: SEGMENTS_BEATS.diverge + i * 0.06 + 0.35,
                  repeat: Infinity,
                  repeatDelay: 0.5,
                }}
              />
            )}
          </g>
        ))}

        {SEG_X.map((x, i) => (
          <GlowLine
            key={`c${i}`}
            d={`M${x},${SEG_Y} Q150,${CTRL_Y_COLLAPSE} ${COLLAPSE.x},${COLLAPSE.y}`}
            color="var(--acid)"
            width={2.4}
            reveal={t(SEGMENTS_BEATS.diverge + 0.3 + i * 0.06)}
            reduced={reduced}
            pulseDelay={SEGMENTS_BEATS.collapse + 0.35 + i * 0.18}
            pulseGap={0.6}
          />
        ))}

        <motion.circle
          cx={COLLAPSE.x}
          cy={COLLAPSE.y}
          r={17}
          fill="var(--acid)"
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.18 }}
          transition={t(SEGMENTS_BEATS.collapse, 0.4)}
        />
        <motion.circle
          cx={COLLAPSE.x}
          cy={COLLAPSE.y}
          r={8.5}
          fill="var(--acid)"
          initial={{ opacity: 0, scale: reduced ? 1 : 0.4 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={t(SEGMENTS_BEATS.collapse, 0.4)}
        />
        {!reduced && (
          <motion.circle
            cx={COLLAPSE.x}
            cy={COLLAPSE.y}
            r={8.5}
            fill="none"
            stroke="var(--acid)"
            strokeWidth={1.4}
            animate={{ r: [8.5, 21], opacity: [0.5, 0] }}
            transition={{
              duration: 1.8,
              ease: EASE_OUT,
              delay: SEGMENTS_BEATS.collapse + 0.4,
              repeat: Infinity,
              repeatDelay: 0.55,
            }}
          />
        )}

        <GlowLine
          d={`M${COLLAPSE.x},${COLLAPSE.y} L${BOTTOM.x},${BOTTOM.y}`}
          color="var(--color-gold)"
          width={3}
          reveal={t(SEGMENTS_BEATS.merge)}
          reduced={reduced}
          pulseDelay={SEGMENTS_BEATS.merge + 0.4}
          pulseDuration={0.7}
          pulseGap={0.5}
        />
      </svg>

      {segments.map((label, i) => (
        <div
          key={label}
          className="absolute"
          style={{
            left: `${(SEG_X[i] / VB_W) * 100}%`,
            top: `${(SEG_Y / VB_H) * 100}%`,
            transform: 'translate(-50%, -160%)',
          }}
        >
          <motion.span
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={t(SEGMENTS_BEATS.diverge + i * 0.06, 0.3)}
            className="label-mono inline-block rounded-chip border border-[color-mix(in_oklab,var(--color-gold)_35%,transparent)] bg-[color-mix(in_oklab,var(--color-ground-deep)_82%,transparent)] px-sp2 py-[3px] whitespace-nowrap text-ink"
          >
            {label}
          </motion.span>
        </div>
      ))}

      <div
        className="absolute"
        style={{
          left: `${(COLLAPSE.x / VB_W) * 100}%`,
          top: `${(COLLAPSE.y / VB_H) * 100}%`,
          transform: 'translate(-50%, 34%)',
        }}
      >
        <motion.span
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={t(SEGMENTS_BEATS.collapse + 0.12, 0.3)}
          className="label-mono inline-block max-w-[190px] rounded-chip border border-[color-mix(in_oklab,var(--acid)_35%,transparent)] bg-[color-mix(in_oklab,var(--color-ground-deep)_82%,transparent)] px-sp2 py-[4px] text-center text-[var(--acid)]"
        >
          {collapseLabel}
        </motion.span>
      </div>
    </div>
  )
}
