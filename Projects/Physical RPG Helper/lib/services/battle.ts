import "server-only"
import { getDb, uid, now } from "@/lib/db"
import { logEvent } from "./history"
import { getCharacter, grantExp, setResource } from "./characters"
import { getEnemyTemplate } from "./enemies"
import {
  computeDamage,
  type AttackerSnapshot,
  type TargetSnapshot,
  type DamageAbility,
  type DamageResult,
} from "@/lib/engine/damage"
import { computeStats } from "@/lib/engine/stats"
import type {
  Battle,
  BattleParticipant,
  BattleAction,
  AppliedStatus,
  BaseStats,
  AbilityDef,
  StatModifier,
} from "@/lib/types"

/* ---------- mapping ---------- */

function statusRow(r: any): AppliedStatus {
  return {
    id: r.id,
    participantId: r.participant_id,
    name: r.name,
    description: r.description,
    modifiers: JSON.parse(r.modifiers) as StatModifier[],
    stacks: r.stacks,
    maxStacks: r.max_stacks,
    duration: r.duration ?? null,
    source: r.source,
    startRound: r.start_round,
  }
}

function participantRow(db: any, r: any): BattleParticipant {
  const statuses = (db.prepare("SELECT * FROM applied_statuses WHERE participant_id = ?").all(r.id) as any[]).map(
    statusRow,
  )
  return {
    id: r.id,
    battleId: r.battle_id,
    side: r.side,
    sourceKind: r.source_kind,
    sourceId: r.source_id ?? null,
    name: r.name,
    level: r.level,
    rarity: r.rarity,
    currentHp: r.current_hp,
    maxHp: r.max_hp,
    currentTp: r.current_tp,
    maxTp: r.max_tp,
    stats: JSON.parse(r.stats) as BaseStats,
    abilities: JSON.parse(r.abilities) as AbilityDef[],
    expReward: r.exp_reward,
    defeated: !!r.defeated,
    sort: r.sort,
    statuses,
  }
}

function battleRow(db: any, r: any): Battle {
  const participants = (
    db.prepare("SELECT * FROM battle_participants WHERE battle_id = ? ORDER BY sort").all(r.id) as any[]
  ).map((p) => participantRow(db, p))
  const actions = (
    db.prepare("SELECT * FROM battle_actions WHERE battle_id = ? ORDER BY created_at DESC LIMIT 100").all(r.id) as any[]
  ).map(
    (a): BattleAction => ({
      id: a.id,
      round: a.round,
      description: a.description,
      detail: JSON.parse(a.detail),
      createdAt: a.created_at,
    }),
  )
  return {
    id: r.id,
    name: r.name,
    status: r.status,
    round: r.round,
    turnIndex: r.turn_index,
    turnOrder: JSON.parse(r.turn_order) as string[],
    participants,
    actions,
  }
}

/* ---------- queries ---------- */

export function getActiveBattle(): Battle | null {
  const db = getDb()
  const r = db.prepare("SELECT * FROM battles WHERE status = 'active' ORDER BY created_at DESC LIMIT 1").get() as any
  return r ? battleRow(db, r) : null
}

export function getBattle(id: string): Battle | null {
  const db = getDb()
  const r = db.prepare("SELECT * FROM battles WHERE id = ?").get(id) as any
  return r ? battleRow(db, r) : null
}

/* ---------- helpers ---------- */

// effective stats = snapshot base stats + all active status modifiers
function effectiveStats(p: BattleParticipant): BaseStats {
  // multiply each status's modifier values by its stack count, then aggregate
  const mods: StatModifier[] = []
  for (const s of p.statuses) {
    for (const m of s.modifiers) mods.push({ ...m, value: m.value * s.stacks })
  }
  return computeStats(p.stats, mods)
}

function attackerSnapshot(p: BattleParticipant): AttackerSnapshot {
  const s = effectiveStats(p)
  return {
    level: p.level,
    atk: s.atk,
    critRate: s.critRate,
    critDmg: s.critDmg,
    basicBonus: s.basicBonus,
    skillBonus: s.skillBonus,
    ultimateBonus: s.ultimateBonus,
  }
}

