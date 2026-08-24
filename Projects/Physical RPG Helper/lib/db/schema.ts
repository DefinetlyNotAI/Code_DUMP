// Relational SQLite schema. Structured tables for game entities; JSON columns
// used only for flexible config (modifier lists, substats, ability rules, loot).

export const SCHEMA_SQL = `
PRAGMA journal_mode = WAL;
PRAGMA foreign_keys = ON;

-- Characters (persistent progression entities)
CREATE TABLE IF NOT EXISTS characters (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  level INTEGER NOT NULL DEFAULT 1,
  current_exp INTEGER NOT NULL DEFAULT 0,
  rarity INTEGER NOT NULL DEFAULT 3,
  is_npc INTEGER NOT NULL DEFAULT 0,
  current_hp INTEGER NOT NULL DEFAULT 0,
  current_tp INTEGER NOT NULL DEFAULT 0,
  -- base stats
  base_hp REAL NOT NULL DEFAULT 1000,
  base_atk REAL NOT NULL DEFAULT 100,
  base_def REAL NOT NULL DEFAULT 100,
  base_crit_rate REAL NOT NULL DEFAULT 5,
  base_crit_dmg REAL NOT NULL DEFAULT 150,
  base_energy_regen REAL NOT NULL DEFAULT 100,
  base_basic_bonus REAL NOT NULL DEFAULT 0,
  base_skill_bonus REAL NOT NULL DEFAULT 0,
  base_ultimate_bonus REAL NOT NULL DEFAULT 0,
  base_basic_res REAL NOT NULL DEFAULT 0,
  base_skill_res REAL NOT NULL DEFAULT 0,
  base_ultimate_res REAL NOT NULL DEFAULT 0,
  base_tp REAL NOT NULL DEFAULT 100,
  -- growth per level (flat added per level above 1)
  growth_hp REAL NOT NULL DEFAULT 80,
  growth_atk REAL NOT NULL DEFAULT 8,
  growth_def REAL NOT NULL DEFAULT 6,
  tags TEXT NOT NULL DEFAULT '[]',
  notes TEXT NOT NULL DEFAULT '',
  temp_modifiers TEXT NOT NULL DEFAULT '[]', -- JSON: StatModifier[] persisted GM overrides
  in_party INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

-- Abilities (data-driven, belong to a character)
CREATE TABLE IF NOT EXISTS abilities (
  id TEXT PRIMARY KEY,
  character_id TEXT,
  name TEXT NOT NULL,
  attack_type TEXT NOT NULL DEFAULT 'basic', -- basic|skill|ultimate
  multiplier REAL NOT NULL DEFAULT 100,
  scaling_stat TEXT NOT NULL DEFAULT 'atk',
  dice TEXT,
  flat_bonus REAL NOT NULL DEFAULT 0,
  tp_cost REAL NOT NULL DEFAULT 0,
  target_type TEXT NOT NULL DEFAULT 'single',
  damage_type TEXT NOT NULL DEFAULT 'damage', -- damage|heal
  description TEXT NOT NULL DEFAULT '',
  effects TEXT NOT NULL DEFAULT '[]',
  sort INTEGER NOT NULL DEFAULT 0,
  FOREIGN KEY (character_id) REFERENCES characters(id) ON DELETE CASCADE
);

-- Enemy templates (reusable definitions)
CREATE TABLE IF NOT EXISTS enemy_templates (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  level INTEGER NOT NULL DEFAULT 1,
  rarity INTEGER NOT NULL DEFAULT 2,
  hp REAL NOT NULL DEFAULT 2000,
  atk REAL NOT NULL DEFAULT 120,
  def REAL NOT NULL DEFAULT 100,
  crit_rate REAL NOT NULL DEFAULT 5,
  crit_dmg REAL NOT NULL DEFAULT 150,
  basic_res REAL NOT NULL DEFAULT 0,
  skill_res REAL NOT NULL DEFAULT 0,
  ultimate_res REAL NOT NULL DEFAULT 0,
  basic_bonus REAL NOT NULL DEFAULT 0,
  skill_bonus REAL NOT NULL DEFAULT 0,
  ultimate_bonus REAL NOT NULL DEFAULT 0,
  tp REAL NOT NULL DEFAULT 100,
  exp_reward INTEGER NOT NULL DEFAULT 100,
  abilities TEXT NOT NULL DEFAULT '[]', -- JSON list of ability defs
  loot TEXT NOT NULL DEFAULT '[]', -- JSON loot config
  tags TEXT NOT NULL DEFAULT '[]',
  notes TEXT NOT NULL DEFAULT '',
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

-- Item definitions (catalog)
CREATE TABLE IF NOT EXISTS items (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  rarity INTEGER NOT NULL DEFAULT 1,
  category TEXT NOT NULL DEFAULT 'Other',
  tags TEXT NOT NULL DEFAULT '[]',
  value REAL NOT NULL DEFAULT 0,
  sellable INTEGER NOT NULL DEFAULT 1,
  stackable INTEGER NOT NULL DEFAULT 1,
  stats TEXT NOT NULL DEFAULT '[]', -- JSON StatModifier[]
  effects TEXT NOT NULL DEFAULT '[]',
  notes TEXT NOT NULL DEFAULT '',
  -- equipment specific (nullable)
  equip_slot TEXT, -- weapon|relic|armor|null
  main_stat TEXT, -- JSON StatModifier|null
  substats TEXT NOT NULL DEFAULT '[]', -- JSON StatModifier[]
  base_atk REAL, -- weapons
  passive TEXT,
  item_level INTEGER,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

-- Inventory quantities (one row per owned item stack)
CREATE TABLE IF NOT EXISTS inventory_entries (
  id TEXT PRIMARY KEY,
  item_id TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE CASCADE
);

-- Equipment: which items a character has equipped, in which slot index
CREATE TABLE IF NOT EXISTS equipped (
  id TEXT PRIMARY KEY,
  character_id TEXT NOT NULL,
  item_id TEXT NOT NULL,
  slot_type TEXT NOT NULL, -- weapon|relic|armor
  slot_index INTEGER NOT NULL DEFAULT 0,
  FOREIGN KEY (character_id) REFERENCES characters(id) ON DELETE CASCADE,
  FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE CASCADE
);

-- Currencies
CREATE TABLE IF NOT EXISTS currencies (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  icon TEXT NOT NULL DEFAULT 'coins',
  description TEXT NOT NULL DEFAULT '',
  amount REAL NOT NULL DEFAULT 0,
  is_default INTEGER NOT NULL DEFAULT 0, -- gold/gems/orbs cannot be deleted
  sort INTEGER NOT NULL DEFAULT 0
);

-- Shop entries
CREATE TABLE IF NOT EXISTS shop_entries (
  id TEXT PRIMARY KEY,
  item_id TEXT, -- nullable; may grant currency (e.g. orbs)
  grant_currency_id TEXT, -- if set, purchase grants this currency instead of an item
  grant_currency_amount REAL NOT NULL DEFAULT 0,
  quantity INTEGER NOT NULL DEFAULT 1, -- units granted per purchase
  price REAL NOT NULL DEFAULT 0,
  currency_id TEXT NOT NULL,
  purchase_limit INTEGER, -- null = unlimited
  purchased INTEGER NOT NULL DEFAULT 0,
  available INTEGER NOT NULL DEFAULT 1,
  description TEXT NOT NULL DEFAULT '',
  sort INTEGER NOT NULL DEFAULT 0
);

-- Gacha pool entries (reference items OR characters)
CREATE TABLE IF NOT EXISTS gacha_entries (
  id TEXT PRIMARY KEY,
  kind TEXT NOT NULL DEFAULT 'item', -- item|character
  ref_id TEXT NOT NULL, -- item id or character id
  rarity INTEGER NOT NULL DEFAULT 1
);

-- Singletons stored as key/value JSON (gacha config + pity)
CREATE TABLE IF NOT EXISTS kv (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

-- Status effect templates
CREATE TABLE IF NOT EXISTS status_templates (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  default_duration INTEGER, -- null = permanent
  max_stacks INTEGER NOT NULL DEFAULT 1,
  modifiers TEXT NOT NULL DEFAULT '[]', -- JSON StatModifier[]
  created_at INTEGER NOT NULL
);

-- Battles (persistent)
CREATE TABLE IF NOT EXISTS battles (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL DEFAULT 'Battle',
  status TEXT NOT NULL DEFAULT 'active', -- active|ended
  round INTEGER NOT NULL DEFAULT 1,
  turn_index INTEGER NOT NULL DEFAULT 0,
  turn_order TEXT NOT NULL DEFAULT '[]', -- JSON participant id order
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

-- Battle participants (snapshot of an entity in a battle)
CREATE TABLE IF NOT EXISTS battle_participants (
  id TEXT PRIMARY KEY,
  battle_id TEXT NOT NULL,
  side TEXT NOT NULL, -- player|enemy
  source_kind TEXT NOT NULL, -- character|enemy_template
  source_id TEXT, -- character id (to award exp) or template id
  name TEXT NOT NULL,
  level INTEGER NOT NULL DEFAULT 1,
  rarity INTEGER NOT NULL DEFAULT 1,
  current_hp INTEGER NOT NULL DEFAULT 0,
  max_hp INTEGER NOT NULL DEFAULT 0,
  current_tp INTEGER NOT NULL DEFAULT 0,
  max_tp INTEGER NOT NULL DEFAULT 0,
  stats TEXT NOT NULL DEFAULT '{}', -- JSON final AggregatedStats snapshot
  abilities TEXT NOT NULL DEFAULT '[]', -- JSON ability defs
  exp_reward INTEGER NOT NULL DEFAULT 0,
  defeated INTEGER NOT NULL DEFAULT 0,
  sort INTEGER NOT NULL DEFAULT 0,
  FOREIGN KEY (battle_id) REFERENCES battles(id) ON DELETE CASCADE
);

-- Applied status effects on participants
CREATE TABLE IF NOT EXISTS applied_statuses (
  id TEXT PRIMARY KEY,
  participant_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  modifiers TEXT NOT NULL DEFAULT '[]',
  stacks INTEGER NOT NULL DEFAULT 1,
  max_stacks INTEGER NOT NULL DEFAULT 1,
  duration INTEGER, -- remaining turns; null = permanent
  source TEXT NOT NULL DEFAULT '',
  start_round INTEGER NOT NULL DEFAULT 1,
  FOREIGN KEY (participant_id) REFERENCES battle_participants(id) ON DELETE CASCADE
);

-- Battle actions log (rolls, damage, overrides)
CREATE TABLE IF NOT EXISTS battle_actions (
  id TEXT PRIMARY KEY,
  battle_id TEXT NOT NULL,
  round INTEGER NOT NULL,
  description TEXT NOT NULL,
  detail TEXT NOT NULL DEFAULT '{}', -- JSON
  created_at INTEGER NOT NULL,
  FOREIGN KEY (battle_id) REFERENCES battles(id) ON DELETE CASCADE
);

-- Global event log
CREATE TABLE IF NOT EXISTS events (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL,
  description TEXT NOT NULL,
  entity TEXT NOT NULL DEFAULT '',
  values_json TEXT NOT NULL DEFAULT '{}',
  undo_json TEXT, -- JSON payload enabling undo; null = not undoable
  undone INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_events_created ON events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_inventory_item ON inventory_entries(item_id);
CREATE INDEX IF NOT EXISTS idx_participants_battle ON battle_participants(battle_id);
CREATE INDEX IF NOT EXISTS idx_actions_battle ON battle_actions(battle_id);
`
