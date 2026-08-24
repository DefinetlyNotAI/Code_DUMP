// Selling, bulk selling, and shop purchase math.

export const SELL_RATE = 0.8 // selling always returns 80% of value. Fixed by design.

export function sellValue(itemValue: number, quantity = 1): number {
  return Math.floor(itemValue * SELL_RATE) * quantity
}

export interface BulkSellLine {
  name: string
  value: number
  quantity: number
}

export interface BulkSellSummary {
  lines: BulkSellLine[]
  totalQuantity: number
  totalValue: number
  totalSellValue: number
}

export function bulkSellSummary(lines: BulkSellLine[]): BulkSellSummary {
  let totalQuantity = 0
  let totalValue = 0
  let totalSellValue = 0
  for (const l of lines) {
    totalQuantity += l.quantity
    totalValue += l.value * l.quantity
    totalSellValue += sellValue(l.value, l.quantity)
  }
  return { lines, totalQuantity, totalValue, totalSellValue }
}

export interface PurchaseResult {
  quantity: number
  totalCost: number
  affordable: boolean
}

// Compute how many units of a shop entry can be bought and the cost.
export function computePurchase(
  price: number,
  requestedQty: number,
  currencyBalance: number,
  purchaseLimit: number | null, // null = unlimited
  alreadyPurchased = 0,
): PurchaseResult {
  let qty = Math.max(0, Math.floor(requestedQty))
  if (purchaseLimit != null) {
    const remaining = Math.max(0, purchaseLimit - alreadyPurchased)
    qty = Math.min(qty, remaining)
  }
  const maxAffordable = price <= 0 ? qty : Math.floor(currencyBalance / price)
  qty = Math.min(qty, maxAffordable)
  const totalCost = qty * price
  return { quantity: qty, totalCost, affordable: totalCost <= currencyBalance }
}

export function maxAffordableQuantity(
  price: number,
  currencyBalance: number,
  purchaseLimit: number | null,
  alreadyPurchased = 0,
): number {
  if (price <= 0) {
    return purchaseLimit != null ? Math.max(0, purchaseLimit - alreadyPurchased) : 9999
  }
  let qty = Math.floor(currencyBalance / price)
  if (purchaseLimit != null) qty = Math.min(qty, Math.max(0, purchaseLimit - alreadyPurchased))
  return Math.max(0, qty)
}
