// Centralized EXP / leveling system.
// Inspired by WuWa progression: increasingly expensive per level, deterministic.
// Level range: 1..120. EXP carries over between levels. Excess EXP at cap is retained.

export const MAX_LEVEL = 120
export const MIN_LEVEL = 1

// EXP required to go from level N -> N+1.
// Deterministic curve: quadratic-ish growth so higher levels cost far more.
// expToNext(1) = 100, grows super-linearly. Rounded to nearest 10 for readability.
export function expToNext(level: number): number {
  if (level >= MAX_LEVEL) return 0
  if (level < MIN_LEVEL) level = MIN_LEVEL
  const base = 100
  // growth: base * (level^1.85) scaled. Level 1 -> 100, ramps steeply.
  const raw = base * Math.pow(level, 1.85) + level * 40
  return Math.round(raw / 10) * 10
}

// Total cumulative EXP required to reach a given level from level 1 (level 1 = 0).
export function totalExpForLevel(level: number): number {
  let total = 0
  for (let l = MIN_LEVEL; l < level; l++) total += expToNext(l)
  return total
}

export interface LevelState {
  level: number
  currentExp: number // exp accumulated within the current level
  expToNext: number // exp needed to reach next level (0 at cap)
}

export interface LevelUpResult {
  before: LevelState
  after: LevelState
  levelsGained: number
  expApplied: number
  overflowDiscarded: number // exp discarded because we hit the cap
}

export function makeLevelState(level: number, currentExp = 0): LevelState {
  const clamped = Math.min(MAX_LEVEL, Math.max(MIN_LEVEL, Math.floor(level)))
  const need = expToNext(clamped)
  return {
    level: clamped,
    currentExp: clamped >= MAX_LEVEL ? 0 : Math.max(0, Math.min(currentExp, need)),
    expToNext: need,
  }
}

// Apply an EXP gain, cascading through multiple levels and stopping at the cap.
export function applyExp(state: LevelState, gain: number): LevelUpResult {
  const before: LevelState = { ...state }
  let level = state.level
  let currentExp = state.currentExp + Math.max(0, Math.floor(gain))
  let overflowDiscarded = 0

  while (level < MAX_LEVEL) {
    const need = expToNext(level)
    if (currentExp >= need) {
      currentExp -= need
      level += 1
    } else {
      break
    }
  }

  if (level >= MAX_LEVEL) {
    // At cap: discard leftover exp (configured cap behavior: retain 0 at cap).
    overflowDiscarded = currentExp
    currentExp = 0
    level = MAX_LEVEL
  }

  const after: LevelState = {
    level,
    currentExp,
    expToNext: expToNext(level),
  }

  return {
    before,
    after,
    levelsGained: after.level - before.level,
    expApplied: Math.max(0, Math.floor(gain)),
    overflowDiscarded,
  }
}

// EXP reward scaling by level difference (enemyLevel - playerLevel).
// Centralized + configurable multipliers.
export interface ExpRewardConfig {
  higherMultiplier: number // enemy higher than player
  sameMultiplier: number // same level (within band)
  lowerMultiplier: number // enemy lower than player
  sameBand: number // +/- levels considered "same"
  minMultiplier: number // floor for very-underleveled enemies
}

export const DEFAULT_EXP_REWARD_CONFIG: ExpRewardConfig = {
  higherMultiplier: 1.5,
  sameMultiplier: 1.0,
  lowerMultiplier: 0.5,
  sameBand: 2,
  minMultiplier: 0.1,
}

export function scaledExpReward(
  baseReward: number,
  playerLevel: number,
  enemyLevel: number,
  config: ExpRewardConfig = DEFAULT_EXP_REWARD_CONFIG,
): number {
  const diff = enemyLevel - playerLevel
  let mult: number
  if (Math.abs(diff) <= config.sameBand) {
    mult = config.sameMultiplier
  } else if (diff > 0) {
    // enemy higher: scale up modestly with the gap
    mult = config.higherMultiplier + Math.min(0.5, (diff - config.sameBand) * 0.03)
  } else {
    // enemy lower: decay toward the floor
    const gap = Math.abs(diff) - config.sameBand
    mult = Math.max(config.minMultiplier, config.lowerMultiplier - gap * 0.03)
  }
  return Math.round(baseReward * mult)
}
