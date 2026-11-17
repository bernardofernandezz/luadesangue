import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useState, type ReactNode } from 'react'
import { alive, noteText, player, type GameState } from '../../engine/game'
import { installed, isIos } from '../help/install'
import { clock } from '../kit/format'
import { Icon, type UiIconName } from '../kit/icons'

// Web apps can't reach the real Dynamic Island (Live Activities are native-only), so this draws a black
// pill over it that grows like one. iPhones with the island report a top safe area of 59pt or more
// (notched ones 44–50). Add ?island to the URL to preview it elsewhere.
let cached: boolean | undefined
function hasIsland() {
  if (cached !== undefined) return cached
  if (new URLSearchParams(location.search).has('island')) return (cached = true)
  if (!isIos() || !installed()) return (cached = false)
  const probe = document.createElement('div')
  probe.style.paddingTop = 'env(safe-area-inset-top)'
  document.body.append(probe)
  cached = parseFloat(getComputedStyle(probe).paddingTop) >= 51
  probe.remove()
  return cached
}

type Compact = { icon: UiIconName; text: string; tone?: string; pulse?: boolean; progress?: number }
type Card = { icon: UiIconName; title: string; text?: string; big?: string; tone?: string; progress?: number }
type Alert = Card & { key: string }
type Content = { compact: Compact | null; detail: Card | null; alert: Alert | null }

const toneFor = (t: number) => (t <= 10 ? 'text-lobos' : t <= 30 ? 'text-solo' : 'text-moon')

function contentFor(s: GameState, timer?: number): Content {
  const turns = s.queue.length ? s.cursor / s.queue.length : 0
  switch (s.phase) {
    case 'reveal': return {
      compact: { icon: 'users', text: `${s.cursor}/${s.queue.length}`, progress: turns },
      detail: { icon: 'users', title: 'Distribuindo as cartas', text: `${s.cursor} de ${s.queue.length} já viram o seu papel.`, progress: turns },
      alert: null,
    }
    case 'night': return {
      compact: { icon: 'moon', text: `N${s.day}`, progress: turns },
      detail: { icon: 'moon', title: `Noite ${s.day}`, text: `${s.cursor} de ${s.queue.length} já fizeram a sua jogada.`, progress: turns },
      alert: null,
    }
    case 'day': {
      const total = s.settings.discussionSeconds
      const t = Math.max(0, timer ?? total)
      return {
        compact: { icon: 'sun', text: clock(t), tone: toneFor(t), pulse: t > 0 && t <= 10, progress: Math.min(1, t / total) },
        detail: { icon: 'sun', title: `Discussão · Dia ${s.day}`, big: clock(t), tone: toneFor(t), text: `${alive(s).length} vivos`, progress: Math.min(1, t / total) },
        alert: t <= 0 ? { key: `timeup-${s.day}`, icon: 'scale', title: 'Tempo esgotado', text: 'Hora de votar.' } : null,
      }
    }
    case 'announce': {
      const card: Card = { icon: 'skull', title: s.next === 'day' ? `Amanhecer · Dia ${s.day}` : 'A vila decidiu', text: s.announcements.map((n) => noteText(s, n)).join(' · ') }
      return { compact: { icon: 'sun', text: `D${s.day}`, tone: 'text-solo' }, detail: card, alert: { ...card, key: `announce-${s.day}-${s.next}-${s.hunterQueue.length}` } }
    }
    case 'defense': {
      const total = s.settings.defenseSeconds
      const t = Math.max(0, timer ?? total)
      const who = s.accused != null ? player(s, s.accused).name : ''
      return {
        compact: { icon: 'scale', text: clock(t), tone: toneFor(t), pulse: t > 0 && t <= 10, progress: Math.min(1, t / total) },
        detail: { icon: 'scale', title: `${who} tem a palavra`, big: clock(t), tone: toneFor(t), text: 'Depois, a vila confirma ou poupa.', progress: Math.min(1, t / total) },
        alert: { key: `defense-${s.day}`, icon: 'scale', title: `${who} foi o mais votado`, text: 'Silêncio: é a vez da defesa.' },
      }
    }
    case 'vote': {
      const secret = s.settings.voteMode === 'secreta'
      return {
        compact: { icon: 'scale', text: secret ? `${s.cursor}/${s.queue.length}` : 'Voto', progress: secret ? turns : undefined },
        detail: secret
          ? { icon: 'scale', title: 'Votação secreta', text: `${s.cursor} de ${s.queue.length} já votaram.`, progress: turns }
          : { icon: 'scale', title: 'Votação aberta', text: 'Contem as mãos levantadas.' },
        alert: null,
      }
    }
    case 'hunter': return {
      compact: { icon: 'bow', text: 'Tiro', tone: 'text-lobos' },
      detail: { icon: 'bow', title: 'Um último tiro', text: 'O arco está armado antes da partida.', tone: 'text-lobos' },
      alert: { key: `hunter-${s.day}-${s.hunterQueue.length}`, icon: 'bow', title: 'Um último tiro', text: 'Alguém vai levar mais um junto.' },
    }
    case 'end': {
      const card: Card | null = s.winner && { icon: 'trophy', title: s.winner.title, text: `${s.day} ${s.day === 1 ? 'dia' : 'dias'} de partida.`, tone: 'text-solo' }
      return { compact: { icon: 'trophy', text: 'Fim', tone: 'text-solo' }, detail: card, alert: card && { ...card, key: `end-${s.startedAt}` } }
    }
    default: return { compact: null, detail: null, alert: null }
  }
}

