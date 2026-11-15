import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useState, type ReactNode } from 'react'
import { alive, canUse, player, seerSees, type GameState, type NightChoice, type Note, type Player } from '../engine/game'
import { ROLES, isWolf, type RoleId } from '../engine/roles'
import { Avatar, Btn, ConfirmBar, Letters, PassTo, PlayerGrid, RoleBadge, RoleCard, RoleHeader, Screen, Sheet, spring, teamText } from './components'
import { Icon, RoleIcon, type UiIconName } from './icons'

type Act<T extends unknown[] = []> = (...a: T) => void

// ───────────────────────── Revelação ─────────────────────────

export function Reveal({ s, onNext }: { s: GameState; onNext: Act }) {
  const p = player(s, s.queue[s.cursor])
  return (
    <PassTo key={p.id} p={p} why="Revelação dos papéis" step={s.cursor} total={s.queue.length}>
      <RevealCard s={s} p={p} onNext={onNext} />
    </PassTo>
  )
}

function useReadDelay(ms: number) {
  const [ready, setReady] = useState(false)
  useEffect(() => { const t = setTimeout(() => setReady(true), ms); return () => clearTimeout(t) }, [ms])
  return ready
}

function RevealCard({ s, p, onNext }: { s: GameState; p: Player; onNext: Act }) {
  const ready = useReadDelay(2000)
  const pack = isWolf(p.role) ? s.players.filter((o) => o.id !== p.id && isWolf(o.role)) : []
  return (
    <Screen kicker={`${p.name}, este é você`}
      footer={<Btn disabled={!ready} onClick={onNext}>{ready ? 'Entendi, esconder' : 'Leia sua carta…'}</Btn>}>
      <motion.div initial={{ rotateY: 90, opacity: 0 }} animate={{ rotateY: 0, opacity: 1 }} transition={{ type: 'spring', stiffness: 120, damping: 16 }}
        style={{ transformPerspective: 900 }}>
        <RoleHeader role={p.role} pulse />
      </motion.div>
      <div className="mt-7">
        <RoleCard role={p.role} stagger={0.35} extra={pack.length > 0 && <Pack wolves={pack} />} />
      </div>
    </Screen>
  )
}

function Pack({ wolves }: { wolves: Player[] }) {
  return (
    <section className="rounded-3xl bg-lobos/10 p-5 ring-1 ring-lobos/25">
      <h3 className="text-[11px] font-mono font-medium tracking-[.14em] text-lobos uppercase">Sua matilha</h3>
      <ul className="mt-3 space-y-2">
        {wolves.map((w) => (
          <li key={w.id} className="flex items-center gap-3"><Avatar p={w} size={32} /><span className="flex-1 font-medium">{w.name}</span><span className="text-sm text-muted">{ROLES[w.role].name}</span></li>
        ))}
      </ul>
    </section>
  )
}

// ───────────────────────── Noite ─────────────────────────

export function Night({ s, onChoose }: { s: GameState; onChoose: Act<[NightChoice]> }) {
  const p = player(s, s.queue[s.cursor])
  return (
    <PassTo key={`${s.day}-${p.id}`} p={p} why={`Noite ${s.day}`} step={s.cursor} total={s.queue.length}>
      <NightTurn s={s} p={p} onChoose={onChoose} />
    </PassTo>
  )
}

function RoleHelp({ role }: { role: RoleId }) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <button onClick={() => setOpen(true)} className="mx-auto mt-3 flex items-center gap-1.5 rounded-full bg-raised px-3 py-1.5 text-xs font-medium text-muted">
        <Icon name="help" size={14} />Como funciona meu papel?
      </button>
      <Sheet open={open} onClose={() => setOpen(false)} title="Sua carta">
        <RoleHeader role={role} />
        <div className="mt-6"><RoleCard role={role} /></div>
      </Sheet>
    </>
  )
}

