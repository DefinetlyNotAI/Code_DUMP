import "server-only"
import { getDb, uid, now } from "@/lib/db"
import { characterRow, characterBaseStats, abilityRow } from "@/lib/db/mappers"
import { computeStats } from "@/lib/engine/stats"
import { applyExp, makeLevelState, MAX_LEVEL, MIN_LEVEL } from "@/lib/engine/progression"
import { logEvent } from "./history"
import type { Character, AbilityDef } from "@/lib/types"
import type { StatModifier } from "@/lib/engine/types"

export function listCharacters(): Character[] {
  const db = getDb()
  const rows = db.prepare("SELECT * FROM characters ORDER BY in_party DESC, name").all() as any[]
  return rows.map((r) => characterRow(db, r))
}

export function getCharacter(id: string): Character | null {
  const db = getDb()
  const r = db.prepare("SELECT * FROM characters WHERE id = ?").get(id)
  return r ? characterRow(db, r) : null
}

export interface CharacterInput {
  name: string
  level: number
  rarity: number
  isNpc: boolean
  base: {
    hp: number
    atk: number
    def: number
    critRate: number
    critDmg: number
    energyRegen: number
    basicBonus: number
    skillBonus: number
    ultimateBonus: number
    basicRes: number
    skillRes: number
    ultimateRes: number
    tp: number
  }
  growth: { hp: number; atk: number; def: number }
  tags: string[]
  notes: string
  inParty: boolean
}

function maxHpTp(input: { level: number; base: CharacterInput["base"]; growth: CharacterInput["growth"] }) {
  const lvlMinus = Math.max(0, input.level - 1)
  const baseStats = {
    ...input.base,
    hp: input.base.hp + input.growth.hp * lvlMinus,
    atk: input.base.atk + input.growth.atk * lvlMinus,
    def: input.base.def + input.growth.def * lvlMinus,
  }
  const final = computeStats(baseStats, [])
  return { maxHp: Math.round(final.hp), maxTp: Math.round(final.tp) }
}

export function createCharacter(input: CharacterInput): string {
  const db = getDb()
  const id = uid("char_")
  const { maxHp } = maxHpTp(input)
  db.prepare(`INSERT INTO characters
    (id,name,level,current_exp,rarity,is_npc,current_hp,current_tp,
     base_hp,base_atk,base_def,base_crit_rate,base_crit_dmg,base_energy_regen,
     base_basic_bonus,base_skill_bonus,base_ultimate_bonus,base_basic_res,base_skill_res,base_ultimate_res,base_tp,
     growth_hp,growth_atk,growth_def,tags,notes,temp_modifiers,in_party,created_at,updated_at)
    VALUES (@id,@name,@level,0,@rarity,@is_npc,@current_hp,@current_tp,
     @base_hp,@base_atk,@base_def,@base_crit_rate,@base_crit_dmg,@base_energy_regen,
     @base_basic_bonus,@base_skill_bonus,@base_ultimate_bonus,@base_basic_res,@base_skill_res,@base_ultimate_res,@base_tp,
     @growth_hp,@growth_atk,@growth_def,@tags,@notes,'[]',@in_party,@created_at,@updated_at)`).run({
    id,
    name: input.name,
    level: input.level,
    rarity: input.rarity,
    is_npc: input.isNpc ? 1 : 0,
    current_hp: maxHp,
    current_tp: input.base.tp,
    base_hp: input.base.hp,
    base_atk: input.base.atk,
    base_def: input.base.def,
    base_crit_rate: input.base.critRate,
    base_crit_dmg: input.base.critDmg,
    base_energy_regen: input.base.energyRegen,
    base_basic_bonus: input.base.basicBonus,
    base_skill_bonus: input.base.skillBonus,
    base_ultimate_bonus: input.base.ultimateBonus,
    base_basic_res: input.base.basicRes,
    base_skill_res: input.base.skillRes,
    base_ultimate_res: input.base.ultimateRes,
    base_tp: input.base.tp,
    growth_hp: input.growth.hp,
    growth_atk: input.growth.atk,
    growth_def: input.growth.def,
    tags: JSON.stringify(input.tags),
    notes: input.notes,
    in_party: input.inParty ? 1 : 0,
    created_at: now(),
    updated_at: now(),
  })
  logEvent(db, "character", `Created character ${input.name}`, { entity: input.name })
  return id
}

