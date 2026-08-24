// Layered damage calculation, inspired by Wuthering Waves' documented model,
// adapted for a 1..120 level range.
//
// Layers (modular — each is a pure function that can be swapped):
//   Base ATK -> ability multiplier -> typed ATK bonus -> crit -> DEF mitigation -> RES mitigation -> final
//
// DEF is a level-aware percentage dampener; RES is a nonlinear multiplier.

import type { AttackType } from "./types"
import { type DiceRollResult, rollNotation, type Rng } from "./dice"

// Level-aware DEF multiplier. Higher DEF => lower multiplier (less damage taken).
// Adapted WuWa form: mult = K(level) / (K(level) + DEF), where K scales with attacker level.
// At level 120 K is large so DEF mitigation curve stays meaningful across 1..120.
export function defConstant(attackerLevel: number): number {
  // Linear-ish scaling: level 1 -> ~200, level 120 -> ~1400.
  return 190 + attackerLevel * 10
}

export function defMultiplier(attackerLevel: number, targetDef: number): number {
  const k = defConstant(attackerLevel)
  const def = Math.max(0, targetDef)
  return k / (k + def)
}

// RES multiplier: nonlinear, independent by attack type.
// res is a percent value. Positive res reduces damage; negative res amplifies.
//   res <= 0        : mult = 1 - res/100            (amplify)
//   0 < res < 80    : mult = 1 - res/100            (linear reduction)
//   res >= 80       : mult = 1 / (1 + (res-80)/100) (diminishing wall, WuWa-style)
export function resMultiplier(res: number): number {
  if (res <= 0) return 1 - res / 100
  if (res < 80) return 1 - res / 100
  return 1 / (1 + (res - 80) / 100)
}

export interface AttackerSnapshot {
  level: number
  atk: number
  critRate: number // percent
  critDmg: number // percent, e.g. 150 => x1.5 additional on top of base? see applyCrit
  basicBonus: number
  skillBonus: number
  ultimateBonus: number
}

export interface TargetSnapshot {
  level: number
  def: number
  basicRes: number
  skillRes: number
  ultimateRes: number
}

export interface DamageAbility {
  attackType: AttackType
  multiplier: number // percent, e.g. 160 => 160% of ATK. 0 if pure dice.
  scalingStat: "atk" // reserved for future stats; ATK for now
  dice?: string | null // e.g. "2d6+5"; added to base damage
  flatBonus?: number // flat added to base damage
}

export interface CritDecision {
  forced?: boolean // GM force crit
  forcedValue?: boolean // when forced, whether it crits
}

export interface DamageResultStep {
  label: string
  value: number
}

export interface DamageResult {
  baseAtk: number
  abilityMultiplier: number
  diceRoll?: DiceRollResult
  baseDamage: number
  typedBonusPercent: number
  afterBonus: number
  isCrit: boolean
  critForced: boolean
  critMultiplier: number
  afterCrit: number
  defMultiplier: number
  afterDef: number
  resPercent: number
  resMultiplier: number
  afterRes: number
  final: number
  steps: DamageResultStep[]
}

function typedBonus(attacker: AttackerSnapshot, type: AttackType): number {
  if (type === "basic") return attacker.basicBonus
  if (type === "skill") return attacker.skillBonus
  return attacker.ultimateBonus
}

function typedRes(target: TargetSnapshot, type: AttackType): number {
  if (type === "basic") return target.basicRes
  if (type === "skill") return target.skillRes
  return target.ultimateRes
}

export function computeDamage(
  attacker: AttackerSnapshot,
  target: TargetSnapshot,
  ability: DamageAbility,
  opts: { rng?: Rng; crit?: CritDecision; critRoll?: number } = {},
): DamageResult {
  const rng = opts.rng ?? Math.random

  // Layer 1: base ATK
  const baseAtk = attacker.atk

  // Layer 2: ability multiplier + dice + flat
  let diceRoll: DiceRollResult | undefined
  let diceComponent = 0
  if (ability.dice && ability.dice.trim()) {
    diceRoll = rollNotation(ability.dice, rng)
    diceComponent = diceRoll.total
  }
  const multComponent = baseAtk * (ability.multiplier / 100)
  const baseDamage = multComponent + diceComponent + (ability.flatBonus ?? 0)

  // Layer 3: typed ATK bonus
  const typedBonusPercent = typedBonus(attacker, ability.attackType)
  const afterBonus = baseDamage * (1 + typedBonusPercent / 100)

  // Layer 4: crit
  let isCrit: boolean
  let critForced = false
  if (opts.crit?.forced) {
    isCrit = !!opts.crit.forcedValue
    critForced = true
  } else {
    const roll = opts.critRoll ?? rng() * 100
    isCrit = roll < attacker.critRate
  }
  const critMultiplier = isCrit ? 1 + attacker.critDmg / 100 : 1
  const afterCrit = afterBonus * critMultiplier

  // Layer 5: DEF mitigation
  const defMult = defMultiplier(attacker.level, target.def)
  const afterDef = afterCrit * defMult

  // Layer 6: RES mitigation
  const resPercent = typedRes(target, ability.attackType)
  const resMult = resMultiplier(resPercent)
  const afterRes = afterDef * resMult

  const final = Math.max(0, Math.round(afterRes))

  const steps: DamageResultStep[] = [
    { label: "Base ATK", value: Math.round(baseAtk) },
    { label: `Ability multiplier (${ability.multiplier}%)`, value: Math.round(multComponent) },
  ]
  if (diceRoll) steps.push({ label: `Dice (${diceRoll.notation})`, value: diceComponent })
  steps.push({ label: "Base damage", value: Math.round(baseDamage) })
  steps.push({ label: `Typed bonus (+${typedBonusPercent}%)`, value: Math.round(afterBonus) })
  steps.push({ label: isCrit ? `Critical (x${critMultiplier.toFixed(2)})` : "No crit", value: Math.round(afterCrit) })
  steps.push({ label: `DEF mult (x${defMult.toFixed(3)})`, value: Math.round(afterDef) })
  steps.push({ label: `RES (${resPercent}% -> x${resMult.toFixed(3)})`, value: Math.round(afterRes) })
  steps.push({ label: "Final damage", value: final })

  return {
    baseAtk,
    abilityMultiplier: ability.multiplier,
    diceRoll,
    baseDamage,
    typedBonusPercent,
    afterBonus,
    isCrit,
    critForced,
    critMultiplier,
    afterCrit,
    defMultiplier: defMult,
    afterDef,
    resPercent,
    resMultiplier: resMult,
    afterRes,
    final,
    steps,
  }
}
