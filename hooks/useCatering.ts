import { useState, useCallback } from 'react'
import { submitCateringInquiry, validateCatering, CateringInput } from '../lib/services/cateringService'

export function useCatering() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const submit = useCallback(async (input: CateringInput) => {
    setError(null)
    const validation = validateCatering(input)
    if (!validation.valid) {
      setError(validation.errors[0])
      throw new Error(validation.errors[0])
    }

    setLoading(true)
    try {
      const id = await submitCateringInquiry(input)
      return id
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Failed to submit inquiry'
      setError(message)
      throw e
    } finally {
      setLoading(false)
    }
  }, [])

  return { submit, loading, error }
}