export function updateCharacter(id: string, input: CharacterInput) {
  const db = getDb()
  const cur = db.prepare("SELECT * FROM characters WHERE id = ?").get(id) as any
  if (!cur) return
  const { maxHp } = maxHpTp(input)
  db.prepare(`UPDATE characters SET
    name=@name, level=@level, rarity=@rarity, is_npc=@is_npc,
    base_hp=@base_hp, base_atk=@base_atk, base_def=@base_def, base_crit_rate=@base_crit_rate, base_crit_dmg=@base_crit_dmg,
    base_energy_regen=@base_energy_regen, base_basic_bonus=@base_basic_bonus, base_skill_bonus=@base_skill_bonus,
    base_ultimate_bonus=@base_ultimate_bonus, base_basic_res=@base_basic_res, base_skill_res=@base_skill_res,
    base_ultimate_res=@base_ultimate_res, base_tp=@base_tp, growth_hp=@growth_hp, growth_atk=@growth_atk, growth_def=@growth_def,
    tags=@tags, notes=@notes, in_party=@in_party, current_hp=@current_hp, updated_at=@updated_at
    WHERE id=@id`).run({
    id,
    name: input.name,
    level: input.level,
    rarity: input.rarity,
    is_npc: input.isNpc ? 1 : 0,
    base_hp: input.base.hp,
    base_atk: input.base.atk,
    base_def: input.base.def,
    base_crit_rate: input.base.critRate,
    base_crit_dmg: input.base.critDmg,
    base_energy_regen: input.base.energyRegen,
    base_basic_bonus: input.base.basicBonus,
    base_skill_bonus: input.base.skillBonus,
    base_ultimate_bonus: input.base.ultimateBonus,
    base_basic_res: input.base.basicRes,
    base_skill_res: input.base.skillRes,
    base_ultimate_res: input.base.ultimateRes,
    base_tp: input.base.tp,
    growth_hp: input.growth.hp,
    growth_atk: input.growth.atk,
    growth_def: input.growth.def,
    tags: JSON.stringify(input.tags),
    notes: input.notes,
    in_party: input.inParty ? 1 : 0,
    current_hp: Math.min(cur.current_hp, maxHp),
    updated_at: now(),
  })
  logEvent(db, "character", `Edited character ${input.name}`, { entity: input.name })
}

export function deleteCharacter(id: string) {
  const db = getDb()
  const c = db.prepare("SELECT name FROM characters WHERE id = ?").get(id) as any
  db.prepare("DELETE FROM characters WHERE id = ?").run(id)
  if (c) logEvent(db, "character", `Deleted character ${c.name}`, { entity: c.name })
}

export function duplicateCharacter(id: string): string | null {
  const db = getDb()
  const c = db.prepare("SELECT * FROM characters WHERE id = ?").get(id) as any
  if (!c) return null
  const newId = uid("char_")
  db.prepare(`INSERT INTO characters
    SELECT @id AS id, name || ' (Copy)', level, current_exp, rarity, is_npc, current_hp, current_tp,
     base_hp, base_atk, base_def, base_crit_rate, base_crit_dmg, base_energy_regen,
     base_basic_bonus, base_skill_bonus, base_ultimate_bonus, base_basic_res, base_skill_res, base_ultimate_res, base_tp,
     growth_hp, growth_atk, growth_def, tags, notes, temp_modifiers, 0 AS in_party, @t AS created_at, @t AS updated_at
     FROM characters WHERE id = @src`).run({ id: newId, src: id, t: now() })
  // copy abilities
  const abils = db.prepare("SELECT * FROM abilities WHERE character_id = ?").all(id) as any[]
  const insAb = db.prepare(`INSERT INTO abilities
    (id,character_id,name,attack_type,multiplier,scaling_stat,dice,flat_bonus,tp_cost,target_type,damage_type,description,effects,sort)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`)
  for (const a of abils) {
    insAb.run(uid("ab_"), newId, a.name, a.attack_type, a.multiplier, a.scaling_stat, a.dice, a.flat_bonus, a.tp_cost, a.target_type, a.damage_type, a.description, a.effects, a.sort)
  }
  logEvent(db, "character", `Duplicated character ${c.name}`, { entity: c.name })
  return newId
}

export function setParty(id: string, inParty: boolean) {
  const db = getDb()
  db.prepare("UPDATE characters SET in_party = ?, updated_at = ? WHERE id = ?").run(inParty ? 1 : 0, now(), id)
}

// Directly set current HP / TP (validated). GM override bypasses caps.
export function setResource(id: string, field: "hp" | "tp", value: number, gmOverride = false) {
  const db = getDb()
  const r = db.prepare("SELECT * FROM characters WHERE id = ?").get(id) as any
  if (!r) return
  const char = characterRow(db, r)
  let v = Math.round(value)
  if (!gmOverride) {
    v = Math.max(0, v)
    if (field === "hp") v = Math.min(v, char.maxHp)
    else v = Math.min(v, char.maxTp)
  }
  const before = field === "hp" ? r.current_hp : r.current_tp
  db.prepare(`UPDATE characters SET ${field === "hp" ? "current_hp" : "current_tp"} = ?, updated_at = ? WHERE id = ?`).run(
    v,
    now(),
    id,
  )
  logEvent(db, field === "hp" ? "hp_change" : "tp_change", `${char.name} ${field.toUpperCase()} ${before} -> ${v}`, {
    entity: char.name,
    values: { before, after: v, gmOverride },
  })
}

