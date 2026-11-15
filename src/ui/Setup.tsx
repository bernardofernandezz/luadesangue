import { AnimatePresence, Reorder, motion, useDragControls } from 'motion/react'
import { useRef, useState } from 'react'
import type { Settings } from '../engine/game'
import { ROLES, ROLE_LIST, TEAM_LABEL, balance, isWolf, preset, type RoleId, type Team } from '../engine/roles'
import { Avatar, Btn, IconBtn, RoleBadge, RoleCard, RoleHeader, Screen, Sheet, Switch, spring, teamText } from './components'
import { AVATARS, AvatarArt, fallbackAvatar, randomAvatar, toThumb } from './avatars'
import { Icon } from './icons'

export interface SetupData { names: string[]; pool: RoleId[]; fixed: Record<string, RoleId>; photos: Record<string, string>; settings: Settings }

export const defaultSetup: SetupData = {
  names: [], pool: [], fixed: {}, photos: {},
  settings: { randomRoles: true, revealOnDeath: true, discussionSeconds: 120, voteMode: 'secreta', narration: true, mode: 'narrador', tie: 'ninguem' },
}

export const rolesFor = (d: SetupData): RoleId[] => d.settings.randomRoles ? d.pool : d.names.map((n) => d.fixed[n] ?? 'aldeao')

export function Setup({ data, onChange, onStart, onHelp, onGuide }: { data: SetupData; onChange: (d: SetupData) => void; onStart: () => void; onHelp: () => void; onGuide: () => void }) {
  const [step, setStep] = useState(0)
  const { names, pool, settings } = data
  const n = names.length
  const roles = rolesFor(data)
  const set = (patch: Partial<SetupData>) => onChange({ ...data, ...patch })
  const setS = (patch: Partial<Settings>) => set({ settings: { ...settings, ...patch } })

  const problems = [
    n < 4 && 'Adicione pelo menos 4 jogadores.',
    roles.length < n && `Faltam ${n - roles.length} papéis.`,
    !roles.some(isWolf) && 'É preciso pelo menos um lobo.',
    ROLE_LIST.some((r) => !r.multi && roles.filter((x) => x === r.id).length > 1) && 'Papéis únicos não podem se repetir.',
  ].filter(Boolean) as string[]

  const next = () => { if (step === 0 && !pool.length) set({ pool: preset(n) }); setStep(step + 1) }
  const steps = ['Jogadores', 'Papéis', 'Regras']

  return (
    <Screen
      lead={<p className="font-display text-3xl italic text-gradient leading-tight">Lua de Sangue</p>}
      footer={
        <>
          {step === 1 && <Balance roles={roles} n={n} />}
          {step > 0 && problems[0] && <p className="text-center text-sm text-solo">{problems[0]}</p>}
          <div className="flex gap-2">
            {step > 0 && <Btn kind="ghost" className="px-4" onClick={() => setStep(step - 1)}><Icon name="back" size={20} /><span className="sr-only">Voltar</span></Btn>}
            {step < 2
              ? <Btn className="flex-1" disabled={n < 4} onClick={next}>{step === 0 && n < 4 ? `Adicione mais ${4 - n}` : 'Próximo'}</Btn>
              : <Btn className="flex-1" icon="moon" disabled={problems.length > 0} onClick={onStart}>Começar a partida</Btn>}
          </div>
        </>
      }>
      <IconBtn name="help" label="Como jogar" onClick={onHelp} className="fixed top-5 left-[max(1.25rem,calc(50%-14rem+1.25rem))] z-30" />
      <IconBtn name="book" label="Guia de papéis" onClick={onGuide} className="fixed top-5 right-[max(1.25rem,calc(50%-14rem+1.25rem))] z-30" />
      <nav className="relative mb-7 grid grid-cols-3 rounded-2xl card glass p-1" aria-label="Etapas">
        {steps.map((s, i) => (
          <button key={s} onClick={() => (i === 0 || n >= 4) && setStep(i)} aria-current={i === step}
            className={`relative z-10 rounded-xl py-2.5 text-sm font-medium transition-colors ${i === step ? 'text-bg' : 'text-muted'}`}>
            {i === step && <motion.span layoutId="step" transition={spring} className="absolute inset-0 -z-10 rounded-xl bg-moon shadow-[0_1px_12px_rgb(255_255_255/.15)]" />}
            {s}
          </button>
        ))}
      </nav>
      <AnimatePresence mode="wait">
        <motion.div key={step} initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }} transition={{ duration: 0.2 }}>
          {step === 0 && <Players data={data} set={set} />}
          {step === 1 && <Roles data={data} set={set} setS={setS} />}
          {step === 2 && <Rules settings={settings} setS={setS} n={n} roles={roles} />}
        </motion.div>
      </AnimatePresence>
    </Screen>
  )
}

