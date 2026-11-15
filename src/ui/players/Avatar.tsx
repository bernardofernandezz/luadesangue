import { useContext } from 'react'
import { PhotoContext, avatarFor } from './photos'

export function Avatar({ name, size = 44, dim }: { name: string; size?: number; dim?: boolean }) {
  const photo = useContext(PhotoContext)[name] ?? ''
  return (
    <span aria-hidden className={`block shrink-0 overflow-hidden rounded-full ring-1 ring-white/10 ${dim ? 'opacity-70 grayscale' : ''}`} style={{ width: size, height: size }}>
      <AvatarArt photo={photo} size={size} />
    </span>
  )
}

export function AvatarArt({ photo, size }: { photo: string; size: number }) {
  if (photo.startsWith('data:')) return <img src={photo} alt="" width={size} height={size} className="size-full rounded-full object-cover" />
  const a = avatarFor(photo)
  return (
    <svg viewBox="0 0 64 64" width={size} height={size} aria-hidden className="rounded-full"
      style={{ background: `linear-gradient(135deg, ${a.bg[0]}, ${a.bg[1]})` }}>
      <g transform="translate(5 7) scale(.84)">{a.art}</g>
    </svg>
  )
}
