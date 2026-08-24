import { describe, it, expect } from "vitest"
import { computeStats, computeBreakdown } from "./stats"
import { emptyStats, type StatModifier } from "./types"
import { expToNext, totalExpForLevel, applyExp, makeLevelState, scaledExpReward, MAX_LEVEL } from "./progression"
import { parseDice, rollNotation, isValidNotation } from "./dice"
import { computeDamage, defMultiplier, resMultiplier } from "./damage"
import { pullRarity, DEFAULT_GACHA_CONFIG, type PityState, selectFromPool } from "./gacha"
import { sellValue, bulkSellSummary, computePurchase, maxAffordableQuantity, SELL_RATE } from "./economy"

// Seeded RNG for determinism
function seededRng(seed: number) {
  let s = seed >>> 0
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0
    return s / 0xffffffff
  }
}

describe("stats aggregation", () => {
  it("applies flat modifiers", () => {
    const base = { ...emptyStats(), atk: 100 }
    const mods: StatModifier[] = [{ stat: "atk", value: 100, kind: "flat" }]
    expect(computeStats(base, mods).atk).toBe(200)
  })

  it("applies percent modifiers to base+flat", () => {
    const base = { ...emptyStats(), atk: 100 }
    const mods: StatModifier[] = [
      { stat: "atk", value: 100, kind: "flat" },
      { stat: "atk", value: 20, kind: "percent" },
    ]
    // (100 + 100) * 1.2 = 240
    expect(computeStats(base, mods).atk).toBe(240)
  })

  it("stacks percent additively", () => {
    const base = { ...emptyStats(), hp: 1000 }
    const mods: StatModifier[] = [
      { stat: "hp", value: 10, kind: "percent" },
      { stat: "hp", value: 20, kind: "percent" },
    ]
    // 1000 * (1 + 0.30) = 1300
    expect(computeStats(base, mods).hp).toBe(1300)
  })

  it("handles negative percent (weaken)", () => {
    const base = { ...emptyStats(), def: 200 }
    const mods: StatModifier[] = [{ stat: "def", value: -15, kind: "percent" }]
    expect(computeStats(base, mods).def).toBeCloseTo(170)
  })

  it("breakdown reports base/flat/percent", () => {
    const base = { ...emptyStats(), atk: 100 }
    const mods: StatModifier[] = [
      { stat: "atk", value: 50, kind: "flat" },
      { stat: "atk", value: 10, kind: "percent" },
    ]
    const entry = computeBreakdown(base, mods).find((e) => e.stat === "atk")!
    expect(entry.base).toBe(100)
    expect(entry.flat).toBe(50)
    expect(entry.percent).toBe(10)
    expect(entry.final).toBeCloseTo(165)
  })
})

describe("progression", () => {
  it("expToNext increases with level", () => {
    expect(expToNext(1)).toBeLessThan(expToNext(50))
    expect(expToNext(50)).toBeLessThan(expToNext(119))
  })

  it("expToNext at cap is 0", () => {
    expect(expToNext(MAX_LEVEL)).toBe(0)
  })

  it("totalExpForLevel accumulates", () => {
    expect(totalExpForLevel(1)).toBe(0)
    expect(totalExpForLevel(3)).toBe(expToNext(1) + expToNext(2))
  })

  it("EXP carries over across a single level", () => {
    const state = makeLevelState(20, 900)
    const need = expToNext(20)
    const result = applyExp(state, need - 900 + 50) // exactly enough + 50 overflow
    expect(result.after.level).toBe(21)
    expect(result.after.currentExp).toBe(50)
  })

  it("multiple level ups from one reward", () => {
    const state = makeLevelState(1, 0)
    const bigReward = totalExpForLevel(5) // enough to hit level 5
    const result = applyExp(state, bigReward)
    expect(result.after.level).toBe(5)
    expect(result.levelsGained).toBe(4)
  })

  it("stops at max level and discards overflow", () => {
    const state = makeLevelState(119, 0)
    const result = applyExp(state, 999_999_999)
    expect(result.after.level).toBe(MAX_LEVEL)
    expect(result.after.currentExp).toBe(0)
    expect(result.overflowDiscarded).toBeGreaterThan(0)
  })

  it("scaled exp: higher enemy gives more", () => {
    const higher = scaledExpReward(100, 10, 20)
    const same = scaledExpReward(100, 10, 10)
    const lower = scaledExpReward(100, 20, 5)
    expect(higher).toBeGreaterThan(same)
    expect(same).toBeGreaterThan(lower)
  })
})

