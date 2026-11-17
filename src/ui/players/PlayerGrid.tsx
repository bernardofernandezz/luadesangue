import { AnimatePresence, motion } from 'motion/react'
import type { Player } from '../../engine/game'
import { selectedClass, spring } from '../kit/styles'
import { Icon } from '../kit/icons'
import { Avatar } from './Avatar'

/** Dead players are selectable only with `allowDead` (the Médium). Without `onSelect` it is display only. `marks` shows a count badge (the pack's votes). */
export function PlayerGrid({ players, selected = [], onSelect, can = () => true, marks, allowDead }: {
  players: Player[]; selected?: (number | null | undefined)[]; onSelect?: (id: number) => void
  can?: (p: Player) => boolean; marks?: Record<number, number>; allowDead?: boolean
}) {
  const readOnly = !onSelect
  return (
    <div className="grid grid-cols-3 gap-2.5">
      {players.map((p, i) => {
        const ok = (p.alive || !!allowDead) && can(p) && !readOnly
        const on = selected.includes(p.id)
        return (
          <motion.button key={p.id} disabled={!ok} onClick={() => onSelect?.(p.id)} aria-pressed={readOnly ? undefined : on}
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: !p.alive && !ok ? 0.3 : ok || readOnly ? 1 : 0.45, y: 0 }}
            transition={{ delay: i * 0.025 }} whileTap={ok ? { scale: 0.94 } : undefined}
            className={`relative flex flex-col items-center gap-2 rounded-2xl px-2 pt-4 pb-3 transition-colors disabled:cursor-default
              ${on ? `border border-transparent ${selectedClass}` : 'card'}`}>
            <Avatar name={p.name} dim={!p.alive} />
            <span className="w-full truncate text-center text-[13px] font-medium">{p.name}</span>
            {!p.alive && <Icon name="skull" size={14} className="absolute top-2 left-2 text-muted" />}
            <AnimatePresence>
              {on && (
                <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} transition={spring}
                  className="absolute top-2 right-2 grid size-5 place-items-center rounded-full bg-moon text-bg">
                  <Icon name="check" size={14} />
                </motion.span>
              )}
            </AnimatePresence>
            {!!marks?.[p.id] && !on && (
              <span className="absolute top-2 right-2 grid size-5 place-items-center rounded-full bg-lobos text-[11px] font-bold text-white">{marks[p.id]}</span>
            )}
          </motion.button>
        )
      })}
    </div>
  )
}
