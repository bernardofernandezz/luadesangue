import { AnimatePresence, MotionConfig, motion } from 'motion/react'
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { ackAnnounce, createGame, hunterShoot, noteText, openVote, revealNext, startVote, submitNight, submitVote, type GameState } from './engine/game'
import { ROLE_LIST, type RoleId } from './engine/roles'
import { Btn, IconBtn, RoleBadge, RoleCard, RoleHeader, Sheet } from './ui/components'
import { Icon } from './ui/icons'
import { Announce, Day, Dealt, End, Hunter, Night, Reveal, Vote } from './ui/screens'
import { Setup, defaultSetup, rolesFor, type SetupData } from './ui/Setup'
import { Transition } from './ui/Transition'
import { Tutorial } from './ui/Tutorial'
import { PhotoContext } from './ui/avatars'

const KEY = 'lua-de-sangue:v2'
interface Saved { setup: SetupData; game: GameState | null; history: GameState[]; tutorialSeen: boolean }

function load(): Saved {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) {
      const saved: Saved = JSON.parse(raw)
      // older saves lack newer settings
      return { ...saved, setup: { ...defaultSetup, ...saved.setup, settings: { ...defaultSetup.settings, ...saved.setup?.settings } } }
    }
  } catch { /* private mode or corrupt data: start fresh */ }
  return { setup: defaultSetup, game: null, history: [], tutorialSeen: false }
}

function speak(text: string) {
  try {
    speechSynthesis.cancel()
    const u = new SpeechSynthesisUtterance(text)
    u.lang = 'pt-BR'
    speechSynthesis.speak(u)
  } catch { /* no speech support */ }
}