// ───────────── Jogadores ─────────────

function Players({ data, set }: { data: SetupData; set: (p: Partial<SetupData>) => void }) {
  const [draft, setDraft] = useState('')
  const [photoFor, setPhotoFor] = useState<string | null>(null)
  const { names, photos } = data
  const remove = (nm: string) => {
    const { [nm]: _gone, ...rest } = photos
    set({ names: names.filter((x) => x !== nm), photos: rest })
  }
  const dup = names.some((x) => x.toLowerCase() === draft.trim().toLowerCase())
  const add = () => {
    const v = draft.trim()
    if (!v || dup || names.length >= 20) return
    set({ names: [...names, v], photos: { ...photos, [v]: photos[v] ?? randomAvatar(Object.values(photos)) } }); setDraft('')
  }
  return (
    <section>
      <h2 className="text-2xl font-semibold tracking-tight">Quem vai jogar?</h2>
      <p className="mt-1 text-sm text-muted">De 4 a 20 pessoas. Arraste para pôr na ordem em que estão sentadas.</p>
      <form className="mt-5 flex gap-2" onSubmit={(e) => { e.preventDefault(); add() }}>
        <input value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Nome do jogador" maxLength={16} aria-label="Nome do jogador" enterKeyHint="done"
          className="min-h-13 min-w-0 flex-1 rounded-2xl card px-4 text-base outline-none placeholder:text-muted/70 focus:ring-2 focus:ring-moon/50" />
        <Btn className="w-13 px-0" disabled={!draft.trim() || dup} onClick={add}><Icon name="plus" size={22} /><span className="sr-only">Adicionar</span></Btn>
      </form>
      {dup && <p className="mt-2 text-sm text-solo">Esse nome já está na lista.</p>}
      <Reorder.Group axis="y" values={names} onReorder={(v) => set({ names: v })} className="mt-5 space-y-2">
        <AnimatePresence initial={false}>
          {names.map((nm, i) => <PlayerRow key={nm} name={nm} index={i} onRemove={() => remove(nm)} onPhoto={() => setPhotoFor(nm)} />)}
        </AnimatePresence>
      </Reorder.Group>
      {!names.length && (
        <div className="mt-10 flex flex-col items-center text-center text-muted">
          <Icon name="users" size={40} className="text-line" />
          <p className="mt-3 text-sm">Ninguém ainda. Digite o primeiro nome acima.</p>
        </div>
      )}
      <PhotoPicker name={photoFor} photo={photoFor ? photos[photoFor] ?? fallbackAvatar(photoFor) : ''} onClose={() => setPhotoFor(null)}
        onPick={(v) => photoFor && set({ photos: { ...photos, [photoFor]: v } })} />
    </section>
  )
}

function PlayerRow({ name, index, onRemove, onPhoto }: { name: string; index: number; onRemove: () => void; onPhoto: () => void }) {
  const controls = useDragControls()
  return (
    <Reorder.Item value={name} dragListener={false} dragControls={controls}
      initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -40, transition: { duration: 0.15 } }}
      whileDrag={{ scale: 1.03, boxShadow: '0 12px 30px rgb(0 0 0 / .4)' }}
      className="flex items-center gap-3 rounded-2xl card py-2 pr-2 pl-1">
      <span onPointerDown={(e) => controls.start(e)} className="grid h-10 w-8 cursor-grab touch-none place-items-center text-muted" aria-label={`Arrastar ${name}`}>
        <Icon name="grip" size={18} />
      </span>
      <button onClick={onPhoto} className="relative rounded-full" aria-label={`Trocar foto de ${name}`}>
        <Avatar p={{ name }} size={38} />
        <span className="absolute -right-1 -bottom-1 grid size-4.5 place-items-center rounded-full border border-line bg-bg text-muted"><Icon name="plus" size={10} /></span>
      </button>
      <span className="flex-1 truncate font-medium">{name}</span>
      <span className="text-xs text-muted tabular-nums">{index + 1}º</span>
      <button onClick={onRemove} className="grid size-10 place-items-center rounded-xl text-muted hover:text-lobos" aria-label={`Remover ${name}`}><Icon name="close" size={18} /></button>
    </Reorder.Item>
  )
}

