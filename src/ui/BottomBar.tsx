import { Children, isValidElement, useState, type ReactNode } from 'react'
import { motion } from 'motion/react'
import { Button } from './Button'
import { EASE_OUT, prefersReducedMotion } from '../lib/motion'

/**
 * Панель действия. Фиксирована, но экран уже зарезервировал под неё место
 * (см. Screen): контент не заезжает под кнопку и не прячется за ней.
 *
 * Когда единственное переданное действие выключено (`Button disabled`), сама
 * панель плавно уходит вниз вместо того, чтобы несколько секунд висеть тусклой
 * нерабочей плашкой во всю ширину («РАЗОБРАТЬСЯ» пока раскрываются карточки,
 * «ДАЛЬШЕ» в тесте пока не выбран ответ) — полировка по ТЗ, задача 2.
 * Определяем это по самим переданным детям: если среди них есть хотя бы одна
 * `Button`, и все найденные `Button` выключены — панель уходит; если рядом
 * есть ещё живое действие (например «Заново» в провале теста), она остаётся.
 *
 * Место под панель в скролле резервирует Screen фиксированной высотой и не
 * зависит от этого состояния — двигается только сама панель, а не разметка.
 * `data-bottom-bar` остаётся на внешнем узле независимо от видимости: панель
 * не размонтируется, кнопка внутри всегда на месте для проверочных скриптов.
 */
export function BottomBar({ children }: { children: ReactNode }) {
  const [reduced] = useState(prefersReducedMotion)
  const allDisabled = isEveryActionDisabled(children)

  return (
    <div
      data-bottom-bar
      className="fixed inset-x-0 z-40 mx-auto w-full max-w-[var(--app-max)] px-[var(--gutter)]"
      style={{
        // Низ окна и низ видимой области — разные вещи: в Telegram под окном
        // остаётся чат, и кнопка, прижатая к bottom:0, оказывается вне экрана.
        bottom: 'var(--tg-gap-bottom)',
        paddingBottom: 'calc(max(env(safe-area-inset-bottom), var(--tg-sa-bottom)) + 16px)',
        // Выключенное действие не должно ловить клики, пока панель прячется.
        pointerEvents: allDisabled ? 'none' : 'auto',
      }}
    >
      {/* Растушёвка к фону: кнопка не висит на резкой границе поверх сцены. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 -z-10 h-[140px]"
        style={{
          background:
            'linear-gradient(to top, var(--color-ground) 38%, color-mix(in oklab, var(--color-ground) 70%, transparent) 72%, transparent)',
        }}
      />
      <motion.div
        // visibility, а не только opacity: полностью прозрачная панель остаётся
        // кликабельной и попадает в фокус с клавиатуры. Прячем ПОСЛЕ анимации
        // (transitionEnd), показываем сразу — иначе исчезновение будет резким.
        animate={
          allDisabled
            ? { opacity: 0, y: 10, transitionEnd: { visibility: 'hidden' } }
            : { opacity: 1, y: 0, visibility: 'visible' }
        }
        initial={false}
        transition={reduced ? { duration: 0 } : { duration: 0.2, ease: EASE_OUT }}
      >
        {children}
      </motion.div>
    </div>
  )
}

/** true только если среди детей нашлась хотя бы одна `Button`, и все они `disabled`. */
function isEveryActionDisabled(node: ReactNode): boolean {
  const states: boolean[] = []
  collectButtonDisabledStates(node, states)
  return states.length > 0 && states.every(Boolean)
}

function collectButtonDisabledStates(node: ReactNode, states: boolean[]): void {
  Children.forEach(node, (child) => {
    if (!isValidElement(child)) return
    if (child.type === Button) {
      states.push(Boolean((child.props as { disabled?: boolean }).disabled))
      return
    }
    const nested = (child.props as { children?: ReactNode } | null)?.children
    if (nested) collectButtonDisabledStates(nested, states)
  })
}
