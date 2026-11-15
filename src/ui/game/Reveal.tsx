import { motion } from 'motion/react'
import { ROLES } from '../../engine/roles'
import { packOf, type GameState, type Player } from '../../engine/game'
import { Btn } from '../kit/controls'
import { Screen } from '../kit/layout'
import { useReadDelay } from '../kit/useReadDelay'
import { Avatar } from '../players/Avatar'
import { PassTo } from './PassTo'
import { RoleDetails } from '../roles/RoleViews'

export function Reveal({ s, onNext }: { s: GameState; onNext: () => void }) {
  return <PassTo s={s} why="Revelação dos papéis">{(p) => <RevealCard s={s} p={p} onNext={onNext} />}</PassTo>
}

function RevealCard({ s, p, onNext }: { s: GameState; p: Player; onNext: () => void }) {
  const ready = useReadDelay(2000)
  const pack = packOf(s, p.id)
  return (
    <Screen kicker={`${p.name}, este é você`}
      footer={<Btn disabled={!ready} onClick={onNext}>{ready ? 'Entendi, esconder' : 'Leia sua carta…'}</Btn>}>
      <motion.div initial={{ rotateY: 90, opacity: 0 }} animate={{ rotateY: 0, opacity: 1 }} transition={{ type: 'spring', stiffness: 120, damping: 16 }}
        style={{ transformPerspective: 900 }}>
        <RoleDetails role={p.role} pulse stagger={0.35} extra={pack.length > 0 && <Pack wolves={pack} />} />
      </motion.div>
    </Screen>
  )
}

/** Wolves know each other, including each one's role. */
function Pack({ wolves }: { wolves: Player[] }) {
  return (
    <section className="rounded-3xl bg-lobos/10 p-5 ring-1 ring-lobos/25">
      <h3 className="eyebrow text-lobos">Sua matilha</h3>
      <ul className="mt-3 space-y-2">
        {wolves.map((w) => (
          <li key={w.id} className="flex items-center gap-3"><Avatar name={w.name} size={32} /><span className="flex-1 font-medium">{w.name}</span><span className="text-sm text-muted">{ROLES[w.role].name}</span></li>
        ))}
      </ul>
    </section>
  )
}
