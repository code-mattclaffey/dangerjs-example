import { formatPrice } from './formatPrice'

describe('formatPrice', () => {
  it('formats pence as pounds', () => {
    expect(formatPrice(1999)).toBe('£19.99')
  })

  it('formats zero', () => {
    expect(formatPrice(0)).toBe('£0.00')
  })
})
