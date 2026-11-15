import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import type { Player } from '../engine/game'
import { ROLES, TEAM_LABEL, type RoleId, type Team } from '../engine/roles'
import { AvatarArt, fallbackAvatar, usePhoto } from './avatars'
import { Icon, RoleIcon, type UiIconName } from './icons'

export const teamText: Record<Team, string> = { vila: 'text-vila', lobos: 'text-lobos', solo: 'text-solo' }
export const teamBg: Record<Team, string> = { vila: 'bg-vila/12', lobos: 'bg-lobos/12', solo: 'bg-solo/12' }
export const teamRing: Record<Team, string> = { vila: 'ring-vila/30', lobos: 'ring-lobos/30', solo: 'ring-solo/30' }

export const spring = { type: 'spring', stiffness: 380, damping: 30 } as const

export function Btn({ children, onClick, disabled, kind = 'primary', className = '', icon }: {
  children: ReactNode; onClick?: () => void; disabled?: boolean; kind?: 'primary' | 'ghost' | 'danger' | 'quiet'; className?: string; icon?: UiIconName
}) {
  const styles = {
    primary: 'bg-moon text-bg shadow-[inset_0_-2px_0_rgb(0_0_0/.12),0_0_24px_rgb(255_255_255/.08)] hover:bg-white',
    ghost: 'glass border border-line bg-white/[.02] text-text hover:bg-white/[.06]',
    danger: 'border border-lobos/40 bg-lobos/15 text-lobos hover:bg-lobos/25',
    quiet: 'bg-transparent text-muted hover:text-text',
  }[kind]
  return (
    <motion.button whileTap={disabled ? undefined : { scale: 0.97 }} onClick={onClick} disabled={disabled}
      className={`inline-flex min-h-12 items-center justify-center gap-2 rounded-full px-5 text-[15px] font-medium transition-[opacity,background-color,color] disabled:opacity-35 ${styles} ${className}`}>
      {icon && <Icon name={icon} size={20} />}
      {children}
    </motion.button>
  )
}

export function IconBtn({ name, label, onClick, className = '' }: { name: UiIconName; label: string; onClick: () => void; className?: string }) {
  return (
    <motion.button whileTap={{ scale: 0.9 }} onClick={onClick} aria-label={label}
      className={`glass grid size-11 place-items-center rounded-full border border-line bg-black/40 text-text backdrop-blur-md hover:bg-white/[.06] ${className}`}>
      <Icon name={name} size={20} />
    </motion.button>
  )
}

export function Screen({ title, kicker, lead, hint, children, footer }: {
  title?: ReactNode; kicker?: ReactNode; lead?: ReactNode; hint?: ReactNode; children?: ReactNode; footer?: ReactNode
}) {
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col px-5 pt-5 pb-[max(1rem,env(safe-area-inset-bottom))]">
      <header className="flex min-h-11 flex-col items-center px-12 text-center">
        {lead && <div className="mb-3">{lead}</div>}
        {kicker && <p className="font-mono text-[11px] font-medium tracking-[.14em] text-muted uppercase">{kicker}</p>}
        {title && <h1 className="mt-2 font-display text-[34px] leading-[1.1] text-balance text-gradient">{title}</h1>}
        {hint && <p className="mt-2 max-w-xs text-sm leading-relaxed text-pretty text-muted">{hint}</p>}
      </header>
      <div className="mt-6 flex-1">{children}</div>
      {footer && <div className="sticky bottom-0 -mx-5 mt-4 flex flex-col gap-2 bg-gradient-to-t from-bg via-bg/80 to-transparent px-5 pt-6 pb-1">{footer}</div>}
    </div>
  )
}

export function Avatar({ p, size = 44, dim }: { p: Pick<Player, 'name'>; size?: number; dim?: boolean }) {
  const photo = usePhoto(p.name) ?? fallbackAvatar(p.name)
  return (
    <span aria-hidden className={`block shrink-0 overflow-hidden rounded-full ring-1 ring-white/10 ${dim ? 'opacity-70 grayscale' : ''}`} style={{ width: size, height: size }}>
      <AvatarArt photo={photo} size={size} />
    </span>
  )
}

export function RoleBadge({ role, size = 44, pulse }: { role: RoleId; size?: number; pulse?: boolean }) {
  const t = ROLES[role].team
  return (
    <span className={`relative grid shrink-0 place-items-center rounded-full ring-1 ${teamBg[t]} ${teamText[t]} ${teamRing[t]}`}
      style={{ width: size, height: size }}>
      {pulse && (
        <motion.span className={`absolute inset-0 rounded-full ring-2 ${teamRing[t]}`}
          initial={{ scale: 1, opacity: 0.8 }} animate={{ scale: 1.6, opacity: 0 }} transition={{ duration: 1.6, repeat: Infinity, ease: 'easeOut' }} />
      )}
      <RoleIcon role={role} size={size * 0.52} />
    </span>
  )
}

export function TeamPill({ team }: { team: Team }) {
  return <span className={`rounded-full px-2.5 py-1 font-mono text-[10px] font-medium tracking-[.14em] uppercase ${teamBg[team]} ${teamText[team]}`}>{TEAM_LABEL[team]}</span>
}

