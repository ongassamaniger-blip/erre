import { useEffect } from 'react'
import { Navigate, Outlet } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'

export function FacilityGuard() {
  const selectedFacility = useAuthStore(state => state.selectedFacility)
  const isHydrated = useAuthStore(state => state.isHydrated)

  useEffect(() => {
    if (isHydrated && selectedFacility && (!selectedFacility.id || !selectedFacility.code || !selectedFacility.name || !selectedFacility.location)) {
      console.warn('Invalid facility data detected')
    }
  }, [selectedFacility, isHydrated])

  if (!isHydrated) {
    return null
  }

  if (!selectedFacility || typeof selectedFacility !== 'object' || !selectedFacility.id || !selectedFacility.code || !selectedFacility.name || !selectedFacility.location) {
    return <Navigate to="/tenant-select" replace />
  }

  return <Outlet />
}