// Grant EXP; auto-level; record with undo snapshot.
export function grantExp(id: string, amount: number, gmOverrideAmount?: number): { levelsGained: number } | null {
  const db = getDb()
  const r = db.prepare("SELECT * FROM characters WHERE id = ?").get(id) as any
  if (!r) return null
  const gain = gmOverrideAmount != null ? gmOverrideAmount : amount
  const snapshot = {
    level: r.level,
    currentExp: r.current_exp,
    currentHp: r.current_hp,
    currentTp: r.current_tp,
    tempModifiers: JSON.parse(r.temp_modifiers ?? "[]"),
  }
  const state = makeLevelState(r.level, r.current_exp)
  const result = applyExp(state, gain)

  // recompute max hp at new level and heal by the hp gained on level up
  const oldChar = characterRow(db, r)
  db.prepare("UPDATE characters SET level = ?, current_exp = ?, updated_at = ? WHERE id = ?").run(
    result.after.level,
    result.after.currentExp,
    now(),
    id,
  )
  const newChar = characterRow(db, db.prepare("SELECT * FROM characters WHERE id = ?").get(id))
  if (result.levelsGained > 0) {
    // top up HP by max HP increase
    const hpGain = newChar.maxHp - oldChar.maxHp
    const newHp = Math.min(newChar.maxHp, r.current_hp + Math.max(0, hpGain))
    db.prepare("UPDATE characters SET current_hp = ? WHERE id = ?").run(newHp, id)
  }

  logEvent(db, "exp", `${r.name} gained ${gain} EXP${result.levelsGained ? ` (+${result.levelsGained} level)` : ""}`, {
    entity: r.name,
    values: { gain, levelsGained: result.levelsGained, newLevel: result.after.level, gmOverride: gmOverrideAmount != null },
    undo: { op: "character_snapshot", characterId: id, snapshot },
  })
  if (result.levelsGained > 0) {
    logEvent(db, "level_up", `${r.name} reached level ${result.after.level}`, { entity: r.name, values: { level: result.after.level } })
  }
  return { levelsGained: result.levelsGained }
}

// Persisted temporary modifiers (GM stat overrides that live on the character).
export function setTempModifiers(id: string, modifiers: StatModifier[]) {
  const db = getDb()
  const r = db.prepare("SELECT * FROM characters WHERE id = ?").get(id) as any
  if (!r) return
  const snapshot = {
    level: r.level,
    currentExp: r.current_exp,
    currentHp: r.current_hp,
    currentTp: r.current_tp,
    tempModifiers: JSON.parse(r.temp_modifiers ?? "[]"),
  }
  db.prepare("UPDATE characters SET temp_modifiers = ?, updated_at = ? WHERE id = ?").run(
    JSON.stringify(modifiers),
    now(),
    id,
  )
  logEvent(db, "stat_mod", `Modified stats for ${r.name}`, {
    entity: r.name,
    values: { count: modifiers.length },
    undo: { op: "character_snapshot", characterId: id, snapshot },
  })
}

// Abilities CRUD
export function saveAbility(characterId: string, ability: Partial<AbilityDef> & { id?: string }) {
  const db = getDb()
  if (ability.id) {
    db.prepare(`UPDATE abilities SET name=?, attack_type=?, multiplier=?, dice=?, flat_bonus=?, tp_cost=?, target_type=?, damage_type=?, description=? WHERE id=?`).run(
      ability.name,
      ability.attackType,
      ability.multiplier,
      ability.dice ?? null,
      ability.flatBonus ?? 0,
      ability.tpCost ?? 0,
      ability.targetType ?? "single",
      ability.damageType ?? "damage",
      ability.description ?? "",
      ability.id,
    )
  } else {
    const cnt = (db.prepare("SELECT COUNT(*) c FROM abilities WHERE character_id = ?").get(characterId) as any).c
    db.prepare(`INSERT INTO abilities (id,character_id,name,attack_type,multiplier,scaling_stat,dice,flat_bonus,tp_cost,target_type,damage_type,description,effects,sort)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`).run(
      uid("ab_"),
      characterId,
      ability.name ?? "New Ability",
      ability.attackType ?? "basic",
      ability.multiplier ?? 100,
      "atk",
      ability.dice ?? null,
      ability.flatBonus ?? 0,
      ability.tpCost ?? 0,
      ability.targetType ?? "single",
      ability.damageType ?? "damage",
      ability.description ?? "",
      "[]",
      cnt,
    )
  }
}

export function deleteAbility(id: string) {
  const db = getDb()
  db.prepare("DELETE FROM abilities WHERE id = ?").run(id)
}
