import { describe, expect, it } from 'vitest'
import { ackAnnounce, auraOf, checkWin, confirmLynch, continueDealt, dayPower, dayPowerOf, investigate, nightAction, peekAt, sameTeam, createGame, current, drawRoles, hunterShoot, noteText, openVote, revealNext, startVote, submitNight, submitVote, type GameState, type NightInput } from './game'
import { isWolf, type RoleId } from './roles'
import { defaultSettings, preset, type Settings } from './setup'

// Older tests pin the original vote rules; the classic defaults are covered on their own.
const settings: Settings = { ...defaultSettings, randomRoles: false, narration: false, defenseSeconds: 0, voteReveal: 'contagem' }
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

  it('guarda-costas leva o ataque no lugar', () => {
    const s = night(setup(['lobisomem', 'guarda_costas', 'aldeao', 'aldeao']), { 0: { target: 2 }, 1: { target: 2 } })
    expect(dead(s)).toEqual([])
    expect(s.inbox[1]?.[0]).toContain('no lugar de P2')
  })

  it('lâmina de prata mata um lobo e salva o portador', () => {
    let s = night(setup(['lobisomem', 'ferreiro', 'aldeao', 'aldeao', 'aldeao']), { 1: { target: 2 } })
    s = ackAnnounce(s); s = startVote(s)
    s = openVote(s, null); s = ackAnnounce(s)
    s = night(s, { 0: { target: 2 } })
    expect(dead(s)).toEqual([0])
    expect(checkWin(s)?.title).toContain('Vila')
  })

  it('bruxa usa cada poção uma vez só, e não envenena na 1ª noite', () => {
    let s = night(setup(['lobisomem', 'bruxa', 'aldeao', 'aldeao', 'aldeao', 'aldeao', 'aldeao']), { 0: { target: 2 }, 1: { target: 2, target2: 3 } })
    expect(dead(s)).toEqual([]) // cure saved P2, poison ignored on night 1
    s = ackAnnounce(s); s = startVote(s); s = openVote(s, null); s = ackAnnounce(s)
    s = night(s, { 0: { target: 2 }, 1: { target: 2, target2: 3 } })
    expect(dead(s).sort()).toEqual([2, 3])
    s = ackAnnounce(s); s = startVote(s); s = openVote(s, null); s = ackAnnounce(s)
    expect(nightAction(s, 1)).toMatchObject({ kind: 'idle', why: 'spent' })
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

  it('prefeito revelado vota por dois pelo resto do jogo', () => {
    const votes: Record<number, number> = { 0: 2, 1: 0, 2: 3, 3: 2, 4: 0, 5: 3, 6: 5 }
    let s = ackAnnounce(night(setup(['lobisomem', 'prefeito', 'aldeao', 'aldeao', 'aldeao', 'aldeao', 'aldeao']), {}))
    expect(dayPower(s, 2)).toBe(s) // not the Prefeito: nothing happens
    s = ackAnnounce(dayPower(s, 1))
    expect(s.phase).toBe('day')
    expect(dayPowerOf(s, 1)).toBeNull()
    s = startVote(s)
    while (s.phase === 'vote') s = submitVote(s, votes[current(s).id])
    expect(dead(s)).toEqual([0])
    s = ackAnnounce(night(setup(['lobisomem', 'prefeito', 'aldeao', 'aldeao', 'aldeao', 'aldeao', 'aldeao']), {}))
    s = startVote(s)
    while (s.phase === 'vote') s = submitVote(s, votes[current(s).id])
    expect(dead(s)).toEqual([]) // unrevealed it's a three-way tie
  })

  const voteWith = (extra: Partial<Settings>, votes: Record<number, number | null>) => {
    let s = night(setup(['lobisomem', 'aldeao', 'aldeao', 'aldeao', 'aldeao'], extra), {})
    s = ackAnnounce(s); s = startVote(s)
    while (s.phase === 'vote') s = submitVote(s, votes[current(s).id] ?? null)
    return s
  }

  it('linchar precisa de votos de metade dos vivos', () => {
    const one = voteWith({}, { 0: 1 })
    expect(dead(one)).toEqual([])
    expect(one.announcements.some((n) => n.kind === 'info' && n.text.includes('eram precisos 2'))).toBe(true)
    expect(dead(voteWith({}, { 0: 1, 2: 1 }))).toEqual([1])
    expect(dead(voteWith({}, {}))).toEqual([])
  })

  it('resultado da votação: nada, contagem ou nomes', () => {
    const tallies = (s: GameState) => s.announcements.filter((n) => n.kind === 'tally')
    expect(tallies(voteWith({ voteReveal: 'nada' }, { 0: 1, 2: 1, 3: 1 }))).toEqual([])
    expect(tallies(voteWith({ voteReveal: 'contagem' }, { 0: 1, 2: 1, 3: 1 }))[0]).toMatchObject({ id: 1, votes: 3, voters: undefined })
    const named = voteWith({ voteReveal: 'nomes' }, { 0: 1, 2: 1, 3: 1 })
    expect(noteText(named, tallies(named)[0])).toBe('P1: 3 votos (P0, P2, P3)')
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
    expect(s.winner?.title).toContain('Bobo')
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
    const go = continueDealt(s)
    expect([go.phase, go.day, go.settings.mode]).toEqual(['night', 1, 'humano'])
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
    s = night(s, { 0: { target: 3 }, 1: { target: 3 } })
    s = ackAnnounce(s); s = startVote(s); s = openVote(s, null); s = ackAnnounce(s)
    s = night(s, { 0: { use: true }, 1: { target: 3 } })
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

describe('vidente', () => {
  it('vê o papel exato, e o Lobo Sombra como Aldeão', () => {
    const s = setup(['vidente', 'lobisomem', 'bruxa', 'tolo', 'lobo_sombra'])
    expect(investigate(s, 1)).toBe('lobisomem')
    expect(investigate(s, 2)).toBe('bruxa')
    expect(investigate(s, 3)).toBe('tolo')
    expect(investigate(s, 4)).toBe('aldeao')
  })
})

describe('papéis clássicos', () => {
  it('atirador: não atira no 1º dia, 1 tiro por dia, 2 balas, e se revela', () => {
    const toNextDay = (g: GameState) => { g = startVote(g); g = openVote(g, null); g = ackAnnounce(g); return ackAnnounce(night(g, {})) }
    let s = ackAnnounce(night(setup(['lobisomem', 'atirador', 'aldeao', 'aldeao', 'aldeao', 'aldeao', 'aldeao', 'aldeao', 'aldeao']), {}))
    expect(dayPowerOf(s, 1)).toBeNull() // day 1
    s = toNextDay(s)
    expect(dayPower(s, 1, 1)).toBe(s) // can't shoot himself
    s = dayPower(s, 1, 3)
    expect(dead(s)).toEqual([3])
    expect(noteText(s, s.announcements[0])).toContain('P1, o Atirador')
    s = ackAnnounce(s)
    expect(dayPowerOf(s, 1)).toBeNull() // once per day
    s = ackAnnounce(dayPower(toNextDay(s), 1, 4))
    expect(dead(s)).toEqual([3, 4])
    expect(dayPowerOf(toNextDay(s), 1)).toBeNull() // out of bullets
  })

  it('detetive compara times (Lobo Sombra passa por Vila)', () => {
    const s = setup(['detetive', 'lobisomem', 'aldeao', 'lobo_sombra', 'tolo'])
    expect(sameTeam(s, 1, 2)).toBe(false)
    expect(sameTeam(s, 2, 3)).toBe(true)
    expect(sameTeam(s, 2, 4)).toBe(false)
  })

  it('médium só age com mortos e vê o papel real', () => {
    let s = setup(['lobisomem', 'medium', 'aldeao', 'lobo_sombra', 'aldeao', 'aldeao', 'aldeao'])
    expect(nightAction(s, 1)).toMatchObject({ kind: 'idle' })
    s = ackAnnounce(night(s, { 0: { target: 2 }, 3: { target: 2 } }))
    s = startVote(s); s = openVote(s, 3); s = ackAnnounce(s)
    expect(nightAction(s, 1)).toMatchObject({ kind: 'pick', targets: [2, 3] })
    expect(peekAt(s, 1, 3)).toBe('lobo_sombra')
  })

  it('lobo vidente não ataca, a não ser que seja o último lobo', () => {
    let s = setup(['lobisomem', 'lobo_vidente', 'aldeao', 'aldeao', 'aldeao', 'aldeao', 'aldeao'])
    expect(nightAction(s, 1)).toMatchObject({ kind: 'pick', peek: true })
    s = night(s, { 0: { target: 2 }, 1: { target: 3 } })
    expect(dead(s)).toEqual([2])
    s = ackAnnounce(s); s = startVote(s); s = openVote(s, 0); s = ackAnnounce(s)
    expect(nightAction(s, 1)).not.toHaveProperty('peek')
    s = night(s, { 1: { target: 4 } })
    expect(dead(s).sort()).toEqual([0, 2, 4])
  })

  it('lobo júnior leva alguém junto', () => {
    let s = night(setup(['lobo_junior', 'lobisomem', 'aldeao', 'aldeao', 'aldeao', 'aldeao']), {})
    s = ackAnnounce(s); s = startVote(s); s = openVote(s, 0)
    s = ackAnnounce(s)
    expect(s.phase).toBe('hunter')
    s = hunterShoot(s, 2)
    expect(dead(s).sort()).toEqual([0, 2])
  })
})

describe('regras do clássico', () => {
  const next = (s: GameState) => { s = ackAnnounce(s); s = startVote(s); s = openVote(s, null); return ackAnnounce(s) }

  it('médico não se protege', () => {
    const s = setup(['lobisomem', 'medico', 'aldeao', 'aldeao'])
    expect(nightAction(s, 1)).toMatchObject({ kind: 'pick', targets: [0, 2, 3] })
  })

  it('guarda-costas aguenta o primeiro ataque e morre no segundo', () => {
    let s = night(setup(['lobisomem', 'guarda_costas', 'aldeao', 'aldeao', 'aldeao', 'aldeao']), { 0: { target: 2 }, 1: { target: 2 } })
    expect(dead(s)).toEqual([])
    s = night(next(s), { 0: { target: 1 } })
    expect(dead(s)).toEqual([1])
  })

  it('a cura da bruxa só é gasta quando salva alguém', () => {
    let s = night(setup(['lobisomem', 'bruxa', 'aldeao', 'aldeao', 'aldeao', 'aldeao']), { 0: { target: 3 }, 1: { target: 2 } })
    expect(dead(s)).toEqual([3])
    s = next(s)
    expect(nightAction(s, 1)).toMatchObject({ kind: 'potions', cure: [0, 1, 2, 4, 5] })
    s = night(s, { 0: { target: 2 }, 1: { target: 2 } })
    expect(dead(s)).toEqual([3])
    expect(s.inbox[1]?.[0]).toContain('salvou P2')
    expect(nightAction(next(s), 1)).toMatchObject({ cure: null })
  })

  it('voto do lobo alfa vale dois na matilha', () => {
    const s = night(setup(['lobo_alfa', 'lobisomem', 'aldeao', 'aldeao', 'aldeao', 'aldeao', 'aldeao']), { 0: { target: 2 }, 1: { target: 3 } })
    expect(dead(s)).toEqual([2])
  })

  it('assassino em série resiste aos lobos', () => {
    const s = night(setup(['lobisomem', 'assassino', 'aldeao', 'aldeao', 'aldeao']), { 0: { target: 1 } })
    expect(dead(s)).toEqual([])
  })

  it('incendiário encharca dois por noite e risca o fósforo quantas vezes quiser', () => {
    let s = night(setup(['incendiario', 'lobisomem', 'aldeao', 'aldeao', 'aldeao', 'aldeao', 'aldeao', 'aldeao']), { 0: { target: 2, target2: 3 } })
    expect(s.doused).toEqual([2, 3])
    s = night(next(s), { 0: { use: true, target: 4 } })
    expect(dead(s)).toEqual([2, 3])
    expect(s.doused).toEqual([])
    s = night(next(s), { 0: { target: 4 } })
    s = night(next(s), { 0: { use: true } })
    expect(dead(s)).toEqual([2, 3, 4])
  })

  it('médium só ressuscita alguém da Vila', () => {
    let s = night(setup(['lobisomem', 'medium', 'aldeao', 'tolo', 'aldeao', 'aldeao', 'aldeao']), { 0: { target: 3 } })
    expect(nightAction(next(s), 1)).toMatchObject({ powerTargets: [] })
    s = night(next(s), { 1: { target: 3, use: true } })
    expect(dead(s)).toEqual([3])
  })

  it('lobo vidente pode renunciar e passa a atacar na noite seguinte', () => {
    let s = night(setup(['lobisomem', 'lobo_vidente', 'aldeao', 'aldeao', 'aldeao', 'aldeao', 'aldeao']), { 0: { target: 2 }, 1: { target: 3, use: true } })
    expect(dead(s)).toEqual([2])
    expect(s.inbox[0]?.[0]).toContain('renunciou')
    s = next(s)
    expect(nightAction(s, 1)).not.toHaveProperty('peek')
  })

  it('médium ressuscita uma vez', () => {
    let s = night(setup(['lobisomem', 'medium', 'aldeao', 'aldeao', 'aldeao', 'aldeao']), { 0: { target: 2 } })
    s = night(next(s), { 1: { target: 2, use: true } })
    expect(dead(s)).toEqual([])
    expect(nightAction(next(s), 1)).toMatchObject({ kind: 'idle' })
  })

  it('amantes sabem o papel um do outro', () => {
    const s = night(setup(['lobisomem', 'cupido', 'vidente', 'aldeao', 'aldeao']), { 1: { target: 0, target2: 2 } })
    expect(s.inbox[2]?.[0]).toContain('Lobisomem')
  })

  it('padrão do clássico: os votos mostram nomes', () => {
    expect(defaultSettings).toMatchObject({ voteReveal: 'nomes' })
  })
})

describe('cargos do Wolvesville', () => {
  const toDay = (s: GameState) => ackAnnounce(s)

  it('vingador leva junto quem marcou', () => {
    const s = night(setup(['lobisomem', 'vingador', 'aldeao', 'aldeao', 'aldeao', 'aldeao']), { 0: { target: 1 }, 1: { target: 0 } })
    expect(dead(s).sort()).toEqual([0, 1])
  })

  it('vingador sem nova escolha mantém a marca', () => {
    let s = night(setup(['lobisomem', 'vingador', 'aldeao', 'aldeao', 'aldeao', 'aldeao']), { 0: { target: 2 }, 1: { target: 0 } })
    s = ackAnnounce(openVote(startVote(toDay(s)), null))
    expect(nightAction(s, 1)).toMatchObject({ note: 'Sua marca atual: P0' })
    s = night(s, { 0: { target: 1 } })
    expect(dead(s).sort()).toEqual([0, 1, 2])
  })

  it('sacerdote queima lobo ou morre se errar', () => {
    const base = toDay(night(setup(['lobisomem', 'sacerdote', 'aldeao', 'aldeao', 'aldeao', 'aldeao']), {}))
    expect(dayPowerOf(base, 1)).toBe('sacerdote')
    expect(dead(dayPower(base, 1, 0))).toEqual([0])
    const miss = dayPower(base, 1, 2)
    expect(dead(miss)).toEqual([1])
    expect(dayPowerOf(ackAnnounce(dayPower(base, 1, 2)), 1)).toBeNull()
  })

  it('vidente da aura vê boa, má ou desconhecida', () => {
    const s = setup(['lobisomem', 'vidente_aura', 'aldeao', 'tolo', 'lobo_sombra'])
    expect([auraOf(s, 0), auraOf(s, 2), auraOf(s, 3), auraOf(s, 4)]).toEqual(['ma', 'boa', 'desconhecida', 'boa'])
    expect(nightAction(s, 1)).toMatchObject({ kind: 'pick', peek: true, aura: true })
  })

  it('dama de vermelho escapa fora de casa e morre na casa do lobo', () => {
    expect(dead(night(setup(['lobisomem', 'dama_vermelho', 'aldeao', 'aldeao', 'aldeao']), { 0: { target: 1 }, 1: { target: 2 } }))).toEqual([])
    expect(dead(night(setup(['lobisomem', 'dama_vermelho', 'aldeao', 'aldeao', 'aldeao']), { 0: { target: 2 }, 1: { target: 0 } })).sort()).toEqual([1, 2])
    expect(dead(night(setup(['lobisomem', 'dama_vermelho', 'aldeao', 'aldeao', 'aldeao']), { 0: { target: 2 }, 1: { target: 2 } })).sort()).toEqual([1, 2])
  })

  it('amaldiçoado vira lobo quando mordido', () => {
    const s = night(setup(['lobisomem', 'amaldicoado', 'aldeao', 'aldeao', 'aldeao', 'aldeao']), { 0: { target: 1 } })
    expect(dead(s)).toEqual([])
    expect(s.players[1].role).toBe('lobisomem')
    expect(s.inbox[0]?.[0]).toContain('virou lobo')
  })

  it('caçador de cabeças vence se o alvo for linchado', () => {
    let s = setup(['lobisomem', 'cacador_cabecas', 'aldeao', 'aldeao', 'aldeao'])
    const target = s.bounty[1]
    expect(s.players[target].role).toBe('aldeao')
    s = startVote(toDay(night(s, {})))
    s = ackAnnounce(openVote(s, target))
    expect(s.phase).toBe('end')
    expect(s.winner).toMatchObject({ team: 'solo', ids: [1] })
  })

  it('caçador de cabeças vira aldeão se o alvo morrer à noite', () => {
    const s0 = setup(['lobisomem', 'cacador_cabecas', 'aldeao', 'aldeao', 'aldeao'])
    const s = night(s0, { 0: { target: s0.bounty[1] } })
    expect(s.players[1].role).toBe('aldeao')
  })
})

