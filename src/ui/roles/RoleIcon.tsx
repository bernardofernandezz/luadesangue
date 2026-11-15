import type { ReactNode } from 'react'
import type { RoleId } from '../../engine/roles'
import { uiArt } from '../kit/iconArt'
import { Svg } from '../kit/icons'

const roleArt: Record<RoleId, ReactNode> = {
  aldeao: <><path d="M3 11 12 4l9 7" /><path d="M5 9.5V20h14V9.5" /><path d="M10 20v-5h4v5" /></>,
  vidente: <><path d="M2 12s3.6-6 10-6 10 6 10 6-3.6 6-10 6S2 12 2 12z" /><circle cx="12" cy="12" r="3" /><circle cx="12" cy="12" r=".6" fill="currentColor" /></>,
  medico: <path d="M9.5 3.5h5v6h6v5h-6v6h-5v-6h-6v-5h6z" />,
  bruxa: <><path d="M9 3h6" /><path d="M10 3v5.5L5.3 17.6A2.3 2.3 0 0 0 7.4 21h9.2a2.3 2.3 0 0 0 2.1-3.4L14 8.5V3" /><path d="M7.3 14.5h9.4" /><circle cx="11" cy="17.5" r=".6" fill="currentColor" /><circle cx="13.5" cy="16.5" r=".5" fill="currentColor" /></>,
  cacador: uiArt.bow,
  cupido: <>{uiArt.heart}<path d="m3 21 5-5M17 7l4-4M18 3h3v3" /></>,
  guarda_costas: <><path d="M12 3 20 6v6c0 4.8-3.4 8-8 9-4.6-1-8-4.2-8-9V6z" /><path d="m9 12 2 2 4-4" /></>,
  prefeito: <><path d="M8 15.5V6a1.5 1.5 0 0 1 1.5-1.5h5A1.5 1.5 0 0 1 16 6v9.5" /><path d="M8 12.5h8" /><path d="M3.5 16.5c0 1.7 3.8 3 8.5 3s8.5-1.3 8.5-3c0-.6-.5-1-1.5-1.3M5 15.2c-1 .3-1.5.7-1.5 1.3" /></>,
  ferreiro: <><path d="m5 19.5 7.5-7.5" /><path d="m11 8.5 4.5-4.5 5 5-4.5 4.5z" /><path d="M3 21h6" /></>,
  rastreador: <><ellipse cx="8" cy="15" rx="2.6" ry="4" /><ellipse cx="16" cy="8" rx="2.6" ry="4" /><path d="M6.8 21h2.4M14.8 14h2.4" /></>,
  herdeiro: <><path d="M7 4h11a2 2 0 0 1 0 4H7" /><path d="M7 4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8" /><path d="M9 12h6M9 15.5h4" /></>,
  faroleiro: uiArt.lighthouse,
  sonambulo: <><path d="M19 14.5A7.5 7.5 0 1 1 9.5 5a6 6 0 0 0 9.5 9.5z" /><path d="M15 3h4l-4 4h4" /></>,
  lobisomem: <><path d="M4.5 3 8 8.5h8L19.5 3v9l-2.8 4.6L12 21l-4.7-4.4L4.5 12z" /><path d="M9 12.5h1.2M13.8 12.5H15" /><path d="m10.5 16.5 1.5 1 1.5-1" /></>,
  lobo_alfa: <><path d="M3.5 18h17" /><path d="m4.5 18-1-10.5 5 4L12 4.5l3.5 7 5-4-1 10.5" /><circle cx="12" cy="14.5" r=".8" fill="currentColor" /></>,
  lobo_sombra: <><circle cx="12" cy="12" r="8" /><path d="M12 4a8 8 0 0 0 0 16z" fill="currentColor" /></>,
  lobo_uivante: <><circle cx="12" cy="11" r="5" /><path d="M4.5 7.5a8.5 8.5 0 0 0 0 7M19.5 7.5a8.5 8.5 0 0 1 0 7" /><path d="M2 5a12 12 0 0 0 0 12M22 5a12 12 0 0 1 0 12" opacity=".5" /></>,
  lobo_farejador: <><circle cx="7" cy="8" r="1.8" /><circle cx="12" cy="5.5" r="1.8" /><circle cx="17" cy="8" r="1.8" /><path d="M12 11c-3.5 0-6 3.5-6 6.2C6 19 7.3 20 9 20c1.2 0 2-.6 3-.6s1.8.6 3 .6c1.7 0 3-1 3-2.8C18 14.5 15.5 11 12 11z" /></>,
  tolo: <><path d="M4.5 5h15v6a7.5 7.5 0 0 1-15 0z" /><path d="M8.5 10h1.5M14 10h1.5" /><path d="M9 14c1.6 1.4 4.4 1.4 6 0" /></>,
  assassino: <><path d="M20 3.5 10 13.5l1.8 1.8L21 6V3.5z" /><path d="m10 13.5-5.5 5.5 1.5 1.5 5.5-5.5" /><path d="m7.5 12 4.5 4.5" /></>,
  mercador: <><path d="M9 3h6l-1.5 3h-3z" /><path d="M10.5 6C6.5 8 4.5 11.5 4.5 15a5 5 0 0 0 5 5h5a5 5 0 0 0 5-5c0-3.5-2-7-6-9" /><path d="M12 10.5v7M10 12.5h3a1.2 1.2 0 0 1 0 2.4h-2a1.2 1.2 0 0 0 0 2.4h3" /></>,
  incendiario: <><path d="M12 3c.8 3.2 5.5 5.2 5.5 10.5a5.5 5.5 0 0 1-11 0c0-2.8 1.6-4.2 2.3-6 1.2 1 1.9 2.2 2 3.4 1.2-1.7 1.6-4.5 1.2-7.9z" /><path d="M12 20a2.5 2.5 0 0 1-2.5-2.5c0-1.5 1.3-2.3 2.5-4 1.2 1.7 2.5 2.5 2.5 4A2.5 2.5 0 0 1 12 20z" /></>,
}

export const RoleIcon = ({ role, size, className }: { role: RoleId; size?: number; className?: string }) =>
  <Svg size={size} className={className}>{roleArt[role]}</Svg>
