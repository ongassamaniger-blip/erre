import { Navigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import type { ModuleType } from '@/types'

interface ModuleGuardProps {
  children: React.ReactNode
  module: ModuleType
}

export function ModuleGuard({ children, module }: ModuleGuardProps) {
  const selectedFacility = useAuthStore(state => state.selectedFacility)
  const location = useLocation()

  // Genel merkez her modüle erişebilir
  if (selectedFacility?.type === 'headquarters') {
    return <>{children}</>
  }

  // Şubeler için modül kontrolü
  const enabledModules = selectedFacility?.enabledModules || []
  
  if (!enabledModules.includes(module)) {
    // Modül aktif değilse dashboard'a yönlendir
    return <Navigate to="/" replace />
  }

  return <>{children}</>
}