function targetSnapshot(p: BattleParticipant): TargetSnapshot {
  const s = effectiveStats(p)
  return {
    level: p.level,
    def: s.def,
    basicRes: s.basicRes,
    skillRes: s.skillRes,
    ultimateRes: s.ultimateRes,
  }
}

// initiative: higher is earlier. energyRegen acts as a "speed" proxy plus a level tiebreak.
function initiative(p: BattleParticipant): number {
  return effectiveStats(p).energyRegen * 100 + p.level
}

/* ---------- create ---------- */

export function createBattle(input: {
  name?: string
  characterIds: string[]
  enemies: { templateId: string; count: number }[]
}): { ok: boolean; error?: string; battleId?: string } {
  const db = getDb()
  const tx = db.transaction(() => {
    // end any existing active battle
    db.prepare("UPDATE battles SET status='ended', updated_at=? WHERE status='active'").run(now())

    const battleId = uid("btl_")
    db.prepare(
      "INSERT INTO battles (id,name,status,round,turn_index,turn_order,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?)",
    ).run(battleId, input.name || "Battle", "active", 1, 0, "[]", now(), now())

    const parts: BattleParticipant[] = []
    let sort = 0

    for (const cid of input.characterIds) {
      const c = getCharacter(cid)
      if (!c) continue
      const pid = uid("pt_")
      db.prepare(
        `INSERT INTO battle_participants
          (id,battle_id,side,source_kind,source_id,name,level,rarity,current_hp,max_hp,current_tp,max_tp,stats,abilities,exp_reward,defeated,sort)
          VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      ).run(
        pid,
        battleId,
        "player",
        "character",
        c.id,
        c.name,
        c.level,
        c.rarity,
        c.currentHp,
        c.maxHp,
        c.currentTp,
        c.maxTp,
        JSON.stringify(c.final),
        JSON.stringify(c.abilities),
        0,
        0,
        sort++,
      )
    }

    for (const grp of input.enemies) {
      const tmpl = getEnemyTemplate(grp.templateId)
      if (!tmpl) continue
      for (let i = 0; i < grp.count; i++) {
        const pid = uid("pt_")
        const suffix = grp.count > 1 ? ` ${i + 1}` : ""
        const stats: BaseStats = {
          hp: tmpl.hp,
          atk: tmpl.atk,
          def: tmpl.def,
          critRate: tmpl.critRate,
          critDmg: tmpl.critDmg,
          energyRegen: 100,
          basicBonus: tmpl.basicBonus,
          skillBonus: tmpl.skillBonus,
          ultimateBonus: tmpl.ultimateBonus,
          basicRes: tmpl.basicRes,
          skillRes: tmpl.skillRes,
          ultimateRes: tmpl.ultimateRes,
          tp: tmpl.tp,
        }
        const abilities: AbilityDef[] = tmpl.abilities.map((a) => ({ ...a, id: uid("ab_") }))
        db.prepare(
          `INSERT INTO battle_participants
            (id,battle_id,side,source_kind,source_id,name,level,rarity,current_hp,max_hp,current_tp,max_tp,stats,abilities,exp_reward,defeated,sort)
            VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
        ).run(
          pid,
          battleId,
          "enemy",
          "enemy_template",
          tmpl.id,
          tmpl.name + suffix,
          tmpl.level,
          tmpl.rarity,
          tmpl.hp,
          tmpl.hp,
          tmpl.tp,
          tmpl.tp,
          JSON.stringify(stats),
          JSON.stringify(abilities),
          tmpl.expReward,
          0,
          sort++,
        )
      }
    }

    // build turn order by initiative
    const rows = db.prepare("SELECT * FROM battle_participants WHERE battle_id = ?").all(battleId) as any[]
    for (const r of rows) parts.push(participantRow(db, r))
    const order = [...parts].sort((a, b) => initiative(b) - initiative(a)).map((p) => p.id)
    db.prepare("UPDATE battles SET turn_order=? WHERE id=?").run(JSON.stringify(order), battleId)

    logEvent(db, "battle", `Started battle "${input.name || "Battle"}" (${parts.length} combatants)`, {
      entity: input.name || "Battle",
    })
    return battleId
  })

  try {
    const battleId = tx()
    return { ok: true, battleId }
  } catch (e) {
    return { ok: false, error: (e as Error).message }
  }
}

