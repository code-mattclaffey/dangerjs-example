import { applyDiscount } from './applyDiscount'

describe('applyDiscount', () => {
  it('returns the total unchanged with no code', () => {
    expect(applyDiscount(4000)).toEqual({ total: 4000, freeShipping: false })
  })

  it('takes £10 off orders over £50', () => {
    expect(applyDiscount(6000, 'TENOFF')).toEqual({ total: 5000, freeShipping: false })
  })

  it('does not apply TENOFF to orders of £50 or less', () => {
    expect(applyDiscount(5000, 'TENOFF')).toEqual({ total: 5000, freeShipping: false })
  })

  it('accepts codes in any case', () => {
    expect(applyDiscount(6000, 'tenoff').total).toBe(5000)
  })

  it('gives free shipping with FREESHIP', () => {
    expect(applyDiscount(2000, 'FREESHIP')).toEqual({ total: 2000, freeShipping: true })
  })

  it('halves the total with HALFPRICE, rounded to whole pence', () => {
    expect(applyDiscount(1999, 'HALFPRICE')).toEqual({ total: 1000, freeShipping: false })
  })

  it('ignores unknown codes', () => {
    expect(applyDiscount(3000, 'NOPE')).toEqual({ total: 3000, freeShipping: false })
  })
})
