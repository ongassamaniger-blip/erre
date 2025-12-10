import { User } from '@/types'

export function canManageForms(user: User | null): boolean {
  if (!user) return false
  return user.role === 'Super Admin' || user.role === 'Admin'
}

export function hasRole(user: User | null, roles: string[]): boolean {
  if (!user) return false
  return roles.includes(user.role)
}

export function getUserRoleCode(user: User | null): string | undefined {
  if (!user) return undefined
  
  const roleMap: Record<string, string> = {
    'Super Admin': 'SUPER_ADMIN',
    'Admin': 'TENANT_ADMIN',
    'Manager': 'MANAGER',
    'User': 'USER'
  }
  
  return roleMap[user.role] || user.role
}