function NightTurn({ s, p, onChoose }: { s: GameState; p: Player; onChoose: Act<[NightChoice]> }) {
  const [t, setT] = useState<number | null>(null)
  const [t2, setT2] = useState<number | null>(null)
  const [use, setUse] = useState(false)
  const [peek, setPeek] = useState(false)
  const r = p.role
  const def = ROLES[r]
  const nm = (id: number | null) => (id == null ? '' : player(s, id).name)
  const others = (o: Player) => o.id !== p.id
  const toggle = (cur: number | null, set: (v: number | null) => void) => (id: number) => set(cur === id ? null : id)
  const n1 = s.day === 1

  // Defaults: no night action → pick a suspect so nobody can tell roles apart by behaviour.
  let mode = 'idle' as 'idle' | 'act'
  let idleReason = 'Seu papel não age à noite.'
  let body: ReactNode = null
  let ready = t != null
  let summary: ReactNode = t != null ? <>Suspeitar de <b className="text-text">{nm(t)}</b></> : null
  let label = 'Confirmar e esconder'
  let choice: NightChoice = { actor: p.id }
  let onConfirm = () => onChoose(choice)

  const act = (b: ReactNode) => { mode = 'act'; body = b }

  if (isWolf(r)) {
    const marks: Record<number, number> = {}
    for (const c of s.choices) if (isWolf(player(s, c.actor).role) && c.target != null) marks[c.target] = (marks[c.target] ?? 0) + 1
    const pack = s.players.filter((o) => isWolf(o.role) && o.alive && o.id !== p.id)
    act(<>
      {pack.length > 0 && <p className="mb-4 text-center text-sm text-muted">Matilha: <span className="text-lobos">{pack.map((w) => w.name).join(', ')}</span></p>}
      <PlayerGrid players={s.players} selected={[t]} onSelect={setT} can={(o) => !isWolf(o.role)} marks={marks} />
      {r === 'lobo_sombra' && canUse(s, p.id, 'sombra') && <Power icon={<RoleIcon role="lobo_sombra" size={20} />} title="Usar a sombra (1×)" text="Seu alvo vira o alvo da matilha, sem contar os votos." v={use} set={setUse} />}
      {r === 'lobo_uivante' && canUse(s, p.id, 'uivo') && <Power icon={<RoleIcon role="lobo_uivante" size={20} />} title="Uivar (1×)" text="A votação de amanhã será cancelada." v={use} set={setUse} />}
    </>)
    summary = t != null && <>Atacar <b className="text-lobos">{nm(t)}</b>{use && (r === 'lobo_sombra' ? ' · com a sombra' : ' · e uivar')}</>
    choice = { actor: p.id, target: t, use }
  } else if (r === 'vidente') {
    act(<>
      <AnimatePresence mode="wait">
        {peek && t != null
          ? <SeerResult key="r" p={player(s, t)} wolf={seerSees(s, t)} />
          : <motion.div key="g" exit={{ opacity: 0, scale: 0.97 }}><PlayerGrid players={s.players} selected={[t]} onSelect={setT} can={others} /></motion.div>}
      </AnimatePresence>
    </>)
    if (!peek) {
      summary = t != null && <>Investigar <b className="text-text">{nm(t)}</b></>
      label = 'Revelar'
      onConfirm = () => setPeek(true)
    } else { summary = null; choice = { actor: p.id, target: t } }
  } else if (r === 'medico' || r === 'guarda_costas' || r === 'rastreador' || r === 'assassino') {
    const verb = { medico: 'Proteger', guarda_costas: 'Guardar', rastreador: 'Seguir', assassino: 'Matar' }[r]
    act(<PlayerGrid players={s.players} selected={[t]} onSelect={setT} can={r === 'medico' ? undefined : others} />)
    summary = t != null && <>{verb} <b className="text-text">{nm(t)}</b></>
    choice = { actor: p.id, target: t }
  } else if (r === 'bruxa' && (canUse(s, p.id, 'cura') || canUse(s, p.id, 'veneno'))) {
    const cure = canUse(s, p.id, 'cura'); const poison = canUse(s, p.id, 'veneno')
    act(<div className="space-y-6">
      {cure && <Potion icon="heart" color="text-vila" title="Poção de cura" text="Protege alguém de ataques esta noite."><PlayerGrid players={s.players} selected={[t]} onSelect={toggle(t, setT)} /></Potion>}
      {poison && <Potion icon="skull" color="text-lobos" title="Poção de veneno" text="Mata alguém. Nada impede."><PlayerGrid players={s.players} selected={[t2]} onSelect={toggle(t2, setT2)} can={others} /></Potion>}
    </div>)
    ready = true
    const parts = [t != null && `curar ${nm(t)}`, t2 != null && `envenenar ${nm(t2)}`].filter(Boolean)
    const text = parts.join(' · ')
    summary = text ? text[0].toUpperCase() + text.slice(1) : null
    if (!text) label = 'Não usar poções e esconder'
    choice = { actor: p.id, target: cure ? t : null, target2: poison ? t2 : null }
  } else if (r === 'cupido' && n1) {
    const pick = (id: number) => t === id ? setT(null) : t2 === id ? setT2(null) : t == null ? setT(id) : setT2(id)
    act(<PlayerGrid players={s.players} selected={[t, t2]} onSelect={pick} />)
    ready = t != null && t2 != null
    summary = t != null && <>Unir <b className="text-love">{nm(t)}</b>{t2 != null ? <> e <b className="text-love">{nm(t2)}</b></> : ' e…'}</>
    choice = { actor: p.id, target: t, target2: t2 }
  } else if (r === 'herdeiro' && n1) {
    act(<PlayerGrid players={s.players} selected={[t]} onSelect={setT} can={others} />)
    summary = t != null && <>Mentor: <b className="text-text">{nm(t)}</b></>
    choice = { actor: p.id, target: t }
  } else if (r === 'ferreiro' && canUse(s, p.id, 'lamina')) {
    act(<PlayerGrid players={s.players} selected={[t]} onSelect={toggle(t, setT)} />)
    ready = true
    summary = t != null ? <>Entregar a lâmina a <b className="text-text">{nm(t)}</b></> : 'Guardar a lâmina para outra noite'
    choice = { actor: p.id, target: t }
  } else if (r === 'mercador' && s.items.length < 3) {
    act(<>
      <p className="mb-4 text-center text-sm text-muted">Amuletos entregues: <b className="text-solo">{s.items.length}/3</b></p>
      <PlayerGrid players={s.players} selected={[t]} onSelect={setT} can={(o) => others(o) && !s.items.includes(o.id)} />
    </>)
    summary = t != null && <>Dar um amuleto a <b className="text-text">{nm(t)}</b></>
    choice = { actor: p.id, target: t }
  } else if (r === 'faroleiro' && canUse(s, p.id, 'farol')) {
    act(<Power icon={<RoleIcon role="faroleiro" size={20} />} title="Acender o farol" text="Amanhã a vila verá todas as ações desta noite." v={use} set={setUse} big />)
    ready = true
    summary = use ? 'O farol vai brilhar esta noite' : 'Deixar o farol apagado'
    choice = { actor: p.id, use }
  } else if (r === 'sonambulo') {
    idleReason = 'Esta noite você vai andar dormindo até a casa de alguém. O que viu chega na sua próxima vez.'
  } else if (def.prompt) {
    idleReason = 'Você já usou o seu poder. Agora sua arma é a conversa de dia.'
  } else {
    idleReason = `${def.tagline} Sua força aparece de dia.`
  }

  if (mode === 'idle') {
    body = (
      <>
        <div className="mb-5 flex gap-3 rounded-3xl card p-4 text-[15px] leading-relaxed">
          <Icon name="moon" size={20} className="mt-0.5 shrink-0 text-moon" />
          <p>{idleReason} <span className="text-muted">Para ninguém perceber, escolha alguém de quem você suspeita.</span></p>
        </div>
        <PlayerGrid players={s.players} selected={[t]} onSelect={setT} can={others} />
      </>
    )
  }

  const title = mode === 'act' ? def.prompt : 'Quem você acha suspeito?'
  const hint = mode === 'act' ? def.promptHint : undefined
  return (
    <Screen lead={<RoleBadge role={r} size={56} />} kicker={`${def.name} · ${p.name}`} title={title}
      hint={<>{hint}<RoleHelp role={r} /></>}
      footer={<ConfirmBar summary={summary} disabled={!ready} label={label} onConfirm={onConfirm} />}>
      <Letters msgs={s.inbox[p.id]} />
      {body}
    </Screen>
  )
}

