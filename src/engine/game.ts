import { ROLES, isWolf, type RoleId } from './roles'

export interface Player { id: number; name: string; role: RoleId; alive: boolean }

export interface Settings {
  randomRoles: boolean
  revealOnDeath: boolean
  discussionSeconds: number
  voteMode: 'secreta' | 'aberta'
  narration: boolean
  /** narrador = the app runs the match; cartas = only deals roles, a human narrates. */
  mode: 'narrador' | 'cartas'
  tie: 'ninguem' | 'sorteio'
}

/** reveal → night → announce → (hunter) → day → vote → announce → night … → end */
export type Phase = 'reveal' | 'night' | 'announce' | 'hunter' | 'day' | 'vote' | 'end' | 'dealt'

/** One player's private night turn. Meaning of fields depends on the role (see resolveNight). */
export interface NightChoice { actor: number; target?: number | null; target2?: number | null; use?: boolean }

export type NoteIcon = 'peace' | 'lighthouse' | 'howl' | 'bow' | 'scale'
/** Public announcement, structured so the UI can render deaths and tallies richly. */
export type Note =
  | { kind: 'death'; id: number; cause: string; role: RoleId | null }
  | { kind: 'tally'; id: number | null; votes: number }
  | { kind: 'info'; icon: NoteIcon; text: string }

export interface LogEntry { day: number; text: string; kind: 'role' | 'action' | 'death' | 'vote' | 'win' }

export interface GameState {
  players: Player[]
  settings: Settings
  phase: Phase
  day: number
  /** Player ids taking a private turn in this phase (reveal / night / secret vote). */
  queue: number[]
  cursor: number
  choices: NightChoice[]
  votes: Record<number, number | null>
  /** One-time abilities already spent, as `${playerId}:${ability}`. */
  used: string[]
  lovers: number[]
  blade: number | null
  mentor: Record<number, number>
  items: number[]
  voteCancelled: boolean
  /** Private messages shown at the player's next turn. */
  inbox: Record<number, string[]>
  announcements: Note[]
  next: 'day' | 'night'
  hunterQueue: number[]
  log: LogEntry[]
  /** Public history (what was announced), safe to show mid-game. */
  timeline: { day: number; text: string }[]
  winner: { title: string; team: 'vila' | 'lobos' | 'solo' | 'amantes' | 'ninguem'; ids: number[] } | null
  seed: number
}

// mulberry32: deterministic so tests and undo are reproducible
function rand(s: GameState): number {
  let t = (s.seed = (s.seed + 0x6d2b79f5) | 0)
  t = Math.imul(t ^ (t >>> 15), t | 1)
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296
}

export const player = (s: GameState, id: number) => s.players.find((p) => p.id === id)!
export const alive = (s: GameState) => s.players.filter((p) => p.alive)
const name = (s: GameState, id: number) => player(s, id).name
/** Valid target: an existing, living player. */
const ok = (s: GameState, id: number | null | undefined): id is number => id != null && !!s.players[id]?.alive
const isUsed = (s: GameState, id: number, ability: string) => s.used.includes(`${id}:${ability}`)
export const canUse = (s: GameState, id: number, ability: string) => !isUsed(s, id, ability)
const spend = (s: GameState, id: number, ability: string) => s.used.push(`${id}:${ability}`)
const tell = (s: GameState, id: number, msg: string) => (s.inbox[id] ??= []).push(msg)
const log = (s: GameState, text: string, kind: LogEntry['kind'] = 'action') => s.log.push({ day: s.day, text, kind })
const info = (s: GameState, icon: NoteIcon, text: string) => s.announcements.push({ kind: 'info', icon, text })

/** Plain-text version of a note, for narration. */
export function noteText(s: GameState, n: Note): string {
  if (n.kind === 'info') return n.text
  if (n.kind === 'tally') return `${n.id == null ? 'Pular' : name(s, n.id)}: ${n.votes} voto${n.votes > 1 ? 's' : ''}`
  return `${name(s, n.id)} ${n.cause}.${n.role ? ` Era ${ROLES[n.role].name}.` : ''}`
}