/** Grid of players to pick from. Dead players are shown faded and are not selectable. */
export function PlayerGrid({ players, selected, onSelect, can = () => true, marks, readOnly }: {
  players: Player[]; selected: (number | null | undefined)[]; onSelect?: (id: number) => void
  can?: (p: Player) => boolean; marks?: Record<number, number>; readOnly?: boolean
}) {
  return (
    <div className="grid grid-cols-3 gap-2.5">
      {players.map((p, i) => {
        const ok = p.alive && can(p) && !readOnly
        const on = selected.includes(p.id)
        return (
          <motion.button key={p.id} disabled={!ok} onClick={() => onSelect?.(p.id)} aria-pressed={readOnly ? undefined : on}
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: !p.alive ? 0.3 : ok || readOnly ? 1 : 0.45, y: 0 }}
            transition={{ delay: i * 0.025 }} whileTap={ok ? { scale: 0.94 } : undefined}
            className={`relative flex flex-col items-center gap-2 rounded-2xl px-2 pt-4 pb-3 transition-colors disabled:cursor-default
              ${on ? 'border border-transparent bg-white/[.07] ring-1 ring-white/60' : 'card'}`}>
            <Avatar p={p} dim={!p.alive} />
            <span className="w-full truncate text-center text-[13px] font-medium">{p.name}</span>
            {!p.alive && <Icon name="skull" size={14} className="absolute top-2 left-2 text-muted" />}
            <AnimatePresence>
              {on && (
                <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} transition={spring}
                  className="absolute top-2 right-2 grid size-5 place-items-center rounded-full bg-moon text-bg">
                  <Icon name="check" size={14} />
                </motion.span>
              )}
            </AnimatePresence>
            {!!marks?.[p.id] && !on && (
              <span className="absolute top-2 right-2 grid size-5 place-items-center rounded-full bg-lobos text-[11px] font-bold text-white">{marks[p.id]}</span>
            )}
          </motion.button>
        )
      })}
    </div>
  )
}

/** Full explanation of a role: goal, steps and tip. */
export function RoleCard({ role, extra, stagger = 0 }: { role: RoleId; extra?: ReactNode; stagger?: number }) {
  const r = ROLES[role]
  const item = (i: number) => ({ initial: { opacity: 0, y: 10 }, animate: { opacity: 1, y: 0 }, transition: { delay: stagger + i * 0.12 } })
  return (
    <div className="space-y-3">
      <motion.section {...item(0)} className="rounded-3xl card p-5">
        <h3 className="flex items-center gap-2 text-[11px] font-mono font-medium tracking-[.14em] text-muted uppercase"><Icon name="flag" size={14} />Seu objetivo</h3>
        <p className="mt-2 leading-relaxed">{r.goal}</p>
      </motion.section>
      <motion.section {...item(1)} className="rounded-3xl card p-5">
        <h3 className="flex items-center gap-2 text-[11px] font-mono font-medium tracking-[.14em] text-muted uppercase"><Icon name="book" size={14} />Como jogar</h3>
        <ol className="mt-3 space-y-3">
          {r.how.map((step, i) => (
            <li key={i} className="flex gap-3 leading-relaxed">
              <span className={`mt-0.5 grid size-6 shrink-0 place-items-center rounded-full text-xs font-bold ${teamBg[r.team]} ${teamText[r.team]}`}>{i + 1}</span>
              <span>{step}</span>
            </li>
          ))}
        </ol>
      </motion.section>
      <motion.section {...item(2)} className="flex gap-3 rounded-3xl border border-line bg-white/[.03] p-5 text-[15px] leading-relaxed">
        <Icon name="sparkle" size={18} className="mt-0.5 shrink-0 text-moon" />
        <p><strong className="text-moon">Dica:</strong> {r.tip}</p>
      </motion.section>
      {extra && <motion.div {...item(3)}>{extra}</motion.div>}
    </div>
  )
}

export function RoleHeader({ role, pulse }: { role: RoleId; pulse?: boolean }) {
  const r = ROLES[role]
  return (
    <div className="flex flex-col items-center text-center">
      <RoleBadge role={role} size={96} pulse={pulse} />
      <h2 className="mt-4 font-display text-[40px] text-gradient leading-tight">{r.name}</h2>
      <div className="mt-2 flex items-center gap-2"><TeamPill team={r.team} />{r.novo && <span className="rounded-full border border-line px-2.5 py-1 font-mono text-[10px] font-medium tracking-[.14em] text-moon uppercase">Novo</span>}</div>
      <p className="mt-3 text-muted">{r.tagline}</p>
    </div>
  )
}

