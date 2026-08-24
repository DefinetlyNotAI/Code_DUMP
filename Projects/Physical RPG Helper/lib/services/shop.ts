import "server-only"
import { getDb, uid } from "@/lib/db"
import { itemRow } from "@/lib/db/mappers"
import { logEvent } from "./history"
import { addToInventory } from "./items"
import { adjustCurrency } from "./currency"
import { sellValue, computePurchase } from "@/lib/engine/economy"
import type { ShopEntry } from "@/lib/types"

function shopEntryRow(db: any, r: any): ShopEntry {
  return {
    id: r.id,
    itemId: r.item_id ?? null,
    item: r.item_id ? itemRow(db.prepare("SELECT * FROM items WHERE id = ?").get(r.item_id)) : null,
    grantCurrencyId: r.grant_currency_id ?? null,
    grantCurrencyAmount: r.grant_currency_amount ?? 0,
    quantity: r.quantity,
    price: r.price,
    currencyId: r.currency_id,
    purchaseLimit: r.purchase_limit ?? null,
    purchased: r.purchased,
    available: !!r.available,
    description: r.description ?? "",
    sort: r.sort,
  }
}

export function listShop(): ShopEntry[] {
  const db = getDb()
  const rows = db.prepare("SELECT * FROM shop_entries ORDER BY sort, rowid").all() as any[]
  return rows.map((r) => shopEntryRow(db, r))
}

export interface ShopEntryInput {
  itemId: string | null
  grantCurrencyId: string | null
  grantCurrencyAmount: number
  quantity: number
  price: number
  currencyId: string
  purchaseLimit: number | null
  available: boolean
  description: string
}

export function createShopEntry(input: ShopEntryInput): string {
  const db = getDb()
  const id = uid("shop_")
  const maxSort = (db.prepare("SELECT MAX(sort) m FROM shop_entries").get() as any)?.m ?? 0
  db.prepare(`INSERT INTO shop_entries
    (id,item_id,grant_currency_id,grant_currency_amount,quantity,price,currency_id,purchase_limit,purchased,available,description,sort)
    VALUES (?,?,?,?,?,?,?,?,0,?,?,?)`).run(
    id,
    input.itemId,
    input.grantCurrencyId,
    input.grantCurrencyAmount ?? 0,
    input.quantity ?? 1,
    input.price ?? 0,
    input.currencyId,
    input.purchaseLimit,
    input.available ? 1 : 0,
    input.description ?? "",
    maxSort + 1,
  )
  logEvent(db, "shop", `Added shop listing`, {})
  return id
}

export function updateShopEntry(id: string, input: ShopEntryInput) {
  const db = getDb()
  db.prepare(`UPDATE shop_entries SET
    item_id=?, grant_currency_id=?, grant_currency_amount=?, quantity=?, price=?, currency_id=?,
    purchase_limit=?, available=?, description=? WHERE id=?`).run(
    input.itemId,
    input.grantCurrencyId,
    input.grantCurrencyAmount ?? 0,
    input.quantity ?? 1,
    input.price ?? 0,
    input.currencyId,
    input.purchaseLimit,
    input.available ? 1 : 0,
    input.description ?? "",
    id,
  )
  logEvent(db, "shop", `Edited shop listing`, {})
}

export function deleteShopEntry(id: string) {
  const db = getDb()
  db.prepare("DELETE FROM shop_entries WHERE id = ?").run(id)
  logEvent(db, "shop", `Removed shop listing`, {})
}

export interface PurchaseOutcome {
  ok: boolean
  error?: string
  purchasedQty: number
  totalCost: number
  balance: number
}