describe("dice", () => {
  it("validates notation", () => {
    expect(isValidNotation("2d6")).toBe(true)
    expect(isValidNotation("3d8+5")).toBe(true)
    expect(isValidNotation("1d20-2")).toBe(true)
    expect(isValidNotation("hello")).toBe(false)
  })

  it("parses terms and modifier", () => {
    const p = parseDice("3d8+5")
    expect(p.terms[0]).toEqual({ count: 3, sides: 8 })
    expect(p.modifier).toBe(5)
  })

  it("rolls within bounds", () => {
    const rng = seededRng(42)
    for (let i = 0; i < 200; i++) {
      const r = rollNotation("2d6", rng)
      expect(r.diceTotal).toBeGreaterThanOrEqual(2)
      expect(r.diceTotal).toBeLessThanOrEqual(12)
    }
  })

  it("applies modifier to total", () => {
    const r = rollNotation("1d1+10")
    expect(r.total).toBe(11) // d1 always = 1
  })
})

describe("damage", () => {
  const attacker = {
    level: 60,
    atk: 1850,
    critRate: 50,
    critDmg: 110, // x2.1 on crit
    basicBonus: 25,
    skillBonus: 0,
    ultimateBonus: 0,
  }
  const target = { level: 60, def: 800, basicRes: 10, skillRes: 0, ultimateRes: 0 }

  it("DEF multiplier decreases with higher DEF", () => {
    const m0 = defMultiplier(60, 0)
    const mHigh = defMultiplier(60, 5000)
    expect(m0).toBe(1)
    expect(mHigh).toBeLessThan(m0)
  })

  it("0 DEF means no mitigation", () => {
    expect(defMultiplier(1, 0)).toBe(1)
    expect(defMultiplier(120, 0)).toBe(1)
  })

  it("RES: positive reduces, negative amplifies", () => {
    expect(resMultiplier(10)).toBeCloseTo(0.9)
    expect(resMultiplier(-20)).toBeCloseTo(1.2)
    expect(resMultiplier(0)).toBe(1)
  })

  it("high RES diminishing wall", () => {
    expect(resMultiplier(90)).toBeLessThan(resMultiplier(80))
    expect(resMultiplier(200)).toBeGreaterThan(0)
  })

  it("forced crit applies crit dmg", () => {
    const r = computeDamage(attacker, target, { attackType: "basic", multiplier: 160, scalingStat: "atk" }, {
      crit: { forced: true, forcedValue: true },
    })
    expect(r.isCrit).toBe(true)
    expect(r.critMultiplier).toBeCloseTo(2.1)
    expect(r.final).toBeGreaterThan(0)
  })

  it("forced no-crit skips crit dmg", () => {
    const r = computeDamage(attacker, target, { attackType: "basic", multiplier: 160, scalingStat: "atk" }, {
      crit: { forced: true, forcedValue: false },
    })
    expect(r.isCrit).toBe(false)
    expect(r.critMultiplier).toBe(1)
  })

  it("100% crit rate always crits, 0% never", () => {
    const always = computeDamage({ ...attacker, critRate: 100 }, target, {
      attackType: "basic",
      multiplier: 100,
      scalingStat: "atk",
    })
    const never = computeDamage({ ...attacker, critRate: 0 }, target, {
      attackType: "basic",
      multiplier: 100,
      scalingStat: "atk",
    })
    expect(always.isCrit).toBe(true)
    expect(never.isCrit).toBe(false)
  })

  it("level 1 vs 120 and 120 vs 1 both produce finite damage", () => {
    const lowVsHigh = computeDamage(
      { ...attacker, level: 1, atk: 50 },
      { ...target, level: 120, def: 5000 },
      { attackType: "basic", multiplier: 100, scalingStat: "atk" },
      { crit: { forced: true, forcedValue: false } },
    )
    const highVsLow = computeDamage(
      { ...attacker, level: 120, atk: 5000 },
      { ...target, level: 1, def: 10 },
      { attackType: "basic", multiplier: 100, scalingStat: "atk" },
      { crit: { forced: true, forcedValue: false } },
    )
    expect(lowVsHigh.final).toBeGreaterThanOrEqual(0)
    expect(Number.isFinite(highVsLow.final)).toBe(true)
    expect(highVsLow.final).toBeGreaterThan(lowVsHigh.final)
  })

  it("uses correct RES by attack type", () => {
    const t = { level: 60, def: 0, basicRes: 50, skillRes: 0, ultimateRes: 0 }
    const basic = computeDamage(attacker, t, { attackType: "basic", multiplier: 100, scalingStat: "atk" }, {
      crit: { forced: true, forcedValue: false },
    })
    const skill = computeDamage(attacker, t, { attackType: "skill", multiplier: 100, scalingStat: "atk" }, {
      crit: { forced: true, forcedValue: false },
    })
    expect(basic.resPercent).toBe(50)
    expect(skill.resPercent).toBe(0)
    expect(skill.final).toBeGreaterThan(basic.final)
  })

  it("incorporates dice into damage", () => {
    const r = computeDamage(attacker, { ...target, def: 0, basicRes: 0 }, {
      attackType: "basic",
      multiplier: 0,
      scalingStat: "atk",
      dice: "1d1+100", // deterministic = 101
    }, { crit: { forced: true, forcedValue: false } })
    expect(r.baseDamage).toBeCloseTo(101)
  })
})

