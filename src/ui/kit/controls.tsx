import { motion } from 'motion/react'
import type { ReactNode } from 'react'
import { Icon, type UiIconName } from './icons'
import { btnClass, selectedClass, spring, type BtnKind } from './styles'


export function Btn({ children, onClick, disabled, kind, size, className = '', icon }: {
  children: ReactNode; onClick?: () => void; disabled?: boolean; kind?: BtnKind; size?: 'md' | 'sm'; className?: string; icon?: UiIconName
}) {
  return (
    <motion.button whileTap={disabled ? undefined : { scale: 0.97 }} onClick={onClick} disabled={disabled} className={`${btnClass(kind, size)} ${className}`}>
      {icon && <Icon name={icon} size={20} />}
      {children}
    </motion.button>
  )
}

export function IconBtn({ name, label, onClick, className = '' }: { name: UiIconName; label: string; onClick: () => void; className?: string }) {
  return (
    <motion.button whileTap={{ scale: 0.9 }} onClick={onClick} aria-label={label}
      className={`glass grid size-11 place-items-center rounded-full border border-line bg-black/40 text-text backdrop-blur-md hover:bg-white/[.06] ${className}`}>
      <Icon name={name} size={20} />
    </motion.button>
  )
}

export function Switch({ label, hint, checked, onChange }: { label: string; hint?: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button role="switch" aria-checked={checked} onClick={() => onChange(!checked)}
      className="card flex w-full items-center justify-between gap-4 rounded-3xl p-4 text-left">
      <span><span className="block font-medium">{label}</span>{hint && <span className="mt-0.5 block text-sm text-muted">{hint}</span>}</span>
      <span className={`flex h-7 w-12 shrink-0 items-center rounded-full p-1 transition-colors ${checked ? 'justify-end bg-moon' : 'justify-start bg-raised'}`}>
        <motion.span layout transition={spring} className={`size-5 rounded-full ${checked ? 'bg-bg' : 'bg-muted'}`} />
      </span>
    </button>
  )
}

/** Tabs with a sliding highlight. `id` must be unique on screen (it drives the highlight animation). */
export function Segmented<T extends string>({ id, value, options, onChange, label, solid }: {
  id: string; value: T; options: { value: T; label: ReactNode; className?: string; disabled?: boolean }[]; onChange: (v: T) => void; label?: string; solid?: boolean
}) {
  return (
    <nav aria-label={label} className="card glass relative grid rounded-2xl p-1" style={{ gridTemplateColumns: `repeat(${options.length}, 1fr)` }}>
      {options.map((o) => {
        const on = o.value === value
        return (
          <button key={o.value} onClick={() => !o.disabled && onChange(o.value)} aria-current={on}
            className={`relative z-10 rounded-xl py-2.5 text-sm font-medium transition-colors ${on ? (solid ? 'text-bg' : o.className ?? 'text-text') : 'text-muted'}`}>
            {on && <motion.span layoutId={id} transition={spring}
              className={`absolute inset-0 -z-10 rounded-xl ${solid ? 'bg-moon shadow-[0_1px_12px_rgb(255_255_255/.15)]' : 'bg-raised'}`} />}
            {o.label}
          </button>
        )
      })}
    </nav>
  )
}

export function Choice<T extends string>({ title, value, set, options }: { title: string; value: T; set: (v: T) => void; options: [T, string, string][] }) {
  return (
    <div className="card rounded-3xl p-4">
      <p className="font-medium">{title}</p>
      <div className="mt-3 grid grid-cols-2 gap-2">
        {options.map(([v, label, hint]) => (
          <button key={v} onClick={() => set(v)} aria-pressed={value === v}
            className={`rounded-2xl p-3 text-left text-sm transition-colors ${value === v ? selectedClass : 'bg-raised'}`}>
            <span className="block font-medium">{label}</span>
            <span className="mt-0.5 block text-muted">{hint}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
