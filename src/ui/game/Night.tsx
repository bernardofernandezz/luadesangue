import { AnimatePresence, motion } from 'motion/react'
import { useState, type ReactNode } from 'react'
import { investigate, nightAction, packOf, player, type GameState, type NightAction, type NightInput, type Player } from '../../engine/game'
import { ROLES, isWolf } from '../../engine/roles'
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
  const [use, setUse] = useState(false)
  const [peeked, setPeeked] = useState(false)
  const def = ROLES[p.role]
  const wolf = isWolf(p.role)
  const pack = packOf(s, p.id)
  const target = t != null && <b className={wolf ? 'text-lobos' : 'text-text'}>{player(s, t).name}</b>
  const summary = peeked ? null
    : t != null ? <>{def.verb} {target}{use && def.power && ` · ${def.power.summary}`}</>
    : a.optional ? def.skip : null
  const confirm = a.peek && !peeked ? () => setPeeked(true) : () => onChoose({ target: t, use })
  return (
    <Turn s={s} p={p} footer={<ConfirmBar summary={summary} disabled={t == null && !a.optional} label={a.peek && !peeked ? 'Revelar' : 'Confirmar e esconder'} onConfirm={confirm} />}>
      {a.note && <p className="mb-4 text-center text-sm text-muted">{a.note}</p>}
      {pack.length > 0 && <p className="mb-4 text-center text-sm text-muted">Matilha: <span className="text-lobos">{pack.map((w) => w.name).join(', ')}</span></p>}
      <AnimatePresence mode="wait">
        {peeked && t != null
          ? <SeerResult key="r" p={player(s, t)} wolf={investigate(s, t)} />
          : <motion.div key="g" exit={{ opacity: 0, scale: 0.97 }}>
              <PlayerGrid players={s.players} selected={[t]} onSelect={a.optional ? toggle(t, setT) : setT} can={pickable(a.targets)} marks={a.marks} />
            </motion.div>}
      </AnimatePresence>
      {a.power && def.power && <Power icon={<RoleIcon role={p.role} size={20} />} title={def.power.title} text={def.power.text} v={use} set={setUse} />}
    </Turn>
  )
}

function PairTurn({ s, p, a, onChoose }: TurnProps<'pair'>) {
  const [t, setT] = useState<number | null>(null)
  const [t2, setT2] = useState<number | null>(null)
  const pick = (id: number) => (t === id ? setT(null) : t2 === id ? setT2(null) : t == null ? setT(id) : setT2(id))
  const nm = (id: number) => <b className="text-love">{player(s, id).name}</b>
  return (
    <Turn s={s} p={p} footer={<ConfirmBar disabled={t == null || t2 == null} label="Confirmar e esconder" onConfirm={() => onChoose({ target: t, target2: t2 })}
      summary={t != null && <>Unir {nm(t)}{t2 != null ? <> e {nm(t2)}</> : ' e…'}</>} />}>
      <PlayerGrid players={s.players} selected={[t, t2]} onSelect={pick} can={pickable(a.targets)} />
    </Turn>
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

function SeerResult({ p, wolf }: { p: Player; wolf: boolean }) {
  return (
    <motion.div initial={{ rotateY: 90, opacity: 0 }} animate={{ rotateY: 0, opacity: 1 }} transition={{ type: 'spring', stiffness: 140, damping: 16 }}
      style={{ transformPerspective: 800 }} role="status"
      className={`flex flex-col items-center rounded-3xl p-8 text-center ring-1 ${wolf ? 'bg-lobos/12 ring-lobos/40' : 'bg-vila/10 ring-vila/30'}`}>
      <Avatar name={p.name} size={72} />
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
        <span className={`card grid size-9 place-items-center rounded-full ${color}`}><Icon name={icon} size={18} /></span>
        <div><p className="font-medium">{title}</p><p className="text-sm text-muted">{text}</p></div>
      </div>
      {children}
    </section>
  )
}

function Power({ icon, title, text, v, set, big }: { icon: ReactNode; title: string; text: string; v: boolean; set: (v: boolean) => void; big?: boolean }) {
  return (
    <motion.button whileTap={{ scale: 0.98 }} onClick={() => set(!v)} aria-pressed={v}
      className={`mt-4 flex w-full items-center gap-4 rounded-3xl p-4 text-left transition-colors ${big ? 'py-6' : ''} ${v ? selectedClass : 'card'}`}>
      <span className={`grid size-11 shrink-0 place-items-center rounded-full ${v ? 'bg-moon text-bg' : 'bg-raised text-moon'}`}>{icon}</span>
      <span className="flex-1"><span className="block font-medium">{title}</span><span className="block text-sm text-muted">{text}</span></span>
      <span className={`grid size-6 place-items-center rounded-full ${v ? 'bg-moon text-bg' : 'ring-1 ring-line'}`}>{v && <Icon name="check" size={14} />}</span>
    </motion.button>
  )
}