function SeerResult({ p, wolf }: { p: Player; wolf: boolean }) {
  return (
    <motion.div initial={{ rotateY: 90, opacity: 0 }} animate={{ rotateY: 0, opacity: 1 }} transition={{ type: 'spring', stiffness: 140, damping: 16 }}
      style={{ transformPerspective: 800 }} role="status"
      className={`flex flex-col items-center rounded-3xl p-8 text-center ring-1 ${wolf ? 'bg-lobos/12 ring-lobos/40' : 'bg-vila/10 ring-vila/30'}`}>
      <Avatar p={p} size={72} />
      <p className="mt-4 text-lg font-medium">{p.name}</p>
      <div className={`mt-4 flex items-center gap-2 text-2xl font-semibold ${wolf ? 'text-lobos' : 'text-vila'}`}>
        {wolf ? <><RoleIcon role="lobisomem" size={28} />É um lobisomem</> : <><Icon name="check" size={28} />Não é lobisomem</>}
      </div>
      <p className="mt-3 text-sm text-muted">Guarde isso com cuidado. Só você sabe.</p>
    </motion.div>
  )
}

function Potion({ icon, color, title, text, children }: { icon: UiIconName; color: string; title: string; text: string; children: ReactNode }) {
  return (
    <section>
      <div className="mb-3 flex items-center gap-3">
        <span className={`grid size-9 place-items-center rounded-full card ${color}`}><Icon name={icon} size={18} /></span>
        <div><p className="font-medium">{title}</p><p className="text-sm text-muted">{text}</p></div>
      </div>
      {children}
    </section>
  )
}

