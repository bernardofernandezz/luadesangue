import type { RoleId } from '../../engine/roles'
import { defaultSettings, type Lineup, type Settings } from '../../engine/setup'

export interface Preset { name: string; pool: RoleId[]; settings: Settings }

/** What the setup screens edit and the app saves: the lineup plus each player's photo (by name). */
export interface SetupData extends Lineup { photos: Record<string, string>; presets: Preset[] }

export const defaultSetup: SetupData = { names: [], pool: [], fixed: {}, photos: {}, presets: [], settings: defaultSettings }