export function createGame(names: string[], roles: RoleId[], settings: Settings, seed = Date.now()): GameState {
  if (roles.length < names.length || (!settings.randomRoles && roles.length !== names.length)) throw new Error('Número de papéis diferente do número de jogadores')
  const s: GameState = {
    players: [], settings, phase: 'reveal', day: 0, queue: [], cursor: 0, choices: [], votes: {}, used: [],
    lovers: [], blade: null, mentor: {}, items: [], voteCancelled: false, inbox: {}, announcements: [],
    next: 'day', hunterQueue: [], log: [], timeline: [], winner: null, seed,
  }
  const shuffle = <T,>(a: T[]) => {
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(rand(s) * (i + 1))
      ;[a[i], a[j]] = [a[j], a[i]]
    }
    return a
  }
  let pool = [...roles]
  if (settings.randomRoles) {
    if (pool.length > names.length) pool = drawRoles(shuffle(pool), names.length)
    shuffle(pool)
  }
  s.players = names.map((n, id) => ({ id, name: n, role: pool[id], alive: true }))
  s.queue = s.players.map((p) => p.id)
  for (const p of s.players) log(s, `${p.name} recebeu ${ROLES[p.role].name}.`, 'role')
  return s
}

/** Picks n of the (already shuffled) roles: 1 to ~n/4 wolves, the rest from the other roles. */
export function drawRoles(shuffled: RoleId[], n: number): RoleId[] {
  const wolves = shuffled.filter(isWolf)
  const others = shuffled.filter((r) => !isWolf(r))
  const w = Math.min(wolves.length, Math.max(1, Math.round(n / 4), n - others.length))
  return [...wolves.slice(0, w), ...others.slice(0, n - w)]
}

export function revealNext(prev: GameState): GameState {
  const s = structuredClone(prev)
  s.cursor++
  if (s.cursor >= s.queue.length) {
    if (s.settings.mode === 'cartas') s.phase = 'dealt'
    else startNight(s)
  }
  return s
}

function startNight(s: GameState) {
  s.day++
  s.phase = 'night'
  s.queue = alive(s).map((p) => p.id)
  s.cursor = 0
  s.choices = []
}

export const seerSees = (s: GameState, target: number) => {
  const r = player(s, target).role
  return isWolf(r) && r !== 'lobo_sombra'
}

export function submitNight(prev: GameState, choice: NightChoice): GameState {
  const s = structuredClone(prev)
  s.choices.push({ ...choice, target: ok(s, choice.target) ? choice.target : null, target2: ok(s, choice.target2) ? choice.target2 : null })
  delete s.inbox[choice.actor]
  s.cursor++
  if (s.cursor >= s.queue.length) resolveNight(s)
  return s
}

function packTarget(s: GameState, wolfChoices: NightChoice[]): number | null {
  const counts = new Map<number, number>()
  for (const c of wolfChoices) if (c.target != null) counts.set(c.target, (counts.get(c.target) ?? 0) + 1)
  if (!counts.size) return null
  const max = Math.max(...counts.values())
  const tied = [...counts].filter(([, n]) => n === max).map(([t]) => t)
  if (tied.length === 1) return tied[0]
  const alfa = wolfChoices.find((c) => player(s, c.actor).role === 'lobo_alfa')
  if (alfa?.target != null && tied.includes(alfa.target)) return alfa.target
  return tied[Math.floor(rand(s) * tied.length)]
}

