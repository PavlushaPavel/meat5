/** Единые токены движения (DESIGN.md §6). Локальные значения в компонентах запрещены. */
export const EASE_OUT = [0.23, 1, 0.32, 1] as const
export const EASE_INOUT = [0.77, 0, 0.175, 1] as const

export const DUR = {
  press: 0.14,
  ui: 0.22,
  scene: 0.52,
} as const

/** Вход снизу: элемент уже существует, он не появляется из ничего (никакого scale(0)). */
export const enter = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: DUR.ui, ease: EASE_OUT },
}

/** Стаггер списка: 40ms между элементами, дольше — интерфейс начинает тормозить. */
export const stagger = (i: number) => ({
  ...enter,
  transition: { ...enter.transition, delay: i * 0.04 },
})

export function prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}
