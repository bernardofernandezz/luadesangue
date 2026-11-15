import { describe, expect, it } from 'vitest'
import { ackAnnounce, checkWin, confirmLynch, createGame, current, drawRoles, hunterShoot, noteText, openVote, revealNext, startVote, submitNight, submitVote, type GameState, type NightInput } from './game'
import { isWolf, type RoleId } from './roles'
import { defaultSettings, preset, type Settings } from './setup'

const settings: Settings = { ...defaultSettings, randomRoles: false, narration: false, defenseSeconds: 0 }
const names = (n: number) => Array.from({ length: n }, (_, i) => `P${i}`)

function setup(roles: RoleId[], extra: Partial<Settings> = {}): GameState {
  const ns = names(roles.length)
  let s = createGame({ names: ns, pool: roles, fixed: Object.fromEntries(ns.map((n, i) => [n, roles[i]])), settings: { ...settings, ...extra } }, 42)
  while (s.phase === 'reveal') s = revealNext(s)
  return s
}

function night(s: GameState, picks: Record<number, NightInput>): GameState {
  while (s.phase === 'night') s = submitNight(s, picks[current(s).id] ?? {})
  return s
}

const dead = (s: GameState) => s.players.filter((p) => !p.alive).map((p) => p.id)

describe('noite', () => {
  it('lobos matam o alvo', () => {
    const s = night(setup(['lobisomem', 'aldeao', 'aldeao', 'aldeao']), { 0: { target: 1 } })
    expect(dead(s)).toEqual([1])
    expect(s.phase).toBe('announce')
  })

  it('médico salva o alvo', () => {
    const s = night(setup(['lobisomem', 'medico', 'aldeao', 'aldeao']), { 0: { target: 2 }, 1: { target: 2 } })
    expect(dead(s)).toEqual([])
  })

  it('guarda-costas morre no lugar', () => {
    const s = night(setup(['lobisomem', 'guarda_costas', 'aldeao', 'aldeao']), { 0: { target: 2 }, 1: { target: 2 } })
    expect(dead(s)).toEqual([1])
  })

  it('lâmina de prata mata um lobo e salva o portador', () => {
    let s = night(setup(['lobisomem', 'ferreiro', 'aldeao', 'aldeao', 'aldeao']), { 1: { target: 2 } })
    s = ackAnnounce(s); s = startVote(s)
    s = openVote(s, null); s = ackAnnounce(s)
    s = night(s, { 0: { target: 2 } })
    expect(dead(s)).toEqual([0])
    expect(checkWin(s)?.title).toContain('Vila')
  })

  it('bruxa usa cada poção uma vez só', () => {
    let s = night(setup(['lobisomem', 'bruxa', 'aldeao', 'aldeao', 'aldeao', 'aldeao']), { 0: { target: 2 }, 1: { target: 2, target2: 3 } })
    expect(dead(s)).toEqual([3])
    s = ackAnnounce(s); s = startVote(s); s = openVote(s, null); s = ackAnnounce(s)
    s = night(s, { 0: { target: 2 }, 1: { target: 2, target2: 4 } })
    expect(dead(s).sort()).toEqual([2, 3])
  })

  it('amantes morrem juntos', () => {
    const s = night(setup(['lobisomem', 'cupido', 'aldeao', 'aldeao', 'aldeao']), { 0: { target: 2 }, 1: { target: 2, target2: 3 } })
    expect(dead(s).sort()).toEqual([2, 3])
  })

  it('herdeiro herda o papel do mentor', () => {
    const s = night(setup(['lobisomem', 'herdeiro', 'vidente', 'aldeao', 'aldeao']), { 0: { target: 2 }, 1: { target: 2 } })
    expect(s.players[1].role).toBe('vidente')
    expect(s.inbox[1][0]).toContain('Vidente')
  })

  it('rastreador vê quem o alvo visitou', () => {
    const s = night(setup(['lobisomem', 'rastreador', 'aldeao', 'aldeao', 'aldeao']), { 0: { target: 3 }, 1: { target: 0 } })
    expect(s.inbox[1][0]).toContain('P3')
  })

  it('lobo uivante cancela a votação', () => {
    let s = night(setup(['lobo_uivante', 'aldeao', 'aldeao', 'aldeao', 'aldeao']), { 0: { target: 1, use: true } })
    s = ackAnnounce(s); s = startVote(s)
    expect(s.phase).toBe('announce')
    s = ackAnnounce(s)
    expect(s.phase).toBe('night')
  })

  it('farol revela as ações', () => {
    const s = night(setup(['lobisomem', 'faroleiro', 'medico', 'aldeao', 'aldeao']), { 0: { target: 3 }, 1: { use: true }, 2: { target: 4 } })
    expect(s.announcements.map((n) => noteText(s, n)).join('\n')).toContain('P4 foi protegido')
  })
})

