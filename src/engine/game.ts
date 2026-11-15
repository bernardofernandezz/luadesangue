import { ROLES, isWolf, type Ability, type RoleId, type Team } from './roles'
import { lineupProblems, rolesFor, wolfTarget, type Lineup, type Settings } from './setup'

export interface Player { id: number; name: string; role: RoleId; alive: boolean }

/** reveal → night → announce → (hunter) → day → vote → announce → night … → end. `dealt` ends a deal-only match. */
type Phase = 'reveal' | 'night' | 'announce' | 'hunter' | 'day' | 'vote' | 'end' | 'dealt'

/** What the current player sends on their night turn. Field meaning depends on the `NightAction` they were offered. */
export interface NightInput { target?: number | null; target2?: number | null; use?: boolean }
interface NightChoice extends NightInput { actor: number }

/** What a player may do on their night turn. The UI renders it; `submitNight` rejects anything outside it. */
export type NightAction =
  | { kind: 'idle'; why: 'none' | 'spent' | 'sleepwalk' }
  | { kind: 'pick'; targets: number[]; optional?: boolean; peek?: boolean; power?: Ability; marks?: Record<number, number>; note?: string }
  | { kind: 'pair'; targets: number[] }
  | { kind: 'potions'; cure: number[] | null; poison: number[] | null }
  | { kind: 'toggle'; power: Ability }

type NoteIcon = 'peace' | 'lighthouse' | 'howl' | 'bow' | 'scale'
export type Note =
  | { kind: 'death'; id: number; cause: string; role: RoleId | null }
  | { kind: 'tally'; id: number | null; votes: number }
  | { kind: 'info'; icon: NoteIcon; text: string }

export interface LogEntry { day: number; text: string; kind: 'role' | 'action' | 'death' | 'vote' | 'win' }
export interface Winner { title: string; team: Team | 'amantes' | 'ninguem'; ids: number[] }

const AMULETS = 3

export interface GameState {
  players: Player[]
  settings: Settings
  phase: Phase
  day: number
  /** Player ids taking a private turn in this phase (reveal / night / secret vote), in order. */
  queue: number[]
  cursor: number
  choices: NightChoice[]
  votes: Record<number, number | null>
  /** Once-per-game abilities already spent, as `${playerId}:${ability}`. */
  used: string[]
  lovers: number[]
  blade: number | null
  mentor: Record<number, number>
  items: number[]
  voteCancelled: boolean
  /** Private messages shown at the player's next turn. */
  inbox: Record<number, string[]>
  announcements: Note[]
  /** What follows the current announcements. */
  next: 'day' | 'night'
  hunterQueue: number[]
  /** Full history, with secrets. Shown only at the end. */
  log: LogEntry[]
  /** Public history: only what was announced. */
  timeline: { day: number; text: string }[]
  winner: Winner | null
  seed: number
}

