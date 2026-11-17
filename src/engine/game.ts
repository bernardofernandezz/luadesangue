import { ROLES, isWolf, type Ability, type RoleId, type Team } from './roles'
import { lineupProblems, rolesFor, wolfTarget, type Lineup, type Settings } from './setup'

export interface Player { id: number; name: string; role: RoleId; alive: boolean }

/** reveal → night → announce → (hunter) → day → vote → (defense) → announce → night … → end. `dealt` ends a deal-only match. */
type Phase = 'reveal' | 'night' | 'announce' | 'hunter' | 'day' | 'vote' | 'defense' | 'end' | 'dealt'

/** What the current player sends on their night turn. Field meaning depends on the `NightAction` they were offered. */
export interface NightInput { target?: number | null; target2?: number | null; use?: boolean }
interface NightChoice extends NightInput { actor: number }

/** What a player may do on their night turn. The UI renders it; `submitNight` rejects anything outside it. */
export type NightAction =
  | { kind: 'idle'; why: 'none' | 'spent' | 'sleepwalk' }
  | { kind: 'pick'; targets: number[]; optional?: boolean; peek?: boolean; dead?: boolean; max?: 2; powerTargets?: number[]; aura?: boolean; power?: Ability; marks?: Record<number, number>; note?: string }
  | { kind: 'pair'; targets: number[]; compare?: boolean }
  | { kind: 'potions'; cure: number[] | null; poison: number[] | null }
  | { kind: 'toggle'; power: Ability }

type NoteIcon = 'peace' | 'lighthouse' | 'howl' | 'bow' | 'scale'
export type Note =
  | { kind: 'death'; id: number; cause: string; role: RoleId | null }
  | { kind: 'tally'; id: number | null; votes: number; voters?: number[] }
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
  /** Players soaked by the Incendiário, burned when the match is struck. */
  doused: number[]
  voteCancelled: boolean
  /** Players who revealed their role in public by day (Prefeito, Atirador). */
  revealed: number[]
  /** Vingador → who dies with him. */
  avenge: Record<number, number>
  /** Caçador de Cabeças → the Vila player he must get lynched. */
  bounty: Record<number, number>
  /** Day of the Atirador's last shot (one per day). */
  shotOnDay: number
  /** Most-voted player, defending before the village confirms the lynch. */
  accused: number | null
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
  /** The seed the game started with: identifies the match (the live `seed` advances with every draw). */
  startedAt: number
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
/** The role the Vidente sees. Roles hidden from her show up as a plain Aldeão. */
export const investigate = (s: GameState, target: number): RoleId => {
  const r = player(s, target).role
  return ROLES[r].hiddenFromSeer ? 'aldeao' : r
}
/** What a peeking role sees: the Médium sees the dead as they were, the seers go through `investigate`. */
export const peekAt = (s: GameState, actor: number, target: number): RoleId =>
  player(s, actor).role === 'medium' ? player(s, target).role : investigate(s, target)
/** The Detetive's answer. Roles hidden from the seers pass as Vila. */
export const sameTeam = (s: GameState, a: number, b: number) => ROLES[investigate(s, a)].team === ROLES[investigate(s, b)].team
/** What the Vidente da Aura sees. Roles hidden from the seers show a good aura. */
export const auraOf = (s: GameState, target: number) => ({ vila: 'boa', lobos: 'ma', solo: 'desconhecida' } as const)[ROLES[investigate(s, target)].team]
/** A revealed Prefeito's vote counts twice. */
export const voteWeight = (s: GameState, id: number) => (player(s, id).role === 'prefeito' && s.revealed.includes(id) ? 2 : 1)
/** The Lobo Vidente stays out of the pack's attack until he is the last wolf alive. */
const hunts = (s: GameState, id: number) =>
  isWolf(player(s, id).role) && (player(s, id).role !== 'lobo_vidente' || !canUse(s, id, 'renuncia') || alive(s).filter((p) => isWolf(p.role)).length === 1)