/** Hold-to-confirm ring around the player's avatar. Stops secrets leaking from an accidental tap. */
function HoldRing({ p, onDone, ms = 650 }: { p: Player; onDone: () => void; ms?: number }) {
  const [progress, setProgress] = useState(0)
  const raf = useRef(0)
  const stop = () => { cancelAnimationFrame(raf.current); setProgress(0) }
  const begin = () => {
    const start = performance.now()
    const tick = (t: number) => {
      const v = Math.min(1, (t - start) / ms)
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
      <motion.span animate={{ scale: 1 + progress * 0.08 }}><Avatar p={p} size={112} /></motion.span>
    </button>
  )
}

export function Dots({ step, total }: { step: number; total: number }) {
  return (
    <div className="flex flex-wrap justify-center gap-1.5" aria-label={`${step + 1} de ${total}`}>
      {Array.from({ length: total }, (_, i) => (
        <span key={i} className={`h-1.5 rounded-full transition-all ${i < step ? 'w-1.5 bg-moon/60' : i === step ? 'w-5 bg-moon' : 'w-1.5 bg-line'}`} />
      ))}
    </div>
  )
}

/** Privacy gate: "pass to X" until that player holds to reveal. Remount with key to re-lock. */
export function PassTo({ p, why, step, total, children }: { p: Player; why: string; step: number; total: number; children: ReactNode }) {
  const [open, setOpen] = useState(false)
  if (open) return <>{children}</>
  return (
    <Screen kicker={why}>
      <div className="flex flex-col items-center pt-6 text-center">
        <Dots step={step} total={total} />
        <p className="mt-10 flex items-center gap-2 text-muted"><Icon name="phone" size={18} />Passe o celular para</p>
        <motion.p initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} className="mt-2 font-display text-5xl text-gradient leading-tight">{p.name}</motion.p>
        <div className="mt-10"><HoldRing p={p} onDone={() => setOpen(true)} /></div>
        <p className="mt-6 flex items-center gap-2 text-sm font-medium"><Icon name="hand" size={18} className="text-moon" />Segure o círculo para ver</p>
        <p className="mt-2 max-w-60 text-xs text-muted">Só {p.name} deve olhar a tela. Os outros, desviem o olhar.</p>
      </div>
    </Screen>
  )
}

export function Letters({ msgs }: { msgs?: string[] }) {
  if (!msgs?.length) return null
  return (
    <div className="mb-6 space-y-2.5" role="status">
      {msgs.map((m, i) => (
        <motion.div key={i} initial={{ opacity: 0, y: -8, rotate: -1 }} animate={{ opacity: 1, y: 0, rotate: 0 }} transition={{ delay: 0.15 + i * 0.15 }}
          className="flex gap-3 rounded-3xl bg-moon/10 p-4 ring-1 ring-moon/25">
          <Icon name="letter" size={20} className="mt-0.5 shrink-0 text-moon" />
          <div>
            <p className="text-[11px] font-mono font-medium tracking-[.14em] text-moon uppercase">Mensagem secreta</p>
            <p className="mt-1 text-[15px] leading-relaxed">{m}</p>
          </div>
        </motion.div>
      ))}
    </div>
  )
}

/** Footer summary of the pending choice + confirm button. */
export function ConfirmBar({ summary, onConfirm, disabled, label = 'Confirmar', kind = 'primary', secondary }: {
  summary?: ReactNode; onConfirm: () => void; disabled?: boolean; label?: string; kind?: 'primary' | 'danger'; secondary?: ReactNode
}) {
  return (
    <>
      <AnimatePresence mode="popLayout">
        {summary && (
          <motion.p key={String(summary)} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
            className="glass mx-auto rounded-full bg-black/60 px-4 py-1.5 text-center text-sm text-muted backdrop-blur-md">{summary}</motion.p>
        )}
      </AnimatePresence>
      <Btn kind={kind} disabled={disabled} onClick={onConfirm}>{label}</Btn>
      {secondary}
    </>
  )
}

export function Sheet({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: ReactNode; children: ReactNode }) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-50 flex items-end bg-black/70 backdrop-blur-sm" onClick={onClose}
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} role="dialog" aria-modal>
          <motion.div onClick={(e) => e.stopPropagation()}
            initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', stiffness: 320, damping: 34 }}
            className="glass mx-auto max-h-[88dvh] w-full max-w-md overflow-y-auto rounded-t-[28px] border-t border-line bg-[#0a0a0a]/95 backdrop-blur-xl px-5 pt-3 pb-[max(1.5rem,env(safe-area-inset-bottom))] ring-1 ring-line">
            <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-line" />
            <div className="mb-5 flex items-center justify-between gap-3">
              <h2 className="font-display text-2xl">{title}</h2>
              <IconBtn name="close" label="Fechar" onClick={onClose} />
            </div>
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export function Switch({ label, hint, checked, onChange }: { label: string; hint?: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button role="switch" aria-checked={checked} onClick={() => onChange(!checked)}
      className="flex w-full items-center justify-between gap-4 rounded-3xl card p-4 text-left">
      <span><span className="block font-medium">{label}</span>{hint && <span className="mt-0.5 block text-sm text-muted">{hint}</span>}</span>
      <span className={`flex h-7 w-12 shrink-0 items-center rounded-full p-1 transition-colors ${checked ? 'justify-end bg-moon' : 'justify-start bg-raised'}`}>
        <motion.span layout transition={spring} className={`size-5 rounded-full ${checked ? 'bg-bg' : 'bg-muted'}`} />
      </span>
    </button>
  )
}
