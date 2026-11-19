import type { BasketItem } from './types'

/** Sum of unit price × quantity for every item, in pence. */
export function calculateTotal(items: BasketItem[]): number {
  return items.reduce((total, item) => total + item.unitPrice * item.quantity, 0)
}
