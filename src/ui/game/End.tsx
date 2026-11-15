import { motion } from 'motion/react'
import { useState } from 'react'
import { player, type GameState, type LogEntry, type Player, type Winner } from '../../engine/game'
import { ROLES } from '../../engine/roles'
import { Btn } from '../kit/controls'
import { Icon, type UiIconName } from '../kit/icons'
import { RoleIcon } from '../roles/RoleIcon'
import { LeadIcon, Screen } from '../kit/layout'
import { Avatar } from '../players/Avatar'
import { RoleBadge } from '../roles/RoleViews'
import { teamBg, teamText } from '../roles/teamStyles'
import { spring } from '../kit/styles'

interface Props { s: GameState; onAgain: () => void; onMenu: () => void; onScore?: () => void }

const winnerColor = (t: Winner['team']) => (t === 'amantes' ? 'text-love bg-love/12' : t === 'ninguem' ? 'text-muted bg-raised' : `${teamText[t]} ${teamBg[t]}`)
const logIcon: Record<LogEntry['kind'], UiIconName> = { role: 'users', action: 'moon', death: 'skull', vote: 'scale', win: 'trophy' }

export function End({ s, onAgain, onMenu, onScore }: Props) {
  const [timeline, setTimeline] = useState(false)
  const w = s.winner!
  const hero = w.team === 'amantes' ? <Icon name="heart" size={40} />
    : w.team === 'lobos' ? <RoleIcon role="lobisomem" size={40} />
    : w.team === 'vila' ? <RoleIcon role="aldeao" size={40} />
    : w.ids[0] != null ? <RoleIcon role={player(s, w.ids[0]).role} size={40} /> : <Icon name="skull" size={40} />
  const days = [...new Set(s.log.map((l) => l.day))]
  const winnersFirst = [...s.players].sort((a, b) => Number(w.ids.includes(b.id)) - Number(w.ids.includes(a.id)))
  return (
    <Screen footer={<><Btn onClick={onAgain}>Jogar de novo</Btn><Btn kind="quiet" onClick={onMenu}>Mudar jogadores ou papéis</Btn></>}>
      <div className="flex flex-col items-center pt-4 text-center">
        <motion.span initial={{ scale: 0, rotate: -30 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: 'spring', stiffness: 200, damping: 12 }}
          className={`grid size-24 place-items-center rounded-full ${winnerColor(w.team)}`}>{hero}</motion.span>
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="eyebrow mt-5 text-muted">Fim de jogo</motion.p>
        <motion.h1 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="mt-2 font-display text-4xl leading-tight text-balance text-gradient">{w.title}</motion.h1>
      </div>
      <div className="mt-8"><Roster players={winnersFirst} winners={w.ids} delay={0.7} /></div>
      <ShareResult s={s} />
      {onScore && <Btn kind="ghost" icon="trophy" className="mt-3 w-full" onClick={onScore}>Ver placar</Btn>}
      {!timeline ? <Btn kind="ghost" icon="book" className="mt-6 w-full" onClick={() => setTimeline(true)}>Ver o que aconteceu</Btn> : (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-8 space-y-6">
          {days.map((d) => (
            <section key={d}>
              <h3 className="eyebrow mb-3 text-muted">{d === 0 ? 'Início' : `Noite e dia ${d}`}</h3>
              <ol className="relative space-y-3 border-l border-line pl-5">
                {s.log.filter((l) => l.day === d).map((l, i) => (
                  <li key={i} className="relative text-[15px] leading-relaxed">
                    <span className={`absolute top-0.5 -left-[31px] grid size-5 place-items-center rounded-full bg-bg ${l.kind === 'death' ? 'text-lobos' : l.kind === 'win' ? 'text-moon' : 'text-muted'}`}>
                      <Icon name={logIcon[l.kind]} size={14} />
                    </span>
                    {l.text}
                  </li>
                ))}
              </ol>
            </section>
          ))}
        </motion.div>
      )}
    </Screen>
  )
}

function ShareResult({ s }: { s: GameState }) {
  const [copied, setCopied] = useState(false)
  const text = [
    `🌕 Lua de Sangue: ${s.winner!.title} em ${s.day} ${s.day === 1 ? 'dia' : 'dias'}.`, '',
    ...s.players.map((p) => `${s.winner!.ids.includes(p.id) ? '🏆' : p.alive ? '•' : '💀'} ${p.name}: ${ROLES[p.role].name}`),
  ].join('\n')
  const share = async () => {
    try {
      if (navigator.share) return await navigator.share({ title: 'Lua de Sangue', text })
      await navigator.clipboard.writeText(text)
      setCopied(true)
    } catch { /* share sheet dismissed or clipboard blocked */ }
  }
  return <Btn kind="ghost" icon={copied ? 'check' : 'letter'} className="mt-3 w-full" onClick={share}>{copied ? 'Copiado' : 'Compartilhar resultado'}</Btn>
}

/** End of a deal-only match: a human narrator takes over. */
export function Dealt({ s, onAgain, onMenu }: Props) {
  const [open, setOpen] = useState(false)
  return (
    <Screen lead={<LeadIcon name="check" />} kicker="Distribuição concluída" title="O narrador assume daqui"
      hint="Todos já viram suas cartas. Devolva o celular para quem vai narrar."
      footer={<><Btn onClick={onAgain}>Distribuir de novo</Btn><Btn kind="quiet" onClick={onMenu}>Mudar jogadores ou papéis</Btn></>}>
      {open ? <Roster players={s.players} />
        : <Btn kind="ghost" icon="users" className="w-full" onClick={() => confirm('Só o narrador deve ver. Mostrar todos os papéis?') && setOpen(true)}>Mostrar todos os papéis ao narrador</Btn>}
    </Screen>
  )
}

function Roster({ players, winners = [], delay = 0 }: { players: Player[]; winners?: number[]; delay?: number }) {
  return (
    <ul className="space-y-2">
      {players.map((p, i) => {
        const won = winners.includes(p.id)
        return (
          <motion.li key={p.id} initial={{ opacity: 0, rotateX: -80 }} animate={{ opacity: 1, rotateX: 0 }} transition={{ delay: delay + i * 0.08, ...spring }}
            style={{ transformPerspective: 600 }} className={`flex items-center gap-3 rounded-2xl p-3 ${won ? 'bg-moon/10 ring-1 ring-moon/30' : 'card'}`}>
            <Avatar name={p.name} size={36} dim={!p.alive} />
            <span className="min-w-0 flex-1">
              <span className="flex items-center gap-1.5 truncate font-medium">{p.name}{!p.alive && <Icon name="skull" size={14} className="text-muted" />}</span>
              <span className={`text-sm ${teamText[ROLES[p.role].team]}`}>{ROLES[p.role].name}</span>
            </span>
            <RoleBadge role={p.role} size={32} />
            {won && <Icon name="trophy" size={18} className="text-moon" />}
          </motion.li>
        )
      })}
    </ul>
  )
}
