import type Database from "better-sqlite3"
import { DEFAULT_GACHA_CONFIG } from "@/lib/engine/gacha"
import { DEFAULT_EXP_REWARD_CONFIG } from "@/lib/engine/progression"

function id(prefix: string) {
  return `${prefix}${Math.random().toString(36).slice(2, 10)}`
}

// Seeds baseline data (currencies, gacha config, a few demo entities) only when
// the database is empty, so the app is immediately usable but never overwrites data.
export function seedIfEmpty(db: Database.Database) {
  const t = Date.now()

  // KV singletons
  const kvGet = db.prepare("SELECT value FROM kv WHERE key = ?")
  const kvSet = db.prepare("INSERT OR IGNORE INTO kv (key, value) VALUES (?, ?)")
  if (!kvGet.get("gacha_config")) kvSet.run("gacha_config", JSON.stringify(DEFAULT_GACHA_CONFIG))
  if (!kvGet.get("gacha_pity")) kvSet.run("gacha_pity", JSON.stringify({ pity4: 0, pity5: 0 }))
  if (!kvGet.get("exp_reward_config")) kvSet.run("exp_reward_config", JSON.stringify(DEFAULT_EXP_REWARD_CONFIG))

  // Default currencies
  const currCount = (db.prepare("SELECT COUNT(*) c FROM currencies").get() as { c: number }).c
  if (currCount === 0) {
    const insC = db.prepare(
      "INSERT INTO currencies (id, name, icon, description, amount, is_default, sort) VALUES (?,?,?,?,?,?,?)",
    )
    insC.run("cur_gold", "Gold", "coins", "The common currency.", 5000, 1, 0)
    insC.run("cur_gems", "Gems", "gem", "Premium currency.", 1200, 1, 1)
    insC.run("cur_orbs", "Orbs", "orbit", "Used for gacha pulls.", 20, 1, 2)
  }

  // Only seed demo entities if there are no characters yet
  const charCount = (db.prepare("SELECT COUNT(*) c FROM characters").get() as { c: number }).c
  if (charCount === 0) {
    seedDemo(db, t)
  }
}

