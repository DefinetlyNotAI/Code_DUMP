import "server-only"
import { getDb, uid, now } from "@/lib/db"
import { itemRow, inventoryRow } from "@/lib/db/mappers"
import { logEvent } from "./history"
import type { Item, InventoryEntry, StatModifier } from "@/lib/types"

export function listItems(): Item[] {
  const db = getDb()
  const rows = db.prepare("SELECT * FROM items ORDER BY rarity DESC, name").all() as any[]
  return rows.map(itemRow)
}

export function getItem(id: string): Item | null {
  const db = getDb()
  const r = db.prepare("SELECT * FROM items WHERE id = ?").get(id)
  return r ? itemRow(r) : null
}

export type ItemInput = Omit<Item, "id">

function bind(input: ItemInput) {
  return {
    name: input.name,
    description: input.description ?? "",
    rarity: input.rarity,
    category: input.category,
    tags: JSON.stringify(input.tags ?? []),
    value: input.value,
    sellable: input.sellable ? 1 : 0,
    stackable: input.stackable ? 1 : 0,
    stats: JSON.stringify(input.stats ?? []),
    effects: JSON.stringify(input.effects ?? []),
    notes: input.notes ?? "",
    equip_slot: input.equipSlot ?? null,
    main_stat: input.mainStat ? JSON.stringify(input.mainStat) : null,
    substats: JSON.stringify(input.substats ?? []),
    base_atk: input.baseAtk ?? null,
    passive: input.passive ?? null,
    item_level: input.itemLevel ?? null,
  }
}

export function createItem(input: ItemInput): string {
  const db = getDb()
  const id = uid("item_")
  db.prepare(`INSERT INTO items
    (id,name,description,rarity,category,tags,value,sellable,stackable,stats,effects,notes,
     equip_slot,main_stat,substats,base_atk,passive,item_level,created_at,updated_at)
    VALUES (@id,@name,@description,@rarity,@category,@tags,@value,@sellable,@stackable,@stats,@effects,@notes,
     @equip_slot,@main_stat,@substats,@base_atk,@passive,@item_level,@created_at,@updated_at)`).run({
    id,
    ...bind(input),
    created_at: now(),
    updated_at: now(),
  })
  logEvent(db, "item", `Created item ${input.name}`, { entity: input.name })
  return id
}

export function updateItem(id: string, input: ItemInput) {
  const db = getDb()
  db.prepare(`UPDATE items SET
    name=@name, description=@description, rarity=@rarity, category=@category, tags=@tags, value=@value,
    sellable=@sellable, stackable=@stackable, stats=@stats, effects=@effects, notes=@notes,
    equip_slot=@equip_slot, main_stat=@main_stat, substats=@substats, base_atk=@base_atk,
    passive=@passive, item_level=@item_level, updated_at=@updated_at
    WHERE id=@id`).run({ id, ...bind(input), updated_at: now() })
  logEvent(db, "item", `Edited item ${input.name}`, { entity: input.name })
}

export function deleteItem(id: string) {
  const db = getDb()
  const it = db.prepare("SELECT name FROM items WHERE id = ?").get(id) as any
  db.prepare("DELETE FROM items WHERE id = ?").run(id)
  if (it) logEvent(db, "item", `Deleted item ${it.name}`, { entity: it.name })
}

export function duplicateItem(id: string): string | null {
  const db = getDb()
  const r = db.prepare("SELECT * FROM items WHERE id = ?").get(id) as any
  if (!r) return null
  const it = itemRow(r)
  const { id: _omit, ...rest } = it
  return createItem({ ...rest, name: `${it.name} (Copy)` })
}

/* ---------------- Inventory ---------------- */

export function listInventory(): InventoryEntry[] {
  const db = getDb()
  const rows = db.prepare("SELECT * FROM inventory_entries ORDER BY created_at DESC").all() as any[]
  return rows.map((r) => inventoryRow(db, r))
}

// Add qty of an item to the shared inventory. Stackable items merge; non-stackable create rows.
export function addToInventory(itemId: string, quantity = 1, opts?: { silent?: boolean }): void {
  const db = getDb()
  const item = itemRow(db.prepare("SELECT * FROM items WHERE id = ?").get(itemId))
  if (item.stackable) {
    const existing = db.prepare("SELECT * FROM inventory_entries WHERE item_id = ?").get(itemId) as any
    if (existing) {
      db.prepare("UPDATE inventory_entries SET quantity = quantity + ?, updated_at = ? WHERE id = ?").run(
        quantity,
        now(),
        existing.id,
      )
    } else {
      db.prepare("INSERT INTO inventory_entries (id,item_id,quantity,created_at,updated_at) VALUES (?,?,?,?,?)").run(
        uid("inv_"),
        itemId,
        quantity,
        now(),
        now(),
      )
    }
  } else {
    for (let i = 0; i < quantity; i++) {
      db.prepare("INSERT INTO inventory_entries (id,item_id,quantity,created_at,updated_at) VALUES (?,?,?,?,?)").run(
        uid("inv_"),
        itemId,
        1,
        now(),
        now(),
      )
    }
  }
  if (!opts?.silent) logEvent(db, "inventory", `Added ${quantity}x ${item.name} to inventory`, { entity: item.name, values: { itemId, quantity } })
}

