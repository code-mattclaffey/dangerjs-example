export type DiscountCode = 'TENOFF' | 'FREESHIP' | 'HALFPRICE'

export interface DiscountResult {
  total: number
  freeShipping: boolean
}

/** Apply a discount code to a basket total in pence. */
export function applyDiscount(total: number, code?: string): DiscountResult {
  if (!code) {
    return { total, freeShipping: false }
  }

  switch (code.toUpperCase()) {
    case 'TENOFF':
      // £10 off orders over £50
      if (total > 5000) {
        return { total: total - 1000, freeShipping: false }
      }
      return { total, freeShipping: false }
    case 'FREESHIP':
      return { total, freeShipping: true }
    case 'HALFPRICE':
      // Round to whole pence
      return { total: Math.round(total / 2), freeShipping: false }
    default:
      return { total, freeShipping: false }
  }
}
