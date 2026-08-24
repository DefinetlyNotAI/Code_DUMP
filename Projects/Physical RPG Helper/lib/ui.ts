import type { Rarity } from "@/lib/types"
import type { StatKey } from "@/lib/engine/types"

export const RARITY_LABEL: Record<Rarity, string> = {
  1: "Common",
  2: "Uncommon",
  3: "Rare",
  4: "Epic",
  5: "Legendary",
}

export const RARITY_TEXT: Record<Rarity, string> = {
  1: "text-rarity-1",
  2: "text-rarity-2",
  3: "text-rarity-3",
  4: "text-rarity-4",
  5: "text-rarity-5",
}

export const RARITY_BORDER: Record<Rarity, string> = {
  1: "border-rarity-1/40",
  2: "border-rarity-2/50",
  3: "border-rarity-3/50",
  4: "border-rarity-4/50",
  5: "border-rarity-5/60",
}

export const STAT_META: Record<StatKey, { label: string; short: string; suffix: string }> = {
  hp: { label: "Health", short: "HP", suffix: "" },
  atk: { label: "Attack", short: "ATK", suffix: "" },
  def: { label: "Defense", short: "DEF", suffix: "" },
  critRate: { label: "Crit Rate", short: "CR", suffix: "%" },
  critDmg: { label: "Crit DMG", short: "CD", suffix: "%" },
  energyRegen: { label: "Energy Regen", short: "ER", suffix: "%" },
  basicBonus: { label: "Basic Bonus", short: "BASIC+", suffix: "%" },
  skillBonus: { label: "Skill Bonus", short: "SKILL+", suffix: "%" },
  ultimateBonus: { label: "Ultimate Bonus", short: "ULT+", suffix: "%" },
  basicRes: { label: "Basic RES", short: "B.RES", suffix: "%" },
  skillRes: { label: "Skill RES", short: "S.RES", suffix: "%" },
  ultimateRes: { label: "Ultimate RES", short: "U.RES", suffix: "%" },
  tp: { label: "Tactical Points", short: "TP", suffix: "" },
}

export function fmt(n: number, digits = 0): string {
  return n.toLocaleString("en-US", { maximumFractionDigits: digits })
}

export function statValue(key: StatKey, value: number): string {
  const meta = STAT_META[key]
  const rounded = meta.suffix === "%" ? Math.round(value * 10) / 10 : Math.round(value)
  return `${fmt(rounded, 1)}${meta.suffix}`
}

export const ATTACK_TYPE_LABEL: Record<string, string> = {
  basic: "Basic",
  skill: "Skill",
  ultimate: "Ultimate",
}
