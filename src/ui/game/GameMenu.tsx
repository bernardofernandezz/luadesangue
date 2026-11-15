import { useState } from 'react'
import type { GameState } from '../../engine/game'
import { Btn } from '../kit/controls'
import { Sheet } from '../kit/layout'

export function GameMenu({ game, open, canUndo, onClose, onUndo, onGuide, onHelp, onQuit }: {
  game: GameState; open: boolean; canUndo: boolean; onClose: () => void; onUndo: () => void; onGuide: () => void; onHelp: () => void; onQuit: () => void
}) {
  const [timeline, setTimeline] = useState(false)
  const then = (fn: () => void) => () => { fn(); onClose() }
  return (
    <>
      <Sheet open={open} onClose={onClose} title="Partida">
        <div className="flex flex-col gap-2">
          <Btn kind="ghost" icon="undo" disabled={!canUndo} onClick={then(onUndo)}>Desfazer última ação</Btn>
          {game.settings.mode !== 'cartas' && <Btn kind="ghost" icon="scale" onClick={then(() => setTimeline(true))}>Acontecimentos</Btn>}
          <Btn kind="ghost" icon="book" onClick={then(onGuide)}>Guia de papéis</Btn>
          <Btn kind="ghost" icon="help" onClick={then(onHelp)}>Como jogar</Btn>
          <Btn kind="quiet" className="text-lobos" onClick={() => confirm('Encerrar a partida atual?') && then(onQuit)()}>Encerrar partida</Btn>
          <p className="mt-1 text-center text-xs text-muted">A partida fica salva neste aparelho. Pode fechar o app e voltar depois.</p>
        </div>
      </Sheet>

      <Sheet open={timeline} onClose={() => setTimeline(false)} title="Acontecimentos">
        {game.timeline.length ? (
          <ol className="space-y-2">
            {game.timeline.map((t, i) => (
              <li key={i} className="card rounded-2xl p-3 text-[15px] leading-relaxed"><span className="mr-2 text-xs text-muted">Dia {t.day}</span>{t.text}</li>
            ))}
          </ol>
        ) : <p className="text-center text-sm text-muted">Nada aconteceu ainda.</p>}
      </Sheet>
    </>
  )
}