/* ---------- actions ---------- */

function touch(db: any, battleId: string) {
  db.prepare("UPDATE battles SET updated_at=? WHERE id=?").run(now(), battleId)
}

function logAction(db: any, battleId: string, round: number, description: string, detail: unknown) {
  db.prepare("INSERT INTO battle_actions (id,battle_id,round,description,detail,created_at) VALUES (?,?,?,?,?,?)").run(
    uid("bta_"),
    battleId,
    round,
    description,
    JSON.stringify(detail ?? {}),
    now(),
  )
}

export interface AttackParams {
  battleId: string
  attackerId: string
  targetId: string
  abilityId: string
  // GM overrides
  forceCrit?: "auto" | "yes" | "no"
  overrideDamage?: number | null
}

export function performAttack(params: AttackParams): { ok: boolean; error?: string; result?: DamageResult } {
  const db = getDb()
  const tx = db.transaction(() => {
    const battle = getBattle(params.battleId)
    if (!battle) throw new Error("Battle not found")
    const attacker = battle.participants.find((p) => p.id === params.attackerId)
    const target = battle.participants.find((p) => p.id === params.targetId)
    if (!attacker || !target) throw new Error("Combatant not found")
    const ability = attacker.abilities.find((a) => a.id === params.abilityId)
    if (!ability) throw new Error("Ability not found")

    // TP cost
    if (ability.tpCost > 0 && attacker.currentTp < ability.tpCost) {
      throw new Error(`${attacker.name} lacks TP (need ${ability.tpCost})`)
    }

    if (ability.damageType === "heal") {
      const healAmount =
        params.overrideDamage != null
          ? params.overrideDamage
          : Math.round(attackerSnapshot(attacker).atk * (ability.multiplier / 100) + ability.flatBonus)
      const newHp = Math.min(target.maxHp, target.currentHp + healAmount)
      db.prepare("UPDATE battle_participants SET current_hp=? WHERE id=?").run(newHp, target.id)
      if (ability.tpCost > 0) {
        db.prepare("UPDATE battle_participants SET current_tp = current_tp - ? WHERE id=?").run(
          ability.tpCost,
          attacker.id,
        )
      }
      logAction(db, battle.id, battle.round, `${attacker.name} healed ${target.name} for ${healAmount} HP`, {
        kind: "heal",
        attackerId: attacker.id,
        targetId: target.id,
        prevHp: target.currentHp,
        newHp,
        prevTp: attacker.currentTp,
        tpCost: ability.tpCost,
      })
      touch(db, battle.id)
      return undefined
    }

    const dmgAbility: DamageAbility = {
      attackType: ability.attackType,
      multiplier: ability.multiplier,
      scalingStat: "atk",
      dice: ability.dice,
      flatBonus: ability.flatBonus,
    }
    const crit =
      params.forceCrit && params.forceCrit !== "auto"
        ? { forced: true, forcedValue: params.forceCrit === "yes" }
        : undefined
    const result = computeDamage(attackerSnapshot(attacker), targetSnapshot(target), dmgAbility, { crit })

    const finalDamage = params.overrideDamage != null ? Math.max(0, Math.round(params.overrideDamage)) : result.final
    const newHp = Math.max(0, target.currentHp - finalDamage)
    const defeated = newHp <= 0

    db.prepare("UPDATE battle_participants SET current_hp=?, defeated=? WHERE id=?").run(
      newHp,
      defeated ? 1 : 0,
      target.id,
    )
    if (ability.tpCost > 0) {
      db.prepare("UPDATE battle_participants SET current_tp = current_tp - ? WHERE id=?").run(ability.tpCost, attacker.id)
    }
    // attacker gains a little TP on basic
    if (ability.attackType === "basic") {
      const gain = 10
      db.prepare("UPDATE battle_participants SET current_tp = MIN(max_tp, current_tp + ?) WHERE id=?").run(
        gain,
        attacker.id,
      )
    }

    logAction(
      db,
      battle.id,
      battle.round,
      `${attacker.name} used ${ability.name} on ${target.name} — ${finalDamage} dmg${result.isCrit ? " (CRIT)" : ""}${defeated ? ` — ${target.name} defeated!` : ""}`,
      {
        kind: "attack",
        attackerId: attacker.id,
        targetId: target.id,
        abilityName: ability.name,
        prevHp: target.currentHp,
        newHp,
        finalDamage,
        overridden: params.overrideDamage != null,
        defeated,
        result,
        prevTp: attacker.currentTp,
        tpCost: ability.tpCost,
      },
    )

    // award exp when an enemy is defeated by a player
    if (defeated && target.side === "enemy") {
      awardExpForDefeat(db, battle, target)
    }

    touch(db, battle.id)
    return result
  })

  try {
    const result = tx()
    return { ok: true, result }
  } catch (e) {
    return { ok: false, error: (e as Error).message }
  }
}