function Power({ icon, title, text, v, set, big }: { icon: ReactNode; title: string; text: string; v: boolean; set: (v: boolean) => void; big?: boolean }) {
  return (
    <motion.button whileTap={{ scale: 0.98 }} onClick={() => set(!v)} aria-pressed={v}
      className={`mt-4 flex w-full items-center gap-4 rounded-3xl p-4 text-left transition-colors ${big ? 'py-6' : ''} ${v ? 'bg-white/[.07] ring-1 ring-white/60' : 'card'}`}>
      <span className={`grid size-11 shrink-0 place-items-center rounded-full ${v ? 'bg-moon text-bg' : 'bg-raised text-moon'}`}>{icon}</span>
      <span className="flex-1"><span className="block font-medium">{title}</span><span className="block text-sm text-muted">{text}</span></span>
      <span className={`grid size-6 place-items-center rounded-full ${v ? 'bg-moon text-bg' : 'ring-1 ring-line'}`}>{v && <Icon name="check" size={14} />}</span>
    </motion.button>
  )
}

// ───────────────────────── Anúncios ─────────────────────────

const noteIcon: Record<string, UiIconName> = { peace: 'peace', lighthouse: 'lighthouse', howl: 'howl', bow: 'bow', scale: 'scale' }

export function Announce({ s, onNext }: { s: GameState; onNext: Act }) {
  const morning = s.next === 'day'
  const ready = useReadDelay(Math.min(3000, 600 + s.announcements.length * 350))
  const maxVotes = Math.max(1, ...s.announcements.map((n) => (n.kind === 'tally' ? n.votes : 0)))
  return (
    <Screen lead={<span className="grid size-14 place-items-center rounded-full border border-line bg-white/[.03] text-moon"><Icon name={morning ? 'sun' : 'scale'} size={26} /></span>}
      kicker={morning ? `Dia ${s.day}` : `Fim do dia ${s.day}`} title={morning ? 'A vila acorda' : 'O veredito'}
      footer={<Btn disabled={!ready} onClick={onNext}>Continuar</Btn>}>
      <ul className="space-y-2.5" aria-live="polite">
        {s.announcements.map((n, i) => (
          <motion.li key={i} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 + i * 0.3 }}>
            <NoteView s={s} n={n} max={maxVotes} delay={0.25 + i * 0.3} />
          </motion.li>
        ))}
      </ul>
    </Screen>
  )
}

