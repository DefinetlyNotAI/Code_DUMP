"use server"

import { revalidatePath } from "next/cache"
import * as chars from "@/lib/services/characters"
import * as enemies from "@/lib/services/enemies"
import * as items from "@/lib/services/items"
import * as currency from "@/lib/services/currency"
import * as shop from "@/lib/services/shop"
import * as gacha from "@/lib/services/gacha"
import * as status from "@/lib/services/status"
import * as battle from "@/lib/services/battle"
import * as history from "@/lib/services/history"
import type { StatModifier, AbilityDef } from "@/lib/types"

function revalidateAll() {
  revalidatePath("/", "layout")
}

/* ---------------- characters ---------------- */

export async function createCharacterAction(input: chars.CharacterInput) {
  const id = chars.createCharacter(input)
  revalidateAll()
  return id
}
export async function updateCharacterAction(id: string, input: chars.CharacterInput) {
  chars.updateCharacter(id, input)
  revalidateAll()
}
export async function deleteCharacterAction(id: string) {
  chars.deleteCharacter(id)
  revalidateAll()
}
export async function duplicateCharacterAction(id: string) {
  chars.duplicateCharacter(id)
  revalidateAll()
}
export async function setPartyAction(id: string, inParty: boolean) {
  chars.setParty(id, inParty)
  revalidateAll()
}
export async function setCharacterResourceAction(id: string, field: "hp" | "tp", value: number, gmOverride = false) {
  chars.setResource(id, field, value, gmOverride)
  revalidateAll()
}
export async function grantExpAction(id: string, amount: number, override?: number) {
  const res = chars.grantExp(id, amount, override)
  revalidateAll()
  return res
}
export async function setTempModifiersAction(id: string, modifiers: StatModifier[]) {
  chars.setTempModifiers(id, modifiers)
  revalidateAll()
}
export async function saveAbilityAction(characterId: string, ability: Partial<AbilityDef> & { id?: string }) {
  chars.saveAbility(characterId, ability)
  revalidateAll()
}
export async function deleteAbilityAction(id: string) {
  chars.deleteAbility(id)
  revalidateAll()
}

/* ---------------- enemies ---------------- */

export async function createEnemyAction(input: enemies.EnemyInput) {
  const id = enemies.createEnemyTemplate(input)
  revalidateAll()
  return id
}
export async function updateEnemyAction(id: string, input: enemies.EnemyInput) {
  enemies.updateEnemyTemplate(id, input)
  revalidateAll()
}
export async function deleteEnemyAction(id: string) {
  enemies.deleteEnemyTemplate(id)
  revalidateAll()
}
export async function duplicateEnemyAction(id: string) {
  enemies.duplicateEnemyTemplate(id)
  revalidateAll()
}

/* ---------------- items / inventory / equipment ---------------- */

export async function createItemAction(input: items.ItemInput) {
  const id = items.createItem(input)
  revalidateAll()
  return id
}
export async function updateItemAction(id: string, input: items.ItemInput) {
  items.updateItem(id, input)
  revalidateAll()
}
export async function deleteItemAction(id: string) {
  items.deleteItem(id)
  revalidateAll()
}
export async function duplicateItemAction(id: string) {
  items.duplicateItem(id)
  revalidateAll()
}
export async function addToInventoryAction(itemId: string, quantity: number) {
  items.addToInventory(itemId, quantity)
  revalidateAll()
}
export async function setInventoryQuantityAction(entryId: string, quantity: number) {
  items.setInventoryQuantity(entryId, quantity)
  revalidateAll()
}
export async function removeInventoryEntryAction(entryId: string) {
  items.removeInventoryEntry(entryId)
  revalidateAll()
}
export async function equipAction(
  characterId: string,
  inventoryEntryId: string,
  slotType: "weapon" | "relic" | "armor",
  slotIndex: number,
) {
  const res = items.equipFromInventory(characterId, inventoryEntryId, slotType, slotIndex)
  revalidateAll()
  return res
}
export async function unequipAction(equippedId: string) {
  const res = items.unequip(equippedId)
  revalidateAll()
  return res
}

/* ---------------- currency ---------------- */

