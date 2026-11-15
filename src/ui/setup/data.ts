import { defaultSettings, type Lineup } from '../../engine/setup'

/** What the setup screens edit and the app saves: the lineup plus each player's photo (by name). */
export interface SetupData extends Lineup { photos: Record<string, string> }

export const defaultSetup: SetupData = { names: [], pool: [], fixed: {}, photos: {}, settings: defaultSettings }
