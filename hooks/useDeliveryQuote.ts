import { useState } from 'react'
import { getDeliveryQuote } from '../lib/delivery'
import { DeliveryQuote, DeliveryQuoteRequest } from '../types/delivery'

export function useDeliveryQuote() {
  const [quote, setQuote] = useState<DeliveryQuote | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchQuote = async (input: DeliveryQuoteRequest) => {
    setLoading(true)
    setError(null)
    try {
      const result = await getDeliveryQuote(input)
      setQuote(result.data as DeliveryQuote)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Unable to get delivery quote')
    } finally {
      setLoading(false)
    }
  }

  return { quote, loading, error, fetchQuote }
}
