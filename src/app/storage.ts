import type { GameState } from '../engine/game'
import { defaultSettings } from '../engine/setup'
import { emptyStats, type Stats } from './stats'
import { defaultSetup, type SetupData } from '../ui/setup/data'

const KEY = 'lua-de-sangue:v2'

export interface Saved { setup: SetupData; game: GameState | null; history: GameState[]; tutorialSeen: boolean; stats: Stats }

/** Fills fields added after a save was written, so older saves keep working. */
const upgradeGame = (g: GameState): GameState => ({ ...g, settings: { ...defaultSettings, ...g.settings }, timeline: g.timeline ?? [], accused: g.accused ?? null, doused: g.doused ?? [], startedAt: g.startedAt ?? g.seed })

// localStorage can be missing, blocked (private browsing) or full; the game must still run, just without saving.
export function load(): Saved {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) {
      const saved: Saved = JSON.parse(raw)
      return {
        ...saved,
        setup: { ...defaultSetup, ...saved.setup, settings: { ...defaultSettings, ...saved.setup?.settings } },
        game: saved.game && upgradeGame(saved.game),
        history: (saved.history ?? []).map(upgradeGame),
        stats: { ...emptyStats, ...saved.stats },
      }
    }
  } catch { /* unreadable or corrupt: start fresh */ }
  return { setup: defaultSetup, game: null, history: [], tutorialSeen: false, stats: emptyStats }
}

export function save(st: Saved) {
  try { localStorage.setItem(KEY, JSON.stringify(st)) } catch { /* see load() */ }
}