function resolveNight(s: GameState) {
  s.announcements = []
  const roleOf = (id: number) => player(s, id).role
  const visits: { actor: number; target: number; what: string }[] = []
  const visit = (actor: number, target: number, what: string) => visits.push({ actor, target, what })
  const isAlive = (id: number) => player(s, id).alive
  let lighthouse = false

  for (const c of s.choices) {
    const r = roleOf(c.actor)
    if (r === 'cupido' && s.day === 1 && c.target != null && c.target2 != null && c.target !== c.target2) {
      s.lovers = [c.target, c.target2]
      tell(s, c.target, `Você se apaixonou por ${name(s, c.target2)}. Se um de vocês morrer, o outro morre junto. Se forem os dois últimos vivos, vocês vencem.`)
      tell(s, c.target2, `Você se apaixonou por ${name(s, c.target)}. Se um de vocês morrer, o outro morre junto. Se forem os dois últimos vivos, vocês vencem.`)
      visit(c.actor, c.target, 'foi flechado pelo Cupido'); visit(c.actor, c.target2, 'foi flechado pelo Cupido')
      log(s, `Cupido uniu ${name(s, c.target)} e ${name(s, c.target2)}.`)
    }
    if (r === 'herdeiro' && s.day === 1 && c.target != null && c.target !== c.actor) {
      s.mentor[c.actor] = c.target
      visit(c.actor, c.target, 'foi escolhido como mentor')
      log(s, `${name(s, c.actor)} (Herdeiro) escolheu ${name(s, c.target)} como mentor.`)
    }
    if (r === 'ferreiro' && c.target != null && canUse(s, c.actor, 'lamina')) {
      spend(s, c.actor, 'lamina')
      s.blade = c.target
      tell(s, c.target, 'Você recebeu uma lâmina de prata do Ferreiro. Se os lobos te atacarem, você sobrevive e um deles morre.')
      visit(c.actor, c.target, 'recebeu uma lâmina de prata')
      log(s, `${name(s, c.actor)} (Ferreiro) deu a lâmina para ${name(s, c.target)}.`)
    }
    if (r === 'mercador' && c.target != null && s.items.length < 3 && !s.items.includes(c.target) && c.target !== c.actor) {
      s.items.push(c.target)
      tell(s, c.target, 'Você recebeu um amuleto de um Mercador misterioso. Ele não tem poder, mas o Mercador torce para você sobreviver.')
      visit(c.actor, c.target, 'recebeu um amuleto')
      log(s, `${name(s, c.actor)} (Mercador) deu um amuleto para ${name(s, c.target)}.`)
    }
    if (r === 'faroleiro' && c.use && canUse(s, c.actor, 'farol')) {
      spend(s, c.actor, 'farol')
      lighthouse = true
      log(s, `${name(s, c.actor)} (Faroleiro) acendeu o farol.`)
    }
    if (r === 'lobo_uivante' && c.use && canUse(s, c.actor, 'uivo')) {
      spend(s, c.actor, 'uivo')
      s.voteCancelled = true
      log(s, `${name(s, c.actor)} (Lobo Uivante) uivou: amanhã não haverá votação.`)
    }
  }

  // Protections
  const shielded = new Set<number>()
  const guards = new Map<number, number>()
  for (const c of s.choices) {
    const r = roleOf(c.actor)
    if (r === 'medico' && c.target != null) {
      shielded.add(c.target); visit(c.actor, c.target, 'foi protegido')
      log(s, `${name(s, c.actor)} (Médico) protegeu ${name(s, c.target)}.`)
    }
    if (r === 'bruxa' && c.target != null && canUse(s, c.actor, 'cura')) {
      spend(s, c.actor, 'cura'); shielded.add(c.target); visit(c.actor, c.target, 'recebeu uma poção de cura')
      log(s, `${name(s, c.actor)} (Bruxa) usou a cura em ${name(s, c.target)}.`)
    }
    if (r === 'guarda_costas' && c.target != null && c.target !== c.actor) {
      guards.set(c.target, c.actor); visit(c.actor, c.target, 'foi guardado')
      log(s, `${name(s, c.actor)} (Guarda-costas) guardou ${name(s, c.target)}.`)
    }
  }

  // Attacks
  const deaths = new Map<number, string>()
  const NIGHT = 'foi encontrado(a) morto(a) ao amanhecer'
  const attack = (target: number, by: 'lobos' | 'assassino') => {
    if (!isAlive(target)) return
    if (by === 'lobos' && s.blade === target) {
      s.blade = null
      const wolves = alive(s).filter((p) => isWolf(p.role))
      const victim = wolves[Math.floor(rand(s) * wolves.length)]
      deaths.set(victim.id, 'foi morto(a) por uma lâmina de prata')
      log(s, `A lâmina de prata de ${name(s, target)} matou ${victim.name}.`)
      return
    }
    const guard = guards.get(target)
    if (guard != null && isAlive(guard)) {
      deaths.set(guard, NIGHT)
      log(s, `${name(s, guard)} morreu protegendo ${name(s, target)}.`)
      return
    }
    if (shielded.has(target)) { log(s, `${name(s, target)} foi atacado(a), mas estava protegido(a).`); return }
    deaths.set(target, NIGHT)
  }

  const wolfChoices = s.choices.filter((c) => isWolf(roleOf(c.actor)))
  const shadow = wolfChoices.find((c) => roleOf(c.actor) === 'lobo_sombra' && c.use && c.target != null && canUse(s, c.actor, 'sombra'))
  if (shadow) { spend(s, shadow.actor, 'sombra'); log(s, `${name(s, shadow.actor)} (Lobo Sombra) impôs o alvo da matilha.`) }
  const pack = shadow?.target ?? packTarget(s, wolfChoices)
  if (pack != null) {
    for (const c of wolfChoices) visit(c.actor, pack, 'foi atacado pela matilha')
    log(s, `A matilha atacou ${name(s, pack)}.`)
    attack(pack, 'lobos')
  }
  for (const c of s.choices) {
    const r = roleOf(c.actor)
    if (r === 'assassino' && c.target != null && c.target !== c.actor) {
      visit(c.actor, c.target, 'foi atacado por um assassino'); log(s, `${name(s, c.actor)} (Assassino) atacou ${name(s, c.target)}.`)
      attack(c.target, 'assassino')
    }
    if (r === 'bruxa' && c.target2 != null && canUse(s, c.actor, 'veneno')) {
      spend(s, c.actor, 'veneno'); visit(c.actor, c.target2, 'foi envenenado')
      log(s, `${name(s, c.actor)} (Bruxa) envenenou ${name(s, c.target2)}.`)
      if (isAlive(c.target2)) deaths.set(c.target2, NIGHT)
    }
    if (r === 'vidente' && c.target != null) visit(c.actor, c.target, 'foi investigado')
  }

  // Information roles (delivered at their next turn)
  for (const c of s.choices) {
    const r = roleOf(c.actor)
    if (r === 'rastreador' && c.target != null) {
      visit(c.actor, c.target, 'foi seguido')
      const seen = [...new Set(visits.filter((v) => v.actor === c.target && v.target !== c.target).map((v) => name(s, v.target)))]
      tell(s, c.actor, seen.length
        ? `Pegadas da noite ${s.day}: ${name(s, c.target)} foi até a casa de ${seen.join(', ')}.`
        : `Pegadas da noite ${s.day}: ${name(s, c.target)} não saiu de casa.`)
    }
    if (r === 'sonambulo') {
      const others = alive(s).filter((p) => p.id !== c.actor)
      const v = others[Math.floor(rand(s) * others.length)]
      if (!v) continue
      if (isWolf(v.role)) {
        tell(s, c.actor, `Você andou dormindo até a casa de ${v.name} e viu garras e pelos: ${v.name} é um lobo! Cuidado: ele também te viu.`)
        tell(s, v.id, `${name(s, c.actor)} entrou na sua casa dormindo e viu quem você realmente é.`)
      } else tell(s, c.actor, `Você andou dormindo até a casa de ${v.name}. Nada de estranho por lá.`)
      log(s, `${name(s, c.actor)} (Sonâmbulo) foi até ${v.name}.`)
    }
  }

  for (const [id, cause] of deaths) kill(s, id, cause)
  if (!s.announcements.length) info(s, 'peace', 'A noite foi tranquila. Ninguém morreu.')
  if (lighthouse) {
    info(s, 'lighthouse', 'O farol foi aceso! A vila viu tudo o que aconteceu esta noite:')
    for (const v of visits) info(s, 'lighthouse', `${name(s, v.target)} ${v.what}.`)
  }
  if (s.voteCancelled) info(s, 'howl', 'Um uivo ecoou pela vila. Hoje não haverá votação.')
  s.phase = 'announce'
  s.next = 'day'
}

