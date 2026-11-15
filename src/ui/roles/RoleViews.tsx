import { motion } from 'motion/react'
import type { ReactNode } from 'react'
import { ROLES, type RoleId, type Team } from '../../engine/roles'
import { TEAM_LABEL, teamBg, teamRing, teamText } from './teamStyles'
import { Icon } from '../kit/icons'
import { RoleIcon } from './RoleIcon'

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

function TeamPill({ team }: { team: Team }) {
  return <span className={`rounded-full px-2.5 py-1 font-mono text-[10px] font-medium tracking-[.14em] uppercase ${teamBg[team]} ${teamText[team]}`}>{TEAM_LABEL[team]}</span>
}

function RoleCard({ role, extra, stagger = 0 }: { role: RoleId; extra?: ReactNode; stagger?: number }) {
  const r = ROLES[role]
  const item = (i: number) => ({ initial: { opacity: 0, y: 10 }, animate: { opacity: 1, y: 0 }, transition: { delay: stagger + i * 0.12 } })
  return (
    <div className="space-y-3">
      <motion.section {...item(0)} className="rounded-3xl card p-5">
        <h3 className="flex items-center gap-2 eyebrow text-muted"><Icon name="flag" size={14} />Seu objetivo</h3>
        <p className="mt-2 leading-relaxed">{r.goal}</p>
      </motion.section>
      <motion.section {...item(1)} className="rounded-3xl card p-5">
        <h3 className="flex items-center gap-2 eyebrow text-muted"><Icon name="book" size={14} />Como jogar</h3>
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

function RoleHeader({ role, pulse }: { role: RoleId; pulse?: boolean }) {
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

export function RoleDetails({ role, pulse, extra, stagger }: { role: RoleId; pulse?: boolean; extra?: ReactNode; stagger?: number }) {
  return (
    <>
      <RoleHeader role={role} pulse={pulse} />
      <div className="mt-6"><RoleCard role={role} extra={extra} stagger={stagger} /></div>
    </>
  )
}
