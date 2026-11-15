import type { ReactNode } from 'react'
import type { RoleId } from '../engine/roles'

/** Line icons on a 24px grid, drawn with currentColor. */
function Svg({ children, size = 24, className }: { children: ReactNode; size?: number; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth={1.6}
      strokeLinecap="round" strokeLinejoin="round" aria-hidden className={className}>
      {children}
    </svg>
  )
}

const roleArt: Record<RoleId, ReactNode> = {
  aldeao: <><path d="M3 11 12 4l9 7" /><path d="M5 9.5V20h14V9.5" /><path d="M10 20v-5h4v5" /></>,
  vidente: <><path d="M2 12s3.6-6 10-6 10 6 10 6-3.6 6-10 6S2 12 2 12z" /><circle cx="12" cy="12" r="3" /><circle cx="12" cy="12" r=".6" fill="currentColor" /></>,
  medico: <path d="M9.5 3.5h5v6h6v5h-6v6h-5v-6h-6v-5h6z" />,
  bruxa: <><path d="M9 3h6" /><path d="M10 3v5.5L5.3 17.6A2.3 2.3 0 0 0 7.4 21h9.2a2.3 2.3 0 0 0 2.1-3.4L14 8.5V3" /><path d="M7.3 14.5h9.4" /><circle cx="11" cy="17.5" r=".6" fill="currentColor" /><circle cx="13.5" cy="16.5" r=".5" fill="currentColor" /></>,
  cacador: <><circle cx="12" cy="12" r="8" /><circle cx="12" cy="12" r="3.5" /><path d="M12 2v4M12 18v4M2 12h4M18 12h4" /></>,
  cupido: <><path d="M12 19.5s-7-4.3-7-9.7A3.9 3.9 0 0 1 12 7.4a3.9 3.9 0 0 1 7 2.4c0 5.4-7 9.7-7 9.7z" /><path d="m3 21 5-5M17 7l4-4M18 3h3v3" /></>,
  guarda_costas: <><path d="M12 3 20 6v6c0 4.8-3.4 8-8 9-4.6-1-8-4.2-8-9V6z" /><path d="m9 12 2 2 4-4" /></>,
  prefeito: <><path d="M8 15.5V6a1.5 1.5 0 0 1 1.5-1.5h5A1.5 1.5 0 0 1 16 6v9.5" /><path d="M8 12.5h8" /><path d="M3.5 16.5c0 1.7 3.8 3 8.5 3s8.5-1.3 8.5-3c0-.6-.5-1-1.5-1.3M5 15.2c-1 .3-1.5.7-1.5 1.3" /></>,
  ferreiro: <><path d="m5 19.5 7.5-7.5" /><path d="m11 8.5 4.5-4.5 5 5-4.5 4.5z" /><path d="M3 21h6" /></>,
  rastreador: <><ellipse cx="8" cy="15" rx="2.6" ry="4" /><ellipse cx="16" cy="8" rx="2.6" ry="4" /><path d="M6.8 21h2.4M14.8 14h2.4" /></>,
  herdeiro: <><path d="M7 4h11a2 2 0 0 1 0 4H7" /><path d="M7 4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8" /><path d="M9 12h6M9 15.5h4" /></>,
  faroleiro: <><path d="m9.5 21 1.2-11.5h2.6L14.5 21" /><path d="M7.5 21h9" /><path d="M10 9.5h4M10.8 9.5V6.5h2.4v3" /><path d="M12 6.5V4.5" /><path d="m3 5 5 2.5M21 5l-5 2.5" /></>,
  sonambulo: <><path d="M19 14.5A7.5 7.5 0 1 1 9.5 5a6 6 0 0 0 9.5 9.5z" /><path d="M15 3h4l-4 4h4" /></>,
  lobisomem: <><path d="M4.5 3 8 8.5h8L19.5 3v9l-2.8 4.6L12 21l-4.7-4.4L4.5 12z" /><path d="M9 12.5h1.2M13.8 12.5H15" /><path d="m10.5 16.5 1.5 1 1.5-1" /></>,
  lobo_alfa: <><path d="M3.5 18h17" /><path d="m4.5 18-1-10.5 5 4L12 4.5l3.5 7 5-4-1 10.5" /><circle cx="12" cy="14.5" r=".8" fill="currentColor" /></>,
  lobo_sombra: <><circle cx="12" cy="12" r="8" /><path d="M12 4a8 8 0 0 0 0 16z" fill="currentColor" /></>,
  lobo_uivante: <><circle cx="12" cy="11" r="5" /><path d="M4.5 7.5a8.5 8.5 0 0 0 0 7M19.5 7.5a8.5 8.5 0 0 1 0 7" /><path d="M2 5a12 12 0 0 0 0 12M22 5a12 12 0 0 1 0 12" opacity=".5" /></>,
  tolo: <><path d="M4.5 5h15v6a7.5 7.5 0 0 1-15 0z" /><path d="M8.5 10h1.5M14 10h1.5" /><path d="M9 14c1.6 1.4 4.4 1.4 6 0" /></>,
  assassino: <><path d="M20 3.5 10 13.5l1.8 1.8L21 6V3.5z" /><path d="m10 13.5-5.5 5.5 1.5 1.5 5.5-5.5" /><path d="m7.5 12 4.5 4.5" /></>,
  mercador: <><path d="M9 3h6l-1.5 3h-3z" /><path d="M10.5 6C6.5 8 4.5 11.5 4.5 15a5 5 0 0 0 5 5h5a5 5 0 0 0 5-5c0-3.5-2-7-6-9" /><path d="M12 10.5v7M10 12.5h3a1.2 1.2 0 0 1 0 2.4h-2a1.2 1.2 0 0 0 0 2.4h3" /></>,
}

