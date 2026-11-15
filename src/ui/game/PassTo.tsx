import { motion } from 'motion/react'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { current, type GameState, type Player } from '../../engine/game'
import { Icon } from '../kit/icons'
import { Dots, Screen } from '../kit/layout'
import { Avatar } from '../players/Avatar'

/** Privacy gate for a private turn: "pass the phone to X" until X holds the ring. Re-locks for every new turn. */
export function PassTo({ s, why, children }: { s: GameState; why: string; children: (p: Player) => ReactNode }) {
  const p = current(s)
  return <Gate key={`${s.phase}-${s.day}-${p.id}`} p={p} why={why} step={s.cursor} total={s.queue.length}>{children(p)}</Gate>
}

function Gate({ p, why, step, total, children }: { p: Player; why: string; step: number; total: number; children: ReactNode }) {
  const [open, setOpen] = useState(false)
  if (open) return <>{children}</>
  return (
    <Screen kicker={why}>
      <div className="flex flex-col items-center pt-6 text-center">
        <Dots step={step} total={total} />
        <p className="mt-10 flex items-center gap-2 text-muted"><Icon name="phone" size={18} />Passe o celular para</p>
        <motion.p initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} className="mt-2 font-display text-5xl leading-tight text-gradient">{p.name}</motion.p>
        <div className="mt-10"><HoldRing p={p} onDone={() => setOpen(true)} /></div>
        <p className="mt-6 flex items-center gap-2 text-sm font-medium"><Icon name="hand" size={18} className="text-moon" />Segure o círculo para ver</p>
        <p className="mt-2 max-w-60 text-xs text-muted">Só {p.name} deve olhar a tela. Os outros, desviem o olhar.</p>
      </div>
    </Screen>
  )
}

/** Hold instead of tap, so an accidental touch doesn't leak a secret. */
const HOLD_MS = 650

function HoldRing({ p, onDone }: { p: Player; onDone: () => void }) {
  const [progress, setProgress] = useState(0)
  const raf = useRef(0)
  const stop = () => { cancelAnimationFrame(raf.current); setProgress(0) }
  const begin = () => {
    const start = performance.now()
    const tick = (t: number) => {
      const v = Math.min(1, (t - start) / HOLD_MS)
      setProgress(v)
      if (v >= 1) { navigator.vibrate?.(25); onDone() } else raf.current = requestAnimationFrame(tick)
    }
    raf.current = requestAnimationFrame(tick)
  }
  useEffect(() => () => cancelAnimationFrame(raf.current), [])
  const R = 74, C = 2 * Math.PI * R
  return (
    <button aria-label={`Sou ${p.name}: segure para ver`}
      onPointerDown={begin} onPointerUp={stop} onPointerLeave={stop} onPointerCancel={stop}
      onKeyDown={(e) => { if ((e.key === 'Enter' || e.key === ' ') && !e.repeat) { e.preventDefault(); begin() } }}
      onKeyUp={stop} onContextMenu={(e) => e.preventDefault()}
      className="relative grid size-44 touch-none place-items-center rounded-full select-none">
      <svg viewBox="0 0 160 160" className="absolute inset-0 -rotate-90">
        <circle cx="80" cy="80" r={R} fill="none" stroke="var(--color-line)" strokeWidth="4" />
        <circle cx="80" cy="80" r={R} fill="none" stroke="var(--color-moon)" strokeWidth="4" strokeLinecap="round"
          strokeDasharray={C} strokeDashoffset={C * (1 - progress)} />
      </svg>
      <motion.span animate={{ scale: 1 + progress * 0.08 }}><Avatar name={p.name} size={112} /></motion.span>
    </button>
  )
}
