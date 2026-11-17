import { AnimatePresence, motion } from 'motion/react'
import { useState, type ReactNode } from 'react'
import { auraOf, nightAction, packOf, peekAt, player, sameTeam, type GameState, type NightAction, type NightInput, type Player } from '../../engine/game'
import { ROLES, isWolf, type RoleId } from '../../engine/roles'
import { TEAM_LABEL, teamText } from '../roles/teamStyles'
import { Icon, type UiIconName } from '../kit/icons'
import { RoleIcon } from '../roles/RoleIcon'
import { selectedClass } from '../kit/styles'
import { ConfirmBar, Screen, Sheet } from '../kit/layout'
import { Avatar } from '../players/Avatar'
import { PassTo } from './PassTo'
import { useReadDelay } from '../kit/useReadDelay'
import { PlayerGrid } from '../players/PlayerGrid'
import { RoleBadge, RoleDetails } from '../roles/RoleViews'

type Choose = (input: NightInput) => void
interface TurnProps<A extends NightAction['kind']> { s: GameState; p: Player; a: Extract<NightAction, { kind: A }>; onChoose: Choose }

export function Night({ s, onChoose }: { s: GameState; onChoose: Choose }) {
  return <PassTo s={s} why={`Noite ${s.day}`}>{(p) => <NightTurn s={s} p={p} onChoose={onChoose} />}</PassTo>
}

function NightTurn({ s, p, onChoose }: { s: GameState; p: Player; onChoose: Choose }) {
  const a = nightAction(s, p.id)
  switch (a.kind) {
    case 'pick': return <PickTurn s={s} p={p} a={a} onChoose={onChoose} />
    case 'pair': return <PairTurn s={s} p={p} a={a} onChoose={onChoose} />
    case 'potions': return <PotionsTurn s={s} p={p} a={a} onChoose={onChoose} />
    case 'toggle': return <ToggleTurn s={s} p={p} a={a} onChoose={onChoose} />
    case 'idle': return <IdleTurn s={s} p={p} a={a} onChoose={onChoose} />
  }
}

/** Every turn lasts at least this long, so nobody can guess a role from how fast the phone came back. */
const MIN_TURN_MS = 4000

function Turn({ s, p, title, hint, footer, children }: { s: GameState; p: Player; title?: string; hint?: string; footer: ReactNode; children: ReactNode }) {
  const def = ROLES[p.role]
  const ready = useReadDelay(MIN_TURN_MS)
  return (
    <Screen lead={<RoleBadge role={p.role} size={56} />} kicker={`${def.name} · ${p.name}`} title={title ?? def.prompt}
      hint={<>{hint ?? def.promptHint}<RoleHelp p={p} /></>}
      footer={<fieldset disabled={!ready} className="contents">{footer}</fieldset>}>
      <Letters msgs={s.inbox[p.id]} />
      {children}
    </Screen>
  )
}

const pickable = (targets: number[]) => (o: Player) => targets.includes(o.id)
const toggle = (cur: number | null, set: (v: number | null) => void) => (id: number) => set(cur === id ? null : id)

