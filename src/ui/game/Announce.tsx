import { motion } from 'motion/react'
import { useState } from 'react'
import { player, type GameState, type Note } from '../../engine/game'
import { ROLES } from '../../engine/roles'
import { Btn } from '../kit/controls'
import { Icon } from '../kit/icons'
import { ConfirmBar, LeadIcon, Screen } from '../kit/layout'
import { useReadDelay } from '../kit/useReadDelay'
import { Avatar } from '../players/Avatar'
import { PlayerGrid } from '../players/PlayerGrid'
import { RoleBadge } from '../roles/RoleViews'
import { teamText } from '../roles/teamStyles'

export function Announce({ s, onNext }: { s: GameState; onNext: () => void }) {
  const morning = s.next === 'day'
  const ready = useReadDelay(Math.min(3000, 600 + s.announcements.length * 350))
  const maxVotes = Math.max(1, ...s.announcements.map((n) => (n.kind === 'tally' ? n.votes : 0)))
  return (
    <Screen lead={<LeadIcon name={morning ? 'sun' : 'scale'} />}
      kicker={morning ? `Dia ${s.day}` : `Fim do dia ${s.day}`} title={morning ? 'A vila acorda' : 'O veredito'}
      footer={<Btn disabled={!ready} onClick={onNext}>Continuar</Btn>}>
      <ul className="space-y-2.5" aria-live="polite">
        {s.announcements.map((n, i) => (
          <motion.li key={i} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 + i * 0.3 }}>
            <NoteView s={s} n={n} max={maxVotes} delay={0.25 + i * 0.3} />
          </motion.li>
        ))}
      </ul>
    </Screen>
  )
}

function NoteView({ s, n, max, delay }: { s: GameState; n: Note; max: number; delay: number }) {
  if (n.kind === 'info') {
    return (
      <div className="flex gap-3 rounded-3xl card p-4 leading-relaxed">
        <Icon name={n.icon} size={20} className="mt-0.5 shrink-0 text-moon" /><p>{n.text}</p>
      </div>
    )
  }
  if (n.kind === 'tally') {
    const who = n.id == null ? null : player(s, n.id)
    return (
      <div className="flex items-center gap-3 rounded-2xl card p-3">
        {who ? <Avatar name={who.name} size={32} /> : <span className="grid size-8 place-items-center rounded-full bg-raised text-muted"><Icon name="close" size={16} /></span>}
        <div className="flex-1">
          <div className="flex justify-between text-sm"><span className="font-medium">{who?.name ?? 'Pular'}</span><span className="text-muted">{n.votes}</span></div>
          <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-raised">
            <motion.div className="h-full rounded-full bg-moon" initial={{ width: 0 }} animate={{ width: `${(n.votes / max) * 100}%` }} transition={{ delay: delay + 0.2, duration: 0.6 }} />
          </div>
        </div>
      </div>
    )
  }
  const p = player(s, n.id)
  return (
    <div className="rounded-3xl card p-5 ring-1 ring-lobos/20">
      <div className="flex items-center gap-4">
        <div className="relative"><Avatar name={p.name} size={52} dim /><Icon name="skull" size={20} className="absolute -right-1 -bottom-1 rounded-full bg-bg p-0.5 text-lobos" /></div>
        <div><p className="text-lg font-semibold">{p.name}</p><p className="text-sm text-muted">{n.cause}</p></div>
      </div>
      {n.role && (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} transition={{ delay: delay + 0.6 }}
          className="overflow-hidden">
          <div className="mt-4 flex items-center gap-3 border-t border-line pt-4">
            <RoleBadge role={n.role} size={36} />
            <p className="text-sm text-muted">Era <b className={teamText[ROLES[n.role].team]}>{ROLES[n.role].name}</b></p>
          </div>
        </motion.div>
      )}
    </div>
  )
}

export function Hunter({ s, onShoot }: { s: GameState; onShoot: (target: number | null) => void }) {
  const h = player(s, s.hunterQueue[0])
  const [t, setT] = useState<number | null>(null)
  return (
    <Screen lead={<RoleBadge role={h.role} size={64} pulse />} kicker="Último suspiro" title={`${h.name} · ${ROLES[h.role].name}`}
      hint={`${h.name}, antes de cair você pode atirar uma flecha. Quem você escolher morre na hora.`}
      footer={<ConfirmBar kind="danger" disabled={t == null} label="Atirar" onConfirm={() => onShoot(t)}
        summary={t != null && <>Flecha em <b className="text-lobos">{player(s, t).name}</b></>}
        secondary={<Btn kind="quiet" onClick={() => onShoot(null)}>Não atirar</Btn>} />}>
      <PlayerGrid players={s.players} selected={[t]} onSelect={setT} can={(o) => o.id !== h.id} />
    </Screen>
  )
}