const name = (s: GameState, id: number) => player(s, id).name
const isAlive = (s: GameState, id: number | null | undefined): id is number => id != null && !!s.players[id]?.alive
export const canUse = (s: GameState, id: number, a: Ability) => {
  const power = ROLES[player(s, id).role].power
  const uses = power?.ability === a ? power.uses ?? 1 : 1
  return s.used.filter((u) => u === `${id}:${a}`).length < uses
}
const spend = (s: GameState, id: number, a: Ability) => s.used.push(`${id}:${a}`)
const tell = (s: GameState, id: number, msg: string) => (s.inbox[id] ??= []).push(msg)
const log = (s: GameState, text: string, kind: LogEntry['kind'] = 'action') => s.log.push({ day: s.day, text, kind })
const info = (s: GameState, icon: NoteIcon, text: string) => s.announcements.push({ kind: 'info', icon, text })

export function noteText(s: GameState, n: Note): string {
  if (n.kind === 'info') return n.text
  if (n.kind === 'tally') return `${n.id == null ? 'Pular' : name(s, n.id)}: ${n.votes} voto${n.votes > 1 ? 's' : ''}${n.voters ? ` (${n.voters.map((v) => name(s, v)).join(', ')})` : ''}`
  return `${name(s, n.id)} ${n.cause}.${n.role ? ` Era ${ROLES[n.role].name}.` : ''}`
}

