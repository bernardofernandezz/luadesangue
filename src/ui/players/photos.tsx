import { createContext, type ReactNode } from 'react'

const W = '#fff'
const K = '#111'

/** Illustrated preset avatars, drawn on a 64×64 grid. Stored as `a:<id>`. */
export const AVATARS: { id: string; name: string; bg: [string, string]; art: ReactNode }[] = [
  { id: 'raposa', name: 'Raposa', bg: ['#ff8a5c', '#d6336c'], art: <>
    <path d="M14 14 24 27h16l10-13v20q0 14-18 20-18-6-18-20z" fill={W} />
    <circle cx="25" cy="36" r="2.6" fill={K} /><circle cx="39" cy="36" r="2.6" fill={K} /><circle cx="32" cy="46" r="2.2" fill={K} /></> },
  { id: 'gato', name: 'Gato', bg: ['#7c5cff', '#3b2a99'], art: <>
    <path d="M17 30 19 11l12 11M47 30 45 11 33 22" fill={W} /><circle cx="32" cy="36" r="16" fill={W} />
    <ellipse cx="25.5" cy="34" rx="2.2" ry="3.4" fill={K} /><ellipse cx="38.5" cy="34" rx="2.2" ry="3.4" fill={K} />
    <path d="M30 41h4l-2 2.4zM22 43l-9 1M22 46l-8 4M42 43l9 1M42 46l8 4" stroke={K} strokeWidth="1.4" strokeLinecap="round" fill={K} /></> },
  { id: 'coruja', name: 'Coruja', bg: ['#22c1c3', '#1b6f8a'], art: <>
    <path d="M15 22 18 11l8 9M49 22l-3-11-8 9" fill={W} /><ellipse cx="32" cy="36" rx="17" ry="19" fill={W} />
    <circle cx="25" cy="32" r="7" fill="#1b6f8a" /><circle cx="39" cy="32" r="7" fill="#1b6f8a" />
    <circle cx="25" cy="32" r="3.4" fill={K} /><circle cx="39" cy="32" r="3.4" fill={K} /><circle cx="26.2" cy="30.8" r="1.1" fill={W} /><circle cx="40.2" cy="30.8" r="1.1" fill={W} />
    <path d="M29.5 39h5L32 44z" fill="#f7b733" /></> },
  { id: 'urso', name: 'Urso', bg: ['#f7b733', '#fc4a1a'], art: <>
    <circle cx="18" cy="21" r="6.5" fill={W} /><circle cx="46" cy="21" r="6.5" fill={W} /><circle cx="32" cy="36" r="17" fill={W} />
    <ellipse cx="32" cy="43" rx="7.5" ry="6" fill="#ffe0c2" /><circle cx="25" cy="33" r="2.5" fill={K} /><circle cx="39" cy="33" r="2.5" fill={K} />
    <ellipse cx="32" cy="41" rx="2.8" ry="2" fill={K} /></> },
  { id: 'coelho', name: 'Coelho', bg: ['#ff6fd8', '#7a3cff'], art: <>
    <ellipse cx="25" cy="17" rx="5" ry="13" fill={W} /><ellipse cx="39" cy="17" rx="5" ry="13" fill={W} />
    <ellipse cx="25" cy="18" rx="2" ry="8" fill="#ffb3e6" /><ellipse cx="39" cy="18" rx="2" ry="8" fill="#ffb3e6" />
    <circle cx="32" cy="40" r="14" fill={W} /><circle cx="26.5" cy="38" r="2.3" fill={K} /><circle cx="37.5" cy="38" r="2.3" fill={K} />
    <path d="M30.5 44h3L32 45.6z" fill="#ff6fd8" /><path d="M30 47.5h4" stroke={K} strokeWidth="1.3" strokeLinecap="round" /></> },
  { id: 'corvo', name: 'Corvo', bg: ['#5ee7df', '#5a6cf0'], art: <>
    <path d="M16 50c0-14 4-24 14-24 8 0 12 6 12 13v11z" fill={W} /><circle cx="30" cy="27" r="12" fill={W} />
    <path d="M40 23 55 28l-15 5z" fill="#f7b733" /><circle cx="33" cy="25" r="2.6" fill={K} /><circle cx="33.8" cy="24.2" r=".8" fill={W} /></> },
  { id: 'lobo', name: 'Lobo', bg: ['#89f7fe', '#2e5bd6'], art: <>
    <path d="M15 11 26 25h12l11-14 2 24-19 20-19-20z" fill={W} /><path d="M26 41h12l-6 9z" fill="#dce7ff" />
    <path d="M22 33l6 2M42 33l-6 2" stroke={K} strokeWidth="2.6" strokeLinecap="round" /><circle cx="32" cy="43" r="2.2" fill={K} /></> },
  { id: 'sapo', name: 'Sapo', bg: ['#a8e063', '#2f8f5b'], art: <>
    <circle cx="21" cy="27" r="8" fill={W} /><circle cx="43" cy="27" r="8" fill={W} /><ellipse cx="32" cy="40" rx="21" ry="13" fill={W} />
    <circle cx="21" cy="27" r="3.6" fill={K} /><circle cx="43" cy="27" r="3.6" fill={K} />
    <path d="M21 42q11 8 22 0" stroke={K} strokeWidth="2" strokeLinecap="round" fill="none" />
    <circle cx="18" cy="40" r="2.4" fill="#ffb3c7" /><circle cx="46" cy="40" r="2.4" fill="#ffb3c7" /></> },
  { id: 'fantasma', name: 'Fantasma', bg: ['#e0c3fc', '#6b5bd6'], art: <>
    <path d="M17 54V29a15 15 0 0 1 30 0v25l-5-4-5 4-5-4-5 4-5-4z" fill={W} />
    <ellipse cx="26" cy="30" rx="3" ry="4.2" fill={K} /><ellipse cx="38" cy="30" rx="3" ry="4.2" fill={K} /><ellipse cx="32" cy="40" rx="3" ry="3.6" fill={K} /></> },
  { id: 'morcego', name: 'Morcego', bg: ['#f093fb', '#f5576c'], art: <>
    <path d="M32 24c-6-6-16-6-24 0 4 2 5 7 4 11 4-3 9-3 12 1M32 24c6-6 16-6 24 0-4 2-5 7-4 11-4-3-9-3-12 1" fill={W} />
    <path d="M25 22 26 13l5 7h2l5-7 1 9" fill={W} /><circle cx="32" cy="32" r="10" fill={W} />
    <circle cx="28.5" cy="30" r="2.1" fill={K} /><circle cx="35.5" cy="30" r="2.1" fill={K} />
    <path d="M29.5 36l1.2 2.4 1.3-2.4 1.3 2.4 1.2-2.4" stroke={K} strokeWidth="1.2" fill="none" strokeLinejoin="round" /></> },
  { id: 'cervo', name: 'Cervo', bg: ['#fbd786', '#c06c84'], art: <>
    <path d="M22 22 16 10M19 16l-7 1M42 22l6-12M45 16l7 1" stroke={W} strokeWidth="3" strokeLinecap="round" />
    <ellipse cx="18" cy="27" rx="6" ry="3.2" fill={W} transform="rotate(-20 18 27)" /><ellipse cx="46" cy="27" rx="6" ry="3.2" fill={W} transform="rotate(20 46 27)" />
    <path d="M20 30q0-10 12-10t12 10q0 12-12 22-12-10-12-22z" fill={W} />
    <circle cx="26.5" cy="32" r="2.3" fill={K} /><circle cx="37.5" cy="32" r="2.3" fill={K} /><ellipse cx="32" cy="46" rx="3" ry="2.2" fill={K} /></> },
  { id: 'mascara', name: 'Máscara', bg: ['#c6ffdd', '#4ba3a3'], art: <>
    <path d="M8 28q12-8 24 0 12-8 24 0-2 14-12 14-6 0-12-6-6 6-12 6-10 0-12-14z" fill={W} />
    <path d="M14 31q5-4 11 1-5 4-11-1zM50 31q-5-4-11 1 5 4 11-1z" fill={K} />
    <path d="M56 28c2-4 2-9-1-13" stroke={W} strokeWidth="2" strokeLinecap="round" fill="none" /></> },
]

const byId = Object.fromEntries(AVATARS.map((a) => [a.id, a]))
/** Unknown or missing photos fall back to the first avatar. */
export const avatarFor = (photo: string) => byId[photo.slice(2)] ?? AVATARS[0]

/** Player photos by name: `a:<avatar id>` or a `data:` image URL. */
export const PhotoContext = createContext<Record<string, string>>({})

export function randomAvatar(taken: string[]) {
  const free = AVATARS.filter((a) => !taken.includes(`a:${a.id}`))
  const list = free.length ? free : AVATARS
  return `a:${list[Math.floor(Math.random() * list.length)].id}`
}

/** Center-crops and shrinks a picked image so 20 photos still fit in localStorage. */
export async function toThumb(file: File): Promise<string> {
  const px = 192
  const bmp = await createImageBitmap(file)
  const s = Math.min(bmp.width, bmp.height)
  const c = document.createElement('canvas')
  c.width = c.height = px
  c.getContext('2d')!.drawImage(bmp, (bmp.width - s) / 2, (bmp.height - s) / 2, s, s, 0, 0, px, px)
  bmp.close()
  return c.toDataURL('image/jpeg', 0.82)
}
