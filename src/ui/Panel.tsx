import type { ReactNode } from 'react'
import { cn } from '../lib/cn'

export function Panel({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn('rounded-panel border border-line bg-panel p-sp4', className)}>{children}</div>
  )
}