describe('dia e vitória', () => {
  it('caçador atira ao morrer', () => {
    let s = night(setup(['lobisomem', 'cacador', 'aldeao', 'aldeao', 'aldeao']), { 0: { target: 1 } })
    s = ackAnnounce(s)
    expect(s.phase).toBe('hunter')
    s = hunterShoot(s, 0); s = ackAnnounce(s)
    expect(s.winner?.title).toContain('Vila')
  })

  it('prefeito vale dois votos', () => {
    let s = night(setup(['lobisomem', 'prefeito', 'aldeao', 'aldeao', 'aldeao', 'aldeao']), {})
    s = ackAnnounce(s); s = startVote(s)
    const votes: Record<number, number> = { 0: 2, 1: 0, 2: 3, 3: 2, 4: 0, 5: 3 }
    while (s.phase === 'vote') s = submitVote(s, votes[current(s).id])
    expect(dead(s)).toEqual([0])
  })

  it('empate não lincha ninguém', () => {
    let s = night(setup(['lobisomem', 'aldeao', 'aldeao', 'aldeao']), {})
    s = ackAnnounce(s); s = startVote(s)
    const votes: Record<number, number> = { 0: 1, 1: 0, 2: 1, 3: 0 }
    while (s.phase === 'vote') s = submitVote(s, votes[current(s).id])
    expect(dead(s)).toEqual([])
  })

  it('tolo vence se linchado', () => {
    let s = night(setup(['lobisomem', 'tolo', 'aldeao', 'aldeao', 'aldeao']), {})
    s = ackAnnounce(s); s = startVote(s); s = openVote(s, 1); s = ackAnnounce(s)
    expect(s.winner?.title).toContain('Tolo')
  })

  it('lobos vencem com paridade', () => {
    const s = night(setup(['lobisomem', 'lobo_alfa', 'aldeao', 'aldeao', 'aldeao']), { 0: { target: 2 }, 1: { target: 2 } })
    expect(checkWin(s)?.title).toContain('Lobos')
  })

  it('preset tem o tamanho certo e pelo menos um lobo', () => {
    for (let n = 4; n <= 20; n++) {
      const p = preset(n)
      expect(p).toHaveLength(n)
      expect(p.some(isWolf)).toBe(true)
    }
  })

  it('empate com sorteio lincha um dos empatados', () => {
    let s = night(setup(['lobisomem', 'aldeao', 'aldeao', 'aldeao'], { tie: 'sorteio' }), {})
    s = ackAnnounce(s); s = startVote(s)
    const votes: Record<number, number> = { 0: 1, 1: 0, 2: 1, 3: 0 }
    while (s.phase === 'vote') s = submitVote(s, votes[current(s).id])
    expect(dead(s)).toHaveLength(1)
    expect([0, 1]).toContain(dead(s)[0])
  })
})

