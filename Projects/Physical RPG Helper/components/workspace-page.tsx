import { Console } from "@/components/workspace"
import { listCharacters } from "@/lib/services/characters"
import { listEnemyTemplates } from "@/lib/services/enemies"
import { listInventory } from "@/lib/services/items"
import { listShop } from "@/lib/services/shop"
import { getGachaConfig, getGachaCost, getPity, listPool } from "@/lib/services/gacha"
import { listEvents } from "@/lib/services/history"
import { getActiveBattle } from "@/lib/services/battle"
import { listCurrencies } from "@/lib/services/currency"
import { listStatusTemplates } from "@/lib/services/status"

export async function WorkspacePage({ section }: { section: string }) {
  const data = { characters: listCharacters(), enemies: listEnemyTemplates(), inventory: listInventory(), shop: listShop(), currencies: listCurrencies(), statuses: listStatusTemplates(), gacha: { config: getGachaConfig(), cost: getGachaCost(), pity: getPity(), pool: listPool() }, events: listEvents(80), battle: getActiveBattle() }
  return <Console section={section} data={data} />
}
