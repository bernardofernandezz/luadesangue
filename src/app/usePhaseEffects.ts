import { useCallback, useEffect, useRef, useState } from 'react'
import { noteText, player, type GameState } from '../engine/game'
import type { Interlude } from '../ui/game/Transition'
import { bell, fanfare, howl, setAmbience, setSoundEnabled, thud } from '../ui/kit/sound'


/** Public moments read aloud. Private turns stay silent. */
export function narrationFor(g: GameState): string | null {
  if (g.phase === 'announce') return g.announcements.map((n) => noteText(g, n)).join('. ')
  if (g.phase === 'night' && g.cursor === 0) return `Noite ${g.day}. A vila adormece.`
  if (g.phase === 'day') return 'Discussão aberta. Quem são os lobos?'
  if (g.phase === 'defense' && g.accused != null) return `${player(g, g.accused).name} foi o mais votado. Você tem a palavra.`
  if (g.phase === 'end') return g.winner?.title ?? null
  return null
}

function interludeFor(g: GameState): Interlude | null {
  if (g.phase === 'night' && g.cursor === 0) return { kind: 'night', day: g.day }
  if (g.phase === 'announce' && g.next === 'day') return { kind: 'dawn', day: g.day }
  return null
}

function speak(text: string) {
  if (!('speechSynthesis' in window)) return
  speechSynthesis.cancel()
  const u = new SpeechSynthesisUtterance(text)
  u.lang = 'pt-BR'
  speechSynthesis.speak(u)
}

export function usePhaseEffects(game: GameState | null) {
  const [interlude, setInterlude] = useState<Interlude | null>(null)
  const shown = useRef('')

  const narration = game?.settings.mode === 'narrador' && game.settings.narration ? narrationFor(game) : null
  const buzz = game?.phase === 'announce' || game?.phase === 'end'
  useEffect(() => {
    if (!narration) return
    speak(narration)
    if (buzz) navigator.vibrate?.(120)
  }, [narration, buzz])

  // Shown once per transition, even if undo comes back to it. A new game starts over.
  useEffect(() => {
    if (!game) return
    if (game.phase === 'reveal') shown.current = ''
    const next = interludeFor(game)
    const key = next && `${next.kind}${next.day}`
    if (next && key !== shown.current) {
      shown.current = key!
      setInterlude(next)
      if (next.kind === 'night') { howl(); setAmbience(true) } else { bell(); setAmbience(false) }
    }
  }, [game])

  const sound = game?.settings.mode === 'narrador' && game.settings.sound
  useEffect(() => { setSoundEnabled(sound); return () => setSoundEnabled(false) }, [sound])
  const sting = !game ? null
    : game.phase === 'end' ? `end-${game.startedAt}`
    : game.phase === 'announce' && game.announcements.some((n) => n.kind === 'death') ? `death-${game.day}-${game.next}-${game.hunterQueue.length}`
    : null
  useEffect(() => {
    if (!sting) return
    if (sting.startsWith('end')) { setAmbience(false); fanfare() } else thud()
  }, [sting])

  // Keep the screen on during a match; the lock is dropped whenever the page is hidden, so take it again on return.
  const playing = !!game
  useEffect(() => {
    if (!playing || !('wakeLock' in navigator)) return
    let lock: WakeLockSentinel | null = null
    let done = false
    const take = () => {
      if (document.visibilityState !== 'visible') return
      navigator.wakeLock.request('screen').then((l) => { if (done) l.release(); else lock = l }).catch(() => {})
    }
    take()
    document.addEventListener('visibilitychange', take)
    return () => { done = true; document.removeEventListener('visibilitychange', take); lock?.release().catch(() => {}) }
  }, [playing])

  const isDay = !!game && (['day', 'vote', 'defense', 'hunter', 'announce'].includes(game.phase) || interlude?.kind === 'dawn') && interlude?.kind !== 'night'
  useEffect(() => { document.body.classList.toggle('day', isDay) }, [isDay])

  return { interlude, endInterlude: useCallback(() => setInterlude(null), []) }
}
