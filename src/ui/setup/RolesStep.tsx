import { AnimatePresence, motion } from 'motion/react'
import { useRef, useState } from 'react'
import { ROLES, ROLE_LIST, type RoleId, type Team } from '../../engine/roles'
import { balance, preset, rolesFor, type Settings } from '../../engine/setup'
import { Btn, Segmented, Switch } from '../kit/controls'
import { selectedClass, spring } from '../kit/styles'
import { Icon } from '../kit/icons'
import { Sheet } from '../kit/layout'
import { Avatar } from '../players/Avatar'
import { RoleBadge, RoleDetails } from '../roles/RoleViews'
import { TEAM_LABEL, teamText } from '../roles/teamStyles'
import type { SetupData } from './data'

export function Balance({ roles, n }: { roles: RoleId[]; n: number }) {
  const draw = roles.length > n
  const b = balance(roles)
  const pos = Math.max(4, Math.min(96, 50 + b * 4))
  const verdict = draw ? `O jogo sorteia ${n} destes` : b > 4 ? 'Favorece a Vila' : b < -4 ? 'Favorece os Lobos' : 'Equilibrado'
  return (
    <div className="rounded-2xl border border-line bg-[#0b0b0b] p-3.5">
      <div className="flex items-center justify-between text-xs">
        <span className="font-medium"><span className={roles.length >= n ? 'text-vila' : 'text-solo'}>{roles.length}</span><span className="text-muted">/{n} papéis</span></span>
        <span className="text-muted">{verdict}</span>
      </div>
      <div className="relative mt-2.5 h-1.5 rounded-full bg-gradient-to-r from-lobos/70 via-raised to-vila/70" role="meter" aria-valuenow={b} aria-label={`Equilíbrio: ${verdict}`}>
        <motion.span animate={{ left: `${pos}%` }} transition={spring} className="absolute top-1/2 size-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-text ring-4 ring-surface" />
      </div>
    </div>
  )
}

export function RolesStep({ data, set, setS }: { data: SetupData; set: (p: Partial<SetupData>) => void; setS: (p: Partial<Settings>) => void }) {
  const [team, setTeam] = useState<Team>('vila')
  const [info, setInfo] = useState<RoleId | null>(null)
  const [pickFor, setPickFor] = useState<string | null>(null)
  const { pool, names, settings } = data
  const assigned = rolesFor(data)
  const count = (r: RoleId) => pool.filter((x) => x === r).length
  const add = (r: RoleId) => {
    if (!ROLES[r].multi && count(r)) return remove(r)
    set({ pool: [...pool, r] })
  }
  const remove = (r: RoleId) => { const i = pool.lastIndexOf(r); if (i >= 0) set({ pool: pool.filter((_, k) => k !== i) }) }

  return (
    <section>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0 flex-1 basis-64">
          <h2 className="text-2xl font-semibold tracking-tight">Papéis</h2>
          <p className="mt-1 text-sm text-muted">{settings.randomRoles ? 'Toque para adicionar, segure para ler. Pode escolher mais papéis que jogadores: o jogo sorteia quais entram.' : 'Escolha o papel de cada jogador.'}</p>
        </div>
        {settings.randomRoles && (
          <div className="flex gap-2">
            <Btn kind="ghost" size="sm" onClick={() => set({ pool: pool.length >= ROLE_LIST.length ? [] : ROLE_LIST.map((r) => r.id) })}>{pool.length >= ROLE_LIST.length ? 'Limpar' : 'Todos'}</Btn>
            <Btn kind="ghost" size="sm" icon="sparkle" onClick={() => set({ pool: preset(names.length) })}>Sugerir</Btn>
          </div>
        )}
      </div>

      <div className="mt-5"><Switch label="Sortear papéis" hint={settings.randomRoles ? 'Ninguém sabe quem recebeu o quê.' : 'Você escolhe o papel de cada um.'} checked={settings.randomRoles} onChange={(v) => setS({ randomRoles: v })} /></div>

      {settings.randomRoles ? (
        <>
          <div className="mt-5">
            <Segmented id="team" label="Times" value={team} onChange={setTeam} options={(['vila', 'lobos', 'solo'] as const).map((t) => {
              const c = pool.filter((r) => ROLES[r].team === t).length
              return { value: t, className: teamText[t], label: <>{TEAM_LABEL[t]} {c > 0 && <span className="text-xs opacity-70">· {c}</span>}</> }
            })} />
          </div>
          <motion.div layout className="mt-4 grid grid-cols-3 gap-2.5">
            <AnimatePresence mode="popLayout">
              {ROLE_LIST.filter((r) => r.team === team).map((r, i) => (
                <RoleTile key={r.id} role={r.id} count={count(r.id)} i={i} onAdd={() => add(r.id)} onRemove={() => remove(r.id)} onInfo={() => setInfo(r.id)} />
              ))}
            </AnimatePresence>
          </motion.div>
        </>
      ) : (
        <ul className="mt-5 space-y-2">
          {names.map((nm, i) => {
            const r = assigned[i]
            return (
              <li key={nm}>
                <button onClick={() => setPickFor(nm)} className="flex w-full items-center gap-3 rounded-2xl card p-2.5 text-left">
                  <Avatar name={nm} size={34} />
                  <span className="flex-1 truncate font-medium">{nm}</span>
                  <span className={`text-sm ${teamText[ROLES[r].team]}`}>{ROLES[r].name}</span>
                  <RoleBadge role={r} size={34} />
                </button>
              </li>
            )
          })}
        </ul>
      )}

      <Sheet open={!!info} onClose={() => setInfo(null)} title="Detalhes do papel">
        {info && <RoleDetails role={info} />}
      </Sheet>
      <Sheet open={!!pickFor} onClose={() => setPickFor(null)} title={`Papel de ${pickFor ?? ''}`}>
        <div className="grid grid-cols-3 gap-2.5">
          {ROLE_LIST.map((r) => (
            <button key={r.id} onClick={() => { set({ fixed: { ...data.fixed, [pickFor!]: r.id } }); setPickFor(null) }}
              className={`flex flex-col items-center gap-2 rounded-2xl p-3 ${data.fixed[pickFor ?? ''] === r.id ? selectedClass : 'card'}`}>
              <RoleBadge role={r.id} size={40} />
              <span className="text-center text-xs leading-tight font-medium">{r.name}</span>
            </button>
          ))}
        </div>
      </Sheet>
    </section>
  )
}

