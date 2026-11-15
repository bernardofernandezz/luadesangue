import type { GameState } from '../engine/game'

export interface Stats {
  players: Record<string, { games: number; wins: number }>
  teams: Record<string, number>
  /** `startedAt` of games already counted, so undoing past the end and finishing again counts once. */
  counted: number[]
}

export const emptyStats: Stats = { players: {}, teams: {}, counted: [] }

export function addResult(stats: Stats, g: GameState): Stats {
  if (!g.winner || stats.counted.includes(g.startedAt)) return stats
  const players = { ...stats.players }
  for (const p of g.players) {
    const cur = players[p.name] ?? { games: 0, wins: 0 }
    players[p.name] = { games: cur.games + 1, wins: cur.wins + Number(g.winner.ids.includes(p.id)) }
  }
  const teams = { ...stats.teams, [g.winner.team]: (stats.teams[g.winner.team] ?? 0) + 1 }
  return { players, teams, counted: [...stats.counted.slice(-49), g.startedAt] }
}
