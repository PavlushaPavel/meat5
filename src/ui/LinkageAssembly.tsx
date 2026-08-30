import { motion } from 'motion/react'
import { NodeRail } from './NodeRail'
import { NODES, type StepId } from '../router/flow'
import { EASE_OUT } from '../lib/motion'
import { cn } from '../lib/cn'

/**
 * Дорогая сцена №5 (SPEC.md §22, §37): КОМУ ✓ → ЧТО СКАЗАТЬ ✓ → КУДА ВЕСТИ ✓,
 * поток проходит через всю систему.
 *
 * NodeRail уже стаггерит появление трёх узлов и растит кислотную линию, когда
 * все они открыты (её единственное условие — `dramatic` и все узлы `open`,
 * что на STATE09 всегда так). Здесь эта же линия усилена: по ней после
 * появления бегут импульсы, а в момент, когда она долетает до правого края,
 * кадр коротко вспыхивает светом — «поток» становится буквальным, а не
 * подписью под рельсой. NodeRail.tsx не редактируется (чужой файл, в процессе
 * переписывания) — вся добавка живёт вокруг него, синхронизированная по тем
 * же таймингам, что и его собственная анимация линии.
 */
export function LinkageAssembly({ step, className }: { step: StepId; className?: string }) {
  // NodeRail: последний узел стартует на NODES.length*0.22, линия — с той же
  // задержки и растёт 0.8с. Импульсы и вспышка ждут, пока линия долетит.
  const lineDelay = NODES.length * 0.22
  const lineDone = lineDelay + 0.8

  return (
    <div className={cn('relative', className)}>
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-sp2 top-1/2 z-0 h-[2px] -translate-y-1/2 overflow-hidden motion-reduce:hidden"
      >
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            initial={{ x: '-20%', opacity: 0 }}
            animate={{ x: '120%', opacity: [0, 1, 1, 0] }}
            transition={{
              duration: 1.1,
              ease: EASE_OUT,
              delay: lineDone + i * 0.34,
              repeat: Infinity,
              repeatDelay: 1.4,
            }}
            className="absolute top-0 h-full w-[22%] rounded-full"
            style={{ background: 'linear-gradient(90deg, transparent, var(--acid), transparent)' }}
          />
        ))}
      </div>

      <NodeRail step={step} dramatic onScene />

      <motion.div
        aria-hidden
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 0.5, 0] }}
        transition={{ duration: 0.65, ease: EASE_OUT, delay: lineDone - 0.05 }}
        className="pointer-events-none absolute inset-0 z-0 rounded-panel motion-reduce:hidden"
        style={{
          background: 'radial-gradient(70% 140% at 50% 50%, var(--acid), transparent 72%)',
        }}
      />
    </div>
  )
}
