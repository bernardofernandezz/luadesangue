import { AnimatePresence, Reorder, useDragControls } from 'motion/react'
import { useState } from 'react'
import { MAX_PLAYERS, MIN_PLAYERS } from '../../engine/setup'
import { Btn } from '../kit/controls'
import { btnClass } from '../kit/styles'
import { Icon } from '../kit/icons'
import { Sheet } from '../kit/layout'
import { Avatar, AvatarArt } from '../players/Avatar'
import { AVATARS, randomAvatar, toThumb } from '../players/photos'
import type { SetupData } from './data'

export function PlayersStep({ data, set, onScore }: { data: SetupData; set: (p: Partial<SetupData>) => void; onScore: () => void }) {
  const [draft, setDraft] = useState('')
  const [photoFor, setPhotoFor] = useState<string | null>(null)
  const { names, photos } = data
  const remove = (nm: string) => {
    const { [nm]: _gone, ...rest } = photos
    set({ names: names.filter((x) => x !== nm), photos: rest })
  }
  const dup = names.some((x) => x.toLowerCase() === draft.trim().toLowerCase())
  const add = () => {
    const v = draft.trim()
    if (!v || dup || names.length >= MAX_PLAYERS) return
    set({ names: [...names, v], photos: { ...photos, [v]: photos[v] ?? randomAvatar(Object.values(photos)) } }); setDraft('')
  }
  return (
    <section>
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-2xl font-semibold tracking-tight">Quem vai jogar?</h2>
        <Btn kind="ghost" size="sm" icon="trophy" onClick={onScore}>Placar</Btn>
      </div>
      <p className="mt-1 text-sm text-muted">De {MIN_PLAYERS} a {MAX_PLAYERS} pessoas. Arraste para pôr na ordem em que estão sentadas.</p>
      <form className="mt-5 flex gap-2" onSubmit={(e) => { e.preventDefault(); add() }}>
        <input value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Nome do jogador" maxLength={16} aria-label="Nome do jogador" enterKeyHint="done"
          className="min-h-13 min-w-0 flex-1 rounded-2xl card px-4 text-base outline-none placeholder:text-muted/70 focus:ring-2 focus:ring-moon/50" />
        <Btn className="w-13 px-0" disabled={!draft.trim() || dup} onClick={add}><Icon name="plus" size={22} /><span className="sr-only">Adicionar</span></Btn>
      </form>
      {dup && <p className="mt-2 text-sm text-solo">Esse nome já está na lista.</p>}
      <Reorder.Group axis="y" values={names} onReorder={(v) => set({ names: v })} className="mt-5 space-y-2">
        <AnimatePresence initial={false}>
          {names.map((nm, i) => <PlayerRow key={nm} name={nm} index={i} onRemove={() => remove(nm)} onPhoto={() => setPhotoFor(nm)} />)}
        </AnimatePresence>
      </Reorder.Group>
      {!names.length && (
        <div className="mt-10 flex flex-col items-center text-center text-muted">
          <Icon name="users" size={40} className="text-line" />
          <p className="mt-3 text-sm">Ninguém ainda. Digite o primeiro nome acima.</p>
        </div>
      )}
      <PhotoPicker name={photoFor} photo={photoFor ? photos[photoFor] ?? '' : ''} onClose={() => setPhotoFor(null)}
        onPick={(v) => photoFor && set({ photos: { ...photos, [photoFor]: v } })} />
    </section>
  )
}

function PlayerRow({ name, index, onRemove, onPhoto }: { name: string; index: number; onRemove: () => void; onPhoto: () => void }) {
  const controls = useDragControls()
  return (
    <Reorder.Item value={name} dragListener={false} dragControls={controls}
      initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -40, transition: { duration: 0.15 } }}
      whileDrag={{ scale: 1.03, boxShadow: '0 12px 30px rgb(0 0 0 / .4)' }}
      className="flex items-center gap-3 rounded-2xl card py-2 pr-2 pl-1">
      <span onPointerDown={(e) => controls.start(e)} className="grid h-10 w-8 cursor-grab touch-none place-items-center text-muted" aria-label={`Arrastar ${name}`}>
        <Icon name="grip" size={18} />
      </span>
      <button onClick={onPhoto} className="relative rounded-full" aria-label={`Trocar foto de ${name}`}>
        <Avatar name={name} size={38} />
        <span className="absolute -right-1 -bottom-1 grid size-4.5 place-items-center rounded-full border border-line bg-bg text-muted"><Icon name="plus" size={10} /></span>
      </button>
      <span className="flex-1 truncate font-medium">{name}</span>
      <span className="text-xs text-muted tabular-nums">{index + 1}º</span>
      <button onClick={onRemove} className="grid size-10 place-items-center rounded-xl text-muted hover:text-lobos" aria-label={`Remover ${name}`}><Icon name="close" size={18} /></button>
    </Reorder.Item>
  )
}

function PhotoPicker({ name, photo, onPick, onClose }: { name: string | null; photo: string; onPick: (v: string) => void; onClose: () => void }) {
  const upload = async (f?: File) => {
    if (!f) return
    try { onPick(await toThumb(f)); onClose() } catch { alert('Não foi possível usar essa imagem. Tente outra.') }
  }
  return (
    <Sheet open={!!name} onClose={onClose} title={`Foto de ${name ?? ''}`}>
      {name && <div className="mx-auto mb-5 w-fit"><Avatar name={name} size={96} /></div>}
      <label className={`${btnClass('ghost')} w-full cursor-pointer`}>
        <Icon name="plus" size={20} />Enviar foto própria
        <input type="file" accept="image/*" className="sr-only" onChange={(e) => { upload(e.target.files?.[0]); e.target.value = '' }} />
      </label>
      <p className="eyebrow mt-6 mb-3 text-muted">Ou escolha um avatar</p>
      <div className="grid grid-cols-4 gap-3">
        {AVATARS.map((a) => {
          const v = `a:${a.id}`
          return (
            <button key={a.id} onClick={() => { onPick(v); onClose() }} aria-label={a.name} aria-pressed={photo === v}
              className={`mx-auto rounded-full p-1 transition-shadow ${photo === v ? 'ring-2 ring-white' : 'ring-1 ring-transparent'}`}>
              <span className="block overflow-hidden rounded-full"><AvatarArt photo={v} size={60} /></span>
            </button>
          )
        })}
      </div>
    </Sheet>
  )
}