export const RoleIcon = ({ role, size, className }: { role: RoleId; size?: number; className?: string }) =>
  <Svg size={size} className={className}>{roleArt[role]}</Svg>

const uiArt = {
  moon: <path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z" />,
  sun: <><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></>,
  skull: <><path d="M12 3a8 8 0 0 0-8 8c0 2.6 1.3 4.5 3 5.6V20h10v-3.4c1.7-1.1 3-3 3-5.6a8 8 0 0 0-8-8z" /><circle cx="9" cy="11.5" r="1.5" /><circle cx="15" cy="11.5" r="1.5" /><path d="M10.5 20v-2M13.5 20v-2" /></>,
  menu: <path d="M4 7h16M4 12h16M4 17h10" />,
  help: <><circle cx="12" cy="12" r="9" /><path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .9-1 1.6v.6" /><circle cx="12" cy="17" r=".6" fill="currentColor" /></>,
  back: <path d="m15 5-7 7 7 7" />,
  check: <path d="m5 12.5 4.5 4.5L19 7.5" />,
  close: <path d="M6 6l12 12M18 6 6 18" />,
  plus: <path d="M12 5v14M5 12h14" />,
  minus: <path d="M5 12h14" />,
  letter: <><rect x="3" y="5.5" width="18" height="13" rx="2" /><path d="m3.5 7 8.5 6 8.5-6" /></>,
  scale: <><path d="M12 4v16M7 20h10M5 7h14" /><path d="m5 7-3 6a3 3 0 0 0 6 0zM19 7l-3 6a3 3 0 0 0 6 0z" /></>,
  grip: <><circle cx="9" cy="7" r="1" fill="currentColor" /><circle cx="15" cy="7" r="1" fill="currentColor" /><circle cx="9" cy="12" r="1" fill="currentColor" /><circle cx="15" cy="12" r="1" fill="currentColor" /><circle cx="9" cy="17" r="1" fill="currentColor" /><circle cx="15" cy="17" r="1" fill="currentColor" /></>,
  users: <><circle cx="9" cy="8" r="3.5" /><path d="M2.5 20a6.5 6.5 0 0 1 13 0" /><path d="M16 4.6a3.5 3.5 0 0 1 0 6.8M18 14.2a6.5 6.5 0 0 1 3.5 5.8" /></>,
  sparkle: <path d="M12 3c.6 4.2 2.8 6.4 7 7-4.2.6-6.4 2.8-7 7-.6-4.2-2.8-6.4-7-7 4.2-.6 6.4-2.8 7-7z" />,
  undo: <><path d="M9 14 4 9l5-5" /><path d="M4 9h10a6 6 0 0 1 0 12h-3" /></>,
  book: <><path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2z" /><path d="M4 19V5M8 7h7" /></>,
  flag: <><path d="M5 21V4" /><path d="M5 4h11l-2 4 2 4H5" /></>,
  trophy: <><path d="M8 4h8v5a4 4 0 0 1-8 0z" /><path d="M8 6H5a3 3 0 0 0 3 4M16 6h3a3 3 0 0 1-3 4" /><path d="M12 13v4M8.5 20h7" /></>,
  hand: <><path d="M8 13V5.5a1.5 1.5 0 0 1 3 0V11" /><path d="M11 10V4.5a1.5 1.5 0 0 1 3 0V11" /><path d="M14 10.5V6a1.5 1.5 0 0 1 3 0v7.5a7 7 0 0 1-7 7 6 6 0 0 1-5-2.7l-2.3-3.6a1.5 1.5 0 0 1 2.4-1.8L8 15" /></>,
  phone: <><rect x="6" y="2.5" width="12" height="19" rx="2.5" /><path d="M10.5 18.5h3" /></>,
  howl: <><circle cx="12" cy="11" r="5" /><path d="M4.5 7.5a8.5 8.5 0 0 0 0 7M19.5 7.5a8.5 8.5 0 0 1 0 7" /></>,
  peace: <><path d="M3 17h18" /><path d="M7 17a5 5 0 0 1 10 0" /><path d="M12 6V4M5.6 8.6 4.2 7.2M18.4 8.6l1.4-1.4" /></>,
  heart: <path d="M12 19.5s-7-4.3-7-9.7A3.9 3.9 0 0 1 12 7.4a3.9 3.9 0 0 1 7 2.4c0 5.4-7 9.7-7 9.7z" />,
  lighthouse: roleArt.faroleiro,
  bow: roleArt.cacador,
}
export type UiIconName = keyof typeof uiArt

export const Icon = ({ name, size, className }: { name: UiIconName; size?: number; className?: string }) =>
  <Svg size={size} className={className}>{uiArt[name]}</Svg>
