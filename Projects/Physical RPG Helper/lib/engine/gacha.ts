// Gacha engine: single pool, no featured items, configurable rarity distribution,
// configurable pity for 4-star and 5-star.

import type { Rarity } from "./types"
import type { Rng } from "./dice"

export interface RarityDistribution {
  1: number
  2: number
  3: number
  4: number
  5: number
}

export interface GachaConfig {
  distribution: RarityDistribution // percentages, should sum ~100
  pity4Threshold: number // guaranteed 4* (or higher) at this count
  pity5Threshold: number // guaranteed 5* at this count
  reset4OnHigher: boolean // reset 4* pity when a 4*+ is obtained
}

export interface PityState {
  pity4: number
  pity5: number
}

export const DEFAULT_GACHA_CONFIG: GachaConfig = {
  distribution: { 1: 60, 2: 25, 3: 10, 4: 4, 5: 1 },
  pity4Threshold: 10,
  pity5Threshold: 80,
  reset4OnHigher: true,
}

export interface PullOutcome {
  rarity: Rarity
  forcedByPity: "4" | "5" | null
  pityBefore: PityState
  pityAfter: PityState
}

// Roll a rarity from the distribution.
function rollRarity(dist: RarityDistribution, roll: number): Rarity {
  const total = dist[1] + dist[2] + dist[3] + dist[4] + dist[5]
  const r = roll * total
  let acc = 0
  const order: Rarity[] = [1, 2, 3, 4, 5]
  for (const rar of order) {
    acc += dist[rar]
    if (r < acc) return rar
  }
  return 5
}

// Determine the rarity for a single pull, applying pity.
export function pullRarity(
  config: GachaConfig,
  pity: PityState,
  rng: Rng = Math.random,
  forcedRarity?: Rarity,
): PullOutcome {
  const pityBefore = { ...pity }
  const next4 = pity.pity4 + 1
  const next5 = pity.pity5 + 1

  let rarity: Rarity
  let forcedByPity: "4" | "5" | null = null

  if (forcedRarity) {
    rarity = forcedRarity
  } else if (next5 >= config.pity5Threshold) {
    rarity = 5
    forcedByPity = "5"
  } else if (next4 >= config.pity4Threshold) {
    // guarantee at least 4*, but allow a natural 5* to still occur
    const rolled = rollRarity(config.distribution, rng())
    rarity = rolled >= 4 ? rolled : 4
    forcedByPity = "4"
  } else {
    rarity = rollRarity(config.distribution, rng())
  }

  // Update pity counters
  let pity4 = next4
  let pity5 = next5

  if (rarity >= 5) {
    pity5 = 0
    if (config.reset4OnHigher) pity4 = 0
  } else if (rarity >= 4) {
    if (config.reset4OnHigher) pity4 = 0
  }

  return {
    rarity,
    forcedByPity,
    pityBefore,
    pityAfter: { pity4, pity5 },
  }
}

// Select a random pool entry of a given rarity.
export function selectFromPool<T extends { rarity: Rarity }>(
  pool: T[],
  rarity: Rarity,
  rng: Rng = Math.random,
): T | null {
  const eligible = pool.filter((p) => p.rarity === rarity)
  if (eligible.length === 0) return null
  const idx = Math.floor(rng() * eligible.length)
  return eligible[idx]
}
