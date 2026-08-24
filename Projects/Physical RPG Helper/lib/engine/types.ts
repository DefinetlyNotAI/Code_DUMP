// Core domain types for the RPG engine.
// These are shared between the pure engine, the DB layer, and the UI.

export type Rarity = 1 | 2 | 3 | 4 | 5

export type AttackType = "basic" | "skill" | "ultimate"

// Every stat that can be modified by equipment, status effects, or temp modifiers.
export type StatKey =
  | "hp"
  | "atk"
  | "def"
  | "critRate"
  | "critDmg"
  | "energyRegen"
  | "basicBonus"
  | "skillBonus"
  | "ultimateBonus"
  | "basicRes"
  | "skillRes"
  | "ultimateRes"
  | "tp"

export const STAT_KEYS: StatKey[] = [
  "hp",
  "atk",
  "def",
  "critRate",
  "critDmg",
  "energyRegen",
  "basicBonus",
  "skillBonus",
  "ultimateBonus",
  "basicRes",
  "skillRes",
  "ultimateRes",
  "tp",
]

export const STAT_LABELS: Record<StatKey, string> = {
  hp: "HP",
  atk: "ATK",
  def: "DEF",
  critRate: "Crit Rate",
  critDmg: "Crit DMG",
  energyRegen: "Energy Regen",
  basicBonus: "Basic ATK Bonus",
  skillBonus: "Skill ATK Bonus",
  ultimateBonus: "Ultimate ATK Bonus",
  basicRes: "Basic RES",
  skillRes: "Skill RES",
  ultimateRes: "Ultimate RES",
  tp: "TP",
}

// A record of the primary combat stats.
export interface BaseStats {
  hp: number
  atk: number
  def: number
  critRate: number // percent, e.g. 5 = 5%
  critDmg: number // percent, e.g. 150 = 150%
  energyRegen: number // percent
  basicBonus: number // percent
  skillBonus: number // percent
  ultimateBonus: number // percent
  basicRes: number // percent
  skillRes: number // percent
  ultimateRes: number // percent
  tp: number // max TP
}

export function emptyStats(): BaseStats {
  return {
    hp: 0,
    atk: 0,
    def: 0,
    critRate: 0,
    critDmg: 0,
    energyRegen: 0,
    basicBonus: 0,
    skillBonus: 0,
    ultimateBonus: 0,
    basicRes: 0,
    skillRes: 0,
    ultimateRes: 0,
    tp: 0,
  }
}

// A single modifier applied to a stat, either flat or percentage.
export interface StatModifier {
  stat: StatKey
  value: number
  kind: "flat" | "percent"
}

// A collection of modifiers, typically from a single source (equipment / status).
export interface ModifierSource {
  id: string
  label: string
  modifiers: StatModifier[]
}
