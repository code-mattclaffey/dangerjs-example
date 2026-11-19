import { shippingCost } from './shippingCost'

describe('shippingCost', () => {
  it('is free for click and collect', () => {
    expect(shippingCost(1000, 'click-and-collect')).toBe(0)
  })

  it('charges £6.99 for next day', () => {
    expect(shippingCost(10000, 'next-day')).toBe(699)
  })

  it('charges £3.99 for standard delivery under £60', () => {
    expect(shippingCost(5999, 'standard')).toBe(399)
  })

  it('is free for standard delivery from £60', () => {
    expect(shippingCost(6000, 'standard')).toBe(0)
  })
})
