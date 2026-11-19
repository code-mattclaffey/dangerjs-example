// Legacy code: written before Danger JS was added, so it has no tests yet.

export type ShippingMethod = 'standard' | 'next-day' | 'click-and-collect'

/** Shipping cost in pence for a basket total and method. */
export function shippingCost(total: number, method: ShippingMethod): number {
  if (method === 'click-and-collect') {
    return 0
  }

  if (method === 'next-day') {
    return 699
  }

  // Free standard delivery over £60
  return total >= 6000 ? 0 : 399
}