const spring = { type: 'spring', stiffness: 420, damping: 32 } as const
const ALERT_MS = 4500
const DETAIL_MS = 6000

/** Live-Activity-style pill around the iPhone's Dynamic Island. Renders nothing elsewhere. */
export function GameIsland({ s, timer }: { s: GameState; timer?: number }) {
  if (!hasIsland()) return null
  return <Island {...contentFor(s, timer)} />
}

/** Tap or pull down to expand, tap again, swipe up or tap outside to collapse. Alerts open it on their own. */
function Island({ compact, detail, alert }: Content) {
  const [open, setOpen] = useState<'alert' | 'detail' | null>(null)
  const alertKey = alert?.key
  useEffect(() => { setOpen(alertKey ? 'alert' : null) }, [alertKey])
  useEffect(() => {
    if (!open) return
    navigator.vibrate?.(10)
    const t = setTimeout(() => setOpen(null), open === 'alert' ? ALERT_MS : DETAIL_MS)
    return () => clearTimeout(t)
  }, [open])

  const card = open === 'alert' ? alert : open === 'detail' ? detail : null
  const mode = card ? 'expanded' : compact ? 'compact' : 'idle'
  // Idle matches the hardware island (126×37) so it disappears into it; compact wings stay clear of the clock and battery.
  const size = { idle: { width: 126, height: 37, borderRadius: 19 }, compact: { width: 198, height: 37, borderRadius: 19 }, expanded: { width: Math.min(innerWidth - 16, 380), height: 'auto', borderRadius: 32 } }[mode]
  const expand = () => { if (detail) setOpen('detail') }
  const toggle = () => (card ? setOpen(null) : expand())

  let body: ReactNode = null
  if (card) body = (
    <motion.div key={`x-${open}`} initial={{ opacity: 0, filter: 'blur(6px)' }} animate={{ opacity: 1, filter: 'blur(0px)' }} exit={{ opacity: 0, filter: 'blur(4px)' }} transition={{ delay: 0.1 }}
      className="px-5 pt-12 pb-5">
      <div className="flex items-start gap-3">
        <span className={`grid size-10 shrink-0 place-items-center rounded-full bg-white/10 ${card.tone ?? 'text-moon'}`}><Icon name={card.icon} size={20} /></span>
        <div className="min-w-0 flex-1 text-left">
          <p className="font-semibold text-white">{card.title}</p>
          {card.text && <p className="mt-0.5 line-clamp-3 text-sm leading-snug text-white/65">{card.text}</p>}
        </div>
        {card.big && <span className={`self-center text-3xl font-light tabular-nums ${card.tone ?? 'text-white'}`}>{card.big}</span>}
      </div>
      {card.progress != null && <Bar value={card.progress} className="mt-4 h-1.5" tone={card.tone} />}
    </motion.div>
  )
  else if (compact) body = (
    <motion.div key={`c-${compact.icon}`} initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }} transition={{ delay: 0.12 }}
      className={`relative flex h-full items-center justify-between px-3 ${compact.tone ?? 'text-moon'}`}>
      <Icon name={compact.icon} size={17} />
      <motion.span animate={compact.pulse ? { opacity: [1, 0.4, 1] } : { opacity: 1 }} transition={compact.pulse ? { duration: 1, repeat: Infinity } : undefined}
        className="text-[13px] font-semibold tabular-nums">{compact.text}</motion.span>
      {compact.progress != null && <Bar value={compact.progress} tone={compact.tone} className="absolute inset-x-5 bottom-1 h-[2px]" />}
    </motion.div>
  )

  return (
    <>
      {card && <button type="button" aria-label="Fechar a ilha" className="fixed inset-0 z-[59] cursor-default" onClick={() => setOpen(null)} />}
      <motion.button type="button" aria-live="polite" aria-expanded={!!card}
        aria-label={card ? `${card.title}. ${card.text ?? ''}` : compact ? `${compact.text}. Toque para ver detalhes.` : 'Ilha'}
        onTap={toggle} drag="y" dragConstraints={{ top: 0, bottom: 0 }} dragElastic={0.25} dragSnapToOrigin
        onDragEnd={(_, info) => { if (info.offset.y > 18) expand(); else if (info.offset.y < -12) setOpen(null) }}
        whileTap={{ scale: 0.97 }} initial={false} animate={size} transition={spring}
        className="fixed top-[max(11px,calc((env(safe-area-inset-top)-37px)/2))] inset-x-0 z-[60] mx-auto touch-none overflow-hidden bg-black shadow-[0_8px_30px_rgb(0_0_0/.5)]">
        <AnimatePresence mode="popLayout" initial={false}>{body}</AnimatePresence>
      </motion.button>
    </>
  )
}

function Bar({ value, tone = 'text-moon', className }: { value: number; tone?: string; className: string }) {
  return (
    <span className={`block overflow-hidden rounded-full bg-white/15 ${className}`}>
      <motion.span className={`block h-full rounded-full bg-current ${tone}`} initial={false} animate={{ width: `${Math.round(value * 100)}%` }} transition={{ duration: 0.6, ease: 'easeOut' }} />
    </span>
  )
}
