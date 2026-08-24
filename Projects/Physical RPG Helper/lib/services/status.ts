import "server-only"
import { getDb, uid, now } from "@/lib/db"
import { logEvent } from "./history"
import type { StatusTemplate, StatModifier } from "@/lib/types"

function templateRow(r: any): StatusTemplate {
  return {
    id: r.id,
    name: r.name,
    description: r.description,
    defaultDuration: r.default_duration ?? null,
    maxStacks: r.max_stacks,
    modifiers: JSON.parse(r.modifiers) as StatModifier[],
  }
}

export function listStatusTemplates(): StatusTemplate[] {
  const db = getDb()
  const rows = db.prepare("SELECT * FROM status_templates ORDER BY name").all() as any[]
  return rows.map(templateRow)
}

export function saveStatusTemplate(input: {
  id?: string
  name: string
  description?: string
  defaultDuration: number | null
  maxStacks: number
  modifiers: StatModifier[]
}): string {
  const db = getDb()
  if (input.id) {
    db.prepare(
      "UPDATE status_templates SET name=?, description=?, default_duration=?, max_stacks=?, modifiers=? WHERE id=?",
    ).run(
      input.name,
      input.description ?? "",
      input.defaultDuration,
      input.maxStacks,
      JSON.stringify(input.modifiers),
      input.id,
    )
    return input.id
  }
  const id = uid("st_")
  db.prepare(
    "INSERT INTO status_templates (id,name,description,default_duration,max_stacks,modifiers,created_at) VALUES (?,?,?,?,?,?,?)",
  ).run(id, input.name, input.description ?? "", input.defaultDuration, input.maxStacks, JSON.stringify(input.modifiers), now())
  return id
}

export function deleteStatusTemplate(id: string) {
  getDb().prepare("DELETE FROM status_templates WHERE id = ?").run(id)
}