function PickTurn({ s, p, a, onChoose }: TurnProps<'pick'>) {
  const [t, setT] = useState<number | null>(null)
  const [t2, setT2] = useState<number | null>(null)
  const [use, setUse] = useState(false)
  const [peeked, setPeeked] = useState(false)
  const def = ROLES[p.role]
  const wolf = isWolf(p.role)
  const pack = packOf(s, p.id)
  // Incendiário: up to two picks, or the power instead of picking.
  const two = a.max === 2
  const instead = two && use
  const pick2 = (id: number) => (t === id ? setT(null) : t2 === id ? setT2(null) : t == null ? setT(id) : t2 == null ? setT2(id) : undefined)
  const nm = (id: number) => <b className={wolf ? 'text-lobos' : 'text-text'}>{player(s, id).name}</b>
  const summary = peeked ? null
    : instead ? def.power?.summary
    : t != null ? <>{def.verb} {nm(t)}{two && t2 != null && <> e {nm(t2)}</>}{use && def.power && ` · ${def.power.summary}`}</>
    : a.optional ? def.skip : null
  const confirm = a.peek && !peeked ? () => setPeeked(true) : () => onChoose(instead ? { use } : { target: t, target2: t2, use: use && (!a.powerTargets || (t != null && a.powerTargets.includes(t))) })
  return (
    <Turn s={s} p={p} footer={<ConfirmBar summary={summary} disabled={t == null && !a.optional && !instead} label={a.peek && !peeked ? 'Revelar' : 'Confirmar e esconder'} onConfirm={confirm} />}>
      {a.note && <p className="mb-4 text-center text-sm text-muted">{a.note}</p>}
      {pack.length > 0 && <p className="mb-4 text-center text-sm text-muted">Matilha: <span className="text-lobos">{pack.map((w) => w.name).join(', ')}</span></p>}
      <AnimatePresence mode="wait">
        {peeked && t != null
          ? a.aura ? <AuraResult key="r" p={player(s, t)} aura={auraOf(s, t)} /> : <SeerResult key="r" p={player(s, t)} role={peekAt(s, p.id, t)} />
          : !instead && <motion.div key="g" exit={{ opacity: 0, scale: 0.97 }}>
              <PlayerGrid players={s.players} selected={[t, two ? t2 : null]} onSelect={two ? pick2 : a.optional ? toggle(t, setT) : setT}
                can={pickable(a.targets)} marks={a.marks} allowDead={a.dead} />
            </motion.div>}
      </AnimatePresence>
      {a.power && def.power && (!a.powerTargets || (t != null && a.powerTargets.includes(t))) && <Power icon={<RoleIcon role={p.role} size={20} />} title={def.power.title} text={def.power.text} v={use} set={setUse} />}
    </Turn>
  )
}

function PairTurn({ s, p, a, onChoose }: TurnProps<'pair'>) {
  const [t, setT] = useState<number | null>(null)
  const [t2, setT2] = useState<number | null>(null)
  const [peeked, setPeeked] = useState(false)
  const pick = (id: number) => (t === id ? setT(null) : t2 === id ? setT2(null) : t == null ? setT(id) : setT2(id))
  const nm = (id: number) => <b className={a.compare ? 'text-text' : 'text-love'}>{player(s, id).name}</b>
  const comparing = a.compare && !peeked
  return (
    <Turn s={s} p={p} footer={<ConfirmBar disabled={t == null || t2 == null} label={comparing ? 'Comparar' : 'Confirmar e esconder'}
      onConfirm={comparing ? () => setPeeked(true) : () => onChoose({ target: t, target2: t2 })}
      summary={!peeked && t != null && <>{a.compare ? 'Comparar' : 'Unir'} {nm(t)}{t2 != null ? <> e {nm(t2)}</> : ' e…'}</>} />}>
      <AnimatePresence mode="wait">
        {peeked && t != null && t2 != null
          ? <CompareResult key="r" a={player(s, t)} b={player(s, t2)} same={sameTeam(s, t, t2)} />
          : <motion.div key="g" exit={{ opacity: 0, scale: 0.97 }}>
              <PlayerGrid players={s.players} selected={[t, t2]} onSelect={pick} can={pickable(a.targets)} />
            </motion.div>}
      </AnimatePresence>
    </Turn>
  )
}

function CompareResult({ a, b, same }: { a: Player; b: Player; same: boolean }) {
  return (
    <motion.div initial={{ rotateY: 90, opacity: 0 }} animate={{ rotateY: 0, opacity: 1 }} transition={{ type: 'spring', stiffness: 140, damping: 16 }}
      style={{ transformPerspective: 800 }} role="status" className={`flex flex-col items-center rounded-3xl p-8 text-center ring-1 ${same ? 'bg-vila/10 ring-vila/30' : 'bg-lobos/12 ring-lobos/40'}`}>
      <div className="flex gap-3"><Avatar name={a.name} size={64} /><Avatar name={b.name} size={64} /></div>
      <p className="mt-4 text-lg font-medium">{a.name} e {b.name} são</p>
      <p className={`mt-3 font-display text-4xl leading-tight ${same ? 'text-vila' : 'text-lobos'}`}>{same ? 'do mesmo time' : 'de times diferentes'}</p>
      <p className="mt-4 text-sm text-muted">Guarde isso com cuidado. Só você sabe.</p>
    </motion.div>
  )
}

