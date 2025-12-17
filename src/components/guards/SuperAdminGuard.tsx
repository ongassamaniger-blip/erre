import { Navigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { Shield } from '@phosphor-icons/react'

interface SuperAdminGuardProps {
  children: React.ReactNode
  requireHeadquarters?: boolean
}

/**
 * Super Admin Guard
 * Sadece Super Admin rolüne sahip kullanıcıların erişmesine izin verir
 * İsteğe bağlı olarak Genel Merkez'de olma şartı da eklenebilir
 */
export function SuperAdminGuard({ children, requireHeadquarters = false }: SuperAdminGuardProps) {
  const user = useAuthStore(state => state.user)
  const selectedFacility = useAuthStore(state => state.selectedFacility)

  // Super Admin kontrolü
  if (user?.role !== 'Super Admin') {
    return (
      <div className="p-4 md:p-6 lg:p-8">
        <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
          <Shield size={64} className="text-muted-foreground mb-4" />
          <h2 className="text-2xl font-semibold mb-2">Erişim Reddedildi</h2>
          <p className="text-muted-foreground">
            Bu sayfaya erişmek için Super Admin yetkisine sahip olmanız gerekmektedir.
          </p>
        </div>
      </div>
    )
  }

  // Genel Merkez kontrolü (isteğe bağlı)
  if (requireHeadquarters && selectedFacility?.type !== 'headquarters') {
    return (
      <div className="p-4 md:p-6 lg:p-8">
        <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
          <Shield size={64} className="text-muted-foreground mb-4" />
          <h2 className="text-2xl font-semibold mb-2">Erişim Reddedildi</h2>
          <p className="text-muted-foreground">
            Bu sayfaya erişmek için Genel Merkez'de bulunmanız gerekmektedir.
          </p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}

