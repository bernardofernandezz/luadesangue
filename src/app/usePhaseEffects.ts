import { useCallback, useEffect, useRef, useState } from 'react'
import { noteText, type GameState } from '../engine/game'
import type { Interlude } from '../ui/game/Transition'


/** Public moments read aloud. Private turns stay silent. */
function narrationFor(g: GameState): string | null {
  if (g.phase === 'announce') return g.announcements.map((n) => noteText(g, n)).join('. ')
  if (g.phase === 'night' && g.cursor === 0) return `Noite ${g.day}. A vila adormece.`
  if (g.phase === 'day') return 'Discussão aberta. Quem são os lobos?'
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

  const narration = game?.settings.narration ? narrationFor(game) : null
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
    if (next && key !== shown.current) { shown.current = key!; setInterlude(next) }
  }, [game])

  const isDay = !!game && (['day', 'vote', 'hunter', 'announce'].includes(game.phase) || interlude?.kind === 'dawn') && interlude?.kind !== 'night'
  useEffect(() => { document.body.classList.toggle('day', isDay) }, [isDay])

  return { interlude, endInterlude: useCallback(() => setInterlude(null), []) }
}
