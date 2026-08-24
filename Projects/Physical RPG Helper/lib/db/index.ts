import "server-only"
import Database from "better-sqlite3"
import path from "node:path"
import fs from "node:fs"
import { SCHEMA_SQL } from "./schema"
import { seedIfEmpty } from "./seed"

let _db: Database.Database | null = null

function resolveDbPath() {
  // Persist to a writable data dir. In the sandbox, cwd is writable.
  const dir = path.join(process.cwd(), ".data")
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
  return path.join(dir, "rpg.sqlite")
}

export function getDb(): Database.Database {
  if (_db) return _db
  const db = new Database(resolveDbPath())
  db.pragma("journal_mode = WAL")
  db.pragma("foreign_keys = ON")
  db.exec(SCHEMA_SQL)
  _db = db
  seedIfEmpty(db)
  return _db
}

export function uid(prefix = ""): string {
  return `${prefix}${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`
}

export function now(): number {
  return Date.now()
}
