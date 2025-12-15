import { useCallback, useRef } from 'react'

/**
 * useMemoizedCallback - Callback'i sadece dependency'ler değiştiğinde yeniden oluşturur
 * useCallback'in gelişmiş versiyonu
 */
export function useMemoizedCallback<T extends (...args: any[]) => any>(
  callback: T,
  deps: React.DependencyList
): T {
  const callbackRef = useRef(callback)
  const depsRef = useRef(deps)

  // Dependency'ler değişmiş mi kontrol et
  const hasChanged = deps.length !== depsRef.current.length ||
    deps.some((dep, i) => dep !== depsRef.current[i])

  if (hasChanged) {
    callbackRef.current = callback
    depsRef.current = deps
  }

  return useCallback(
    ((...args: Parameters<T>) => callbackRef.current(...args)) as T,
    []
  )
}

