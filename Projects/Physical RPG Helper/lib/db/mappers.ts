import "server-only"
import type Database from "better-sqlite3"
import type {
  Character,
  EnemyTemplate,
  Item,
  InventoryEntry,
  Currency,
  ShopEntry,
  StatusTemplate,
  AbilityDef,
  EquippedItem,
  Rarity,
} from "@/lib/types"
import type { BaseStats, StatModifier } from "@/lib/engine/types"
import { computeStats } from "@/lib/engine/stats"
import { expToNext } from "@/lib/engine/progression"

function J<T>(s: string | null | undefined, fallback: T): T {
  if (!s) return fallback
  try {
    return JSON.parse(s) as T
  } catch {
    return fallback
  }
}

export function itemRow(r: any): Item {
  return {
    id: r.id,
    name: r.name,
    description: r.description ?? "",
    rarity: r.rarity as Rarity,
    category: r.category,
    tags: J<string[]>(r.tags, []),
    value: r.value,
    sellable: !!r.sellable,
    stackable: !!r.stackable,
    stats: J<StatModifier[]>(r.stats, []),
    effects: J<string[]>(r.effects, []),
    notes: r.notes ?? "",
    equipSlot: r.equip_slot ?? null,
    mainStat: r.main_stat ? J<StatModifier | null>(r.main_stat, null) : null,
    substats: J<StatModifier[]>(r.substats, []),
    baseAtk: r.base_atk ?? null,
    passive: r.passive ?? null,
    itemLevel: r.item_level ?? null,
  }
}

// note: inventory rows come from the `inventory_entries` table
export function inventoryRow(db: Database.Database, r: any): InventoryEntry {
  const item = itemRow(db.prepare("SELECT * FROM items WHERE id = ?").get(r.item_id))
  return { id: r.id, quantity: r.quantity, item }
}

export function currencyRow(r: any): Currency {
  return {
    id: r.id,
    name: r.name,
    icon: r.icon,
    description: r.description ?? "",
    amount: r.amount,
    isDefault: !!r.is_default,
    sort: r.sort,
  }
}

export function statusTemplateRow(r: any): StatusTemplate {
  return {
    id: r.id,
    name: r.name,
    description: r.description ?? "",
    defaultDuration: r.default_duration ?? null,
    maxStacks: r.max_stacks,
    modifiers: J<StatModifier[]>(r.modifiers, []),
  }
}

export function abilityRow(r: any): AbilityDef {
  return {
    id: r.id,
    name: r.name,
    attackType: r.attack_type,
    multiplier: r.multiplier,
    scalingStat: "atk",
    dice: r.dice ?? null,
    flatBonus: r.flat_bonus ?? 0,
    tpCost: r.tp_cost ?? 0,
    targetType: r.target_type ?? "single",
    damageType: r.damage_type ?? "damage",
    description: r.description ?? "",
    effects: J<string[]>(r.effects, []),
  }
}

// Base stats of a character at its current level (base + per-level growth).
export function characterBaseStats(r: any): BaseStats {
  const lvl = r.level
  const lvlMinus = Math.max(0, lvl - 1)
  return {
    hp: r.base_hp + r.growth_hp * lvlMinus,
    atk: r.base_atk + r.growth_atk * lvlMinus,
    def: r.base_def + r.growth_def * lvlMinus,
    critRate: r.base_crit_rate,
    critDmg: r.base_crit_dmg,
    energyRegen: r.base_energy_regen,
    basicBonus: r.base_basic_bonus,
    skillBonus: r.base_skill_bonus,
    ultimateBonus: r.base_ultimate_bonus,
    basicRes: r.base_basic_res,
    skillRes: r.base_skill_res,
    ultimateRes: r.base_ultimate_res,
    tp: r.base_tp,
  }
}

function equipmentModifiers(equipment: EquippedItem[]): StatModifier[] {
  const mods: StatModifier[] = []
  for (const e of equipment) {
    const it = e.item
    if (it.mainStat) mods.push(it.mainStat)
    mods.push(...it.substats)
    mods.push(...it.stats)
    if (it.baseAtk) mods.push({ stat: "atk", value: it.baseAtk, kind: "flat" })
  }
  return mods
}

export function characterRow(db: Database.Database, r: any): Character {
  const base = characterBaseStats(r)
  const tempModifiers = J<StatModifier[]>(r.temp_modifiers, [])

  const equipRows = db
    .prepare("SELECT * FROM equipped WHERE character_id = ? ORDER BY slot_type, slot_index")
    .all(r.id) as any[]
  const equipment: EquippedItem[] = equipRows.map((er) => ({
    equippedId: er.id,
    slotType: er.slot_type,
    slotIndex: er.slot_index,
    item: itemRow(db.prepare("SELECT * FROM items WHERE id = ?").get(er.item_id)),
  }))

  const allMods = [...equipmentModifiers(equipment), ...tempModifiers]
  const final = computeStats(base, allMods)

  const abilityRows = db
    .prepare("SELECT * FROM abilities WHERE character_id = ? ORDER BY sort, name")
    .all(r.id) as any[]

  return {
    id: r.id,
    name: r.name,
    level: r.level,
    currentExp: r.current_exp,
    expToNext: expToNext(r.level),
    rarity: r.rarity as Rarity,
    isNpc: !!r.is_npc,
    currentHp: r.current_hp,
    currentTp: r.current_tp,
    base,
    final,
    maxHp: Math.round(final.hp),
    maxTp: Math.round(final.tp),
    growth: { hp: r.growth_hp, atk: r.growth_atk, def: r.growth_def },
    tags: J<string[]>(r.tags, []),
    notes: r.notes ?? "",
    tempModifiers,
    inParty: !!r.in_party,
    abilities: abilityRows.map(abilityRow),
    equipment,
  }
}

export function enemyTemplateRow(r: any): EnemyTemplate {
  return {
    id: r.id,
    name: r.name,
    level: r.level,
    rarity: r.rarity as Rarity,
    hp: r.hp,
    atk: r.atk,
    def: r.def,
    critRate: r.crit_rate,
    critDmg: r.crit_dmg,
    basicRes: r.basic_res,
    skillRes: r.skill_res,
    ultimateRes: r.ultimate_res,
    basicBonus: r.basic_bonus,
    skillBonus: r.skill_bonus,
    ultimateBonus: r.ultimate_bonus,
    tp: r.tp,
    expReward: r.exp_reward,
    abilities: J<Omit<AbilityDef, "id">[]>(r.abilities, []),
    loot: J<any[]>(r.loot, []),
    tags: J<string[]>(r.tags, []),
    notes: r.notes ?? "",
  }
}