describe('modos e consistência', () => {
  it('sorteia papéis quando há mais papéis que jogadores', () => {
    const pool: RoleId[] = ['lobisomem', 'lobo_alfa', 'lobo_sombra', 'lobo_uivante', 'vidente', 'medico', 'bruxa', 'cacador', 'tolo', 'assassino', 'prefeito']
    for (let seed = 1; seed <= 30; seed++) {
      const g = createGame({ names: names(6), pool, fixed: {}, settings: { ...settings, randomRoles: true } }, seed)
      const roles = g.players.map((p) => p.role)
      expect(roles).toHaveLength(6)
      expect(new Set(roles).size).toBe(6)
      const w = roles.filter(isWolf).length
      expect(w).toBeGreaterThanOrEqual(1)
      expect(w).toBeLessThanOrEqual(2)
    }
    expect(drawRoles(['lobisomem', 'lobo_alfa', 'vidente'], 3).filter(isWolf)).toHaveLength(2)
  })

  it('modo cartas para depois da distribuição', () => {
    const s = setup(['lobisomem', 'aldeao', 'aldeao', 'aldeao'], { mode: 'cartas' })
    expect(s.phase).toBe('dealt')
  })

  it('recusa ações inválidas', () => {
    const wolfOnWolf = night(setup(['lobisomem', 'lobo_alfa', 'aldeao', 'aldeao', 'aldeao']), { 0: { target: 1 }, 1: { target: 1 } })
    expect(dead(wolfOnWolf)).toEqual([])
    expect(submitVote(wolfOnWolf, 2)).toBe(wolfOnWolf)

    let s = ackAnnounce(wolfOnWolf); s = startVote(s)
    const votes: Record<number, number> = { 0: 0, 1: 2, 2: 0, 3: 1, 4: 1 }
    while (s.phase === 'vote') s = submitVote(s, votes[current(s).id])
    expect(dead(s)).toEqual([1])
  })

  it('histórico público registra os anúncios', () => {
    let s = night(setup(['lobisomem', 'aldeao', 'aldeao', 'aldeao']), { 0: { target: 1 } })
    s = ackAnnounce(s)
    expect(s.timeline.map((t) => t.text).join()).toContain('P1')
  })
})

describe('defesa', () => {
  const toVote = (extra: Partial<Settings>) => {
    let s = night(setup(['lobisomem', 'aldeao', 'aldeao', 'aldeao', 'aldeao'], extra), {})
    s = ackAnnounce(s); return startVote(s)
  }

  it('o mais votado se defende e a vila confirma', () => {
    let s = toVote({ defenseSeconds: 45 })
    while (s.phase === 'vote') s = submitVote(s, current(s).id === 0 ? 1 : 0)
    expect(s.phase).toBe('defense')
    expect(s.accused).toBe(0)
    expect(dead(s)).toEqual([])
    s = confirmLynch(s, true)
    expect(dead(s)).toEqual([0])
    expect(s.phase).toBe('announce')
  })

  it('a vila pode poupar o acusado', () => {
    let s = toVote({ defenseSeconds: 45, voteMode: 'aberta' })
    s = openVote(s, 2)
    expect(s.phase).toBe('defense')
    s = confirmLynch(s, false)
    expect(dead(s)).toEqual([])
    expect(s.accused).toBeNull()
    expect(s.phase).toBe('announce')
  })

  it('sem defesa, lincha direto', () => {
    const s = openVote(toVote({ defenseSeconds: 0 }), 2)
    expect(dead(s)).toEqual([2])
  })
})

describe('papéis novos', () => {
  it('Lobo Farejador descobre o papel de quem escolheu', () => {
    const s = night(setup(['lobo_farejador', 'vidente', 'aldeao', 'aldeao', 'aldeao']), { 0: { target: 1 } })
    expect(s.inbox[0]?.[0]).toContain('P1 é Vidente')
  })

  it('o fósforo queima todos os encharcados, mesmo protegidos', () => {
    const roles: RoleId[] = ['incendiario', 'medico', 'aldeao', 'aldeao', 'lobisomem', 'aldeao']
    let s = night(setup(roles), { 0: { target: 2 }, 4: { target: 5 } })
    s = ackAnnounce(s); s = startVote(s); s = openVote(s, null); s = ackAnnounce(s)
    s = night(s, { 0: { target: 3, use: true }, 1: { target: 3 } })
    expect(dead(s).sort()).toEqual([2, 3, 5])
    expect(s.doused).toEqual([])
  })

  it('o Incendiário vence quando sobram dois', () => {
    const s = setup(['incendiario', 'aldeao', 'aldeao', 'lobisomem'])
    s.players[2].alive = false
    s.players[3].alive = false
    expect(checkWin(s)?.title).toBe('O Incendiário venceu')
  })
})
