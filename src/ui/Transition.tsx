import { motion } from 'motion/react'
import { useEffect } from 'react'
import { Icon } from './icons'

/** Short cinematic between night and day. Tap to skip. */
export function Transition({ kind, day, onDone }: { kind: 'night' | 'dawn'; day: number; onDone: () => void }) {
  useEffect(() => { const t = setTimeout(onDone, 2400); return () => clearTimeout(t) }, [onDone])
  const night = kind === 'night'
  const stars = night ? Array.from({ length: 28 }, (_, i) => ({ x: (i * 37) % 100, y: (i * 53) % 60, d: (i % 7) * 0.12 })) : []
  return (
    <motion.button onClick={onDone} aria-label="Pular" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.5 }}
      className={`fixed inset-0 z-40 flex flex-col items-center justify-center overflow-hidden ${night ? 'bg-black' : 'bg-[#0a0705]'}`}>
      {stars.map((s, i) => (
        <motion.span key={i} className="absolute size-0.5 rounded-full bg-white" style={{ left: `${s.x}%`, top: `${s.y}%` }}
          initial={{ opacity: 0 }} animate={{ opacity: [0, 1, 0.5] }} transition={{ delay: 0.3 + s.d, duration: 1.5 }} />
      ))}
      <motion.div initial={{ y: 140, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 1.4, ease: [0.2, 0.8, 0.2, 1] }}
        className={`relative grid size-32 place-items-center rounded-full ${night ? 'text-moon' : 'text-solo'}`}>
        <motion.span className={`absolute inset-0 rounded-full blur-2xl ${night ? 'bg-white/15' : 'bg-solo/40'}`}
          animate={{ scale: [1, 1.15, 1] }} transition={{ duration: 2.4, repeat: Infinity }} />
        <Icon name={night ? 'moon' : 'sun'} size={88} className="relative" />
      </motion.div>
      <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}
        className="mt-10 text-[11px] font-mono font-medium tracking-[.14em] text-muted uppercase">{night ? `Noite ${day}` : `Dia ${day}`}</motion.p>
      <motion.h1 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8 }}
        className="mt-3 font-display text-5xl text-gradient leading-tight">{night ? 'A vila adormece' : 'Amanhecer'}</motion.h1>
      <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.2 }} className="mt-3 max-w-64 text-center text-sm text-muted">
        {night ? 'Passem o celular na ordem da roda. Cada um faz sua jogada em segredo.' : 'Reúnam-se. É hora de descobrir o que aconteceu.'}
      </motion.p>
    </motion.button>
  )
}
