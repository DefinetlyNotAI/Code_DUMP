import "server-only"
import { getDb, uid } from "@/lib/db"
import { logEvent } from "./history"
import { addToInventory } from "./items"
import { getCurrency, adjustCurrency } from "./currency"
import {
  pullRarity,
  DEFAULT_GACHA_CONFIG,
  selectFromPool,
  type GachaConfig,
  type PityState,
} from "@/lib/engine/gacha"
import type { GachaPoolEntry, Rarity } from "@/lib/types"

const CONFIG_KEY = "gacha_config"
const PITY_KEY = "gacha_pity"
const COST_KEY = "gacha_cost"

interface GachaCost {
  currencyId: string
  perPull: number
}

function readKv<T>(key: string, fallback: T): T {
  const db = getDb()
  const row = db.prepare("SELECT value FROM kv WHERE key = ?").get(key) as { value: string } | undefined
  if (!row) return fallback
  try {
    return JSON.parse(row.value) as T
  } catch {
    return fallback
  }
}

function writeKv(key: string, value: unknown) {
  const db = getDb()
  db.prepare("INSERT INTO kv (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value").run(
    key,
    JSON.stringify(value),
  )
}

export function getGachaConfig(): GachaConfig {
  return readKv<GachaConfig>(CONFIG_KEY, DEFAULT_GACHA_CONFIG)
}

export function setGachaConfig(config: GachaConfig) {
  writeKv(CONFIG_KEY, config)
  logEvent(getDb(), "gacha", "Updated gacha configuration", { entity: "Gacha" })
}

export function getPity(): PityState {
  return readKv<PityState>(PITY_KEY, { pity4: 0, pity5: 0 })
}

function setPity(pity: PityState) {
  writeKv(PITY_KEY, pity)
}

export function getGachaCost(): GachaCost {
  return readKv<GachaCost>(COST_KEY, { currencyId: "cur_orbs", perPull: 1 })
}

export function setGachaCost(cost: GachaCost) {
  writeKv(COST_KEY, cost)
}

export function listPool(): GachaPoolEntry[] {
  const db = getDb()
  const rows = db.prepare("SELECT * FROM gacha_entries").all() as any[]
  return rows.map((r) => {
    let name = "Unknown"
    if (r.kind === "item") {
      const it = db.prepare("SELECT name FROM items WHERE id = ?").get(r.ref_id) as { name: string } | undefined
      name = it?.name ?? "Removed Item"
    } else {
      const ch = db.prepare("SELECT name FROM characters WHERE id = ?").get(r.ref_id) as { name: string } | undefined
      name = ch?.name ?? "Removed Character"
    }
    return { id: r.id, kind: r.kind, refId: r.ref_id, rarity: r.rarity as Rarity, name }
  })
}

export function addPoolEntry(kind: "item" | "character", refId: string, rarity: Rarity) {
  const db = getDb()
  db.prepare("INSERT INTO gacha_entries (id, kind, ref_id, rarity) VALUES (?,?,?,?)").run(uid("ge_"), kind, refId, rarity)
}

export function removePoolEntry(id: string) {
  getDb().prepare("DELETE FROM gacha_entries WHERE id = ?").run(id)
}

export interface PullResult {
  rarity: Rarity
  forcedByPity: "4" | "5" | null
  entry: GachaPoolEntry | null
  grantedItem: boolean
}

// Perform N pulls. Deducts currency (unless free), applies pity, grants items to inventory.
export function pull(count: number, opts: { free?: boolean } = {}): {
  ok: boolean
  error?: string
  results: PullResult[]
  pityAfter: PityState
} {
  const db = getDb()
  const config = getGachaConfig()
  const cost = getGachaCost()
  const pool = listPool()

  const tx = db.transaction(() => {
    if (!opts.free) {
      const total = cost.perPull * count
      const cur = getCurrency(cost.currencyId)
      if (!cur) throw new Error("Pull currency not found")
      if (cur.amount < total) throw new Error(`Not enough ${cur.name} (need ${total}, have ${cur.amount})`)
      adjustCurrency(cost.currencyId, -total, `Gacha ${count}-pull`)
    }

    let pity = getPity()
    const results: PullResult[] = []
    for (let i = 0; i < count; i++) {
      const outcome = pullRarity(config, pity, Math.random)
      pity = outcome.pityAfter
      const entry = selectFromPool(pool, outcome.rarity, Math.random)
      let grantedItem = false
      if (entry && entry.kind === "item") {
        addToInventory(entry.refId, 1, { silent: true })
        grantedItem = true
      }
      results.push({
        rarity: outcome.rarity,
        forcedByPity: outcome.forcedByPity,
        entry,
        grantedItem,
      })
    }
    setPity(pity)

    const rarityCounts = results.reduce<Record<number, number>>((acc, r) => {
      acc[r.rarity] = (acc[r.rarity] ?? 0) + 1
      return acc
    }, {})
    logEvent(db, "gacha", `Pulled ${count}x — ${summarize(rarityCounts)}`, {
      entity: "Gacha",
      values: { count, rarityCounts },
    })

    return { results, pity }
  })

  try {
    const { results, pity } = tx()
    return { ok: true, results, pityAfter: pity }
  } catch (e) {
    return { ok: false, error: (e as Error).message, results: [], pityAfter: getPity() }
  }
}

function summarize(counts: Record<number, number>): string {
  return [5, 4, 3, 2, 1]
    .filter((r) => counts[r])
    .map((r) => `${counts[r]}×${r}★`)
    .join(", ")
}

export function resetPity() {
  setPity({ pity4: 0, pity5: 0 })
  logEvent(getDb(), "gacha", "Reset pity counters", { entity: "Gacha" })
}