export function createGame(lineup: Lineup, seed = Date.now()): GameState {
  const problems = lineupProblems(lineup)
  if (problems.length) throw new Error(problems[0])
  const { names, settings } = lineup
  const s: GameState = {
    players: [], settings, phase: 'reveal', day: 0, queue: [], cursor: 0, choices: [], votes: {}, used: [],
    lovers: [], blade: null, mentor: {}, items: [], doused: [], revealed: [], avenge: {}, bounty: {}, shotOnDay: 0, voteCancelled: false, accused: null, inbox: {}, announcements: [],
    next: 'day', hunterQueue: [], log: [], timeline: [], winner: null, seed, startedAt: seed,
  }
  let roles = rolesFor(lineup)
  if (settings.randomRoles) roles = shuffle(s, drawRoles(shuffle(s, [...roles]), names.length))
  s.players = names.map((n, id) => ({ id, name: n, role: roles[id], alive: true }))
  s.queue = s.players.map((p) => p.id)
  for (const p of s.players) log(s, `${p.name} recebeu ${ROLES[p.role].name}.`, 'role')
  for (const h of s.players.filter((p) => p.role === 'cacador_cabecas')) {
    const vila = s.players.filter((p) => ROLES[p.role].team === 'vila')
    const t = pickOne(s, vila.length ? vila : s.players.filter((p) => p.id !== h.id))
    s.bounty[h.id] = t.id
    tell(s, h.id, `Seu alvo é ${t.name}. Faça a vila linchar essa pessoa e você vence.`)
    log(s, `O alvo de ${h.name} (Caçador de Cabeças) é ${t.name}.`, 'role')
  }
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

/** Deal-only match that wants to keep going: the app takes over silently, a person reads its lines. */
export function continueDealt(prev: GameState): GameState {
  if (prev.phase !== 'dealt') return prev
  const s = structuredClone(prev)
  s.settings.mode = 'humano'
  startNight(s)
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

  if (p.role === 'lobo_vidente' && !hunts(s, id)) return { kind: 'pick', targets: all.filter((o) => !isWolf(player(s, o).role)), peek: true, power }
  if (isWolf(p.role)) {
    const marks = Object.fromEntries(packVotes(s, s.choices.filter((c) => hunts(s, c.actor))))
    return { kind: 'pick', targets: all.filter((o) => !isWolf(player(s, o).role)), power, marks }
  }
  switch (p.role) {
    case 'vidente': return { kind: 'pick', targets: others, peek: true }
    case 'medico': case 'rastreador': case 'assassino': return { kind: 'pick', targets: others }
    case 'guarda_costas': case 'dama_vermelho': return { kind: 'pick', targets: others, optional: true }
    case 'vidente_aura': return { kind: 'pick', targets: others, peek: true, aura: true }
    case 'vingador': {
      const mark = s.avenge[id]
      return { kind: 'pick', targets: others, optional: true, note: isAlive(s, mark) ? `Sua marca atual: ${name(s, mark)}` : 'Você ainda não marcou ninguém.' }
    }
    case 'detetive': return others.length >= 2 ? { kind: 'pair', targets: others, compare: true } : spent
    case 'medium': {
      const dead = s.players.filter((o) => !o.alive).map((o) => o.id)
      // Classic: only a dead player of the Médium's own team can be revived.
      const revivable = dead.filter((o) => ROLES[player(s, o).role].team === def.team)
      return dead.length ? { kind: 'pick', targets: dead, peek: true, dead: true, power, powerTargets: revivable } : { kind: 'idle', why: 'none' }
    }
    case 'herdeiro': return s.day === 1 ? { kind: 'pick', targets: others } : spent
    case 'cupido': return s.day === 1 ? { kind: 'pair', targets: all } : spent
    case 'ferreiro': return canUse(s, id, 'lamina') ? { kind: 'pick', targets: all, optional: true } : spent
    case 'faroleiro': return power ? { kind: 'toggle', power } : spent
    case 'sonambulo': return { kind: 'idle', why: 'sleepwalk' }
    case 'mercador': return s.items.length < AMULETS
      ? { kind: 'pick', targets: others.filter((o) => !s.items.includes(o)), note: `Amuletos entregues: ${s.items.length}/${AMULETS}` }
      : spent
    case 'incendiario': {
      const fresh = others.filter((o) => !s.doused.includes(o))
      const soaked = s.doused.filter((o) => isAlive(s, o)).map((o) => name(s, o))
      return { kind: 'pick', targets: fresh, optional: true, max: 2, power, note: soaked.length ? `Encharcados: ${soaked.join(', ')}` : 'Ninguém encharcado ainda.' }
    }
    case 'bruxa': {
      const cure = canUse(s, id, 'cura') ? all : null
      const poison = canUse(s, id, 'veneno') && s.day > 1 ? others : null // classic: no poison on the first night
      return cure || poison ? { kind: 'potions', cure, poison } : spent
    }
  }
  return { kind: 'idle', why: 'none' }
}

function sanitize(a: NightAction, input: NightInput): NightInput {
  const within = (list: number[] | null, t?: number | null) => (list && t != null && list.includes(t) ? t : null)
  switch (a.kind) {
    case 'pick': {
      const target = within(a.targets, input.target)
      const target2 = a.max === 2 ? within(a.targets, input.target2) : null
      return { target, target2: target2 !== target ? target2 : null, use: !!a.power && !!input.use }
    }
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
function packVotes(s: GameState, wolfChoices: NightChoice[]): Map<number, number> {
  const counts = new Map<number, number>()
  for (const c of wolfChoices) if (c.target != null) counts.set(c.target, (counts.get(c.target) ?? 0) + (ROLES[player(s, c.actor).role].packVotes ?? 1))
  return counts
}

function packTarget(s: GameState, wolfChoices: NightChoice[]): number | null {
  const counts = packVotes(s, wolfChoices)
  if (!counts.size) return null
  const max = Math.max(...counts.values())
  return pickOne(s, [...counts].filter(([, n]) => n === max).map(([t]) => t))
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
        tell(s, a, `Você se apaixonou por ${name(s, b)}, que é ${ROLES[roleOf(b)].name}. Se um de vocês morrer, o outro morre junto. Se forem os dois últimos vivos, vocês vencem.`)
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
    if (r === 'vingador' && c.target != null) {
      s.avenge[c.actor] = c.target
      visit(c.actor, c.target, 'foi marcado pelo Vingador')
      log(s, `${name(s, c.actor)} (Vingador) marcou ${name(s, c.target)}.`)
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
    if (power === 'renuncia') {
      spend(s, c.actor, power)
      for (const w of packOf(s, c.actor)) tell(s, w.id, `${name(s, c.actor)} renunciou à visão e agora ataca com a matilha.`)
      log(s, `${name(s, c.actor)} (Lobo Vidente) renunciou à visão.`)
    }
    if (power === 'uivo') {
      spend(s, c.actor, power)
      s.voteCancelled = true
      log(s, `${name(s, c.actor)} (${ROLES[r].name}) uivou: amanhã não haverá votação.`)
    }
  }

  const shielded = new Set<number>()
  const guards = new Map<number, number>()
  const cured = new Map<number, number>()
  for (const c of s.choices) {
    const r = roleOf(c.actor)
    if (c.target == null) continue
    if (r === 'medico') {
      shielded.add(c.target); visit(c.actor, c.target, 'foi protegido')
      log(s, `${name(s, c.actor)} (Médico) protegeu ${name(s, c.target)}.`)
    }
    if (r === 'bruxa') {
      cured.set(c.target, c.actor); visit(c.actor, c.target, 'recebeu uma poção de cura')
      log(s, `${name(s, c.actor)} (Bruxa) deu a cura para ${name(s, c.target)}.`)
    }
    if (r === 'guarda_costas') {
      guards.set(c.target, c.actor); visit(c.actor, c.target, 'foi guardado')
      log(s, `${name(s, c.actor)} (Guarda-costas) guardou ${name(s, c.target)}.`)
    }
  }

  // Dama de Vermelho → whose house she sleeps in. Attacks on her own house find it empty.
  const stays = new Map<number, number>()
  for (const c of s.choices) if (roleOf(c.actor) === 'dama_vermelho' && c.target != null) {
    stays.set(c.actor, c.target); visit(c.actor, c.target, 'recebeu a Dama de Vermelho')
    log(s, `${name(s, c.actor)} (Dama de Vermelho) passou a noite com ${name(s, c.target)}.`)
  }

  const deaths = new Map<number, string>()
  const attack = (target: number, by: 'lobos' | 'assassino') => {
    if (!isAlive(s, target)) return
    if (stays.has(target)) { log(s, `${name(s, target)} foi atacado(a), mas não estava em casa.`); return }
    if (by === 'lobos' && s.blade === target) {
      s.blade = null
      const victim = pickOne(s, alive(s).filter((p) => isWolf(p.role)))
      deaths.set(victim.id, 'foi morto(a) por uma lâmina de prata')
      log(s, `A lâmina de prata de ${name(s, target)} matou ${victim.name}.`)
      return
    }
    if (by === 'lobos' && ROLES[roleOf(target)].immuneToWolves) { log(s, `${name(s, target)} resistiu ao ataque da matilha.`); return }
    const guard = guards.get(target)
    if (guard != null && isAlive(s, guard)) { hitGuard(guard, target); return }
    if (shielded.has(target)) { log(s, `${name(s, target)} foi atacado(a), mas estava protegido(a).`); return }
    const witch = cured.get(target)
    // The cure is only spent when it actually saves someone.
    if (witch != null && canUse(s, witch, 'cura')) {
      spend(s, witch, 'cura')
      tell(s, witch, `Sua poção de cura salvou ${name(s, target)} na noite ${s.day}.`)
      log(s, `A cura da Bruxa salvou ${name(s, target)}.`)
      return
    }
    if (roleOf(target) === 'guarda_costas') { hitGuard(target, target); return }
    if (by === 'lobos' && roleOf(target) === 'amaldicoado') {
      player(s, target).role = 'lobisomem'
      tell(s, target, 'Os lobos te morderam, mas você não morreu: a maldição despertou. Agora você é um Lobisomem e joga com a matilha.')
      for (const w of packOf(s, target)) tell(s, w.id, `${name(s, target)} era o Amaldiçoado e virou lobo. Agora é da matilha.`)
      log(s, `${name(s, target)} (Amaldiçoado) virou Lobisomem.`)
      return
    }
    deaths.set(target, NIGHT_DEATH)
  }
  /** The Guarda-costas survives the first attack he takes and dies on the second. */
  const hitGuard = (guard: number, target: number) => {
    const why = guard === target ? 'foi atacado' : `protegeu ${name(s, target)}`
    if (canUse(s, guard, 'escudo')) {
      spend(s, guard, 'escudo')
      tell(s, guard, `Você ${guard === target ? 'foi atacado' : `levou o ataque no lugar de ${name(s, target)}`} e sobreviveu. O próximo ataque será fatal.`)
      log(s, `${name(s, guard)} (Guarda-costas) ${why} e sobreviveu.`)
    } else {
      deaths.set(guard, NIGHT_DEATH)
      log(s, `${name(s, guard)} (Guarda-costas) ${why} e morreu.`)
    }
  }

  // A Lobo Vidente who resigned tonight starts attacking next night: tonight's pick was a peek.
  const wolfChoices = s.choices.filter((c) => hunts(s, c.actor) && !(c.use && roleOf(c.actor) === 'lobo_vidente'))
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
    if (r === 'detetive' && c.target != null && c.target2 != null) {
      visit(c.actor, c.target, 'foi investigado'); visit(c.actor, c.target2, 'foi investigado')
      log(s, `${name(s, c.actor)} (Detetive) comparou ${name(s, c.target)} e ${name(s, c.target2)}: ${sameTeam(s, c.target, c.target2) ? 'mesmo time' : 'times diferentes'}.`)
    }
    if (r === 'medium' && c.target != null) log(s, `${name(s, c.actor)} (Médium) falou com ${name(s, c.target)}.`)
    if (r === 'lobo_vidente' && c.target != null && !wolfChoices.includes(c)) {
      visit(c.actor, c.target, 'foi investigado')
      log(s, `${name(s, c.actor)} (Lobo Vidente) viu ${name(s, c.target)} como ${ROLES[investigate(s, c.target)].name}.`)
    }
    if (r === 'vidente' && c.target != null) {
      visit(c.actor, c.target, 'foi investigado')
      log(s, `${name(s, c.actor)} (Vidente) viu ${name(s, c.target)} como ${ROLES[investigate(s, c.target)].name}.`)
    }
    if (r === 'incendiario') {
      // Igniting takes the whole night: no dousing on the same turn.
      for (const t of c.use ? [] : [c.target, c.target2]) {
        if (t == null) continue
        s.doused.push(t); visit(c.actor, t, 'foi encharcado de querosene')
        log(s, `${name(s, c.actor)} (Incendiário) encharcou ${name(s, t)}.`)
      }
      if (c.use) {
        log(s, `${name(s, c.actor)} (Incendiário) riscou o fósforo.`)
        for (const id of s.doused) if (isAlive(s, id)) deaths.set(id, 'morreu queimado(a) num incêndio')
        s.doused = []
      }
    }
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
    if (r === 'lobo_farejador' && c.target != null) {
      const role = ROLES[roleOf(c.target)].name
      tell(s, c.actor, `Seu faro na noite ${s.day}: ${name(s, c.target)} é ${role}.`)
      log(s, `${name(s, c.actor)} (Lobo Farejador) farejou ${name(s, c.target)}: ${role}.`)
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

  for (const [lady, host] of stays) {
    const h = ROLES[roleOf(host)]
    if (h.team === 'lobos' || h.winsAlone || deaths.has(host)) {
      deaths.set(lady, NIGHT_DEATH)
      log(s, `${name(s, lady)} (Dama de Vermelho) morreu na casa de ${name(s, host)}.`)
    }
  }

  for (const [id, cause] of deaths) kill(s, id, cause)
  if (!s.announcements.length) info(s, 'peace', 'A noite foi tranquila. Ninguém morreu.')
  for (const c of s.choices) {
    if (roleOf(c.actor) !== 'medium' || !c.use || c.target == null || isAlive(s, c.target) || !isAlive(s, c.actor)) continue
    if (ROLES[roleOf(c.target)].team !== ROLES.medium.team) continue
    spend(s, c.actor, 'reviver')
    player(s, c.target).alive = true
    info(s, 'peace', `${name(s, c.target)} voltou dos mortos!`)
    log(s, `${name(s, c.actor)} (Médium) ressuscitou ${name(s, c.target)}.`)
  }
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
  for (const [hunter, target] of Object.entries(s.bounty)) {
    const h = player(s, Number(hunter))
    if (target !== id || !h.alive) continue
    h.role = 'aldeao'
    delete s.bounty[h.id]
    tell(s, h.id, `Seu alvo ${p.name} morreu sem ser linchado. Agora você é Aldeão e joga pela Vila.`)
    log(s, `${h.name} (Caçador de Cabeças) perdeu o alvo e virou Aldeão.`)
  }
  if (p.role === 'vingador' && isAlive(s, s.avenge[id])) kill(s, s.avenge[id], `foi levado(a) pela vingança de ${p.name}, o Vingador`)
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
  if (isAlive(s, target)) kill(s, target, `foi levado(a) junto por ${name(s, hunter)}, ${ROLES[player(s, hunter).role].name}`)
  else info(s, 'bow', `${name(s, hunter)} partiu sem levar ninguém.`)
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

/** Votes the most voted player needs to be lynched: half of the living, rounded down. */
export const votesNeeded = (s: GameState) => Math.max(1, Math.floor(alive(s).length / 2))

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
  const voters = new Map<number, number[]>()
  for (const [v, t] of Object.entries(s.votes)) {
    const k = t ?? SKIP
    tally.set(k, (tally.get(k) ?? 0) + voteWeight(s, Number(v)))
    voters.set(k, [...(voters.get(k) ?? []), Number(v)])
  }
  // Classic: skips don't compete, but the most voted needs votes from at least half of the living.
  const need = votesNeeded(s)
  const counted = [...tally].filter(([t]) => t !== SKIP)
  const max = Math.max(0, ...counted.map(([, n]) => n))
  const top = max >= need ? counted.filter(([, n]) => n === max).map(([t]) => t) : []
  const tallies: Note[] = [...tally].sort((a, b) => b[1] - a[1]).map(([t, n]) => ({ kind: 'tally', id: t === SKIP ? null : t, votes: n, voters: voters.get(t) }))
  s.announcements = []
  log(s, `Votos: ${tallies.map((t) => noteText(s, t)).join(', ')}.`, 'vote')
  s.phase = 'announce'
  if (top.length === 1) accuse(s, top[0])
  else if (top.length > 1 && s.settings.tie === 'sorteio') {
    const pick = pickOne(s, top)
    info(s, 'scale', `Empate! O sorteio escolheu ${name(s, pick)}.`)
    accuse(s, pick)
  } else info(s, 'scale', top.length > 1 ? 'Empate! Ninguém foi linchado hoje.' : max > 0 ? `Ninguém teve votos suficientes: eram precisos ${need}.` : NO_LYNCH)
  const reveal = s.settings.voteReveal
  if (reveal !== 'nada') s.announcements.unshift(...tallies.map((t) => (reveal === 'nomes' ? t : { ...t, voters: undefined })))
  return s
}

/** Show-of-hands vote: the host marks who was lynched, or null for nobody. */
export function openVote(prev: GameState, target: number | null): GameState {
  if (prev.phase !== 'vote') return prev
  const s = structuredClone(prev)
  s.announcements = []
  s.phase = 'announce'
  if (isAlive(s, target)) accuse(s, target)
  else info(s, 'scale', NO_LYNCH)
  return s
}

/** The vote's choice: defends first when the rules give a defense, otherwise is lynched right away. */
function accuse(s: GameState, id: number) {
  if (s.settings.defenseSeconds > 0) { s.accused = id; s.phase = 'defense' }
  else lynch(s, id)
}

/** After the defense, the village (show of hands) confirms the lynch or spares the accused. */
export function confirmLynch(prev: GameState, yes: boolean): GameState {
  if (prev.phase !== 'defense' || prev.accused == null) return prev
  const s = structuredClone(prev)
  const id = s.accused!
  s.accused = null
  s.announcements = s.announcements.filter((n) => n.kind === 'tally')
  if (yes) lynch(s, id)
  else { info(s, 'scale', `${name(s, id)} se defendeu e foi poupado(a).`); log(s, `A vila poupou ${name(s, id)} após a defesa.`, 'vote') }
  s.phase = 'announce'
  return s
}

function lynch(s: GameState, id: number) {
  const p = player(s, id)
  log(s, `A vila linchou ${p.name}.`, 'vote')
  const hunter = Object.entries(s.bounty).map(([h, t]) => [Number(h), t]).find(([h, t]) => t === id && isAlive(s, h))?.[0]
  if (hunter != null) delete s.bounty[hunter] // won: he must not turn Aldeão as his target dies
  kill(s, id, 'foi linchado(a) pela vila')
  if (hunter != null) s.winner = withSharers(s, { title: winTitle('cacador_cabecas'), team: 'solo', ids: [hunter] })
  else if (ROLES[p.role].winsIfLynched) s.winner = withSharers(s, { title: winTitle(p.role), team: 'solo', ids: [id] })
}

/** Which public day power a player has right now, if any. */
export function dayPowerOf(s: GameState, id: number): 'prefeito' | 'atirador' | 'sacerdote' | null {
  const p = player(s, id)
  if (!p.alive) return null
  if (p.role === 'prefeito' && !s.revealed.includes(id)) return 'prefeito'
  // Classic: no shooting on the first day, and one shot per day.
  if (p.role === 'atirador' && canUse(s, id, 'bala') && s.day > 1 && s.shotOnDay !== s.day) return 'atirador'
  if (p.role === 'sacerdote' && canUse(s, id, 'agua')) return 'sacerdote'
  return null
}

export const bulletsLeft = (s: GameState, id: number) => (ROLES.atirador.power!.uses ?? 1) - s.used.filter((u) => u === `${id}:bala`).length

/** During the discussion: the Prefeito reveals himself, the Atirador shoots or the Sacerdote throws holy water (both get revealed). */
export function dayPower(prev: GameState, actor: number, target: number | null = null): GameState {
  const power = prev.phase === 'day' ? dayPowerOf(prev, actor) : null
  if (!power || (power !== 'prefeito' && (!isAlive(prev, target) || target === actor))) return prev
  const s = structuredClone(prev)
  s.announcements = []
  if (!s.revealed.includes(actor)) s.revealed.push(actor)
  if (power === 'prefeito') {
    info(s, 'scale', `${name(s, actor)} se revelou Prefeito! O voto dele(a) vale 2 daqui em diante.`)
    log(s, `${name(s, actor)} se revelou Prefeito.`)
  } else if (power === 'sacerdote') {
    spend(s, actor, 'agua')
    const wolf = isWolf(player(s, target!).role)
    log(s, `${name(s, actor)} (Sacerdote) jogou água benta em ${name(s, target!)}.`)
    if (wolf) kill(s, target!, `foi queimado(a) pela água benta de ${name(s, actor)}, o Sacerdote`)
    else kill(s, actor, `jogou água benta em ${name(s, target!)}, que não era lobo, e morreu`)
  } else {
    spend(s, actor, 'bala')
    s.shotOnDay = s.day
    log(s, `${name(s, actor)} (Atirador) atirou em ${name(s, target!)}.`)
    kill(s, target!, `foi baleado(a) por ${name(s, actor)}, o Atirador`)
  }
  s.phase = 'announce'
  s.next = 'day'
  return s
}
