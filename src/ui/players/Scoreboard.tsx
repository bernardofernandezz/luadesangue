import type { Stats } from '../../app/stats'
import { Btn } from '../kit/controls'
import { Avatar } from './Avatar'

const TEAM_NAMES: Record<string, string> = { vila: 'Vila', lobos: 'Lobos', solo: 'Solo', amantes: 'Amantes', ninguem: 'Ninguém' }

/** Wins across matches on this phone, by player name and by winning side. */
export function Scoreboard({ stats, onReset }: { stats: Stats; onReset: () => void }) {
  const rows = Object.entries(stats.players).sort(([, a], [, b]) => b.wins - a.wins || b.wins / b.games - a.wins / a.games)
  const teams = Object.entries(stats.teams).sort(([, a], [, b]) => b - a)
  if (!rows.length) return <p className="py-8 text-center text-sm text-muted">Terminem uma partida para o placar começar.</p>
  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {teams.map(([t, n]) => <span key={t} className="card rounded-full px-3 py-1.5 text-sm">{TEAM_NAMES[t] ?? t} <b className="text-moon">{n}</b></span>)}
      </div>
      <ol className="mt-5 space-y-2">
        {rows.map(([name, r], i) => (
          <li key={name} className="card flex items-center gap-3 rounded-2xl p-2.5">
            <span className="w-5 text-center text-sm text-muted tabular-nums">{i + 1}</span>
            <Avatar name={name} size={34} />
            <span className="min-w-0 flex-1 truncate font-medium">{name}</span>
            <span className="text-sm text-muted tabular-nums">{r.wins}/{r.games} · {Math.round((r.wins / r.games) * 100)}%</span>
          </li>
        ))}
      </ol>
      <Btn kind="quiet" className="mt-5 w-full" onClick={() => confirm('Zerar o placar de todos?') && onReset()}>Zerar placar</Btn>
    </div>
  )
}
