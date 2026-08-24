import "server-only"
import { getDb, uid, now } from "@/lib/db"
import { currencyRow } from "@/lib/db/mappers"
import { logEvent } from "./history"
import type { Currency } from "@/lib/types"

export function listCurrencies(): Currency[] {
  const db = getDb()
  const rows = db.prepare("SELECT * FROM currencies ORDER BY sort, name").all() as any[]
  return rows.map(currencyRow)
}

export function getCurrency(id: string): Currency | null {
  const db = getDb()
  const r = db.prepare("SELECT * FROM currencies WHERE id = ?").get(id)
  return r ? currencyRow(r) : null
}

export function createCurrency(input: { name: string; icon: string; description: string; amount: number }): string {
  const db = getDb()
  const id = uid("cur_")
  const maxSort = (db.prepare("SELECT MAX(sort) m FROM currencies").get() as any)?.m ?? 0
  db.prepare(
    "INSERT INTO currencies (id,name,icon,description,amount,is_default,sort) VALUES (?,?,?,?,?,0,?)",
  ).run(id, input.name, input.icon, input.description ?? "", input.amount ?? 0, maxSort + 1)
  logEvent(db, "currency", `Created currency ${input.name}`, { entity: input.name })
  return id
}

export function updateCurrency(id: string, input: { name: string; icon: string; description: string }) {
  const db = getDb()
  db.prepare("UPDATE currencies SET name=?, icon=?, description=? WHERE id=?").run(
    input.name,
    input.icon,
    input.description ?? "",
    id,
  )
  logEvent(db, "currency", `Edited currency ${input.name}`, { entity: input.name })
}

export function deleteCurrency(id: string) {
  const db = getDb()
  const c = db.prepare("SELECT * FROM currencies WHERE id = ?").get(id) as any
  if (!c) return
  if (c.is_default) throw new Error("Cannot delete the default currency")
  db.prepare("DELETE FROM currencies WHERE id = ?").run(id)
  logEvent(db, "currency", `Deleted currency ${c.name}`, { entity: c.name })
}

// Adjust a currency balance by delta (can be negative). Clamped at 0.
export function adjustCurrency(id: string, delta: number, reason?: string): number {
  const db = getDb()
  const c = db.prepare("SELECT * FROM currencies WHERE id = ?").get(id) as any
  if (!c) throw new Error("Currency not found")
  const next = Math.max(0, c.amount + delta)
  db.prepare("UPDATE currencies SET amount = ? WHERE id = ?").run(next, id)
  const sign = delta >= 0 ? "+" : ""
  logEvent(db, "currency", `${reason ? reason + ": " : ""}${sign}${delta} ${c.name} (now ${next})`, {
    entity: c.name,
    values: { delta, balance: next },
  })
  return next
}

export function setCurrency(id: string, amount: number): number {
  const db = getDb()
  const c = db.prepare("SELECT * FROM currencies WHERE id = ?").get(id) as any
  if (!c) throw new Error("Currency not found")
  const next = Math.max(0, Math.round(amount))
  db.prepare("UPDATE currencies SET amount = ? WHERE id = ?").run(next, id)
  logEvent(db, "currency", `Set ${c.name} to ${next}`, { entity: c.name, values: { balance: next } })
  return next
}
