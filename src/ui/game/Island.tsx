import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useState, type ReactNode } from 'react'
import { noteText, type GameState } from '../../engine/game'
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

type Compact = { icon: UiIconName; text: string; tone?: string; pulse?: boolean }
type Alert = { key: string; icon: UiIconName; title: string; text?: string }

function contentFor(s: GameState, timer?: number): { compact: Compact | null; alert: Alert | null } {
  switch (s.phase) {
    case 'night': return { compact: { icon: 'moon', text: `N${s.day}` }, alert: null }
    case 'day': {
      const t = timer ?? s.settings.discussionSeconds
      return {
        compact: { icon: 'sun', text: clock(Math.max(0, t)), tone: t <= 10 ? 'text-lobos' : t <= 30 ? 'text-solo' : 'text-moon', pulse: t > 0 && t <= 10 },
        alert: t <= 0 ? { key: `timeup-${s.day}`, icon: 'scale', title: 'Tempo esgotado', text: 'Hora de votar.' } : null,
      }
    }
    case 'announce': return {
      compact: { icon: 'sun', text: `D${s.day}`, tone: 'text-solo' },
      alert: { key: `announce-${s.day}-${s.next}`, icon: 'skull', title: s.next === 'day' ? `Amanhecer · Dia ${s.day}` : 'A vila decidiu', text: s.announcements.map((n) => noteText(s, n)).join(' · ') },
    }
    case 'vote': return { compact: { icon: 'scale', text: 'Voto' }, alert: null }
    case 'hunter': return { compact: { icon: 'bow', text: 'Tiro', tone: 'text-lobos' }, alert: null }
    case 'end': return {
      compact: { icon: 'trophy', text: 'Fim', tone: 'text-solo' },
      alert: s.winner ? { key: `end-${s.seed}`, icon: 'trophy', title: s.winner.title } : null,
    }
    default: return { compact: null, alert: null }
  }
}

const spring = { type: 'spring', stiffness: 420, damping: 32 } as const

/** Live-Activity-style pill around the iPhone's Dynamic Island. Renders nothing elsewhere. */
export function GameIsland({ s, timer }: { s: GameState; timer?: number }) {
  if (!hasIsland()) return null
  const { compact, alert } = contentFor(s, timer)
  return <Island compact={compact} alert={alert} />
}

function Island({ compact, alert }: { compact: Compact | null; alert: Alert | null }) {
  const [open, setOpen] = useState(false)
  const alertKey = alert?.key
  useEffect(() => {
    if (!alertKey) return setOpen(false)
    setOpen(true)
    const t = setTimeout(() => setOpen(false), 4500)
    return () => clearTimeout(t)
  }, [alertKey])

  const mode = open && alert ? 'expanded' : compact ? 'compact' : 'idle'
  // Idle matches the hardware island (126×37) so it disappears into it; compact wings stay clear of the clock and battery.
  const size = { idle: { width: 126, height: 37, borderRadius: 19 }, compact: { width: 198, height: 37, borderRadius: 19 }, expanded: { width: Math.min(innerWidth - 16, 380), height: 'auto', borderRadius: 32 } }[mode]

  let body: ReactNode = null
  if (mode === 'expanded') body = (
    <motion.div key="x" initial={{ opacity: 0, filter: 'blur(6px)' }} animate={{ opacity: 1, filter: 'blur(0px)' }} exit={{ opacity: 0 }} transition={{ delay: 0.1 }}
      className="flex items-start gap-3 px-5 pt-12 pb-5">
      <span className="grid size-10 shrink-0 place-items-center rounded-full bg-white/10 text-moon"><Icon name={alert!.icon} size={20} /></span>
      <div className="min-w-0 text-left">
        <p className="font-semibold text-white">{alert!.title}</p>
        {alert!.text && <p className="mt-0.5 line-clamp-3 text-sm leading-snug text-white/65">{alert!.text}</p>}
      </div>
    </motion.div>
  )
  else if (mode === 'compact') body = (
    <motion.div key={`c-${compact!.icon}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ delay: 0.12 }}
      className={`flex h-full items-center justify-between px-3 ${compact!.tone ?? 'text-moon'}`}>
      <Icon name={compact!.icon} size={17} />
      <motion.span animate={compact!.pulse ? { opacity: [1, 0.4, 1] } : { opacity: 1 }} transition={compact!.pulse ? { duration: 1, repeat: Infinity } : undefined}
        className="text-[13px] font-semibold tabular-nums">{compact!.text}</motion.span>
    </motion.div>
  )

  return (
    <motion.button type="button" aria-live="polite" aria-label={mode === 'expanded' ? `${alert!.title}. ${alert!.text ?? ''}` : compact ? compact.text : 'Ilha'}
      onClick={() => alert && setOpen(!open)} initial={false} animate={size} transition={spring}
      className="fixed top-[max(11px,calc((env(safe-area-inset-top)-37px)/2))] inset-x-0 z-[60] mx-auto overflow-hidden bg-black shadow-[0_8px_30px_rgb(0_0_0/.5)]">
      <AnimatePresence mode="popLayout" initial={false}>{body}</AnimatePresence>
    </motion.button>
  )
}
