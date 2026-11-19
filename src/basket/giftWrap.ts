/** Gift wrap costs £2.50 per item, and is free on baskets over £100. */
export function giftWrapCost(total: number, itemCount: number): number {
  if (total > 10000) {
    return 0
  }
  return itemCount * 250
}
