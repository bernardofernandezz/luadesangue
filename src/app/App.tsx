import { AnimatePresence, MotionConfig, motion, useIsPresent } from 'motion/react'
import { useEffect, useState, type ReactNode } from 'react'
import { ackAnnounce, createGame, hunterShoot, openVote, revealNext, startVote, submitNight, submitVote, type GameState } from '../engine/game'
import { Announce, Hunter } from '../ui/game/Announce'
import { Day } from '../ui/game/Day'
import { Dealt, End } from '../ui/game/End'
import { GameMenu } from '../ui/game/GameMenu'
import { Night } from '../ui/game/Night'
import { Reveal } from '../ui/game/Reveal'
import { Transition } from '../ui/game/Transition'
import { Vote } from '../ui/game/Vote'
import { IconBtn } from '../ui/kit/controls'
import { corner } from '../ui/kit/styles'
import { PhotoContext } from '../ui/players/photos'
import { RoleGuide } from '../ui/roles/RoleGuide'
import { Setup } from '../ui/setup/Setup'
import { Tutorial } from '../ui/help/Tutorial'
import { load, save, type Saved } from './storage'
import { usePhaseEffects } from './usePhaseEffects'

const UNDO_DEPTH = 40

export default function App() {
  const [st, setSt] = useState<Saved>(load)
  const [menu, setMenu] = useState(false)
  const [guide, setGuide] = useState(false)
  const [tutorial, setTutorial] = useState(!st.tutorialSeen)
  const { game, setup } = st
  const { interlude, endInterlude } = usePhaseEffects(game)

  useEffect(() => save(st), [st])

  const apply = (fn: (g: GameState) => GameState) =>
    setSt((cur) => (cur.game ? { ...cur, game: fn(cur.game), history: [...cur.history.slice(-UNDO_DEPTH), cur.game] } : cur))
  const undo = () => setSt((cur) => (cur.history.length ? { ...cur, game: cur.history.at(-1)!, history: cur.history.slice(0, -1) } : cur))
  const start = () => setSt((cur) => ({ ...cur, game: createGame(cur.setup), history: [] }))
  const quit = () => setSt((cur) => ({ ...cur, game: null, history: [] }))
  const closeTutorial = () => { setTutorial(false); setSt((cur) => ({ ...cur, tutorialSeen: true })) }

  let screen: ReactNode
  let key = 'setup'
  if (!game) {
    screen = <Setup data={setup} onChange={(d) => setSt((cur) => ({ ...cur, setup: d }))} onStart={start} onHelp={() => setTutorial(true)} onGuide={() => setGuide(true)} />
  } else {
    key = `${game.phase}-${game.day}-${game.cursor}-${game.hunterQueue.length}-${game.next}`
    screen = {
      reveal: <Reveal s={game} onNext={() => apply(revealNext)} />,
      night: <Night s={game} onChoose={(c) => apply((g) => submitNight(g, c))} />,
      announce: <Announce s={game} onNext={() => apply(ackAnnounce)} />,
      hunter: <Hunter s={game} onShoot={(t) => apply((g) => hunterShoot(g, t))} />,
      day: <Day s={game} onVote={() => apply(startVote)} />,
      vote: <Vote s={game} onSecret={(t) => apply((g) => submitVote(g, t))} onOpen={(t) => apply((g) => openVote(g, t))} />,
      end: <End s={game} onAgain={start} onMenu={quit} />,
      dealt: <Dealt s={game} onAgain={start} onMenu={quit} />,
    }[game.phase]
  }

  return (
    <PhotoContext.Provider value={setup.photos}>
      <MotionConfig reducedMotion="user">
        <AnimatePresence mode="wait">
          <motion.main key={key} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.25, ease: 'easeOut' }}>
            <Inert>{screen}</Inert>
          </motion.main>
        </AnimatePresence>

        {game && (
          <>
            <IconBtn name="menu" label="Menu da partida" onClick={() => setMenu(true)} className={corner.right} />
            <GameMenu game={game} open={menu} canUndo={st.history.length > 0} onClose={() => setMenu(false)}
              onUndo={undo} onGuide={() => setGuide(true)} onHelp={() => setTutorial(true)} onQuit={quit} />
          </>
        )}
        <RoleGuide open={guide} onClose={() => setGuide(false)} />

        <AnimatePresence>{interlude && <Transition key={`${interlude.kind}${interlude.day}`} {...interlude} onDone={endInterlude} />}</AnimatePresence>
        <AnimatePresence>{tutorial && <Tutorial onDone={closeTutorial} />}</AnimatePresence>
      </MotionConfig>
    </PhotoContext.Provider>
  )
}

/** A screen on its way out can't be tapped: a double tap would otherwise act on the next turn. */
function Inert({ children }: { children: ReactNode }) {
  return <div inert={!useIsPresent()}>{children}</div>
}
