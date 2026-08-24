// Serializable DTOs passed between server actions and client components.
import type { Rarity, StatModifier, AttackType, BaseStats } from "@/lib/engine/types"

export type { Rarity, StatModifier, AttackType, BaseStats }

export interface AbilityDef {
  id: string
  name: string
  attackType: AttackType
  multiplier: number
  scalingStat: "atk"
  dice: string | null
  flatBonus: number
  tpCost: number
  targetType: string
  damageType: "damage" | "heal"
  description: string
  effects: string[]
}

export interface Character {
  id: string
  name: string
  level: number
  currentExp: number
  expToNext: number
  rarity: Rarity
  isNpc: boolean
  currentHp: number
  currentTp: number
  base: BaseStats
  final: BaseStats // aggregated with equipment + temp modifiers
  maxHp: number
  maxTp: number
  growth: { hp: number; atk: number; def: number }
  tags: string[]
  notes: string
  tempModifiers: StatModifier[]
  inParty: boolean
  abilities: AbilityDef[]
  equipment: EquippedItem[]
}

export interface EquippedItem {
  equippedId: string
  slotType: "weapon" | "relic" | "armor"
  slotIndex: number
  item: Item
}

export interface EnemyTemplate {
  id: string
  name: string
  level: number
  rarity: Rarity
  hp: number
  atk: number
  def: number
  critRate: number
  critDmg: number
  basicRes: number
  skillRes: number
  ultimateRes: number
  basicBonus: number
  skillBonus: number
  ultimateBonus: number
  tp: number
  expReward: number
  abilities: Omit<AbilityDef, "id">[]
  loot: any[]
  tags: string[]
  notes: string
}

export interface Item {
  id: string
  name: string
  description: string
  rarity: Rarity
  category: string
  tags: string[]
  value: number
  sellable: boolean
  stackable: boolean
  stats: StatModifier[]
  effects: string[]
  notes: string
  equipSlot: "weapon" | "relic" | "armor" | null
  mainStat: StatModifier | null
  substats: StatModifier[]
  baseAtk: number | null
  passive: string | null
  itemLevel: number | null
}

export interface InventoryEntry {
  id: string
  quantity: number
  item: Item
}

export interface Currency {
  id: string
  name: string
  icon: string
  description: string
  amount: number
  isDefault: boolean
  sort: number
}

export interface ShopEntry {
  id: string
  itemId: string | null
  item: Item | null
  grantCurrencyId: string | null
  grantCurrencyAmount: number
  quantity: number
  price: number
  currencyId: string
  purchaseLimit: number | null
  purchased: number
  available: boolean
  description: string
  sort: number
}

export interface GachaPoolEntry {
  id: string
  kind: "item" | "character"
  refId: string
  rarity: Rarity
  name: string
}

export interface StatusTemplate {
  id: string
  name: string
  description: string
  defaultDuration: number | null
  maxStacks: number
  modifiers: StatModifier[]
}

export interface AppliedStatus {
  id: string
  participantId: string
  name: string
  description: string
  modifiers: StatModifier[]
  stacks: number
  maxStacks: number
  duration: number | null
  source: string
  startRound: number
}

export interface BattleParticipant {
  id: string
  battleId: string
  side: "player" | "enemy"
  sourceKind: "character" | "enemy_template"
  sourceId: string | null
  name: string
  level: number
  rarity: Rarity
  currentHp: number
  maxHp: number
  currentTp: number
  maxTp: number
  stats: BaseStats
  abilities: AbilityDef[]
  expReward: number
  defeated: boolean
  sort: number
  statuses: AppliedStatus[]
}

export interface BattleAction {
  id: string
  round: number
  description: string
  detail: any
  createdAt: number
}

export interface Battle {
  id: string
  name: string
  status: "active" | "ended"
  round: number
  turnIndex: number
  turnOrder: string[]
  participants: BattleParticipant[]
  actions: BattleAction[]
}

export interface GameEvent {
  id: string
  type: string
  description: string
  entity: string
  values: any
  undoable: boolean
  undone: boolean
  createdAt: number
}