function PhotoPicker({ name, photo, onPick, onClose }: { name: string | null; photo: string; onPick: (v: string) => void; onClose: () => void }) {
  const upload = async (f?: File) => {
    if (!f) return
    try { onPick(await toThumb(f)); onClose() } catch { alert('Não foi possível usar essa imagem. Tente outra.') }
  }
  return (
    <Sheet open={!!name} onClose={onClose} title={`Foto de ${name ?? ''}`}>
      {name && <div className="mx-auto mb-5 w-fit"><Avatar p={{ name }} size={96} /></div>}
      <label className="glass flex min-h-12 cursor-pointer items-center justify-center gap-2 rounded-full border border-line bg-white/[.02] text-[15px] font-medium hover:bg-white/[.06]">
        <Icon name="plus" size={20} />Enviar foto própria
        <input type="file" accept="image/*" className="sr-only" onChange={(e) => { upload(e.target.files?.[0]); e.target.value = '' }} />
      </label>
      <p className="mt-6 mb-3 font-mono text-[11px] font-medium tracking-[.14em] text-muted uppercase">Ou escolha um avatar</p>
      <div className="grid grid-cols-4 gap-3">
        {AVATARS.map((a) => {
          const v = `a:${a.id}`
          return (
            <button key={a.id} onClick={() => { onPick(v); onClose() }} aria-label={a.name} aria-pressed={photo === v}
              className={`mx-auto rounded-full p-1 transition-shadow ${photo === v ? 'ring-2 ring-white' : 'ring-1 ring-transparent'}`}>
              <span className="block overflow-hidden rounded-full"><AvatarArt photo={v} size={60} /></span>
            </button>
          )
        })}
      </div>
    </Sheet>
  )
}

// ───────────── Papéis ─────────────