function seedDemo(db: Database.Database, t: number) {
  const insChar = db.prepare(`INSERT INTO characters
    (id,name,level,current_exp,rarity,is_npc,current_hp,current_tp,
     base_hp,base_atk,base_def,base_crit_rate,base_crit_dmg,base_energy_regen,
     base_basic_bonus,base_skill_bonus,base_ultimate_bonus,base_basic_res,base_skill_res,base_ultimate_res,base_tp,
     growth_hp,growth_atk,growth_def,tags,notes,temp_modifiers,in_party,created_at,updated_at)
    VALUES (@id,@name,@level,@current_exp,@rarity,@is_npc,@current_hp,@current_tp,
     @base_hp,@base_atk,@base_def,@base_crit_rate,@base_crit_dmg,@base_energy_regen,
     @base_basic_bonus,@base_skill_bonus,@base_ultimate_bonus,@base_basic_res,@base_skill_res,@base_ultimate_res,@base_tp,
     @growth_hp,@growth_atk,@growth_def,@tags,@notes,@temp_modifiers,@in_party,@created_at,@updated_at)`)

  const insAbility = db.prepare(`INSERT INTO abilities
    (id,character_id,name,attack_type,multiplier,scaling_stat,dice,flat_bonus,tp_cost,target_type,damage_type,description,effects,sort)
    VALUES (@id,@character_id,@name,@attack_type,@multiplier,@scaling_stat,@dice,@flat_bonus,@tp_cost,@target_type,@damage_type,@description,@effects,@sort)`)

  function makeChar(opts: {
    name: string
    rarity: number
    level: number
    isNpc?: boolean
    atk: number
    hp: number
    def: number
    inParty: boolean
    tags: string[]
  }) {
    const cid = id("char_")
    // compute current hp/tp from base + growth at level
    const maxHp = Math.round(opts.hp + 80 * (opts.level - 1))
    insChar.run({
      id: cid,
      name: opts.name,
      level: opts.level,
      current_exp: 0,
      rarity: opts.rarity,
      is_npc: opts.isNpc ? 1 : 0,
      current_hp: maxHp,
      current_tp: 100,
      base_hp: opts.hp,
      base_atk: opts.atk,
      base_def: opts.def,
      base_crit_rate: 5,
      base_crit_dmg: 150,
      base_energy_regen: 100,
      base_basic_bonus: 0,
      base_skill_bonus: 0,
      base_ultimate_bonus: 0,
      base_basic_res: 0,
      base_skill_res: 0,
      base_ultimate_res: 0,
      base_tp: 100,
      growth_hp: 80,
      growth_atk: 8,
      growth_def: 6,
      tags: JSON.stringify(opts.tags),
      notes: "",
      temp_modifiers: "[]",
      in_party: opts.inParty ? 1 : 0,
      created_at: t,
      updated_at: t,
    })
    return cid
  }

  const c1 = makeChar({ name: "Ravel", rarity: 5, level: 20, atk: 220, hp: 1400, def: 120, inParty: true, tags: ["Vanguard"] })
  const c2 = makeChar({ name: "Sera", rarity: 4, level: 18, atk: 180, hp: 1200, def: 90, inParty: true, tags: ["Support"] })
  const c3 = makeChar({ name: "Kalis", rarity: 4, level: 16, isNpc: true, atk: 160, hp: 1500, def: 150, inParty: false, tags: ["NPC", "Tank"] })

  const abilities = [
    { cid: c1, name: "Cleave", type: "basic", mult: 120, dice: null, tp: 0, dtype: "damage", sort: 0 },
    { cid: c1, name: "Rupture", type: "skill", mult: 220, dice: "2d6", tp: 30, dtype: "damage", sort: 1 },
    { cid: c1, name: "Cataclysm", type: "ultimate", mult: 420, dice: "3d8", tp: 80, dtype: "damage", sort: 2 },
    { cid: c2, name: "Jab", type: "basic", mult: 100, dice: null, tp: 0, dtype: "damage", sort: 0 },
    { cid: c2, name: "Mend", type: "skill", mult: 160, dice: null, tp: 25, dtype: "heal", sort: 1 },
    { cid: c3, name: "Bash", type: "basic", mult: 110, dice: null, tp: 0, dtype: "damage", sort: 0 },
  ]
  for (const a of abilities) {
    insAbility.run({
      id: id("ab_"),
      character_id: a.cid,
      name: a.name,
      attack_type: a.type,
      multiplier: a.mult,
      scaling_stat: "atk",
      dice: a.dice,
      flat_bonus: 0,
      tp_cost: a.tp,
      target_type: "single",
      damage_type: a.dtype,
      description: "",
      effects: "[]",
      sort: a.sort,
    })
  }

  // Enemy templates
  const insEnemy = db.prepare(`INSERT INTO enemy_templates
    (id,name,level,rarity,hp,atk,def,crit_rate,crit_dmg,basic_res,skill_res,ultimate_res,
     basic_bonus,skill_bonus,ultimate_bonus,tp,exp_reward,abilities,loot,tags,notes,created_at,updated_at)
    VALUES (@id,@name,@level,@rarity,@hp,@atk,@def,@crit_rate,@crit_dmg,@basic_res,@skill_res,@ultimate_res,
     @basic_bonus,@skill_bonus,@ultimate_bonus,@tp,@exp_reward,@abilities,@loot,@tags,@notes,@created_at,@updated_at)`)

  function makeEnemy(opts: { name: string; level: number; rarity: number; hp: number; atk: number; def: number; exp: number; tags: string[]; abilities: any[] }) {
    insEnemy.run({
      id: id("etpl_"),
      name: opts.name,
      level: opts.level,
      rarity: opts.rarity,
      hp: opts.hp,
      atk: opts.atk,
      def: opts.def,
      crit_rate: 5,
      crit_dmg: 150,
      basic_res: 0,
      skill_res: 0,
      ultimate_res: 0,
      basic_bonus: 0,
      skill_bonus: 0,
      ultimate_bonus: 0,
      tp: 100,
      exp_reward: opts.exp,
      abilities: JSON.stringify(opts.abilities),
      loot: "[]",
      tags: JSON.stringify(opts.tags),
      notes: "",
      created_at: t,
      updated_at: t,
    })
  }

  makeEnemy({
    name: "Husk Soldier",
    level: 18,
    rarity: 2,
    hp: 2600,
    atk: 140,
    def: 110,
    exp: 220,
    tags: ["Common"],
    abilities: [{ name: "Strike", attackType: "basic", multiplier: 100, scalingStat: "atk", tpCost: 0 }],
  })
  makeEnemy({
    name: "Sable Warden",
    level: 22,
    rarity: 4,
    hp: 9000,
    atk: 210,
    def: 200,
    exp: 900,
    tags: ["Elite", "Boss"],
    abilities: [
      { name: "Crush", attackType: "basic", multiplier: 130, scalingStat: "atk", tpCost: 0 },
      { name: "Quake", attackType: "skill", multiplier: 260, scalingStat: "atk", dice: "2d8", tpCost: 40 },
    ],
  })

  // A few items
  const insItem = db.prepare(`INSERT INTO items
    (id,name,description,rarity,category,tags,value,sellable,stackable,stats,effects,notes,
     equip_slot,main_stat,substats,base_atk,passive,item_level,created_at,updated_at)
    VALUES (@id,@name,@description,@rarity,@category,@tags,@value,@sellable,@stackable,@stats,@effects,@notes,
     @equip_slot,@main_stat,@substats,@base_atk,@passive,@item_level,@created_at,@updated_at)`)
  const insInv = db.prepare("INSERT INTO inventory_entries (id,item_id,quantity,created_at,updated_at) VALUES (?,?,?,?,?)")

  function makeItem(opts: any, qty: number) {
    const iid = id("item_")
    insItem.run({
      id: iid,
      name: opts.name,
      description: opts.description ?? "",
      rarity: opts.rarity,
      category: opts.category,
      tags: JSON.stringify(opts.tags ?? []),
      value: opts.value ?? 0,
      sellable: opts.sellable === false ? 0 : 1,
      stackable: opts.stackable === false ? 0 : 1,
      stats: JSON.stringify(opts.stats ?? []),
      effects: JSON.stringify(opts.effects ?? []),
      notes: "",
      equip_slot: opts.equipSlot ?? null,
      main_stat: opts.mainStat ? JSON.stringify(opts.mainStat) : null,
      substats: JSON.stringify(opts.substats ?? []),
      base_atk: opts.baseAtk ?? null,
      passive: opts.passive ?? null,
      item_level: opts.itemLevel ?? null,
      created_at: t,
      updated_at: t,
    })
    if (qty > 0) insInv.run(id("inv_"), iid, qty, t, t)
    return iid
  }

  makeItem({ name: "Minor Healing Draught", rarity: 1, category: "Consumables", tags: ["Healing"], value: 50, effects: ["Restore 500 HP"] }, 24)
  makeItem({ name: "Ether Vial", rarity: 2, category: "Consumables", tags: ["Healing"], value: 120, effects: ["Restore 30 TP"] }, 10)
  makeItem(
    { name: "Warblade", rarity: 4, category: "Weapons", tags: ["Weapon"], value: 3000, equipSlot: "weapon", baseAtk: 240, passive: "+8% ATK when HP above 50%", stats: [{ stat: "atk", value: 12, kind: "percent" }] },
    1,
  )
  makeItem(
    { name: "Bloodstone Relic", rarity: 5, category: "Relics", tags: ["Relic"], value: 5000, equipSlot: "relic", mainStat: { stat: "atk", value: 30, kind: "percent" }, substats: [{ stat: "critRate", value: 12, kind: "flat" }, { stat: "skillBonus", value: 20, kind: "flat" }] },
    1,
  )
  makeItem({ name: "Iron Ore", rarity: 1, category: "Materials", tags: ["Crafting"], value: 20 }, 60)
  makeItem({ name: "Sealed Relic Cache", rarity: 3, category: "Gacha Items", tags: ["Rare"], value: 800 }, 3)

  // Gacha pool: put the items above into the pool
  const items = db.prepare("SELECT id, rarity FROM items").all() as { id: string; rarity: number }[]
  const insGacha = db.prepare("INSERT INTO gacha_entries (id, kind, ref_id, rarity) VALUES (?,?,?,?)")
  for (const it of items) insGacha.run(id("ge_"), "item", it.id, it.rarity)

  // Status templates
  const insStatus = db.prepare(
    "INSERT INTO status_templates (id,name,description,default_duration,max_stacks,modifiers,created_at) VALUES (?,?,?,?,?,?,?)",
  )
  insStatus.run(
    id("st_"),
    "Battle Rage",
    "Empowered and reckless.",
    3,
    3,
    JSON.stringify([
      { stat: "atk", value: 250, kind: "flat" },
      { stat: "critRate", value: 10, kind: "flat" },
    ]),
    t,
  )
  insStatus.run(
    id("st_"),
    "Weakened",
    "Defenses shattered.",
    2,
    1,
    JSON.stringify([
      { stat: "atk", value: -15, kind: "percent" },
      { stat: "def", value: -10, kind: "percent" },
    ]),
    t,
  )

  // Shop entries
  const insShop = db.prepare(`INSERT INTO shop_entries
    (id,item_id,grant_currency_id,grant_currency_amount,quantity,price,currency_id,purchase_limit,purchased,available,description,sort)
    VALUES (@id,@item_id,@grant_currency_id,@grant_currency_amount,@quantity,@price,@currency_id,@purchase_limit,@purchased,@available,@description,@sort)`)
  // Gems -> Orbs conversion
  insShop.run({
    id: id("shop_"),
    item_id: null,
    grant_currency_id: "cur_orbs",
    grant_currency_amount: 1,
    quantity: 1,
    price: 100,
    currency_id: "cur_gems",
    purchase_limit: null,
    purchased: 0,
    available: 1,
    description: "Convert Gems into a gacha Orb.",
    sort: 0,
  })
  const healItem = db.prepare("SELECT id FROM items WHERE name = ?").get("Minor Healing Draught") as { id: string } | undefined
  if (healItem) {
    insShop.run({
      id: id("shop_"),
      item_id: healItem.id,
      grant_currency_id: null,
      grant_currency_amount: 0,
      quantity: 1,
      price: 60,
      currency_id: "cur_gems",
      purchase_limit: 50,
      purchased: 0,
      available: 1,
      description: "A restorative draught.",
      sort: 1,
    })
  }
}