function NoteView({ s, n, max, delay }: { s: GameState; n: Note; max: number; delay: number }) {
  if (n.kind === 'info') {
    return (
      <div className="flex gap-3 rounded-3xl card p-4 leading-relaxed">
        <Icon name={noteIcon[n.icon]} size={20} className="mt-0.5 shrink-0 text-moon" /><p>{n.text}</p>
      </div>
    )
  }
  if (n.kind === 'tally') {
    const who = n.id == null ? null : player(s, n.id)
    return (
      <div className="flex items-center gap-3 rounded-2xl card p-3">
        {who ? <Avatar p={who} size={32} /> : <span className="grid size-8 place-items-center rounded-full bg-raised text-muted"><Icon name="close" size={16} /></span>}
        <div className="flex-1">
          <div className="flex justify-between text-sm"><span className="font-medium">{who?.name ?? 'Pular'}</span><span className="text-muted">{n.votes}</span></div>
          <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-raised">
            <motion.div className="h-full rounded-full bg-moon" initial={{ width: 0 }} animate={{ width: `${(n.votes / max) * 100}%` }} transition={{ delay: delay + 0.2, duration: 0.6 }} />
          </div>
        </div>
      </div>
    )
  }
  const p = player(s, n.id)
  return (
    <div className="rounded-3xl card p-5 ring-1 ring-lobos/20">
      <div className="flex items-center gap-4">
        <div className="relative"><Avatar p={p} size={52} dim /><Icon name="skull" size={20} className="absolute -right-1 -bottom-1 rounded-full bg-bg p-0.5 text-lobos" /></div>
        <div><p className="text-lg font-semibold">{p.name}</p><p className="text-sm text-muted">{n.cause}</p></div>
      </div>
      {n.role && (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} transition={{ delay: delay + 0.6 }}
          className="overflow-hidden">
          <div className="mt-4 flex items-center gap-3 border-t border-line pt-4">
            <RoleBadge role={n.role} size={36} />
            <p className="text-sm text-muted">Era <b className={teamText[ROLES[n.role].team]}>{ROLES[n.role].name}</b></p>
          </div>
        </motion.div>
      )}
    </div>
  )
}

export function Hunter({ s, onShoot }: { s: GameState; onShoot: Act<[number | null]> }) {
  const h = player(s, s.hunterQueue[0])
  const [t, setT] = useState<number | null>(null)
  return (
    <Screen lead={<RoleBadge role="cacador" size={64} pulse />} kicker="Último suspiro" title={`${h.name} era o Caçador`}
      hint={`${h.name}, antes de cair você pode atirar uma flecha. Quem você escolher morre na hora.`}
      footer={<ConfirmBar kind="danger" disabled={t == null} label="Atirar" onConfirm={() => onShoot(t)}
        summary={t != null && <>Flecha em <b className="text-lobos">{player(s, t).name}</b></>}
        secondary={<Btn kind="quiet" onClick={() => onShoot(null)}>Não atirar</Btn>} />}>
      <PlayerGrid players={s.players} selected={[t]} onSelect={setT} can={(o) => o.id !== h.id} />
    </Screen>
  )
}