// Buy `requestedQty` of a shop entry. All validation (limits, affordability) is
// enforced server-side. Currency is deducted and the reward granted atomically.
export function purchase(entryId: string, requestedQty: number): PurchaseOutcome {
  const db = getDb()
  const tx = db.transaction(() => {
    const r = db.prepare("SELECT * FROM shop_entries WHERE id = ?").get(entryId) as any
    if (!r) return { ok: false, error: "Listing not found", purchasedQty: 0, totalCost: 0, balance: 0 }
    if (!r.available) return { ok: false, error: "Listing unavailable", purchasedQty: 0, totalCost: 0, balance: 0 }

    const cur = db.prepare("SELECT * FROM currencies WHERE id = ?").get(r.currency_id) as any
    if (!cur) return { ok: false, error: "Currency not found", purchasedQty: 0, totalCost: 0, balance: 0 }

    const plan = computePurchase(r.price, requestedQty, cur.amount, r.purchase_limit ?? null, r.purchased)
    if (plan.quantity <= 0) {
      const reason =
        r.purchase_limit != null && r.purchased >= r.purchase_limit
          ? "Purchase limit reached"
          : "Not enough currency"
      return { ok: false, error: reason, purchasedQty: 0, totalCost: 0, balance: cur.amount }
    }

    // deduct currency
    const balance = adjustCurrency(r.currency_id, -plan.totalCost, "Shop purchase")

    // grant reward
    const grantedUnits = plan.quantity * (r.quantity || 1)
    let label = ""
    if (r.item_id) {
      addToInventory(r.item_id, grantedUnits, { silent: true })
      const it = db.prepare("SELECT name FROM items WHERE id = ?").get(r.item_id) as any
      label = `${grantedUnits}x ${it?.name ?? "item"}`
    } else if (r.grant_currency_id) {
      const amt = plan.quantity * (r.grant_currency_amount || 0)
      adjustCurrency(r.grant_currency_id, amt, "Shop bundle")
      const gc = db.prepare("SELECT name FROM currencies WHERE id = ?").get(r.grant_currency_id) as any
      label = `${amt} ${gc?.name ?? "currency"}`
    }

    db.prepare("UPDATE shop_entries SET purchased = purchased + ? WHERE id = ?").run(plan.quantity, entryId)

    // undo payload: remove granted items and refund spent currency (op matches history dispatcher)
    const undo =
      r.item_id
        ? {
            op: "inventory_remove",
            entries: [{ itemId: r.item_id, quantity: grantedUnits }],
            currencyId: r.currency_id,
            currencyDelta: -plan.totalCost, // reverse of a spend => add back
          }
        : {
            op: "currency_delta",
            currencyId: r.currency_id,
            delta: -plan.totalCost,
          }

    logEvent(db, "shop", `Bought ${label} for ${plan.totalCost} ${cur.name}`, {
      entity: label,
      values: { entryId, qty: plan.quantity, cost: plan.totalCost },
      undo,
    })

    return { ok: true, purchasedQty: plan.quantity, totalCost: plan.totalCost, balance }
  })
  return tx()
}

// Sell items from inventory. Returns the default currency and credits sale value.
export function sellFromInventory(entryId: string, quantity: number, currencyId: string): PurchaseOutcome {
  const db = getDb()
  const tx = db.transaction(() => {
    const entry = db.prepare("SELECT * FROM inventory_entries WHERE id = ?").get(entryId) as any
    if (!entry) return { ok: false, error: "Inventory entry not found", purchasedQty: 0, totalCost: 0, balance: 0 }
    const item = itemRow(db.prepare("SELECT * FROM items WHERE id = ?").get(entry.item_id))
    if (!item.sellable) return { ok: false, error: "Item cannot be sold", purchasedQty: 0, totalCost: 0, balance: 0 }

    const qty = Math.min(Math.max(1, Math.floor(quantity)), entry.quantity)
    const gain = sellValue(item.value, qty)

    if (entry.quantity - qty <= 0) {
      db.prepare("DELETE FROM inventory_entries WHERE id = ?").run(entryId)
    } else {
      db.prepare("UPDATE inventory_entries SET quantity = quantity - ? WHERE id = ?").run(qty, entryId)
    }
    const balance = adjustCurrency(currencyId, gain, `Sold ${qty}x ${item.name}`)
    return { ok: true, purchasedQty: qty, totalCost: gain, balance }
  })
  return tx()
}
