import { calculateTotal } from './calculateTotal'

describe('calculateTotal', () => {
  it('returns 0 for an empty basket', () => {
    expect(calculateTotal([])).toBe(0)
  })

  it('multiplies unit price by quantity', () => {
    expect(
      calculateTotal([
        { sku: 'TEE-1', name: 'T-shirt', unitPrice: 1500, quantity: 2 },
        { sku: 'CAP-1', name: 'Cap', unitPrice: 1000, quantity: 1 },
      ]),
    ).toBe(4000)
  })
})