export function setInventoryQuantity(entryId: string, quantity: number) {
  const db = getDb()
  const entry = db.prepare("SELECT * FROM inventory_entries WHERE id = ?").get(entryId) as any
  if (!entry) return
  const item = itemRow(db.prepare("SELECT * FROM items WHERE id = ?").get(entry.item_id))
  if (quantity <= 0) {
    db.prepare("DELETE FROM inventory_entries WHERE id = ?").run(entryId)
  } else {
    db.prepare("UPDATE inventory_entries SET quantity = ?, updated_at = ? WHERE id = ?").run(quantity, now(), entryId)
  }
  logEvent(db, "inventory", `Set ${item.name} quantity to ${Math.max(0, quantity)}`, { entity: item.name })
}

export function removeInventoryEntry(entryId: string) {
  const db = getDb()
  const entry = db.prepare("SELECT * FROM inventory_entries WHERE id = ?").get(entryId) as any
  if (!entry) return
  const item = itemRow(db.prepare("SELECT * FROM items WHERE id = ?").get(entry.item_id))
  db.prepare("DELETE FROM inventory_entries WHERE id = ?").run(entryId)
  logEvent(db, "inventory", `Removed ${item.name} from inventory`, { entity: item.name })
}

/* ---------------- Equipment ---------------- */

// Equip an inventory entry onto a character in a given slot. Any existing item in
// that slot is returned to inventory. The equipped item is consumed from inventory.
export function equipFromInventory(
  characterId: string,
  inventoryEntryId: string,
  slotType: "weapon" | "relic" | "armor",
  slotIndex: number,
): { ok: boolean; error?: string } {
  const db = getDb()
  const tx = db.transaction(() => {
    const entry = db.prepare("SELECT * FROM inventory_entries WHERE id = ?").get(inventoryEntryId) as any
    if (!entry) return { ok: false, error: "Inventory entry not found" }
    const item = itemRow(db.prepare("SELECT * FROM items WHERE id = ?").get(entry.item_id))
    if (item.equipSlot !== slotType) return { ok: false, error: `Item cannot be equipped in ${slotType} slot` }
    const char = db.prepare("SELECT name FROM characters WHERE id = ?").get(characterId) as any
    if (!char) return { ok: false, error: "Character not found" }

    // unequip existing in-slot item -> back to inventory
    const existing = db
      .prepare("SELECT * FROM equipped WHERE character_id = ? AND slot_type = ? AND slot_index = ?")
      .get(characterId, slotType, slotIndex) as any
    if (existing) {
      addToInventory(existing.item_id, 1, { silent: true })
      db.prepare("DELETE FROM equipped WHERE id = ?").run(existing.id)
    }

    // consume 1 from inventory
    if (entry.quantity > 1) {
      db.prepare("UPDATE inventory_entries SET quantity = quantity - 1, updated_at = ? WHERE id = ?").run(now(), entry.id)
    } else {
      db.prepare("DELETE FROM inventory_entries WHERE id = ?").run(entry.id)
    }

    db.prepare(
      "INSERT INTO equipped (id,character_id,item_id,slot_type,slot_index) VALUES (?,?,?,?,?)",
    ).run(uid("eq_"), characterId, item.id, slotType, slotIndex)

    logEvent(db, "equipment", `Equipped ${item.name} on ${char.name}`, { entity: char.name, values: { item: item.name } })
    return { ok: true }
  })
  return tx()
}

export function unequip(equippedId: string): { ok: boolean } {
  const db = getDb()
  const tx = db.transaction(() => {
    const eq = db.prepare("SELECT * FROM equipped WHERE id = ?").get(equippedId) as any
    if (!eq) return { ok: false }
    const item = itemRow(db.prepare("SELECT * FROM items WHERE id = ?").get(eq.item_id))
    const char = db.prepare("SELECT name FROM characters WHERE id = ?").get(eq.character_id) as any
    addToInventory(eq.item_id, 1, { silent: true })
    db.prepare("DELETE FROM equipped WHERE id = ?").run(equippedId)
    logEvent(db, "equipment", `Unequipped ${item.name} from ${char?.name ?? "character"}`, { entity: char?.name ?? "" })
    return { ok: true }
  })
  return tx()
}