function kill(s: GameState, id: number, cause: string) {
  const p = player(s, id)
  if (!p.alive) return
  p.alive = false
  s.announcements.push({ kind: 'death', id, cause, role: s.settings.revealOnDeath ? p.role : null })
  log(s, `${p.name} (${ROLES[p.role].name}) ${cause}.`, 'death')
  if (p.role === 'cacador') s.hunterQueue.push(id)
  for (const [heir, mentor] of Object.entries(s.mentor)) {
    const h = player(s, Number(heir))
    if (mentor !== id || !h.alive) continue
    h.role = p.role
    delete s.mentor[h.id]
    tell(s, h.id, `Seu mentor ${p.name} morreu. Agora você é ${ROLES[p.role].name}. Veja sua nova carta.`)
    log(s, `${h.name} herdou o papel ${ROLES[p.role].name}.`)
  }
  if (s.lovers.includes(id)) {
    const other = s.lovers.find((l) => l !== id)!
    kill(s, other, 'morreu de coração partido')
  }
}

export function checkWin(s: GameState): GameState['winner'] {
  const live = alive(s)
  let w: GameState['winner'] = null
  const wolves = live.filter((p) => isWolf(p.role))
  const killers = live.filter((p) => p.role === 'assassino')
  const teamIds = (pred: (p: Player) => boolean) => s.players.filter(pred).map((p) => p.id)
  if (!live.length) w = { title: 'Ninguém sobreviveu', team: 'ninguem', ids: [] }
  else if (s.lovers.length === 2 && live.length === 2 && s.lovers.every((l) => player(s, l).alive)) w = { title: 'Os amantes venceram', team: 'amantes', ids: [...s.lovers] }
  else if (killers.length && live.length <= 2) w = { title: 'O Assassino venceu', team: 'solo', ids: killers.map((p) => p.id) }
  else if (!wolves.length && !killers.length) w = { title: 'A Vila venceu', team: 'vila', ids: teamIds((p) => ROLES[p.role].team === 'vila') }
  else if (wolves.length && !killers.length && wolves.length >= live.length - wolves.length) w = { title: 'Os Lobos venceram', team: 'lobos', ids: teamIds((p) => isWolf(p.role)) }
  if (!w) return null
  return withMerchant(s, w)
}

