import { noteText, player, type GameState } from '../../engine/game'
import { Btn } from '../kit/controls'
import { Screen } from '../kit/layout'
import { TimerRing, useCountdown } from '../kit/Timer'
import { Avatar } from '../players/Avatar'

/** The most-voted player defends; then a show of hands confirms or spares them. */
export function Defense({ s, onDecide, onTick }: { s: GameState; onDecide: (lynch: boolean) => void; onTick?: (left: number | undefined) => void }) {
  const total = s.settings.defenseSeconds
  const [left, setLeft] = useCountdown(total, onTick)
  const p = player(s, s.accused!)
  const tallies = s.announcements.filter((n) => n.kind === 'tally')
  return (
    <Screen kicker={`Dia ${s.day} · Defesa`} title={`${p.name} tem a palavra`}
      hint={left > 0 ? 'Todos em silêncio. Depois, levantem a mão quem ainda quer linchar.' : 'Tempo acabou. Levantem a mão quem quer linchar.'}
      footer={<>
        <Btn kind="danger" icon="scale" onClick={() => onDecide(true)}>Linchar {p.name}</Btn>
        <Btn kind="ghost" onClick={() => onDecide(false)}>Poupar</Btn>
      </>}>
      <div className="flex flex-col items-center">
        <Avatar name={p.name} size={88} />
        <div className="mt-6"><TimerRing left={left} total={total} size="size-40" /></div>
        {left > 0 && <Btn kind="ghost" size="sm" className="mt-4" onClick={() => setLeft(0)}>Encerrar defesa</Btn>}
      </div>
      {tallies.length > 0 && (
        <ul className="mt-8 space-y-1.5 text-center text-sm text-muted">
          {tallies.map((n, i) => <li key={i}>{noteText(s, n)}</li>)}
        </ul>
      )}
    </Screen>
  )
}