describe("gacha", () => {
  it("distribution roughly matches over many pulls", () => {
    const rng = seededRng(7)
    const config = { ...DEFAULT_GACHA_CONFIG, pity4Threshold: 9999, pity5Threshold: 9999 }
    let pity: PityState = { pity4: 0, pity5: 0 }
    const counts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } as Record<number, number>
    const N = 20000
    for (let i = 0; i < N; i++) {
      const out = pullRarity(config, pity, rng)
      pity = out.pityAfter
      counts[out.rarity]++
    }
    expect(counts[1] / N).toBeGreaterThan(0.5)
    expect(counts[1] / N).toBeLessThan(0.7)
    expect(counts[5] / N).toBeLessThan(0.03)
  })

  it("5-star pity guarantees a 5-star", () => {
    const config = { ...DEFAULT_GACHA_CONFIG, pity5Threshold: 10 }
    let pity: PityState = { pity4: 0, pity5: 9 }
    const out = pullRarity(config, pity, seededRng(1))
    expect(out.rarity).toBe(5)
    expect(out.forcedByPity).toBe("5")
    expect(out.pityAfter.pity5).toBe(0)
  })

  it("4-star pity guarantees at least a 4-star", () => {
    const config = { ...DEFAULT_GACHA_CONFIG, pity4Threshold: 10, pity5Threshold: 999 }
    let pity: PityState = { pity4: 9, pity5: 0 }
    const out = pullRarity(config, pity, seededRng(3))
    expect(out.rarity).toBeGreaterThanOrEqual(4)
    expect(out.pityAfter.pity4).toBe(0)
  })

  it("pity increments when not hit", () => {
    const config = { ...DEFAULT_GACHA_CONFIG, distribution: { 1: 100, 2: 0, 3: 0, 4: 0, 5: 0 }, pity4Threshold: 999, pity5Threshold: 999 }
    let pity: PityState = { pity4: 0, pity5: 0 }
    const out = pullRarity(config, pity, seededRng(5))
    expect(out.rarity).toBe(1)
    expect(out.pityAfter.pity4).toBe(1)
    expect(out.pityAfter.pity5).toBe(1)
  })

  it("selects an item of the given rarity from the pool", () => {
    const pool = [
      { rarity: 1 as const, name: "a" },
      { rarity: 5 as const, name: "b" },
    ]
    const sel = selectFromPool(pool, 5, seededRng(2))
    expect(sel?.name).toBe("b")
    expect(selectFromPool(pool, 3, seededRng(2))).toBeNull()
  })
})

describe("economy", () => {
  it("sell value is 80% floored", () => {
    expect(SELL_RATE).toBe(0.8)
    expect(sellValue(1000)).toBe(800)
    expect(sellValue(1001)).toBe(800) // floor(800.8)
  })

  it("sell value scales with quantity", () => {
    expect(sellValue(1000, 3)).toBe(2400)
  })

  it("bulk sell summary totals", () => {
    const s = bulkSellSummary([
      { name: "Potion", value: 100, quantity: 10 },
      { name: "Elixir", value: 500, quantity: 2 },
    ])
    expect(s.totalQuantity).toBe(12)
    expect(s.totalValue).toBe(100 * 10 + 500 * 2)
    expect(s.totalSellValue).toBe(sellValue(100, 10) + sellValue(500, 2))
  })

  it("purchase respects affordability", () => {
    const p = computePurchase(100, 5, 350, null)
    expect(p.quantity).toBe(3)
    expect(p.totalCost).toBe(300)
  })

  it("purchase respects limit", () => {
    const p = computePurchase(10, 100, 100000, 5, 2)
    expect(p.quantity).toBe(3) // limit 5 - already 2
  })

  it("max affordable quantity", () => {
    expect(maxAffordableQuantity(100, 950, null)).toBe(9)
    expect(maxAffordableQuantity(100, 950, 5)).toBe(5)
  })
})
