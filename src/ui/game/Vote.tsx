import { useState } from 'react'
import { player, votesNeeded, voteTargets, voteWeight, type GameState, type Player } from '../../engine/game'
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
    <Screen lead={<LeadIcon name="scale" />} kicker={`Dia ${s.day}`} title="Votação aberta" hint={`Contem as mãos levantadas. Marque quem recebeu mais votos, se tiver pelo menos ${votesNeeded(s)} mãos.${s.revealed.some((id) => player(s, id).alive && voteWeight(s, id) > 1) ? ' A mão do Prefeito conta 2.' : ''}`}
      footer={<ConfirmBar kind="danger" disabled={t == null} label="Linchar" onConfirm={() => onLynch(t)}
        summary={t != null && <>Linchar <b className="text-lobos">{player(s, t).name}</b></>}
        secondary={<Btn kind="quiet" onClick={() => onLynch(null)}>Ninguém será linchado</Btn>} />}>
      <PlayerGrid players={s.players} selected={[t]} onSelect={setT} />
    </Screen>
  )
}

function SecretVote({ s, p, onVote }: { s: GameState; p: Player; onVote: Lynch }) {
  const [t, setT] = useState<number | null>(null)
  return (
    <Screen kicker={`Voto de ${p.name}`} title="Quem deve ser linchado?"
      hint={`Para linchar, são precisos ${votesNeeded(s)} votos. ${s.settings.voteReveal === 'nomes' ? 'No resultado, todos vão ver em quem cada um votou.' : 'Ninguém vai ver o seu voto, só o resultado final.'}${voteWeight(s, p.id) > 1 ? ' Seu voto de Prefeito vale 2.' : ''}`}
      footer={<ConfirmBar kind="danger" disabled={t == null} label="Votar" onConfirm={() => onVote(t)}
        summary={t != null && <>Votar em <b className="text-lobos">{player(s, t).name}</b></>}
        secondary={<Btn kind="quiet" onClick={() => onVote(null)}>Pular voto</Btn>} />}>
      <PlayerGrid players={s.players} selected={[t]} onSelect={setT} can={(o) => voteTargets(s, p.id).includes(o.id)} />
    </Screen>
  )
}