// mulberry32 on state: same seed, same game, so tests and undo are reproducible.
function rand(s: GameState): number {
  let t = (s.seed = (s.seed + 0x6d2b79f5) | 0)
  t = Math.imul(t ^ (t >>> 15), t | 1)
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296
}
const pickOne = <T,>(s: GameState, list: T[]) => list[Math.floor(rand(s) * list.length)]
function shuffle<T>(s: GameState, a: T[]): T[] {
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand(s) * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

/** Player ids are their index in `players`. */
export const player = (s: GameState, id: number) => s.players[id]
export const alive = (s: GameState) => s.players.filter((p) => p.alive)
/** The player whose private turn it is (reveal, night or secret vote). */
export const current = (s: GameState) => player(s, s.queue[s.cursor])
export const packOf = (s: GameState, id: number) =>
  isWolf(player(s, id).role) ? alive(s).filter((p) => p.id !== id && isWolf(p.role)) : []
export const voteTargets = (s: GameState, voter: number) => alive(s).map((p) => p.id).filter((id) => id !== voter)
export const investigate = (s: GameState, target: number) => {
  const r = player(s, target).role
  return isWolf(r) && !ROLES[r].hiddenFromSeer
}
export const voteWeight = (s: GameState, id: number) => ROLES[player(s, id).role].votes ?? 1

const name = (s: GameState, id: number) => player(s, id).name
const isAlive = (s: GameState, id: number | null | undefined): id is number => id != null && !!s.players[id]?.alive
const canUse = (s: GameState, id: number, a: Ability) => !s.used.includes(`${id}:${a}`)
const spend = (s: GameState, id: number, a: Ability) => s.used.push(`${id}:${a}`)
const tell = (s: GameState, id: number, msg: string) => (s.inbox[id] ??= []).push(msg)
const log = (s: GameState, text: string, kind: LogEntry['kind'] = 'action') => s.log.push({ day: s.day, text, kind })
const info = (s: GameState, icon: NoteIcon, text: string) => s.announcements.push({ kind: 'info', icon, text })

export function noteText(s: GameState, n: Note): string {
  if (n.kind === 'info') return n.text
  if (n.kind === 'tally') return `${n.id == null ? 'Pular' : name(s, n.id)}: ${n.votes} voto${n.votes > 1 ? 's' : ''}`
  return `${name(s, n.id)} ${n.cause}.${n.role ? ` Era ${ROLES[n.role].name}.` : ''}`
}

export function createGame(lineup: Lineup, seed = Date.now()): GameState {
  const problems = lineupProblems(lineup)
  if (problems.length) throw new Error(problems[0])
  const { names, settings } = lineup
  const s: GameState = {
    players: [], settings, phase: 'reveal', day: 0, queue: [], cursor: 0, choices: [], votes: {}, used: [],
    lovers: [], blade: null, mentor: {}, items: [], voteCancelled: false, inbox: {}, announcements: [],
    next: 'day', hunterQueue: [], log: [], timeline: [], winner: null, seed,
  }
  let roles = rolesFor(lineup)
  if (settings.randomRoles) roles = shuffle(s, drawRoles(shuffle(s, [...roles]), names.length))
  s.players = names.map((n, id) => ({ id, name: n, role: roles[id], alive: true }))
  s.queue = s.players.map((p) => p.id)
  for (const p of s.players) log(s, `${p.name} recebeu ${ROLES[p.role].name}.`, 'role')
  return s
}

export function drawRoles(shuffled: RoleId[], n: number): RoleId[] {
  const wolves = shuffled.filter(isWolf)
  const others = shuffled.filter((r) => !isWolf(r))
  const w = Math.min(wolves.length, Math.max(wolfTarget(n), n - others.length))
  return [...wolves.slice(0, w), ...others.slice(0, n - w)]
}

export function revealNext(prev: GameState): GameState {
  if (prev.phase !== 'reveal') return prev
  const s = structuredClone(prev)
  s.cursor++
  if (s.cursor < s.queue.length) return s
  if (s.settings.mode === 'cartas') s.phase = 'dealt'
  else startNight(s)
  return s
}

function startNight(s: GameState) {
  s.day++
  s.phase = 'night'
  s.queue = alive(s).map((p) => p.id)
  s.cursor = 0
  s.choices = []
}

export function nightAction(s: GameState, id: number): NightAction {
  const p = player(s, id)
  const def = ROLES[p.role]
  const all = alive(s).map((o) => o.id)
  const others = all.filter((o) => o !== id)
  const spent = { kind: 'idle', why: 'spent' } as const
  const power = def.power && canUse(s, id, def.power.ability) ? def.power.ability : undefined

  if (isWolf(p.role)) {
    const marks = Object.fromEntries(packVotes(s.choices.filter((c) => isWolf(player(s, c.actor).role))))
    return { kind: 'pick', targets: all.filter((o) => !isWolf(player(s, o).role)), power, marks }
  }
  switch (p.role) {
    case 'vidente': return { kind: 'pick', targets: others, peek: true }
    case 'medico': return { kind: 'pick', targets: all }
    case 'guarda_costas': case 'rastreador': case 'assassino': return { kind: 'pick', targets: others }
    case 'herdeiro': return s.day === 1 ? { kind: 'pick', targets: others } : spent
    case 'cupido': return s.day === 1 ? { kind: 'pair', targets: all } : spent
    case 'ferreiro': return canUse(s, id, 'lamina') ? { kind: 'pick', targets: all, optional: true } : spent
    case 'faroleiro': return power ? { kind: 'toggle', power } : spent
    case 'sonambulo': return { kind: 'idle', why: 'sleepwalk' }
    case 'mercador': return s.items.length < AMULETS
      ? { kind: 'pick', targets: others.filter((o) => !s.items.includes(o)), note: `Amuletos entregues: ${s.items.length}/${AMULETS}` }
      : spent
    case 'bruxa': {
      const cure = canUse(s, id, 'cura') ? all : null
      const poison = canUse(s, id, 'veneno') ? others : null
      return cure || poison ? { kind: 'potions', cure, poison } : spent
    }
  }
  return { kind: 'idle', why: 'none' }
}

function sanitize(a: NightAction, input: NightInput): NightInput {
  const within = (list: number[] | null, t?: number | null) => (list && t != null && list.includes(t) ? t : null)
  switch (a.kind) {
    case 'pick': return { target: within(a.targets, input.target), use: !!a.power && !!input.use }
    case 'pair': {
      const [t, t2] = [within(a.targets, input.target), within(a.targets, input.target2)]
      return t != null && t2 != null && t !== t2 ? { target: t, target2: t2 } : {}
    }
    case 'potions': return { target: within(a.cure, input.target), target2: within(a.poison, input.target2) }
    case 'toggle': return { use: !!input.use }
    case 'idle': return {}
  }
}

export function submitNight(prev: GameState, input: NightInput): GameState {
  if (prev.phase !== 'night') return prev
  const s = structuredClone(prev)
  const actor = current(s).id
  s.choices.push({ actor, ...sanitize(nightAction(s, actor), input) })
  delete s.inbox[actor]
  s.cursor++
  if (s.cursor >= s.queue.length) resolveNight(s)
  return s
}

/** Votes per target among the wolves' choices. Shown to wolves while they vote, and decides the pack's target. */
function packVotes(wolfChoices: NightChoice[]): Map<number, number> {
  const counts = new Map<number, number>()
  for (const c of wolfChoices) if (c.target != null) counts.set(c.target, (counts.get(c.target) ?? 0) + 1)
  return counts
}

function packTarget(s: GameState, wolfChoices: NightChoice[]): number | null {
  const counts = packVotes(wolfChoices)
  if (!counts.size) return null
  const max = Math.max(...counts.values())
  const tied = [...counts].filter(([, n]) => n === max).map(([t]) => t)
  if (tied.length === 1) return tied[0]
  const leader = wolfChoices.find((c) => ROLES[player(s, c.actor).role].breaksPackTies)
  if (leader?.target != null && tied.includes(leader.target)) return leader.target
  return pickOne(s, tied)
}

const NIGHT_DEATH = 'foi encontrado(a) morto(a) ao amanhecer'
const NO_LYNCH = 'A vila decidiu não linchar ninguém.'

function resolveNight(s: GameState) {
  s.announcements = []
  const roleOf = (id: number) => player(s, id).role
  const visits: { actor: number; target: number; what: string }[] = []
  const visit = (actor: number, target: number, what: string) => visits.push({ actor, target, what })
  let lighthouse = false

  for (const c of s.choices) {
    const r = roleOf(c.actor)
    if (r === 'cupido' && c.target != null && c.target2 != null) {
      s.lovers = [c.target, c.target2]
      for (const [a, b] of [[c.target, c.target2], [c.target2, c.target]])
        tell(s, a, `Você se apaixonou por ${name(s, b)}. Se um de vocês morrer, o outro morre junto. Se forem os dois últimos vivos, vocês vencem.`)
      visit(c.actor, c.target, 'foi flechado pelo Cupido'); visit(c.actor, c.target2, 'foi flechado pelo Cupido')
      log(s, `Cupido uniu ${name(s, c.target)} e ${name(s, c.target2)}.`)
    }
    if (r === 'herdeiro' && c.target != null) {
      s.mentor[c.actor] = c.target
      visit(c.actor, c.target, 'foi escolhido como mentor')
      log(s, `${name(s, c.actor)} (Herdeiro) escolheu ${name(s, c.target)} como mentor.`)
    }
    if (r === 'ferreiro' && c.target != null) {
      spend(s, c.actor, 'lamina')
      s.blade = c.target
      tell(s, c.target, 'Você recebeu uma lâmina de prata do Ferreiro. Se os lobos te atacarem, você sobrevive e um deles morre.')
      visit(c.actor, c.target, 'recebeu uma lâmina de prata')
      log(s, `${name(s, c.actor)} (Ferreiro) deu a lâmina para ${name(s, c.target)}.`)
    }
    if (r === 'mercador' && c.target != null) {
      s.items.push(c.target)
      tell(s, c.target, 'Você recebeu um amuleto de um Mercador misterioso. Ele não tem poder, mas o Mercador torce para você sobreviver.')
      visit(c.actor, c.target, 'recebeu um amuleto')
      log(s, `${name(s, c.actor)} (Mercador) deu um amuleto para ${name(s, c.target)}.`)
    }
    const power = c.use ? ROLES[r].power?.ability : undefined
    if (power === 'farol') {
      spend(s, c.actor, power)
      lighthouse = true
      log(s, `${name(s, c.actor)} (${ROLES[r].name}) acendeu o farol.`)
    }
    if (power === 'uivo') {
      spend(s, c.actor, power)
      s.voteCancelled = true
      log(s, `${name(s, c.actor)} (${ROLES[r].name}) uivou: amanhã não haverá votação.`)
    }
  }

  const shielded = new Set<number>()
  const guards = new Map<number, number>()
  for (const c of s.choices) {
    const r = roleOf(c.actor)
    if (c.target == null) continue
    if (r === 'medico') {
      shielded.add(c.target); visit(c.actor, c.target, 'foi protegido')
      log(s, `${name(s, c.actor)} (Médico) protegeu ${name(s, c.target)}.`)
    }
    if (r === 'bruxa') {
      spend(s, c.actor, 'cura'); shielded.add(c.target); visit(c.actor, c.target, 'recebeu uma poção de cura')
      log(s, `${name(s, c.actor)} (Bruxa) usou a cura em ${name(s, c.target)}.`)
    }
    if (r === 'guarda_costas') {
      guards.set(c.target, c.actor); visit(c.actor, c.target, 'foi guardado')
      log(s, `${name(s, c.actor)} (Guarda-costas) guardou ${name(s, c.target)}.`)
    }
  }

  const deaths = new Map<number, string>()
  const attack = (target: number, by: 'lobos' | 'assassino') => {
    if (!isAlive(s, target)) return
    if (by === 'lobos' && s.blade === target) {
      s.blade = null
      const victim = pickOne(s, alive(s).filter((p) => isWolf(p.role)))
      deaths.set(victim.id, 'foi morto(a) por uma lâmina de prata')
      log(s, `A lâmina de prata de ${name(s, target)} matou ${victim.name}.`)
      return
    }
    const guard = guards.get(target)
    if (guard != null && isAlive(s, guard)) {
      deaths.set(guard, NIGHT_DEATH)
      log(s, `${name(s, guard)} morreu protegendo ${name(s, target)}.`)
      return
    }
    if (shielded.has(target)) { log(s, `${name(s, target)} foi atacado(a), mas estava protegido(a).`); return }
    deaths.set(target, NIGHT_DEATH)
  }

  const wolfChoices = s.choices.filter((c) => isWolf(roleOf(c.actor)))
  const shadow = wolfChoices.find((c) => c.use && c.target != null && ROLES[roleOf(c.actor)].power?.ability === 'sombra')
  if (shadow) { spend(s, shadow.actor, 'sombra'); log(s, `${name(s, shadow.actor)} (${ROLES[roleOf(shadow.actor)].name}) impôs o alvo da matilha.`) }
  const pack = shadow?.target ?? packTarget(s, wolfChoices)
  if (pack != null) {
    for (const c of wolfChoices) visit(c.actor, pack, 'foi atacado pela matilha')
    log(s, `A matilha atacou ${name(s, pack)}.`)
    attack(pack, 'lobos')
  }
  for (const c of s.choices) {
    const r = roleOf(c.actor)
    if (r === 'assassino' && c.target != null) {
      visit(c.actor, c.target, 'foi atacado por um assassino'); log(s, `${name(s, c.actor)} (Assassino) atacou ${name(s, c.target)}.`)
      attack(c.target, 'assassino')
    }
    if (r === 'bruxa' && c.target2 != null) {
      spend(s, c.actor, 'veneno'); visit(c.actor, c.target2, 'foi envenenado')
      log(s, `${name(s, c.actor)} (Bruxa) envenenou ${name(s, c.target2)}.`)
      if (isAlive(s, c.target2)) deaths.set(c.target2, NIGHT_DEATH)
    }
    if (r === 'vidente' && c.target != null) visit(c.actor, c.target, 'foi investigado')
  }

  // Information roles run last so they see every visit of the night.
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
      const v = pickOne(s, alive(s).filter((p) => p.id !== c.actor))
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
  if (ROLES[p.role].shootsOnDeath) s.hunterQueue.push(id)
  for (const [heir, mentor] of Object.entries(s.mentor)) {
    const h = player(s, Number(heir))
    if (mentor !== id || !h.alive) continue
    h.role = p.role
    delete s.mentor[h.id]
    tell(s, h.id, `Seu mentor ${p.name} morreu. Agora você é ${ROLES[p.role].name}. Veja sua nova carta.`)
    log(s, `${h.name} herdou o papel ${ROLES[p.role].name}.`)
  }
  if (s.lovers.includes(id)) kill(s, s.lovers.find((l) => l !== id)!, 'morreu de coração partido')
}

export function checkWin(s: GameState): Winner | null {
  const live = alive(s)
  const wolves = live.filter((p) => isWolf(p.role))
  const loners = live.filter((p) => ROLES[p.role].winsAlone)
  const everyone = (pred: (p: Player) => boolean) => s.players.filter(pred).map((p) => p.id)
  let w: Winner | null = null
  if (!live.length) w = { title: 'Ninguém sobreviveu', team: 'ninguem', ids: [] }
  else if (s.lovers.length === 2 && live.length === 2 && s.lovers.every((l) => isAlive(s, l))) w = { title: 'Os amantes venceram', team: 'amantes', ids: [...s.lovers] }
  else if (loners.length && live.length <= 2) w = { title: winTitle(loners[0].role), team: 'solo', ids: loners.map((p) => p.id) }
  else if (!wolves.length && !loners.length) w = { title: 'A Vila venceu', team: 'vila', ids: everyone((p) => ROLES[p.role].team === 'vila') }
  else if (wolves.length && !loners.length && wolves.length >= live.length - wolves.length) w = { title: 'Os Lobos venceram', team: 'lobos', ids: everyone((p) => isWolf(p.role)) }
  return w && withSharers(s, w)
}

const winTitle = (r: RoleId) => ROLES[r].winTitle ?? `${ROLES[r].name} venceu`

function withSharers(s: GameState, w: Winner): Winner {
  const m = alive(s).find((p) => ROLES[p.role].sharesVictory)
  if (m && s.items.length === AMULETS && s.items.every((i) => isAlive(s, i)) && !w.ids.includes(m.id))
    return { ...w, title: `${w.title} (e o ${ROLES[m.role].name} também)`, ids: [...w.ids, m.id] }
  return w
}

export function ackAnnounce(prev: GameState): GameState {
  if (prev.phase !== 'announce') return prev
  const s = structuredClone(prev)
  for (const n of s.announcements) s.timeline.push({ day: s.day, text: noteText(s, n) })
  if (!s.winner && s.hunterQueue.length) { s.phase = 'hunter'; return s }
  s.winner ??= checkWin(s)
  if (s.winner) { s.phase = 'end'; log(s, s.winner.title, 'win'); return s }
  if (s.next === 'day') { s.phase = 'day'; s.announcements = [] } else startNight(s)
  return s
}

export function hunterShoot(prev: GameState, target: number | null): GameState {
  if (prev.phase !== 'hunter') return prev
  const s = structuredClone(prev)
  const hunter = s.hunterQueue.shift()!
  s.announcements = []
  if (isAlive(s, target)) kill(s, target, `foi atingido(a) pela flecha de ${name(s, hunter)}, ${ROLES[player(s, hunter).role].name}`)
  else info(s, 'bow', `${name(s, hunter)} baixou o arco sem atirar.`)
  s.phase = 'announce'
  return s
}

export function startVote(prev: GameState): GameState {
  if (prev.phase !== 'day') return prev
  const s = structuredClone(prev)
  s.next = 'night'
  s.announcements = []
  if (s.voteCancelled) {
    s.voteCancelled = false
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

/** Secret vote by the current voter; null skips. Tallies after the last voter. */
export function submitVote(prev: GameState, target: number | null): GameState {
  if (prev.phase !== 'vote') return prev
  const s = structuredClone(prev)
  const voter = current(s).id
  s.votes[voter] = target != null && voteTargets(s, voter).includes(target) ? target : null
  s.cursor++
  if (s.cursor < s.queue.length) return s
  const SKIP = -1
  const tally = new Map<number, number>()
  for (const [v, t] of Object.entries(s.votes)) tally.set(t ?? SKIP, (tally.get(t ?? SKIP) ?? 0) + voteWeight(s, Number(v)))
  const max = Math.max(...tally.values())
  const top = [...tally].filter(([, n]) => n === max).map(([t]) => t)
  const tiedPlayers = top.filter((t) => t !== SKIP)
  const tallies: Note[] = [...tally].sort((a, b) => b[1] - a[1]).map(([t, n]) => ({ kind: 'tally', id: t === SKIP ? null : t, votes: n }))
  s.announcements = []
  if (top.length === 1 && top[0] !== SKIP) lynch(s, top[0])
  else if (top.length > 1 && s.settings.tie === 'sorteio' && tiedPlayers.length) {
    const pick = pickOne(s, tiedPlayers)
    info(s, 'scale', `Empate! O sorteio escolheu ${name(s, pick)}.`)
    lynch(s, pick)
  } else info(s, 'scale', top.length > 1 ? 'Empate! Ninguém foi linchado hoje.' : NO_LYNCH)
  s.announcements.unshift(...tallies)
  log(s, `Votos: ${tallies.map((t) => noteText(s, t)).join(', ')}.`, 'vote')
  s.phase = 'announce'
  return s
}

/** Show-of-hands vote: the host marks who was lynched, or null for nobody. */
export function openVote(prev: GameState, target: number | null): GameState {
  if (prev.phase !== 'vote') return prev
  const s = structuredClone(prev)
  s.announcements = []
  if (isAlive(s, target)) lynch(s, target)
  else info(s, 'scale', NO_LYNCH)
  s.phase = 'announce'
  return s
}

function lynch(s: GameState, id: number) {
  const p = player(s, id)
  log(s, `A vila linchou ${p.name}.`, 'vote')
  kill(s, id, 'foi linchado(a) pela vila')
  if (ROLES[p.role].winsIfLynched) s.winner = withSharers(s, { title: winTitle(p.role), team: 'solo', ids: [id] })
}
