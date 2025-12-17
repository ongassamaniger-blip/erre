import { useAuthStore } from '@/store/authStore'
import { roleManagementService } from '@/services/roleManagementService'

/**
 * Permission Checker
 * Kullanıcının modül ve proje erişimlerini kontrol eder
 */

export interface PermissionCheck {
  hasAccess: boolean
  reason?: string
}

/**
 * Kullanıcının modül erişimini kontrol et
 */
export async function checkModuleAccess(
  module: 'finance' | 'hr' | 'projects' | 'qurban' | 'reports' | 'approvals' | 'calendar' | 'settings',
  permission: 'view' | 'create' | 'edit' | 'delete' | 'approve' | 'export' | 'reject' = 'view'
): Promise<PermissionCheck> {
  const user = useAuthStore.getState().user
  const selectedFacility = useAuthStore.getState().selectedFacility

  if (!user || !selectedFacility) {
    return { hasAccess: false, reason: 'Kullanıcı veya tesis seçilmemiş' }
  }

  // Super Admin her zaman erişebilir
  if (user.role === 'Super Admin') {
    return { hasAccess: true }
  }

  // Genel Merkez kullanıcıları tüm modüllere erişebilir (eğer Admin/Manager ise)
  if (selectedFacility.type === 'headquarters' && (user.role === 'Admin' || user.role === 'Manager')) {
    return { hasAccess: true }
  }

  // Rol bazlı erişim kontrolü
  const hasAccess = await roleManagementService.hasModuleAccess(
    user.id,
    selectedFacility.id,
    module,
    permission
  )

  return {
    hasAccess,
    reason: hasAccess ? undefined : 'Bu modüle erişim yetkiniz bulunmamaktadır'
  }
}

/**
 * Kullanıcının proje erişimini kontrol et
 */
export async function checkProjectAccess(projectId: string): Promise<PermissionCheck> {
  const user = useAuthStore.getState().user
  const selectedFacility = useAuthStore.getState().selectedFacility

  if (!user || !selectedFacility) {
    return { hasAccess: false, reason: 'Kullanıcı veya tesis seçilmemiş' }
  }

  // Super Admin her zaman erişebilir
  if (user.role === 'Super Admin') {
    return { hasAccess: true }
  }

  // Rol bazlı proje erişim kontrolü
  const hasAccess = await roleManagementService.hasProjectAccess(
    user.id,
    selectedFacility.id,
    projectId
  )

  return {
    hasAccess,
    reason: hasAccess ? undefined : 'Bu projeye erişim yetkiniz bulunmamaktadır'
  }
}

/**
 * Hook: Modül erişimini kontrol et (React hook)
 */
export function useModuleAccess(
  module: 'finance' | 'hr' | 'projects' | 'qurban' | 'reports' | 'approvals' | 'calendar' | 'settings',
  permission: 'view' | 'create' | 'edit' | 'delete' | 'approve' | 'export' | 'reject' = 'view'
): boolean {
  const user = useAuthStore(state => state.user)
  const selectedFacility = useAuthStore(state => state.selectedFacility)
  const [hasAccess, setHasAccess] = React.useState(false)

  React.useEffect(() => {
    if (!user || !selectedFacility) {
      setHasAccess(false)
      return
    }

    // Super Admin her zaman erişebilir
    if (user.role === 'Super Admin') {
      setHasAccess(true)
      return
    }

    // Genel Merkez kontrolü
    if (selectedFacility.type === 'headquarters' && (user.role === 'Admin' || user.role === 'Manager')) {
      setHasAccess(true)
      return
    }

    // Rol bazlı kontrol
    roleManagementService.hasModuleAccess(user.id, selectedFacility.id, module, permission)
      .then(setHasAccess)
      .catch(() => setHasAccess(false))
  }, [user, selectedFacility, module, permission])

  return hasAccess
}

// React import ekle
import React from 'react'

