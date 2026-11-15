import { AnimatePresence, motion } from 'motion/react'
import type { ReactNode } from 'react'
import { Btn, IconBtn } from './controls'
import { Icon, type UiIconName } from './icons'

export function Screen({ title, kicker, lead, hint, children, footer }: {
  title?: ReactNode; kicker?: ReactNode; lead?: ReactNode; hint?: ReactNode; children?: ReactNode; footer?: ReactNode
}) {
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col pt-[max(1.25rem,calc(env(safe-area-inset-top)+.5rem))] pr-[max(1.25rem,env(safe-area-inset-right))] pl-[max(1.25rem,env(safe-area-inset-left))] pb-[max(1rem,env(safe-area-inset-bottom))]">
      <header className="flex min-h-11 flex-col items-center px-12 text-center">
        {lead && <div className="mb-3">{lead}</div>}
        {kicker && <p className="eyebrow text-muted">{kicker}</p>}
        {title && <h1 className="mt-2 font-display text-[34px] leading-[1.1] text-balance text-gradient">{title}</h1>}
        {hint && <p className="mt-2 max-w-xs text-sm leading-relaxed text-pretty text-muted">{hint}</p>}
      </header>
      <div className="mt-6 flex-1">{children}</div>
      {footer && <div className="sticky bottom-0 -mx-5 mt-4 flex flex-col gap-2 bg-gradient-to-t from-bg via-bg via-80% to-transparent px-5 pt-8 pb-1">{footer}</div>}
    </div>
  )
}

export function LeadIcon({ name }: { name: UiIconName }) {
  return <span className="grid size-14 place-items-center rounded-full border border-line bg-white/[.03] text-moon"><Icon name={name} size={26} /></span>
}

export function Sheet({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: ReactNode; children: ReactNode }) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-50 flex items-end bg-black/70 backdrop-blur-sm" onClick={onClose}
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} role="dialog" aria-modal>
          <motion.div onClick={(e) => e.stopPropagation()}
            initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', stiffness: 320, damping: 34 }}
            className="glass glass-sheet mx-auto max-h-[calc(100dvh-env(safe-area-inset-top)-1rem)] w-full max-w-md overflow-y-auto rounded-t-[28px] border-t border-line bg-[#0a0a0a]/95 px-5 pt-3 pb-[max(1.5rem,env(safe-area-inset-bottom))] ring-1 ring-line backdrop-blur-xl">
            <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-line" />
            <div className="mb-5 flex items-center justify-between gap-3">
              <h2 className="font-display text-2xl">{title}</h2>
              <IconBtn name="close" label="Fechar" onClick={onClose} />
            </div>
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export function Dots({ step, total }: { step: number; total: number }) {
  return (
    <div className="flex flex-wrap justify-center gap-1.5" aria-label={`${step + 1} de ${total}`}>
      {Array.from({ length: total }, (_, i) => (
        <span key={i} className={`h-1.5 rounded-full transition-all ${i < step ? 'w-1.5 bg-moon/60' : i === step ? 'w-5 bg-moon' : 'w-1.5 bg-line'}`} />
      ))}
    </div>
  )
}

export function ConfirmBar({ summary, onConfirm, disabled, label = 'Confirmar', kind = 'primary', secondary }: {
  summary?: ReactNode; onConfirm: () => void; disabled?: boolean; label?: string; kind?: 'primary' | 'danger'; secondary?: ReactNode
}) {
  return (
    <>
      <AnimatePresence mode="popLayout">
        {summary && (
          <motion.p key={String(summary)} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
            className="glass mx-auto rounded-full bg-black/60 px-4 py-1.5 text-center text-sm text-muted backdrop-blur-md">{summary}</motion.p>
        )}
      </AnimatePresence>
      <Btn kind={kind} disabled={disabled} onClick={onConfirm}>{label}</Btn>
      {secondary}
    </>
  )
}
