import { motion } from 'motion/react'
import { useEffect, useState } from 'react'
import { clock } from './format'

/** Seconds left of a countdown that buzzes at 10s and at the end. Reports each tick to `onTick` (the island shows it). */
export function useCountdown(total: number, onTick?: (left: number | undefined) => void) {
  const [left, setLeft] = useState(total)
  useEffect(() => {
    if (left === 10) navigator.vibrate?.(80)
    if (left <= 0) { navigator.vibrate?.([200, 100, 200]); return }
    const t = setTimeout(() => setLeft(left - 1), 1000)
    return () => clearTimeout(t)
  }, [left])
  useEffect(() => onTick?.(left), [left, onTick])
  useEffect(() => () => onTick?.(undefined), [onTick]) // a stale 0 would flash "time's up" on the next timer
  return [left, setLeft] as const
}

export function TimerRing({ left, total, size = 'size-52' }: { left: number; total: number; size?: string }) {
  const R = 88, C = 2 * Math.PI * R
  const color = left <= 10 ? 'var(--color-lobos)' : left <= 30 ? 'var(--color-solo)' : 'var(--color-moon)'
  return (
    <div className={`relative mx-auto grid place-items-center ${size}`} role="timer" aria-label={`${left} segundos restantes`}>
      <svg viewBox="0 0 200 200" className="absolute inset-0 -rotate-90">
        <circle cx="100" cy="100" r={R} fill="none" stroke="var(--color-line)" strokeWidth="6" />
        <motion.circle cx="100" cy="100" r={R} fill="none" strokeWidth="6" strokeLinecap="round" strokeDasharray={C}
          animate={{ strokeDashoffset: C * (1 - Math.min(1, left / total)), stroke: color }} transition={{ duration: 1, ease: 'linear' }} />
      </svg>
      <motion.span key={left <= 10 ? left : 'x'} initial={left <= 10 ? { scale: 1.2 } : false} animate={{ scale: 1 }}
        className="text-5xl font-light tabular-nums" style={{ color }}>
        {clock(left)}
      </motion.span>
    </div>
  )
}