function Balance({ roles, n }: { roles: RoleId[]; n: number }) {
  const draw = roles.length > n
  const b = balance(roles)
  const pos = Math.max(4, Math.min(96, 50 + b * 4))
  const verdict = draw ? `O jogo sorteia ${n} destes` : b > 4 ? 'Favorece a Vila' : b < -4 ? 'Favorece os Lobos' : 'Equilibrado'
  return (
    <div className="rounded-2xl card p-3.5">
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

function Roles({ data, set, setS }: { data: SetupData; set: (p: Partial<SetupData>) => void; setS: (p: Partial<Settings>) => void }) {
  const [team, setTeam] = useState<Team>('vila')
  const [info, setInfo] = useState<RoleId | null>(null)
  const [pickFor, setPickFor] = useState<string | null>(null)
  const { pool, names, settings } = data
  const count = (r: RoleId) => pool.filter((x) => x === r).length
  const add = (r: RoleId) => {
    if (!ROLES[r].multi && count(r)) return remove(r)
    set({ pool: [...pool, r] })
  }
  const remove = (r: RoleId) => { const i = pool.lastIndexOf(r); if (i >= 0) set({ pool: pool.filter((_, k) => k !== i) }) }

  return (
    <section>
      <div className="flex items-end justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Papéis</h2>
          <p className="mt-1 text-sm text-muted">{settings.randomRoles ? 'Toque para adicionar, segure para ler. Pode escolher mais papéis que jogadores: o jogo sorteia quais entram.' : 'Escolha o papel de cada jogador.'}</p>
        </div>
        {settings.randomRoles && (
          <div className="flex shrink-0 gap-2">
            <Btn kind="ghost" className="min-h-10 px-3 text-sm" onClick={() => set({ pool: pool.length >= ROLE_LIST.length ? [] : ROLE_LIST.map((r) => r.id) })}>{pool.length >= ROLE_LIST.length ? 'Limpar' : 'Todos'}</Btn>
            <Btn kind="ghost" icon="sparkle" className="min-h-10 px-3 text-sm" onClick={() => set({ pool: preset(names.length) })}>Sugerir</Btn>
          </div>
        )}
      </div>

      <div className="mt-5"><Switch label="Sortear papéis" hint={settings.randomRoles ? 'Ninguém sabe quem recebeu o quê.' : 'Você escolhe o papel de cada um.'} checked={settings.randomRoles} onChange={(v) => setS({ randomRoles: v })} /></div>

      {settings.randomRoles ? (
        <>
          <div className="relative mt-5 grid grid-cols-3 rounded-2xl card glass p-1">
            {(['vila', 'lobos', 'solo'] as const).map((t) => {
              const c = pool.filter((r) => ROLES[r].team === t).length
              return (
                <button key={t} onClick={() => setTeam(t)} aria-pressed={team === t}
                  className={`relative z-10 rounded-xl py-2 text-sm font-medium transition-colors ${team === t ? teamText[t] : 'text-muted'}`}>
                  {team === t && <motion.span layoutId="team" transition={spring} className="absolute inset-0 -z-10 rounded-xl bg-raised" />}
                  {TEAM_LABEL[t]} {c > 0 && <span className="text-xs opacity-70">· {c}</span>}
                </button>
              )
            })}
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
          {names.map((nm) => {
            const r = data.fixed[nm] ?? 'aldeao'
            return (
              <li key={nm}>
                <button onClick={() => setPickFor(nm)} className="flex w-full items-center gap-3 rounded-2xl card p-2.5 text-left">
                  <Avatar p={{ name: nm }} size={34} />
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
        {info && <><RoleHeader role={info} /><div className="mt-6"><RoleCard role={info} /></div></>}
      </Sheet>
      <Sheet open={!!pickFor} onClose={() => setPickFor(null)} title={`Papel de ${pickFor ?? ''}`}>
        <div className="grid grid-cols-3 gap-2.5">
          {ROLE_LIST.map((r) => (
            <button key={r.id} onClick={() => { set({ fixed: { ...data.fixed, [pickFor!]: r.id } }); setPickFor(null) }}
              className={`flex flex-col items-center gap-2 rounded-2xl p-3 ${data.fixed[pickFor ?? ''] === r.id ? 'bg-white/[.07] ring-1 ring-white/60' : 'card'}`}>
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

// ───────────── Regras ─────────────

function Rules({ settings, setS, n, roles }: { settings: Settings; setS: (p: Partial<Settings>) => void; n: number; roles: RoleId[] }) {
  const mins = `${Math.floor(settings.discussionSeconds / 60)}:${String(settings.discussionSeconds % 60).padStart(2, '0')}`
  return (
    <section className="space-y-3">
      <h2 className="text-2xl font-semibold tracking-tight">Regras da partida</h2>
      <p className="-mt-1 pb-2 text-sm text-muted">Dá para deixar como está. Tudo pode mudar na próxima partida.</p>
      <Choice title="Modo" value={settings.mode} set={(mode) => setS({ mode })} options={[
        ['narrador', 'Narrador automático', 'O app conduz noite, dia e votação.'],
        ['cartas', 'Só distribuir papéis', 'Cada um vê sua carta; um narrador humano conduz.'],
      ]} />
      {settings.mode === 'narrador' && <>
      <Switch label="Revelar papel ao morrer" hint="Quem morre mostra quem era. Desligado é mais difícil." checked={settings.revealOnDeath} onChange={(v) => setS({ revealOnDeath: v })} />
      <Switch label="Narração por voz" hint="O celular lê os anúncios em voz alta." checked={settings.narration} onChange={(v) => setS({ narration: v })} />
      <Choice title="Votação" value={settings.voteMode} set={(voteMode) => setS({ voteMode })} options={[
        ['secreta', 'Secreta', 'Cada um vota no celular, escondido.'],
        ['aberta', 'Aberta', 'Mão levantada; o anfitrião marca.'],
      ]} />
      <Choice title="Empate na votação" value={settings.tie} set={(tie) => setS({ tie })} options={[
        ['ninguem', 'Ninguém morre', 'Empatou, ninguém é linchado.'],
        ['sorteio', 'Sorteio', 'Um dos empatados é sorteado.'],
      ]} />
      <div className="rounded-3xl card p-4">
        <div className="flex justify-between"><span className="font-medium">Tempo de discussão</span><span className="text-moon tabular-nums">{mins}</span></div>
        <input type="range" min={30} max={600} step={30} value={settings.discussionSeconds} aria-label="Tempo de discussão"
          onChange={(e) => setS({ discussionSeconds: Number(e.target.value) })} className="mt-4 w-full" />
      </div>
      </>}
      <div className="flex items-center gap-3 rounded-3xl border border-line bg-white/[.03] p-4 text-sm">
        <Icon name="users" size={20} className="shrink-0 text-moon" />
        <p>{n} jogadores · {roles.length > n ? `${n} de ${roles.length} papéis sorteados` : `${roles.filter(isWolf).length} lobo(s)`} · {settings.randomRoles ? 'papéis sorteados' : 'papéis escolhidos'}{settings.mode === 'cartas' && ' · só distribuição'}</p>
      </div>
    </section>
  )
}

function Choice<T extends string>({ title, value, set, options }: { title: string; value: T; set: (v: T) => void; options: [T, string, string][] }) {
  return (
    <div className="rounded-3xl card p-4">
      <p className="font-medium">{title}</p>
      <div className="mt-3 grid grid-cols-2 gap-2">
        {options.map(([v, label, hint]) => (
          <button key={v} onClick={() => set(v)} aria-pressed={value === v}
            className={`rounded-2xl p-3 text-left text-sm transition-colors ${value === v ? 'bg-white/[.07] ring-1 ring-white/60' : 'bg-raised'}`}>
            <span className="block font-medium">{label}</span>
            <span className="mt-0.5 block text-muted">{hint}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
