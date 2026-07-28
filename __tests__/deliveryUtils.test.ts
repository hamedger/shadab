import { extractFirstName, isValidUSPhone, toE164USPhone } from '../lib/deliveryUtils'

describe('deliveryUtils', () => {
  it('formats US phone to E.164', () => {
    expect(toE164USPhone('2485550100')).toBe('+12485550100')
    expect(toE164USPhone('(248) 555-0100')).toBe('+12485550100')
    expect(isValidUSPhone('2485550100')).toBe(true)
    expect(isValidUSPhone('123')).toBe(false)
  })

  it('extracts first name from display name', () => {
    expect(extractFirstName('Jane Doe')).toBe('Jane')
    expect(extractFirstName('')).toBe('Guest')
  })
})