const AURA = {
  boa: ['boa', 'É da Vila.', 'text-vila', 'bg-vila/10 ring-vila/30'],
  ma: ['má', 'É um lobo.', 'text-lobos', 'bg-lobos/12 ring-lobos/40'],
  desconhecida: ['desconhecida', 'É um papel solo: não é da Vila nem dos lobos.', 'text-solo', 'bg-solo/10 ring-solo/30'],
} as const

function AuraResult({ p, aura }: { p: Player; aura: keyof typeof AURA }) {
  const [word, meaning, text, ring] = AURA[aura]
  return (
    <motion.div initial={{ rotateY: 90, opacity: 0 }} animate={{ rotateY: 0, opacity: 1 }} transition={{ type: 'spring', stiffness: 140, damping: 16 }}
      style={{ transformPerspective: 800 }} role="status" className={`flex flex-col items-center rounded-3xl p-8 text-center ring-1 ${ring}`}>
      <Avatar name={p.name} size={72} />
      <p className="mt-4 text-lg font-medium">A aura de {p.name} é</p>
      <p className={`mt-3 font-display text-4xl leading-tight ${text}`}>{word}</p>
      <p className="mt-1 text-sm text-muted">{meaning}</p>
      <p className="mt-4 text-sm text-muted">Guarde isso com cuidado. Só você sabe.</p>
    </motion.div>
  )
}

function PotionsTurn({ s, p, a, onChoose }: TurnProps<'potions'>) {
  const [cure, setCure] = useState<number | null>(null)
  const [poison, setPoison] = useState<number | null>(null)
  const nm = (id: number | null) => (id == null ? '' : player(s, id).name)
  const text = [cure != null && `curar ${nm(cure)}`, poison != null && `envenenar ${nm(poison)}`].filter(Boolean).join(' · ')
  return (
    <Turn s={s} p={p} footer={<ConfirmBar summary={text && text[0].toUpperCase() + text.slice(1)} label={text ? 'Confirmar e esconder' : 'Não usar poções e esconder'}
      onConfirm={() => onChoose({ target: cure, target2: poison })} />}>
      <div className="space-y-6">
        {a.cure && <Potion icon="heart" color="text-vila" title="Poção de cura" text="Protege alguém de ataques esta noite.">
          <PlayerGrid players={s.players} selected={[cure]} onSelect={toggle(cure, setCure)} can={pickable(a.cure)} />
        </Potion>}
        {a.poison && <Potion icon="skull" color="text-lobos" title="Poção de veneno" text="Mata alguém. Nada impede.">
          <PlayerGrid players={s.players} selected={[poison]} onSelect={toggle(poison, setPoison)} can={pickable(a.poison)} />
        </Potion>}
      </div>
    </Turn>
  )
}

function ToggleTurn({ s, p, onChoose }: TurnProps<'toggle'>) {
  const [use, setUse] = useState(false)
  const def = ROLES[p.role]
  return (
    <Turn s={s} p={p} footer={<ConfirmBar summary={use ? def.power?.summary : def.skip} label="Confirmar e esconder" onConfirm={() => onChoose({ use })} />}>
      {def.power && <Power icon={<RoleIcon role={p.role} size={20} />} title={def.power.title} text={def.power.text} v={use} set={setUse} big />}
    </Turn>
  )
}

/** Everyone takes a turn, so nobody can tell roles apart by who touched the phone: without an action, pick a suspect. */
function IdleTurn({ s, p, a, onChoose }: TurnProps<'idle'>) {
  const [t, setT] = useState<number | null>(null)
  const def = ROLES[p.role]
  const reason = {
    sleepwalk: 'Esta noite você vai andar dormindo até a casa de alguém. O que viu chega na sua próxima vez.',
    spent: 'Você já usou o seu poder. Agora sua arma é a conversa de dia.',
    none: `${def.tagline} Sua força aparece de dia.`,
  }[a.why]
  return (
    <Turn s={s} p={p} title="Quem você acha suspeito?" hint=""
      footer={<ConfirmBar summary={t != null && <>Suspeitar de <b className="text-text">{player(s, t).name}</b></>} disabled={t == null} label="Confirmar e esconder" onConfirm={() => onChoose({})} />}>
      <div className="card mb-5 flex gap-3 rounded-3xl p-4 text-[15px] leading-relaxed">
        <Icon name="moon" size={20} className="mt-0.5 shrink-0 text-moon" />
        <p>{reason} <span className="text-muted">Para ninguém perceber, escolha alguém de quem você suspeita.</span></p>
      </div>
      <PlayerGrid players={s.players} selected={[t]} onSelect={setT} can={(o) => o.id !== p.id} />
    </Turn>
  )
}

