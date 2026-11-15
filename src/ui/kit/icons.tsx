import type { ReactNode } from 'react'
import { uiArt } from './iconArt'

export function Svg({ children, size = 24, className }: { children: ReactNode; size?: number; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth={1.6}
      strokeLinecap="round" strokeLinejoin="round" aria-hidden className={className}>
      {children}
    </svg>
  )
}

export type UiIconName = keyof typeof uiArt

export const Icon = ({ name, size, className }: { name: UiIconName; size?: number; className?: string }) =>
  <Svg size={size} className={className}>{uiArt[name]}</Svg>
