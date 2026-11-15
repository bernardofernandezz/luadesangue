import type { GameState } from '../engine/game'
import { defaultSettings } from '../engine/setup'
import { defaultSetup, type SetupData } from '../ui/setup/data'

const KEY = 'lua-de-sangue:v2'

export interface Saved { setup: SetupData; game: GameState | null; history: GameState[]; tutorialSeen: boolean }

/** Fills fields added after a save was written, so older saves keep working. */
const upgradeGame = (g: GameState): GameState => ({ ...g, settings: { ...defaultSettings, ...g.settings }, timeline: g.timeline ?? [], accused: g.accused ?? null })

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
      }
    }
  } catch { /* unreadable or corrupt: start fresh */ }
  return { setup: defaultSetup, game: null, history: [], tutorialSeen: false }
}

export function save(st: Saved) {
  try { localStorage.setItem(KEY, JSON.stringify(st)) } catch { /* see load() */ }
}
