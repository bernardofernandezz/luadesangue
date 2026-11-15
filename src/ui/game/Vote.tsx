import { useState } from 'react'
import { player, voteTargets, voteWeight, type GameState, type Player } from '../../engine/game'
import { Btn } from '../kit/controls'
import { ConfirmBar, LeadIcon, Screen } from '../kit/layout'
import { PassTo } from './PassTo'
import { PlayerGrid } from '../players/PlayerGrid'

type Lynch = (target: number | null) => void

export function Vote({ s, onSecret, onOpen }: { s: GameState; onSecret: Lynch; onOpen: Lynch }) {
  return s.settings.voteMode === 'aberta'
    ? <OpenVote s={s} onLynch={onOpen} />
    : <PassTo s={s} why="Votação secreta">{(p) => <SecretVote s={s} p={p} onVote={onSecret} />}</PassTo>
}

function OpenVote({ s, onLynch }: { s: GameState; onLynch: Lynch }) {
  const [t, setT] = useState<number | null>(null)
  return (
    <Screen lead={<LeadIcon name="scale" />} kicker={`Dia ${s.day}`} title="Votação aberta" hint="Contem as mãos levantadas. Marque quem recebeu mais votos."
      footer={<ConfirmBar kind="danger" disabled={t == null} label="Linchar" onConfirm={() => onLynch(t)}
        summary={t != null && <>Linchar <b className="text-lobos">{player(s, t).name}</b></>}
        secondary={<Btn kind="quiet" onClick={() => onLynch(null)}>Ninguém será linchado</Btn>} />}>
      <PlayerGrid players={s.players} selected={[t]} onSelect={setT} />
    </Screen>
  )
}

function SecretVote({ s, p, onVote }: { s: GameState; p: Player; onVote: Lynch }) {
  const [t, setT] = useState<number | null>(null)
  const weight = voteWeight(s, p.id)
  return (
    <Screen kicker={`Voto de ${p.name}`} title="Quem deve ser linchado?"
      hint={weight > 1 ? `Seu voto vale por ${weight}.` : 'Ninguém vai ver o seu voto, só o resultado final.'}
      footer={<ConfirmBar kind="danger" disabled={t == null} label="Votar" onConfirm={() => onVote(t)}
        summary={t != null && <>Votar em <b className="text-lobos">{player(s, t).name}</b></>}
        secondary={<Btn kind="quiet" onClick={() => onVote(null)}>Pular voto</Btn>} />}>
      <PlayerGrid players={s.players} selected={[t]} onSelect={setT} can={(o) => voteTargets(s, p.id).includes(o.id)} />
    </Screen>
  )
}
