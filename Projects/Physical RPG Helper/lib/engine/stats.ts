// Stat aggregation: combines base stats with any number of modifier sources.
// Rule: all flat modifiers are summed onto the base, then all percentage
// modifiers are applied to the base value of that stat (additive percent).

import { type BaseStats, type StatKey, type StatModifier, type ModifierSource, emptyStats, STAT_KEYS } from "./types"

export interface AggregatedStats extends BaseStats {}

export interface StatBreakdownEntry {
  stat: StatKey
  base: number
  flat: number
  percent: number // total additive percent applied
  final: number
}

export function aggregateModifiers(sources: ModifierSource[]): StatModifier[] {
  const all: StatModifier[] = []
  for (const s of sources) all.push(...s.modifiers)
  return all
}

// Compute final stats from a base and a list of modifiers.
export function computeStats(base: BaseStats, modifiers: StatModifier[]): AggregatedStats {
  const flat = emptyStats()
  const percent = emptyStats()

  for (const m of modifiers) {
    if (m.kind === "flat") flat[m.stat] += m.value
    else percent[m.stat] += m.value
  }

  const result = emptyStats()
  for (const key of STAT_KEYS) {
    const b = base[key] ?? 0
    const withFlat = b + flat[key]
    const final = withFlat * (1 + percent[key] / 100)
    result[key] = final
  }
  return result
}

export function computeBreakdown(base: BaseStats, modifiers: StatModifier[]): StatBreakdownEntry[] {
  const flat = emptyStats()
  const percent = emptyStats()
  for (const m of modifiers) {
    if (m.kind === "flat") flat[m.stat] += m.value
    else percent[m.stat] += m.value
  }
  return STAT_KEYS.map((key) => {
    const b = base[key] ?? 0
    const final = (b + flat[key]) * (1 + percent[key] / 100)
    return { stat: key, base: b, flat: flat[key], percent: percent[key], final }
  })
}

// Rounds stats that should be integers (HP, ATK, DEF, TP) while leaving
// percentage stats as-is for precision.
export function roundStats(stats: AggregatedStats): AggregatedStats {
  return {
    ...stats,
    hp: Math.round(stats.hp),
    atk: Math.round(stats.atk),
    def: Math.round(stats.def),
    tp: Math.round(stats.tp),
  }
}
