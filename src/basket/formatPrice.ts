/** Format a price in pence as pounds, for example 1999 → "£19.99". */
export function formatPrice(pence: number): string {
  return new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(pence / 100)
}