function withMerchant(s: GameState, w: NonNullable<GameState['winner']>): NonNullable<GameState['winner']> {
  const m = s.players.find((p) => p.role === 'mercador' && p.alive)
  if (m && s.items.length === 3 && s.items.every((i) => player(s, i).alive) && !w.ids.includes(m.id))
    return { ...w, title: `${w.title} (e o Mercador também)`, ids: [...w.ids, m.id] }
  return w
}

/** Host taps "continuar" after reading announcements. */
export function ackAnnounce(prev: GameState): GameState {
  const s = structuredClone(prev)
  for (const n of s.announcements) (s.timeline ??= []).push({ day: s.day, text: noteText(s, n) })
  if (!s.winner && s.hunterQueue.length) { s.phase = 'hunter'; return s }
  s.winner ??= checkWin(s)
  if (s.winner) { s.phase = 'end'; log(s, s.winner.title, 'win'); return s }
  if (s.next === 'day') { s.phase = 'day'; s.announcements = [] } else startNight(s)
  return s
}

export function hunterShoot(prev: GameState, target: number | null): GameState {
  const s = structuredClone(prev)
  const hunter = s.hunterQueue.shift()!
  s.announcements = []
  if (target != null && player(s, target).alive) kill(s, target, `foi atingido(a) pela flecha de ${name(s, hunter)}, o Caçador`)
  else info(s, 'bow', `${name(s, hunter)} baixou o arco sem atirar.`)
  s.phase = 'announce'
  return s
}

export function startVote(prev: GameState): GameState {
  const s = structuredClone(prev)
  s.next = 'night'
  if (s.voteCancelled) {
    s.voteCancelled = false
    s.announcements = []
    info(s, 'howl', 'Por causa do uivo, a vila não votou hoje.')
    s.phase = 'announce'
    return s
  }
  s.phase = 'vote'
  s.votes = {}
  s.queue = alive(s).map((p) => p.id)
  s.cursor = 0
  return s
}

export function submitVote(prev: GameState, voter: number, target: number | null): GameState {
  const s = structuredClone(prev)
  s.votes[voter] = ok(s, target) ? target : null
  s.cursor++
  if (s.cursor < s.queue.length) return s
  const tally = new Map<number, number>()
  for (const [v, t] of Object.entries(s.votes)) {
    const key = t ?? -1
    tally.set(key, (tally.get(key) ?? 0) + (player(s, Number(v)).role === 'prefeito' ? 2 : 1))
  }
  const max = Math.max(...tally.values())
  const top = [...tally].filter(([, n]) => n === max)
  s.announcements = []
  const tallies: Note[] = [...tally].sort((a, b) => b[1] - a[1]).map(([t, n]) => ({ kind: 'tally', id: t === -1 ? null : t, votes: n }))
  const tied = top.map(([t]) => t).filter((t) => t !== -1)
  if (top.length === 1 && top[0][0] !== -1) lynch(s, top[0][0])
  else if (top.length > 1 && s.settings.tie === 'sorteio' && tied.length) {
    const pick = tied[Math.floor(rand(s) * tied.length)]
    info(s, 'scale', `Empate! O sorteio escolheu ${name(s, pick)}.`)
    lynch(s, pick)
  } else info(s, 'scale', top.length > 1 ? 'Empate! Ninguém foi linchado hoje.' : 'A vila decidiu não linchar ninguém.')
  s.announcements.unshift(...tallies)
  log(s, `Votos: ${tallies.map((t) => noteText(s, t)).join(', ')}.`, 'vote')
  s.phase = 'announce'
  return s
}

export function openVote(prev: GameState, target: number | null): GameState {
  const s = structuredClone(prev)
  s.announcements = []
  if (ok(s, target)) lynch(s, target)
  else info(s, 'scale', 'A vila decidiu não linchar ninguém.')
  s.phase = 'announce'
  return s
}

function lynch(s: GameState, id: number) {
  const p = player(s, id)
  log(s, `A vila linchou ${p.name}.`, 'vote')
  if (p.role === 'tolo') s.winner = withMerchant(s, { title: 'O Tolo venceu', team: 'solo', ids: [id] })
  kill(s, id, 'foi linchado(a) pela vila')
}