function RoleHelp({ p }: { p: Player }) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <button onClick={() => setOpen(true)} className="mx-auto mt-3 flex items-center gap-1.5 rounded-full bg-raised px-3 py-1.5 text-xs font-medium text-muted">
        <Icon name="help" size={14} />Como funciona meu papel?
      </button>
      <Sheet open={open} onClose={() => setOpen(false)} title="Sua carta"><RoleDetails role={p.role} /></Sheet>
    </>
  )
}

function Letters({ msgs }: { msgs?: string[] }) {
  if (!msgs?.length) return null
  return (
    <div className="mb-6 space-y-2.5" role="status">
      {msgs.map((m, i) => (
        <motion.div key={i} initial={{ opacity: 0, y: -8, rotate: -1 }} animate={{ opacity: 1, y: 0, rotate: 0 }} transition={{ delay: 0.15 + i * 0.15 }}
          className="flex gap-3 rounded-3xl bg-moon/10 p-4 ring-1 ring-moon/25">
          <Icon name="letter" size={20} className="mt-0.5 shrink-0 text-moon" />
          <div>
            <p className="eyebrow text-moon">Mensagem secreta</p>
            <p className="mt-1 text-[15px] leading-relaxed">{m}</p>
          </div>
        </motion.div>
      ))}
    </div>
  )
}

function SeerResult({ p, role }: { p: Player; role: RoleId }) {
  const def = ROLES[role]
  const ring = { lobos: 'bg-lobos/12 ring-lobos/40', vila: 'bg-vila/10 ring-vila/30', solo: 'bg-solo/10 ring-solo/30' }[def.team]
  return (
    <motion.div initial={{ rotateY: 90, opacity: 0 }} animate={{ rotateY: 0, opacity: 1 }} transition={{ type: 'spring', stiffness: 140, damping: 16 }}
      style={{ transformPerspective: 800 }} role="status" className={`flex flex-col items-center rounded-3xl p-8 text-center ring-1 ${ring}`}>
      <Avatar name={p.name} size={72} />
      <p className="mt-4 text-lg font-medium">{p.name} é</p>
      <div className="mt-3"><RoleBadge role={role} size={64} /></div>
      <p className={`mt-3 font-display text-4xl leading-tight ${teamText[def.team]}`}>{def.name}</p>
      <p className="mt-1 text-sm text-muted">{TEAM_LABEL[def.team]}</p>
      <p className="mt-4 text-sm text-muted">Guarde isso com cuidado. Só você sabe.</p>
    </motion.div>
  )
}

function Potion({ icon, color, title, text, children }: { icon: UiIconName; color: string; title: string; text: string; children: ReactNode }) {
  return (
    <section>
      <div className="mb-3 flex items-center gap-3">
        <span className={`card grid size-9 place-items-center rounded-full ${color}`}><Icon name={icon} size={18} /></span>
        <div><p className="font-medium">{title}</p><p className="text-sm text-muted">{text}</p></div>
      </div>
      {children}
    </section>
  )
}

export function Power({ icon, title, text, v, set, big }: { icon: ReactNode; title: string; text: string; v: boolean; set: (v: boolean) => void; big?: boolean }) {
  return (
    <motion.button whileTap={{ scale: 0.98 }} onClick={() => set(!v)} aria-pressed={v}
      className={`mt-4 flex w-full items-center gap-4 rounded-3xl p-4 text-left transition-colors ${big ? 'py-6' : ''} ${v ? selectedClass : 'card'}`}>
      <span className={`grid size-11 shrink-0 place-items-center rounded-full ${v ? 'bg-moon text-bg' : 'bg-raised text-moon'}`}>{icon}</span>
      <span className="flex-1"><span className="block font-medium">{title}</span><span className="block text-sm text-muted">{text}</span></span>
      <span className={`grid size-6 place-items-center rounded-full ${v ? 'bg-moon text-bg' : 'ring-1 ring-line'}`}>{v && <Icon name="check" size={14} />}</span>
    </motion.button>
  )
}
