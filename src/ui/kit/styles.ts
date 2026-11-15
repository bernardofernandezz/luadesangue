export const spring = { type: 'spring', stiffness: 380, damping: 30 } as const

export type BtnKind = 'primary' | 'ghost' | 'danger' | 'quiet'
const kinds: Record<BtnKind, string> = {
  primary: 'bg-moon text-bg shadow-[inset_0_-2px_0_rgb(0_0_0/.12),0_0_24px_rgb(255_255_255/.08)] hover:bg-white',
  ghost: 'glass border border-line bg-white/[.02] text-text hover:bg-white/[.06]',
  danger: 'border border-lobos/40 bg-lobos/15 text-lobos hover:bg-lobos/25',
  quiet: 'bg-transparent text-muted hover:text-text',
}

/** Button look, also for elements that can't be a <button> (a file <label>). */
export const btnClass = (kind: BtnKind = 'primary', size: 'md' | 'sm' = 'md') =>
  `inline-flex items-center justify-center gap-2 rounded-full font-medium transition-[opacity,background-color,color] disabled:opacity-35 ${
    size === 'sm' ? 'min-h-10 px-3 text-sm' : 'min-h-12 px-5 text-[15px]'} ${kinds[kind]}`

/** Pinned to the top corners of the centered column. */
export const corner = { left: 'fixed top-5 left-[max(1.25rem,calc(50%-14rem+1.25rem))] z-30', right: 'fixed top-5 right-[max(1.25rem,calc(50%-14rem+1.25rem))] z-30' }

/** Look of a selected option. */
export const selectedClass = 'bg-white/[.07] ring-1 ring-white/60'
