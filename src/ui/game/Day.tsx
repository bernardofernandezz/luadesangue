import { alive, type GameState } from '../../engine/game'
import { Btn } from '../kit/controls'
import { Avatar } from '../players/Avatar'
import { TimerRing, useCountdown } from '../kit/Timer'
import { Screen } from '../kit/layout'
import { PlayerGrid } from '../players/PlayerGrid'
import { RoleBadge } from '../roles/RoleViews'

export function Day({ s, onVote, onTick }: { s: GameState; onVote: () => void; onTick?: (left: number | undefined) => void }) {
  const total = s.settings.discussionSeconds
  const [left, setLeft] = useCountdown(total, onTick)
  const dead = s.players.filter((p) => !p.alive)
  return (
    <Screen kicker={`Dia ${s.day}`} title="Discussão" hint="Conversem, acusem e se defendam. Quando o tempo acabar, todos votam."
      footer={<Btn kind={left > 0 ? 'ghost' : 'danger'} icon="scale" onClick={onVote}>{left > 0 ? 'Ir para a votação' : 'Hora de votar'}</Btn>}>
      <TimerRing left={left} total={total} />
      <div className="mt-4 flex justify-center gap-2">
        <Btn kind="ghost" size="sm" onClick={() => setLeft(left + 30)}>+30s</Btn>
        <Btn kind="ghost" size="sm" onClick={() => setLeft(0)}>Encerrar</Btn>
      </div>
      <h3 className="mt-8 mb-3 eyebrow text-muted">Vivos · {alive(s).length}</h3>
      <PlayerGrid players={alive(s)} />
      {dead.length > 0 && (
        <>
          <h3 className="mt-6 mb-3 eyebrow text-muted">Mortos · {dead.length}</h3>
          <div className="no-scrollbar -mx-5 flex gap-2 overflow-x-auto px-5">
            {dead.map((p) => (
              <div key={p.id} className="flex shrink-0 items-center gap-2 rounded-full card py-1.5 pr-3 pl-1.5">
                {s.settings.revealOnDeath ? <RoleBadge role={p.role} size={28} /> : <Avatar name={p.name} size={28} dim />}
                <span className="text-sm text-muted line-through decoration-muted/40">{p.name}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </Screen>
  )
}