function awardExpForDefeat(db: any, battle: Battle, defeated: BattleParticipant) {
  const players = battle.participants.filter((p) => p.side === "player" && p.sourceId && !p.defeated)
  if (players.length === 0) return
  const share = Math.max(1, Math.round(defeated.expReward / players.length))
  for (const pl of players) {
    if (pl.sourceId) grantExp(pl.sourceId, share)
  }
  logEvent(db, "battle", `Party gained ${defeated.expReward} EXP for defeating ${defeated.name}`, {
    entity: defeated.name,
    values: { total: defeated.expReward, perMember: share },
  })
}

// Manual HP/TP set (GM override)
export function setParticipantResource(battleId: string, participantId: string, field: "hp" | "tp", value: number) {
  const db = getDb()
  const p = db.prepare("SELECT * FROM battle_participants WHERE id=?").get(participantId) as any
  if (!p) return
  if (field === "hp") {
    const v = Math.max(0, Math.min(p.max_hp, Math.round(value)))
    db.prepare("UPDATE battle_participants SET current_hp=?, defeated=? WHERE id=?").run(v, v <= 0 ? 1 : 0, participantId)
  } else {
    const v = Math.max(0, Math.min(p.max_tp, Math.round(value)))
    db.prepare("UPDATE battle_participants SET current_tp=? WHERE id=?").run(v, participantId)
  }
  logAction(db, battleId, battleRoundOf(db, battleId), `GM set ${p.name} ${field.toUpperCase()} to ${Math.round(value)}`, {
    kind: "override",
    participantId,
    field,
    value,
  })
  touch(db, battleId)
}

function battleRoundOf(db: any, battleId: string): number {
  const r = db.prepare("SELECT round FROM battles WHERE id=?").get(battleId) as any
  return r?.round ?? 1
}

/* ---------- status effects ---------- */

export function applyStatus(input: {
  battleId: string
  participantId: string
  name: string
  description?: string
  modifiers: StatModifier[]
  duration: number | null
  maxStacks: number
  source?: string
}) {
  const db = getDb()
  const round = battleRoundOf(db, input.battleId)
  const existing = db
    .prepare("SELECT * FROM applied_statuses WHERE participant_id=? AND name=?")
    .get(input.participantId, input.name) as any

  if (existing) {
    const newStacks = Math.min(input.maxStacks, existing.stacks + 1)
    db.prepare("UPDATE applied_statuses SET stacks=?, duration=? WHERE id=?").run(
      newStacks,
      input.duration,
      existing.id,
    )
  } else {
    db.prepare(
      "INSERT INTO applied_statuses (id,participant_id,name,description,modifiers,stacks,max_stacks,duration,source,start_round) VALUES (?,?,?,?,?,?,?,?,?,?)",
    ).run(
      uid("as_"),
      input.participantId,
      input.name,
      input.description ?? "",
      JSON.stringify(input.modifiers),
      1,
      input.maxStacks,
      input.duration,
      input.source ?? "GM",
      round,
    )
  }
  const p = db.prepare("SELECT name FROM battle_participants WHERE id=?").get(input.participantId) as any
  logAction(db, input.battleId, round, `Applied ${input.name} to ${p?.name ?? "combatant"}`, {
    kind: "status",
    participantId: input.participantId,
    name: input.name,
  })
  touch(db, input.battleId)
}

