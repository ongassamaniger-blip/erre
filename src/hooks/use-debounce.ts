import { useEffect, useState } from 'react'

/**
 * useDebounce - Değeri belirli bir süre bekledikten sonra günceller
 * Arama ve filtreleme için performans optimizasyonu
 */
export function useDebounce<T>(value: T, delay: number = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])

  return debouncedValue
}