function RoleTile({ role, count, i, onAdd, onRemove, onInfo }: { role: RoleId; count: number; i: number; onAdd: () => void; onRemove: () => void; onInfo: () => void }) {
  const r = ROLES[role]
  const timer = useRef(0)
  const long = useRef(false)
  const down = () => { long.current = false; timer.current = window.setTimeout(() => { long.current = true; navigator.vibrate?.(20); onInfo() }, 450) }
  const up = () => clearTimeout(timer.current)
  return (
    <motion.div layout initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} transition={{ delay: i * 0.02 }} className="relative">
      <motion.button whileTap={{ scale: 0.94 }} onPointerDown={down} onPointerUp={up} onPointerLeave={up} onContextMenu={(e) => e.preventDefault()}
        onClick={() => { if (!long.current) onAdd() }} aria-label={`${r.name}${count ? `, ${count} na partida` : ''}. Toque para adicionar.`}
        className={`flex w-full flex-col items-center gap-2 rounded-2xl px-1.5 pt-4 pb-3 transition-colors select-none ${count ? 'bg-moon/10 ring-1 ring-white/50' : 'card'}`}>
        <RoleBadge role={role} size={44} />
        <span className="text-center text-[13px] leading-tight font-medium">{r.name}</span>
        {r.novo && <span className="text-[9px] font-semibold tracking-widest text-moon uppercase">Novo</span>}
      </motion.button>
      <AnimatePresence>
        {count > 0 && (
          <>
            <motion.span key="c" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} transition={spring}
              className="pointer-events-none absolute top-2 right-2 grid size-6 place-items-center rounded-full bg-moon text-xs font-bold text-bg">{count}</motion.span>
            <motion.button key="m" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} transition={spring} onClick={onRemove}
              aria-label={`Remover ${r.name}`} className="absolute top-1.5 left-1.5 grid size-7 place-items-center rounded-full bg-raised text-muted">
              <Icon name="minus" size={14} />
            </motion.button>
          </>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