export function removeStatus(battleId: string, statusId: string) {
  const db = getDb()
  db.prepare("DELETE FROM applied_statuses WHERE id=?").run(statusId)
  touch(db, battleId)
}

/* ---------- turn / round flow ---------- */

export function advanceTurn(battleId: string): { ok: boolean; newRound: boolean } {
  const db = getDb()
  const battle = getBattle(battleId)
  if (!battle) return { ok: false, newRound: false }
  const order = battle.turnOrder.filter((id) => {
    const p = battle.participants.find((x) => x.id === id)
    return p && !p.defeated
  })
  if (order.length === 0) return { ok: false, newRound: false }

  let idx = battle.turnIndex + 1
  let newRound = false
  let round = battle.round
  if (idx >= order.length) {
    idx = 0
    round += 1
    newRound = true
    tickStatuses(db, battleId, round)
  }
  db.prepare("UPDATE battles SET turn_index=?, round=?, updated_at=? WHERE id=?").run(idx, round, now(), battleId)
  if (newRound) {
    logAction(db, battleId, round, `Round ${round} begins`, { kind: "round" })
  }
  return { ok: true, newRound }
}

// Decrement durations at the start of each new round; expire those that hit 0.
function tickStatuses(db: any, battleId: string, round: number) {
  const parts = db.prepare("SELECT id, name FROM battle_participants WHERE battle_id=?").all(battleId) as any[]
  for (const p of parts) {
    const statuses = db.prepare("SELECT * FROM applied_statuses WHERE participant_id=?").all(p.id) as any[]
    for (const s of statuses) {
      if (s.duration == null) continue
      const nd = s.duration - 1
      if (nd <= 0) {
        db.prepare("DELETE FROM applied_statuses WHERE id=?").run(s.id)
        logAction(db, battleId, round, `${s.name} expired on ${p.name}`, { kind: "status_expire", name: s.name })
      } else {
        db.prepare("UPDATE applied_statuses SET duration=? WHERE id=?").run(nd, s.id)
      }
    }
  }
}

/* ---------- end / sync ---------- */

// Persist participant HP/TP back to the source characters, then end the battle.
export function endBattle(battleId: string, opts: { syncToCharacters?: boolean } = {}): { ok: boolean } {
  const db = getDb()
  const battle = getBattle(battleId)
  if (!battle) return { ok: false }
  if (opts.syncToCharacters) {
    for (const p of battle.participants) {
      if (p.side === "player" && p.sourceId) {
        setResource(p.sourceId, "hp", p.currentHp, true)
        setResource(p.sourceId, "tp", p.currentTp, true)
      }
    }
  }
  db.prepare("UPDATE battles SET status='ended', updated_at=? WHERE id=?").run(now(), battleId)
  logEvent(db, "battle", `Ended battle "${battle.name}"`, { entity: battle.name })
  return { ok: true }
}

// Undo the most recent battle action (attack/heal/override) by restoring HP/TP from its detail.
export function undoLastAction(battleId: string): { ok: boolean; error?: string } {
  const db = getDb()
  const last = db
    .prepare("SELECT * FROM battle_actions WHERE battle_id=? ORDER BY created_at DESC LIMIT 1")
    .get(battleId) as any
  if (!last) return { ok: false, error: "Nothing to undo" }
  const detail = JSON.parse(last.detail)
  const tx = db.transaction(() => {
    if (detail.kind === "attack" || detail.kind === "heal") {
      if (detail.targetId != null && detail.prevHp != null) {
        db.prepare("UPDATE battle_participants SET current_hp=?, defeated=? WHERE id=?").run(
          detail.prevHp,
          detail.prevHp <= 0 ? 1 : 0,
          detail.targetId,
        )
      }
      if (detail.attackerId != null && detail.prevTp != null) {
        db.prepare("UPDATE battle_participants SET current_tp=? WHERE id=?").run(detail.prevTp, detail.attackerId)
      }
    } else if (detail.kind === "override") {
      // best-effort: overrides are not perfectly reversible; leave note
    }
    db.prepare("DELETE FROM battle_actions WHERE id=?").run(last.id)
    touch(db, battleId)
  })
  try {
    tx()
    return { ok: true }
  } catch (e) {
    return { ok: false, error: (e as Error).message }
  }
}
