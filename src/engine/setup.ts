import { ROLES, ROLE_LIST, isWolf, type RoleId } from './roles'

export const MIN_PLAYERS = 4
export const MAX_PLAYERS = 20

export interface Settings {
  /** On: roles come from `pool` and are dealt at random. Off: the host assigns each role in `fixed`. */
  randomRoles: boolean
  revealOnDeath: boolean
  discussionSeconds: number
  voteMode: 'secreta' | 'aberta'
  narration: boolean
  /** narrador = the app runs the match and speaks; humano = it runs the match silently and a person reads its lines; cartas = it only deals roles. */
  mode: 'narrador' | 'humano' | 'cartas'
  /** What the secret vote result shows: nothing but the verdict, the counts, or who voted for whom. */
  voteReveal: 'nada' | 'contagem' | 'nomes'
  tie: 'ninguem' | 'sorteio'
  /** Seconds the most-voted player gets to defend before the village confirms. 0 skips the defense. */
  defenseSeconds: number
  sound: boolean
}

export const defaultSettings: Settings = {
  randomRoles: true, revealOnDeath: true, discussionSeconds: 120, voteMode: 'secreta', narration: true, mode: 'narrador', tie: 'ninguem', defenseSeconds: 45, sound: true,
  voteReveal: 'nomes',
}

export interface Lineup {
  names: string[]
  /** Roles to deal when `randomRoles` is on. May hold more roles than players: the game draws from it. */
  pool: RoleId[]
  fixed: Record<string, RoleId>
  settings: Settings
}

export const rolesFor = (l: Lineup): RoleId[] => (l.settings.randomRoles ? l.pool : l.names.map((n) => l.fixed[n] ?? 'aldeao'))

/** Reasons the lineup can't start yet, most important first. */
export function lineupProblems(l: Lineup): string[] {
  const n = l.names.length
  const roles = rolesFor(l)
  return [
    n < MIN_PLAYERS && `Adicione pelo menos ${MIN_PLAYERS} jogadores.`,
    n > MAX_PLAYERS && `No máximo ${MAX_PLAYERS} jogadores.`,
    roles.length < n && `Faltam ${n - roles.length} papéis.`,
    !roles.some(isWolf) && 'É preciso pelo menos um lobo.',
    ROLE_LIST.some((r) => !r.multi && roles.filter((x) => x === r.id).length > 1) && 'Papéis únicos não podem se repetir.',
  ].filter((p): p is string => !!p)
}

export const wolfTarget = (n: number) => Math.max(1, Math.round(n / 4))

export const balance = (roles: RoleId[]) => roles.reduce((sum, r) => sum + ROLES[r].weight, 0)

export function preset(n: number): RoleId[] {
  const wolves: RoleId[] = ['lobisomem', 'lobo_alfa', 'lobo_sombra', 'lobo_uivante']
  const solos: RoleId[] = n >= 12 ? ['tolo', 'assassino', 'cacador_cabecas'] : n >= 10 ? ['tolo', 'cacador_cabecas'] : n >= 9 ? ['tolo'] : []
  const specials: RoleId[] = ['vidente', 'medico', 'cacador', 'bruxa', 'vingador', 'cupido', 'vidente_aura', 'ferreiro', 'sacerdote', 'rastreador', 'guarda_costas', 'dama_vermelho', 'herdeiro', 'prefeito', 'amaldicoado', 'faroleiro', 'sonambulo']
  const out: RoleId[] = []
  for (let i = 0; i < wolfTarget(n); i++) out.push(wolves[i] ?? 'lobisomem')
  out.push(...solos)
  out.push(...specials.slice(0, Math.ceil((n - out.length) * 0.66)))
  while (out.length < n) out.push('aldeao')
  return out.slice(0, n)
}
