import { useEffect, useState } from 'react'
import { alive, bulletsLeft, dayPowerOf, player, type GameState } from '../../engine/game'
import { Btn } from '../kit/controls'
import { Avatar } from '../players/Avatar'
import { TimerRing, useCountdown } from '../kit/Timer'
import { Screen, Sheet } from '../kit/layout'
import { PlayerGrid } from '../players/PlayerGrid'
import { RoleBadge } from '../roles/RoleViews'

type Power = (actor: number, target: number | null) => void

// The discussion clock outlives a day power and a page reload. Kept out of GameState so ticks don't flood the undo history.
const CLOCK = 'lua-de-sangue:clock'
function savedLeft(key: string): number | undefined {
  try { const c = JSON.parse(localStorage.getItem(CLOCK) ?? 'null'); return c?.key === key ? c.left : undefined } catch { return undefined }
}
function saveLeft(key: string, left: number) {
  try { localStorage.setItem(CLOCK, JSON.stringify({ key, left })) } catch { /* no storage: the clock restarts on reload */ }
}

export function Day({ s, onVote, onPower, onTick }: { s: GameState; onVote: () => void; onPower: Power; onTick?: (left: number | undefined) => void }) {
  const total = s.settings.discussionSeconds
  const key = `${s.startedAt}-${s.day}`
  const [left, setLeft] = useCountdown(total, onTick, savedLeft(key) ?? total)
  useEffect(() => saveLeft(key, left), [key, left])
  const [powerOpen, setPowerOpen] = useState(false)
  const dead = s.players.filter((p) => !p.alive)
  return (
    <Screen kicker={`Dia ${s.day}`} title="Discussão" hint="Conversem, acusem e se defendam. Quando o tempo acabar, todos votam."
      footer={<Btn kind={left > 0 ? 'ghost' : 'danger'} icon="scale" onClick={onVote}>{left > 0 ? 'Ir para a votação' : 'Hora de votar'}</Btn>}>
      <TimerRing left={left} total={total} />
      <div className="mt-4 flex justify-center gap-2">
        <Btn kind="ghost" size="sm" onClick={() => setLeft(left + 30)}>+30s</Btn>
        <Btn kind="ghost" size="sm" onClick={() => setLeft(0)}>Encerrar</Btn>
        <Btn kind="ghost" size="sm" icon="sparkle" onClick={() => setPowerOpen(true)}>Usar poder do dia</Btn>
      </div>
      <h3 className="mt-8 mb-3 eyebrow text-muted">Vivos · {alive(s).length}</h3>
      <PlayerGrid players={alive(s)} />
      {dead.length > 0 && (
        <>
          <h3 className="mt-6 mb-3 eyebrow text-muted">Mortos · {dead.length}</h3>
          <div className="no-scrollbar -mx-5 flex gap-2 overflow-x-auto px-5">
            {dead.map((p) => (
              <div key={p.id} className="flex shrink-0 items-center gap-2 rounded-full card py-1.5 pr-3 pl-1.5">
                {s.settings.revealOnDeath ? <RoleBadge role={p.role} size={28} /> : <Avatar name={p.name} size={28} dim />}
                <span className="text-sm text-muted line-through decoration-muted/40">{p.name}</span>
              </div>
            ))}
          </div>
        </>
      )}
      <Sheet open={powerOpen} onClose={() => setPowerOpen(false)} title="Poder do dia">
        {powerOpen && <DayPower s={s} onPower={(a, t) => { setPowerOpen(false); onPower(a, t) }} />}
      </Sheet>
    </Screen>
  )
}

/** Public powers (Prefeito, Atirador, Sacerdote): the player says it out loud, the host marks who and, for a shot, the target. */
function DayPower({ s, onPower }: { s: GameState; onPower: Power }) {
  const [actor, setActor] = useState<number | null>(null)
  const [target, setTarget] = useState<number | null>(null)
  if (actor == null) {
    return (
      <>
        <p className="mb-4 text-sm text-muted">Quem vai usar um poder? (Prefeito se revelando, Atirador atirando, Sacerdote jogando água benta.)</p>
        <PlayerGrid players={alive(s)} onSelect={setActor} />
      </>
    )
  }
  const who = player(s, actor)
  const power = dayPowerOf(s, actor)
  const back = <Btn kind="quiet" onClick={() => { setActor(null); setTarget(null) }}>Voltar</Btn>
  if (!power) return <div className="space-y-4 text-center"><p>{who.name} não tem poder para usar agora.</p>{back}</div>
  if (power === 'prefeito') {
    return (
      <div className="space-y-4 text-center">
        <p>{who.name} vai se revelar Prefeito. Todos vão saber, e o voto dele(a) passa a valer 2.</p>
        <Btn onClick={() => onPower(actor, null)}>Revelar Prefeito</Btn>{back}
      </div>
    )
  }
  if (power === 'sacerdote') {
    return (
      <>
        <p className="mb-4 text-sm text-muted">{who.name} é o Sacerdote e só tem uma água benta. Em quem vai jogar? Se for lobo, o lobo morre. Se não for, morre o Sacerdote.</p>
        <PlayerGrid players={alive(s)} selected={[target]} onSelect={setTarget} can={(o) => o.id !== actor} />
        <div className="mt-4 flex flex-col gap-2">
          <Btn kind="danger" disabled={target == null} onClick={() => onPower(actor, target)}>Jogar água benta{target != null && ` em ${player(s, target).name}`}</Btn>
          {back}
        </div>
      </>
    )
  }
  return (
    <>
      <p className="mb-4 text-sm text-muted">{who.name} é o Atirador ({bulletsLeft(s, actor)} bala{bulletsLeft(s, actor) > 1 ? 's' : ''}). Em quem vai atirar? O alvo morre na hora.</p>
      <PlayerGrid players={alive(s)} selected={[target]} onSelect={setTarget} can={(o) => o.id !== actor} />
      <div className="mt-4 flex flex-col gap-2">
        <Btn kind="danger" disabled={target == null} onClick={() => onPower(actor, target)}>Atirar{target != null && ` em ${player(s, target).name}`}</Btn>
        {back}
      </div>
    </>
  )
}
