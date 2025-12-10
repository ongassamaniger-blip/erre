import { useEffect } from 'react'
import { Navigate, Outlet } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { LoadingScreen } from '@/components/common/LoadingScreen'

export function AuthGuard() {
  const { isAuthenticated, user, isHydrated, isInitialized } = useAuthStore()

  useEffect(() => {
    if (isHydrated && isInitialized && isAuthenticated && (!user || !user.id)) {
      console.warn('Invalid authentication state detected')
    }
  }, [isAuthenticated, user, isHydrated, isInitialized])

  if (!isHydrated || !isInitialized) {
    return <LoadingScreen />
  }

  if (!isAuthenticated || !user || typeof user !== 'object' || !user.id) {
    return <Navigate to="/login" replace />
  }

  return <Outlet />
}
