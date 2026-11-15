import { describe, expect, it } from 'vitest'
import type { GameState } from '../engine/game'
import { addResult, emptyStats } from './stats'

const game = (startedAt: number) => ({
  startedAt,
  players: [{ id: 0, name: 'Ana' }, { id: 1, name: 'Bia' }],
  winner: { title: 'A Vila venceu', team: 'vila', ids: [0] },
}) as unknown as GameState

describe('placar', () => {
  it('soma partidas, vitórias e time', () => {
    const s = addResult(emptyStats, game(1))
    expect(s.players).toEqual({ Ana: { games: 1, wins: 1 }, Bia: { games: 1, wins: 0 } })
    expect(s.teams).toEqual({ vila: 1 })
  })

  it('não conta a mesma partida duas vezes', () => {
    const once = addResult(emptyStats, game(1))
    expect(addResult(once, game(1))).toBe(once)
    expect(addResult(once, game(2)).players.Ana).toEqual({ games: 2, wins: 2 })
  })
})