export default function App() {
  const [st, setSt] = useState<Saved>(load)
  const [menu, setMenu] = useState(false)
  const [history, setHistory] = useState(false)
  const [guide, setGuide] = useState<RoleId | '' | null>(null)
  const [tutorial, setTutorial] = useState(!st.tutorialSeen)
  const [interlude, setInterlude] = useState<{ kind: 'night' | 'dawn'; day: number } | null>(null)
  const shown = useRef('')
  const { game, setup } = st

  useEffect(() => {
    try { localStorage.setItem(KEY, JSON.stringify(st)) } catch { /* storage full or blocked */ }
  }, [st])

  // Cinematic between night and day, once per transition.
  useEffect(() => {
    if (!game) return
    const k = game.phase === 'night' && game.cursor === 0 ? `n${game.day}` : game.phase === 'announce' && game.next === 'day' ? `d${game.day}` : ''
    if (k && shown.current !== k) { shown.current = k; setInterlude({ kind: k[0] === 'n' ? 'night' : 'dawn', day: game.day }) }
  }, [game])

  // Narrate public moments only; private turns stay silent.
  const phaseKey = game ? `${game.phase}-${game.day}-${game.announcements.length}-${game.hunterQueue.length}` : ''
  useEffect(() => {
    if (!game?.settings.narration) return
    if (game.phase === 'announce') speak(game.announcements.map((n) => noteText(game, n)).join('. '))
    if (game.phase === 'night' && game.cursor === 0) speak(`Noite ${game.day}. A vila adormece.`)
    if (game.phase === 'day') speak('Discussão aberta. Quem são os lobos?')
    if (game.phase === 'end') speak(game.winner?.title ?? '')
    if (game.phase === 'announce' || game.phase === 'end') navigator.vibrate?.(120)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phaseKey])

  const isDay = !!game && (['day', 'vote', 'hunter', 'announce'].includes(game.phase) || interlude?.kind === 'dawn') && interlude?.kind !== 'night'
  useEffect(() => { document.body.classList.toggle('day', isDay) }, [isDay])

  const apply = (fn: (g: GameState) => GameState) =>
    setSt((cur) => (cur.game ? { ...cur, game: fn(cur.game), history: [...cur.history.slice(-40), cur.game] } : cur))
  const undo = () => setSt((cur) => cur.history.length ? { ...cur, game: cur.history.at(-1)!, history: cur.history.slice(0, -1) } : cur)
  const start = () => { shown.current = ''; setSt((cur) => ({ ...cur, game: createGame(cur.setup.names, rolesFor(cur.setup), cur.setup.settings), history: [] })) }
  const quit = () => { setSt((cur) => ({ ...cur, game: null, history: [] })); setMenu(false) }
  const closeTutorial = () => { setTutorial(false); setSt((cur) => ({ ...cur, tutorialSeen: true })) }
  const endInterlude = useCallback(() => setInterlude(null), [])

  let screen: ReactNode
  let key = 'setup'
  if (!game) {
    screen = <Setup data={setup} onChange={(d) => setSt((cur) => ({ ...cur, setup: d }))} onStart={start} onHelp={() => setTutorial(true)} onGuide={() => setGuide('')} />
  } else {
    key = `${game.phase}-${game.day}-${game.cursor}-${game.hunterQueue.length}-${game.next}`
    screen = {
      reveal: <Reveal s={game} onNext={() => apply(revealNext)} />,
      night: <Night s={game} onChoose={(c) => apply((g) => submitNight(g, c))} />,
      announce: <Announce s={game} onNext={() => apply(ackAnnounce)} />,
      hunter: <Hunter s={game} onShoot={(t) => apply((g) => hunterShoot(g, t))} />,
      day: <Day s={game} onVote={() => apply(startVote)} />,
      vote: <Vote s={game} onSecret={(v, t) => apply((g) => submitVote(g, v, t))} onOpen={(t) => apply((g) => openVote(g, t))} />,
      end: <End s={game} onAgain={start} onMenu={quit} />,
      dealt: <Dealt s={game} onAgain={start} onMenu={quit} />,
    }[game.phase]
  }

  return (
    <PhotoContext.Provider value={setup.photos}>
    <MotionConfig reducedMotion="user">
      <AnimatePresence mode="wait">
        <motion.main key={key} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.25, ease: 'easeOut' }}>
          {screen}
        </motion.main>
      </AnimatePresence>

      {game && <IconBtn name="menu" label="Menu da partida" onClick={() => setMenu(true)} className="fixed top-5 right-[max(1.25rem,calc(50%-14rem+1.25rem))] z-30" />}

      <AnimatePresence>{interlude && <Transition key={`${interlude.kind}${interlude.day}`} kind={interlude.kind} day={interlude.day} onDone={endInterlude} />}</AnimatePresence>
      <AnimatePresence>{tutorial && <Tutorial onDone={closeTutorial} />}</AnimatePresence>

      <Sheet open={menu} onClose={() => setMenu(false)} title="Partida">
        <div className="flex flex-col gap-2">
          <Btn kind="ghost" icon="undo" disabled={!st.history.length} onClick={() => { undo(); setMenu(false) }}>Desfazer última ação</Btn>
          {game?.settings.mode !== 'cartas' && <Btn kind="ghost" icon="scale" onClick={() => { setHistory(true); setMenu(false) }}>Acontecimentos</Btn>}
          <Btn kind="ghost" icon="book" onClick={() => { setGuide(''); setMenu(false) }}>Guia de papéis</Btn>
          <Btn kind="ghost" icon="help" onClick={() => { setTutorial(true); setMenu(false) }}>Como jogar</Btn>
          <Btn kind="quiet" className="text-lobos" onClick={() => confirm('Encerrar a partida atual?') && quit()}>Encerrar partida</Btn>
          <p className="mt-1 text-center text-xs text-muted">A partida fica salva neste aparelho. Pode fechar o app e voltar depois.</p>
        </div>
      </Sheet>

      <Sheet open={history} onClose={() => setHistory(false)} title="Acontecimentos">
        {game?.timeline?.length ? (
          <ol className="space-y-2">
            {game.timeline.map((t, i) => (
              <li key={i} className="rounded-2xl card p-3 text-[15px] leading-relaxed"><span className="mr-2 text-xs text-muted">Dia {t.day}</span>{t.text}</li>
            ))}
          </ol>
        ) : <p className="text-center text-sm text-muted">Nada aconteceu ainda.</p>}
      </Sheet>

      <Sheet open={guide !== null} onClose={() => setGuide(null)} title="Guia de papéis">
        {guide ? (
          <>
            <button onClick={() => setGuide('')} className="mb-4 flex items-center gap-1 text-sm text-muted"><Icon name="back" size={16} />Todos os papéis</button>
            <RoleHeader role={guide} />
            <div className="mt-6"><RoleCard role={guide} /></div>
          </>
        ) : (
          <ul className="space-y-2">
            {ROLE_LIST.map((r) => (
              <li key={r.id}>
                <button onClick={() => setGuide(r.id)} className="flex w-full items-center gap-3 rounded-2xl card p-3 text-left">
                  <RoleBadge role={r.id} size={40} />
                  <span className="flex-1"><span className="block font-medium">{r.name}</span><span className="block text-sm text-muted">{r.tagline}</span></span>
                  <Icon name="back" size={16} className="rotate-180 text-muted" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </Sheet>
    </MotionConfig>
    </PhotoContext.Provider>
  )
}
