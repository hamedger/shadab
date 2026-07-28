import { useCallback, useEffect, useRef, useState } from 'react'
import { getDeliveryQuote } from '../lib/delivery'
import { DeliveryQuote } from '../types/delivery'
import { DropoffAddressInput } from '../lib/deliveryUtils'

const QUOTE_REFRESH_MS = 5 * 60 * 1000

interface UseLiveDeliveryQuoteOptions {
  enabled: boolean
  dropoffAddress: DropoffAddressInput | null
  locationId: string
  debounceMs?: number
  onQuote: (quote: DeliveryQuote) => void
  onClear: () => void
}

export function useLiveDeliveryQuote({
  enabled,
  dropoffAddress,
  locationId,
  debounceMs = 600,
  onQuote,
  onClear,
}: UseLiveDeliveryQuoteOptions) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const requestId = useRef(0)

  const fetchQuote = useCallback(async () => {
    if (
      !enabled ||
      !dropoffAddress?.street.trim() ||
      !dropoffAddress.city.trim() ||
      !dropoffAddress.zip.trim()
    ) {
      onClear()
      setError(null)
      setLoading(false)
      return
    }

    const id = ++requestId.current
    setLoading(true)
    setError(null)

    try {
      const result = await getDeliveryQuote({
        dropoffStreet: dropoffAddress.street.trim(),
        dropoffCity: dropoffAddress.city.trim(),
        dropoffState: dropoffAddress.state.trim() || 'MI',
        dropoffZip: dropoffAddress.zip.trim(),
        locationId,
      })
      if (id !== requestId.current) return
      onQuote(result.data as DeliveryQuote)
    } catch (e: unknown) {
      if (id !== requestId.current) return
      onClear()
      const message =
        e instanceof Error ? e.message : 'Unable to get delivery quote for this address'
      setError(message)
    } finally {
      if (id === requestId.current) setLoading(false)
    }
  }, [enabled, dropoffAddress, locationId, onQuote, onClear])

  useEffect(() => {
    if (!enabled) {
      onClear()
      setError(null)
      setLoading(false)
      return
    }

    if (!dropoffAddress?.street.trim()) {
      onClear()
      setError(null)
      return
    }

    const timer = setTimeout(() => {
      void fetchQuote()
    }, debounceMs)

    return () => clearTimeout(timer)
  }, [enabled, dropoffAddress, debounceMs, fetchQuote, onClear])

  useEffect(() => {
    if (!enabled || !dropoffAddress?.street.trim()) return

    const interval = setInterval(() => {
      void fetchQuote()
    }, QUOTE_REFRESH_MS)

    return () => clearInterval(interval)
  }, [enabled, dropoffAddress, fetchQuote])

  return { loading, error, refreshQuote: fetchQuote }
}