// ───────────────────────── Dia ─────────────────────────

export function Day({ s, onVote }: { s: GameState; onVote: Act }) {
  const total = s.settings.discussionSeconds
  const [left, setLeft] = useState(total)
  useEffect(() => {
    if (left === 10) navigator.vibrate?.(80)
    if (left <= 0) { navigator.vibrate?.([200, 100, 200]); return }
    const t = setTimeout(() => setLeft(left - 1), 1000)
    return () => clearTimeout(t)
  }, [left])
  const R = 88, C = 2 * Math.PI * R
  const color = left <= 10 ? 'var(--color-lobos)' : left <= 30 ? 'var(--color-solo)' : 'var(--color-moon)'
  const dead = s.players.filter((p) => !p.alive)
  return (
    <Screen kicker={`Dia ${s.day}`} title="Discussão" hint="Conversem, acusem e se defendam. Quando o tempo acabar, todos votam."
      footer={<Btn kind={left > 0 ? 'ghost' : 'danger'} icon="scale" onClick={onVote}>{left > 0 ? 'Ir para a votação' : 'Hora de votar'}</Btn>}>
      <div className="relative mx-auto grid size-52 place-items-center" role="timer" aria-label={`${left} segundos restantes`}>
        <svg viewBox="0 0 200 200" className="absolute inset-0 -rotate-90">
          <circle cx="100" cy="100" r={R} fill="none" stroke="var(--color-line)" strokeWidth="6" />
          <motion.circle cx="100" cy="100" r={R} fill="none" strokeWidth="6" strokeLinecap="round" strokeDasharray={C}
            animate={{ strokeDashoffset: C * (1 - left / total), stroke: color }} transition={{ duration: 1, ease: 'linear' }} />
        </svg>
        <motion.span key={left <= 10 ? left : 'x'} initial={left <= 10 ? { scale: 1.2 } : false} animate={{ scale: 1 }}
          className="text-5xl font-light tabular-nums" style={{ color }}>
          {Math.floor(left / 60)}:{String(left % 60).padStart(2, '0')}
        </motion.span>
      </div>
      <div className="mt-4 flex justify-center gap-2">
        <Btn kind="ghost" className="min-h-10 text-sm" onClick={() => setLeft(left + 30)}>+30s</Btn>
        <Btn kind="ghost" className="min-h-10 text-sm" onClick={() => setLeft(0)}>Encerrar</Btn>
      </div>
      <h3 className="mt-8 mb-3 text-[11px] font-mono font-medium tracking-[.14em] text-muted uppercase">Vivos · {alive(s).length}</h3>
      <PlayerGrid players={alive(s)} selected={[]} readOnly />
      {dead.length > 0 && (
        <>
          <h3 className="mt-6 mb-3 text-[11px] font-mono font-medium tracking-[.14em] text-muted uppercase">Mortos · {dead.length}</h3>
          <div className="no-scrollbar -mx-5 flex gap-2 overflow-x-auto px-5">
            {dead.map((p) => (
              <div key={p.id} className="flex shrink-0 items-center gap-2 rounded-full card py-1.5 pr-3 pl-1.5">
                {s.settings.revealOnDeath ? <RoleBadge role={p.role} size={28} /> : <Avatar p={p} size={28} dim />}
                <span className="text-sm text-muted line-through decoration-muted/40">{p.name}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </Screen>
  )
}

export function Vote({ s, onSecret, onOpen }: { s: GameState; onSecret: Act<[number, number | null]>; onOpen: Act<[number | null]> }) {
  const [t, setT] = useState<number | null>(null)
  if (s.settings.voteMode === 'aberta') {
    return (
      <Screen lead={<span className="grid size-14 place-items-center rounded-full border border-line bg-white/[.03] text-moon"><Icon name="scale" size={26} /></span>}
        kicker={`Dia ${s.day}`} title="Votação aberta" hint="Contem as mãos levantadas. Marque quem recebeu mais votos."
        footer={<ConfirmBar kind="danger" disabled={t == null} label="Linchar" onConfirm={() => onOpen(t)}
          summary={t != null && <>Linchar <b className="text-lobos">{player(s, t).name}</b></>}
          secondary={<Btn kind="quiet" onClick={() => onOpen(null)}>Ninguém será linchado</Btn>} />}>
        <PlayerGrid players={s.players} selected={[t]} onSelect={setT} />
      </Screen>
    )
  }
  const p = player(s, s.queue[s.cursor])
  return (
    <PassTo key={`v${s.day}-${p.id}`} p={p} why="Votação secreta" step={s.cursor} total={s.queue.length}>
      <SecretVote s={s} p={p} onVote={(target) => onSecret(p.id, target)} />
    </PassTo>
  )
}

function SecretVote({ s, p, onVote }: { s: GameState; p: Player; onVote: Act<[number | null]> }) {
  const [t, setT] = useState<number | null>(null)
  return (
    <Screen kicker={`Voto de ${p.name}`} title="Quem deve ser linchado?"
      hint={p.role === 'prefeito' ? 'Como Prefeito, seu voto vale por dois.' : 'Ninguém vai ver o seu voto, só o resultado final.'}
      footer={<ConfirmBar kind="danger" disabled={t == null} label="Votar" onConfirm={() => onVote(t)}
        summary={t != null && <>Votar em <b className="text-lobos">{player(s, t).name}</b></>}
        secondary={<Btn kind="quiet" onClick={() => onVote(null)}>Pular voto</Btn>} />}>
      <PlayerGrid players={s.players} selected={[t]} onSelect={setT} can={(o) => o.id !== p.id} />
    </Screen>
  )
}

// ───────────────────────── Só distribuição ─────────────────────────

export function Dealt({ s, onAgain, onMenu }: { s: GameState; onAgain: Act; onMenu: Act }) {
  const [open, setOpen] = useState(false)
  return (
    <Screen lead={<span className="grid size-14 place-items-center rounded-full border border-line bg-white/[.03] text-moon"><Icon name="check" size={26} /></span>}
      kicker="Distribuição concluída" title="O narrador assume daqui"
      hint="Todos já viram suas cartas. Devolva o celular para quem vai narrar."
      footer={<><Btn onClick={onAgain}>Distribuir de novo</Btn><Btn kind="quiet" onClick={onMenu}>Mudar jogadores ou papéis</Btn></>}>
      {!open ? (
        <Btn kind="ghost" icon="users" className="w-full" onClick={() => confirm('Só o narrador deve ver. Mostrar todos os papéis?') && setOpen(true)}>Mostrar todos os papéis ao narrador</Btn>
      ) : (
        <ul className="space-y-2">
          {s.players.map((p) => (
            <li key={p.id} className="flex items-center gap-3 rounded-2xl card p-3">
              <Avatar p={p} size={36} />
              <span className="min-w-0 flex-1">
                <span className="block truncate font-medium">{p.name}</span>
                <span className={`text-sm ${teamText[ROLES[p.role].team]}`}>{ROLES[p.role].name}</span>
              </span>
              <RoleBadge role={p.role} size={32} />
            </li>
          ))}
        </ul>
      )}
    </Screen>
  )
}

// ───────────────────────── Fim ─────────────────────────

const logIcon: Record<string, UiIconName> = { role: 'users', action: 'moon', death: 'skull', vote: 'scale', win: 'trophy' }

export function End({ s, onAgain, onMenu }: { s: GameState; onAgain: Act; onMenu: Act }) {
  const [timeline, setTimeline] = useState(false)
  const w = s.winner!
  const hero = w.team === 'amantes' ? <Icon name="heart" size={40} />
    : w.team === 'lobos' ? <RoleIcon role="lobisomem" size={40} />
    : w.team === 'vila' ? <RoleIcon role="aldeao" size={40} />
    : w.ids[0] != null ? <RoleIcon role={player(s, w.ids[0]).role} size={40} /> : <Icon name="skull" size={40} />
  const color = { vila: 'text-vila bg-vila/12', lobos: 'text-lobos bg-lobos/12', solo: 'text-solo bg-solo/12', amantes: 'text-love bg-love/12', ninguem: 'text-muted bg-raised' }[w.team]
  const days = [...new Set(s.log.map((l) => l.day))]
  const sorted = [...s.players].sort((a, b) => Number(w.ids.includes(b.id)) - Number(w.ids.includes(a.id)))
  return (
    <Screen footer={<><Btn onClick={onAgain}>Jogar de novo</Btn><Btn kind="quiet" onClick={onMenu}>Mudar jogadores ou papéis</Btn></>}>
      <div className="flex flex-col items-center pt-4 text-center">
        <motion.span initial={{ scale: 0, rotate: -30 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: 'spring', stiffness: 200, damping: 12 }}
          className={`grid size-24 place-items-center rounded-full ${color}`}>{hero}</motion.span>
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="mt-5 text-[11px] font-mono font-medium tracking-[.14em] text-muted uppercase">Fim de jogo</motion.p>
        <motion.h1 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="mt-2 font-display text-4xl text-balance text-gradient leading-tight">{w.title}</motion.h1>
      </div>
      <ul className="mt-8 space-y-2">
        {sorted.map((p, i) => {
          const won = w.ids.includes(p.id)
          return (
            <motion.li key={p.id} initial={{ opacity: 0, rotateX: -80 }} animate={{ opacity: 1, rotateX: 0 }} transition={{ delay: 0.7 + i * 0.08, ...spring }}
              style={{ transformPerspective: 600 }}
              className={`flex items-center gap-3 rounded-2xl p-3 ${won ? 'bg-moon/10 ring-1 ring-moon/30' : 'card'}`}>
              <Avatar p={p} size={36} dim={!p.alive} />
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-1.5 truncate font-medium">{p.name}{!p.alive && <Icon name="skull" size={14} className="text-muted" />}</span>
                <span className={`text-sm ${teamText[ROLES[p.role].team]}`}>{ROLES[p.role].name}</span>
              </span>
              <RoleBadge role={p.role} size={32} />
              {won && <Icon name="trophy" size={18} className="text-moon" />}
            </motion.li>
          )
        })}
      </ul>
      {!timeline ? <Btn kind="ghost" icon="book" className="mt-6 w-full" onClick={() => setTimeline(true)}>Ver o que aconteceu</Btn> : (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-8 space-y-6">
          {days.map((d) => (
            <section key={d}>
              <h3 className="mb-3 text-[11px] font-mono font-medium tracking-[.14em] text-muted uppercase">{d === 0 ? 'Início' : `Noite e dia ${d}`}</h3>
              <ol className="relative space-y-3 border-l border-line pl-5">
                {s.log.filter((l) => l.day === d).map((l, i) => (
                  <li key={i} className="relative text-[15px] leading-relaxed">
                    <span className={`absolute top-0.5 -left-[31px] grid size-5 place-items-center rounded-full bg-bg ${l.kind === 'death' ? 'text-lobos' : l.kind === 'win' ? 'text-moon' : 'text-muted'}`}>
                      <Icon name={logIcon[l.kind]} size={14} />
                    </span>
                    {l.text}
                  </li>
                ))}
              </ol>
            </section>
          ))}
        </motion.div>
      )}
    </Screen>
  )
}
