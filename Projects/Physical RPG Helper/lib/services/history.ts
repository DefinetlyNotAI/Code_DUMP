import "server-only"
import type Database from "better-sqlite3"
import { getDb, uid, now } from "@/lib/db"
import type { GameEvent } from "@/lib/types"

export function logEvent(
  db: Database.Database,
  type: string,
  description: string,
  opts: { entity?: string; values?: any; undo?: any } = {},
): string {
  const id = uid("ev_")
  db.prepare(
    "INSERT INTO events (id,type,description,entity,values_json,undo_json,undone,created_at) VALUES (?,?,?,?,?,?,0,?)",
  ).run(
    id,
    type,
    description,
    opts.entity ?? "",
    JSON.stringify(opts.values ?? {}),
    opts.undo ? JSON.stringify(opts.undo) : null,
    now(),
  )
  return id
}

function mapEvent(r: any): GameEvent {
  return {
    id: r.id,
    type: r.type,
    description: r.description,
    entity: r.entity,
    values: r.values_json ? JSON.parse(r.values_json) : {},
    undoable: !!r.undo_json && !r.undone,
    undone: !!r.undone,
    createdAt: r.created_at,
  }
}

export function listEvents(limit = 200, type?: string): GameEvent[] {
  const db = getDb()
  const rows = type
    ? (db.prepare("SELECT * FROM events WHERE type = ? ORDER BY created_at DESC LIMIT ?").all(type, limit) as any[])
    : (db.prepare("SELECT * FROM events ORDER BY created_at DESC LIMIT ?").all(limit) as any[])
  return rows.map(mapEvent)
}

export function clearHistory() {
  const db = getDb()
  db.prepare("DELETE FROM events").run()
}

// Undo dispatch: each undoable event carries an undo payload with an "op" field.
export function undoEvent(eventId: string): { ok: boolean; message: string } {
  const db = getDb()
  const row = db.prepare("SELECT * FROM events WHERE id = ?").get(eventId) as any
  if (!row) return { ok: false, message: "Event not found." }
  if (row.undone) return { ok: false, message: "Already undone." }
  if (!row.undo_json) return { ok: false, message: "This event cannot be undone." }
  const undo = JSON.parse(row.undo_json)

  const tx = db.transaction(() => {
    applyUndo(db, undo)
    db.prepare("UPDATE events SET undone = 1 WHERE id = ?").run(eventId)
    logEvent(db, "undo", `Undid: ${row.description}`, { entity: row.entity })
  })
  try {
    tx()
    return { ok: true, message: "Undone." }
  } catch (e: any) {
    return { ok: false, message: e?.message ?? "Undo failed." }
  }
}

function applyUndo(db: Database.Database, undo: any) {
  switch (undo.op) {
    case "currency_delta": {
      // reverse a currency change
      db.prepare("UPDATE currencies SET amount = amount + ? WHERE id = ?").run(-undo.delta, undo.currencyId)
      break
    }
    case "inventory_restore": {
      // restore inventory quantities: undo.entries = [{itemId, quantity}]
      for (const e of undo.entries) {
        const existing = db.prepare("SELECT * FROM inventory_entries WHERE item_id = ?").get(e.itemId) as any
        if (existing) {
          db.prepare("UPDATE inventory_entries SET quantity = quantity + ?, updated_at = ? WHERE id = ?").run(
            e.quantity,
            now(),
            existing.id,
          )
        } else {
          db.prepare("INSERT INTO inventory_entries (id,item_id,quantity,created_at,updated_at) VALUES (?,?,?,?,?)").run(
            uid("inv_"),
            e.itemId,
            e.quantity,
            now(),
            now(),
          )
        }
      }
      // reverse currency granted by the sale
      if (undo.currencyId && undo.currencyDelta) {
        db.prepare("UPDATE currencies SET amount = amount + ? WHERE id = ?").run(-undo.currencyDelta, undo.currencyId)
      }
      break
    }
    case "inventory_remove": {
      // undo an add: remove quantities
      for (const e of undo.entries) {
        const existing = db.prepare("SELECT * FROM inventory_entries WHERE item_id = ?").get(e.itemId) as any
        if (existing) {
          const nq = existing.quantity - e.quantity
          if (nq <= 0) db.prepare("DELETE FROM inventory_entries WHERE id = ?").run(existing.id)
          else db.prepare("UPDATE inventory_entries SET quantity = ?, updated_at = ? WHERE id = ?").run(nq, now(), existing.id)
        }
      }
      if (undo.currencyId && undo.currencyDelta) {
        db.prepare("UPDATE currencies SET amount = amount + ? WHERE id = ?").run(-undo.currencyDelta, undo.currencyId)
      }
      break
    }
    case "gacha": {
      // remove granted items, restore orbs, restore pity
      for (const e of undo.entries) {
        const existing = db.prepare("SELECT * FROM inventory_entries WHERE item_id = ?").get(e.itemId) as any
        if (existing) {
          const nq = existing.quantity - e.quantity
          if (nq <= 0) db.prepare("DELETE FROM inventory_entries WHERE id = ?").run(existing.id)
          else db.prepare("UPDATE inventory_entries SET quantity = ?, updated_at = ? WHERE id = ?").run(nq, now(), existing.id)
        }
      }
      if (undo.orbCost) db.prepare("UPDATE currencies SET amount = amount + ? WHERE id = ?").run(undo.orbCost, "cur_orbs")
      if (undo.pity) db.prepare("UPDATE kv SET value = ? WHERE key = 'gacha_pity'").run(JSON.stringify(undo.pity))
      break
    }
    case "character_snapshot": {
      // restore character stats/exp/hp/tp/level
      const s = undo.snapshot
      db.prepare(
        `UPDATE characters SET level=?, current_exp=?, current_hp=?, current_tp=?, temp_modifiers=?, updated_at=? WHERE id=?`,
      ).run(s.level, s.currentExp, s.currentHp, s.currentTp, JSON.stringify(s.tempModifiers ?? []), now(), undo.characterId)
      break
    }
    default:
      throw new Error("Unknown undo operation.")
  }
}
