import "server-only"
import { getDb, uid, now } from "@/lib/db"
import { enemyTemplateRow } from "@/lib/db/mappers"
import { logEvent } from "./history"
import type { EnemyTemplate } from "@/lib/types"

export function listEnemyTemplates(): EnemyTemplate[] {
  const db = getDb()
  const rows = db.prepare("SELECT * FROM enemy_templates ORDER BY name").all() as any[]
  return rows.map(enemyTemplateRow)
}

export function getEnemyTemplate(id: string): EnemyTemplate | null {
  const db = getDb()
  const r = db.prepare("SELECT * FROM enemy_templates WHERE id = ?").get(id)
  return r ? enemyTemplateRow(r) : null
}

export type EnemyInput = Omit<EnemyTemplate, "id">

function bind(input: EnemyInput) {
  return {
    name: input.name,
    level: input.level,
    rarity: input.rarity,
    hp: input.hp,
    atk: input.atk,
    def: input.def,
    crit_rate: input.critRate,
    crit_dmg: input.critDmg,
    basic_res: input.basicRes,
    skill_res: input.skillRes,
    ultimate_res: input.ultimateRes,
    basic_bonus: input.basicBonus,
    skill_bonus: input.skillBonus,
    ultimate_bonus: input.ultimateBonus,
    tp: input.tp,
    exp_reward: input.expReward,
    abilities: JSON.stringify(input.abilities ?? []),
    loot: JSON.stringify(input.loot ?? []),
    tags: JSON.stringify(input.tags ?? []),
    notes: input.notes ?? "",
  }
}

export function createEnemyTemplate(input: EnemyInput): string {
  const db = getDb()
  const id = uid("etpl_")
  db.prepare(`INSERT INTO enemy_templates
    (id,name,level,rarity,hp,atk,def,crit_rate,crit_dmg,basic_res,skill_res,ultimate_res,
     basic_bonus,skill_bonus,ultimate_bonus,tp,exp_reward,abilities,loot,tags,notes,created_at,updated_at)
    VALUES (@id,@name,@level,@rarity,@hp,@atk,@def,@crit_rate,@crit_dmg,@basic_res,@skill_res,@ultimate_res,
     @basic_bonus,@skill_bonus,@ultimate_bonus,@tp,@exp_reward,@abilities,@loot,@tags,@notes,@created_at,@updated_at)`).run({
    id,
    ...bind(input),
    created_at: now(),
    updated_at: now(),
  })
  logEvent(db, "enemy", `Created enemy template ${input.name}`, { entity: input.name })
  return id
}

export function updateEnemyTemplate(id: string, input: EnemyInput) {
  const db = getDb()
  db.prepare(`UPDATE enemy_templates SET
    name=@name, level=@level, rarity=@rarity, hp=@hp, atk=@atk, def=@def, crit_rate=@crit_rate, crit_dmg=@crit_dmg,
    basic_res=@basic_res, skill_res=@skill_res, ultimate_res=@ultimate_res, basic_bonus=@basic_bonus, skill_bonus=@skill_bonus,
    ultimate_bonus=@ultimate_bonus, tp=@tp, exp_reward=@exp_reward, abilities=@abilities, loot=@loot, tags=@tags, notes=@notes, updated_at=@updated_at
    WHERE id=@id`).run({ id, ...bind(input), updated_at: now() })
  logEvent(db, "enemy", `Edited enemy template ${input.name}`, { entity: input.name })
}

export function deleteEnemyTemplate(id: string) {
  const db = getDb()
  const e = db.prepare("SELECT name FROM enemy_templates WHERE id = ?").get(id) as any
  db.prepare("DELETE FROM enemy_templates WHERE id = ?").run(id)
  if (e) logEvent(db, "enemy", `Deleted enemy template ${e.name}`, { entity: e.name })
}

export function duplicateEnemyTemplate(id: string): string | null {
  const db = getDb()
  const e = db.prepare("SELECT * FROM enemy_templates WHERE id = ?").get(id) as any
  if (!e) return null
  const t = enemyTemplateRow(e)
  return createEnemyTemplate({ ...t, name: `${t.name} (Copy)` })
}