export async function createCurrencyAction(input: { name: string; icon: string; description: string; amount: number }) {
  const id = currency.createCurrency(input)
  revalidateAll()
  return id
}
export async function updateCurrencyAction(id: string, input: { name: string; icon: string; description: string }) {
  currency.updateCurrency(id, input)
  revalidateAll()
}
export async function deleteCurrencyAction(id: string) {
  currency.deleteCurrency(id)
  revalidateAll()
}
export async function adjustCurrencyAction(id: string, delta: number, reason?: string) {
  const res = currency.adjustCurrency(id, delta, reason)
  revalidateAll()
  return res
}
export async function setCurrencyAction(id: string, amount: number) {
  const res = currency.setCurrency(id, amount)
  revalidateAll()
  return res
}

/* ---------------- shop ---------------- */

export async function createShopEntryAction(input: shop.ShopEntryInput) {
  const id = shop.createShopEntry(input)
  revalidateAll()
  return id
}
export async function updateShopEntryAction(id: string, input: shop.ShopEntryInput) {
  shop.updateShopEntry(id, input)
  revalidateAll()
}
export async function deleteShopEntryAction(id: string) {
  shop.deleteShopEntry(id)
  revalidateAll()
}
export async function purchaseAction(entryId: string, quantity: number) {
  const res = shop.purchase(entryId, quantity)
  revalidateAll()
  return res
}
export async function sellAction(entryId: string, quantity: number, currencyId: string) {
  const res = shop.sellFromInventory(entryId, quantity, currencyId)
  revalidateAll()
  return res
}

/* ---------------- gacha ---------------- */

export async function pullAction(count: number, free = false) {
  const res = gacha.pull(count, { free })
  revalidateAll()
  return res
}
export async function setGachaConfigAction(config: Parameters<typeof gacha.setGachaConfig>[0]) {
  gacha.setGachaConfig(config)
  revalidateAll()
}
export async function setGachaCostAction(cost: Parameters<typeof gacha.setGachaCost>[0]) {
  gacha.setGachaCost(cost)
  revalidateAll()
}
export async function addPoolEntryAction(kind: "item" | "character", refId: string, rarity: 1 | 2 | 3 | 4 | 5) {
  gacha.addPoolEntry(kind, refId, rarity)
  revalidateAll()
}
export async function removePoolEntryAction(id: string) {
  gacha.removePoolEntry(id)
  revalidateAll()
}
export async function resetPityAction() {
  gacha.resetPity()
  revalidateAll()
}

/* ---------------- status templates ---------------- */

export async function saveStatusTemplateAction(input: Parameters<typeof status.saveStatusTemplate>[0]) {
  const id = status.saveStatusTemplate(input)
  revalidateAll()
  return id
}
export async function deleteStatusTemplateAction(id: string) {
  status.deleteStatusTemplate(id)
  revalidateAll()
}

/* ---------------- battle ---------------- */

export async function createBattleAction(input: {
  name?: string
  characterIds: string[]
  enemies: { templateId: string; count: number }[]
}) {
  const res = battle.createBattle(input)
  revalidateAll()
  return res
}
export async function performAttackAction(params: battle.AttackParams) {
  const res = battle.performAttack(params)
  revalidateAll()
  return res
}
export async function setParticipantResourceAction(
  battleId: string,
  participantId: string,
  field: "hp" | "tp",
  value: number,
) {
  battle.setParticipantResource(battleId, participantId, field, value)
  revalidateAll()
}
export async function applyStatusAction(input: Parameters<typeof battle.applyStatus>[0]) {
  battle.applyStatus(input)
  revalidateAll()
}
export async function removeStatusAction(battleId: string, statusId: string) {
  battle.removeStatus(battleId, statusId)
  revalidateAll()
}
export async function advanceTurnAction(battleId: string) {
  const res = battle.advanceTurn(battleId)
  revalidateAll()
  return res
}
export async function endBattleAction(battleId: string, syncToCharacters: boolean) {
  const res = battle.endBattle(battleId, { syncToCharacters })
  revalidateAll()
  return res
}
export async function undoLastActionAction(battleId: string) {
  const res = battle.undoLastAction(battleId)
  revalidateAll()
  return res
}

/* ---------------- history ---------------- */

export async function undoEventAction(eventId: string) {
  const res = history.undoEvent(eventId)
  revalidateAll()
  return res
}
export async function clearHistoryAction() {
  history.clearHistory()
  revalidateAll()
}
