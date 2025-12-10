import type { BranchUser, BranchRole, BranchRoleDefinition, BranchUserHierarchy, BranchUserPermissions } from '@/types/branchUserManagement'
import { supabase } from '@/lib/supabase'

// Varsayılan rol izinleri
const getDefaultPermissionsForRole = (role: BranchRole): BranchUserPermissions => {
  const basePermissions: BranchUserPermissions = {
    finance: { view: false, create: false, edit: false, delete: false, approve: false },
    hr: { view: false, create: false, edit: false, delete: false, approve: false },
    projects: { view: false, create: false, edit: false, delete: false, approve: false },
    qurban: { view: false, create: false, edit: false, delete: false, approve: false },
    reports: { view: false, create: false, export: false },
    approvals: { view: false, approve: false, reject: false },
    calendar: { view: false, create: false, edit: false, delete: false },
    settings: { view: false, edit: false },
  }

  switch (role) {
    case 'Branch Manager':
      return {
        finance: { view: true, create: true, edit: true, delete: true, approve: true },
        hr: { view: true, create: true, edit: true, delete: true, approve: true },
        projects: { view: true, create: true, edit: true, delete: true, approve: true },
        qurban: { view: true, create: true, edit: true, delete: true, approve: true },
        reports: { view: true, create: true, export: true },
        approvals: { view: true, approve: true, reject: true },
        calendar: { view: true, create: true, edit: true, delete: true },
        settings: { view: true, edit: true },
      }
    case 'Finance Manager':
      return {
        ...basePermissions,
        finance: { view: true, create: true, edit: true, delete: false, approve: true },
        reports: { view: true, create: true, export: true },
        approvals: { view: true, approve: true, reject: true },
        calendar: { view: true, create: true, edit: true, delete: false },
      }
    case 'HR Manager':
      return {
        ...basePermissions,
        hr: { view: true, create: true, edit: true, delete: false, approve: true },
        reports: { view: true, create: true, export: true },
        approvals: { view: true, approve: true, reject: true },
        calendar: { view: true, create: true, edit: true, delete: false },
      }
    case 'Project Manager':
      return {
        ...basePermissions,
        projects: { view: true, create: true, edit: true, delete: false, approve: true },
        reports: { view: true, create: true, export: true },
        calendar: { view: true, create: true, edit: true, delete: false },
      }
    case 'Accountant':
      return {
        ...basePermissions,
        finance: { view: true, create: true, edit: true, delete: false, approve: false },
        reports: { view: true, create: true, export: true },
        calendar: { view: true, create: false, edit: false, delete: false },
      }
    case 'HR Specialist':
      return {
        ...basePermissions,
        hr: { view: true, create: true, edit: true, delete: false, approve: false },
        calendar: { view: true, create: true, edit: false, delete: false },
      }
    case 'Project Coordinator':
      return {
        ...basePermissions,
        projects: { view: true, create: true, edit: true, delete: false, approve: false },
        calendar: { view: true, create: true, edit: false, delete: false },
      }
    case 'Staff':
      return {
        ...basePermissions,
        finance: { view: true, create: false, edit: false, delete: false, approve: false },
        hr: { view: true, create: false, edit: false, delete: false, approve: false },
        projects: { view: true, create: false, edit: false, delete: false, approve: false },
        calendar: { view: true, create: true, edit: false, delete: false },
      }
    case 'Viewer':
      return {
        ...basePermissions,
        finance: { view: true, create: false, edit: false, delete: false, approve: false },
        hr: { view: true, create: false, edit: false, delete: false, approve: false },
        projects: { view: true, create: false, edit: false, delete: false, approve: false },
        qurban: { view: true, create: false, edit: false, delete: false, approve: false },
        reports: { view: true, create: false, export: false },
        calendar: { view: true, create: false, edit: false, delete: false },
      }
    default:
      return basePermissions
  }
}

// Sistem rolleri
const systemRoles: BranchRole[] = [
  'Branch Manager',
  'Finance Manager',
  'HR Manager',
  'Project Manager',
  'Accountant',
  'HR Specialist',
  'Project Coordinator',
  'Staff',
  'Viewer',
]

export const branchUserManagementService = {
  async getUsers(facilityId: string): Promise<BranchUser[]> {
    try {
      // facility_users tablosundan bu tesise ait kullanıcıları çek
      const { data, error } = await supabase
        .from('facility_users')
        .select(`
          user_id,
          profiles:user_id (
            id,
            email,
            name,
            avatar,
            role,
            department,
            position,
            phone,
            status,
            created_at,
            updated_at
          )
        `)
        .eq('facility_id', facilityId)

      if (error) throw error

      return (data || [])
        .filter((item: any) => item.profiles) // Profili olmayanları filtrele
        .map((item: any) => {
          const profile = item.profiles
          const role = profile.role as BranchRole || 'Staff'

          return {
            id: profile.id,
            facilityId,
            email: profile.email,
            name: profile.name,
            avatar: profile.avatar,
            role: role,
            department: profile.department,
            position: profile.position,
            phone: profile.phone,
            isActive: profile.status === 'active',
            permissions: getDefaultPermissionsForRole(role),
            createdAt: profile.created_at,
            updatedAt: profile.updated_at,
            createdBy: 'system', // Metadata eksik olabilir
            // reportsTo: undefined // Hiyerarşi tablosu varsa oradan çekilmeli
          }
        })
    } catch (error) {
      console.error('Get users error:', error)
      return []
    }
  },

  async getUserById(id: string): Promise<BranchUser | null> {
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', id)
        .single()

      if (error) throw error
      if (!profile) return null

      const role = profile.role as BranchRole || 'Staff'

      return {
        id: profile.id,
        facilityId: '', // Bu metotta facilityId'yi bilmiyoruz, gerekirse facility_users'dan çekilebilir
        email: profile.email,
        name: profile.name,
        avatar: profile.avatar,
        role: role,
        department: profile.department,
        position: profile.position,
        phone: profile.phone,
        isActive: profile.status === 'active',
        permissions: getDefaultPermissionsForRole(role),
        createdAt: profile.created_at,
        updatedAt: profile.updated_at,
        createdBy: 'system',
      }
    } catch (error) {
      console.error('Get user by id error:', error)
      return null
    }
  },

  async createUser(facilityId: string, userData: Omit<BranchUser, 'id' | 'facilityId' | 'createdAt' | 'createdBy' | 'updatedAt' | 'permissions'> & { permissions?: Partial<BranchUserPermissions> }): Promise<BranchUser> {
    // Not: Gerçek bir Auth kullanıcısı oluşturmak için Supabase Admin API veya Edge Function gerekir.
    // Şimdilik sadece profiles tablosuna eklemeye çalışacağız, ancak auth.users kaydı olmadığı için login olamayabilirler.
    // Veya var olan bir kullanıcıyı e-posta ile bulup ekleyebiliriz.

    try {
      // 1. E-posta ile kullanıcı var mı kontrol et
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', userData.email)
        .single()

      let userId = existingProfile?.id

      if (!userId) {
        // Kullanıcı yoksa, oluşturamayız (Auth kısıtlaması).
        // Ancak demo/test için profiles tablosuna eklemeyi deneyebiliriz (eğer FK yoksa).
        // Eğer FK varsa hata verecektir.
        throw new Error('Kullanıcı bulunamadı. Lütfen önce kullanıcının sisteme kayıt olmasını sağlayın veya Admin panelinden davet edin.')
      }

      // 2. Kullanıcıyı tesise ekle
      const { error: linkError } = await supabase
        .from('facility_users')
        .insert({
          facility_id: facilityId,
          user_id: userId
        })

      if (linkError) {
        // Belki zaten ekli?
        if (!linkError.message.includes('unique constraint')) {
          throw linkError
        }
      }

      // 3. Profil bilgilerini güncelle (rol, departman vb.)
      const { data: updatedProfile, error: updateError } = await supabase
        .from('profiles')
        .update({
          role: userData.role,
          department: userData.department,
          position: userData.position,
          phone: userData.phone,
          status: userData.isActive ? 'active' : 'inactive'
        })
        .eq('id', userId)
        .select()
        .single()

      if (updateError) throw updateError

      const role = updatedProfile.role as BranchRole

      return {
        id: updatedProfile.id,
        facilityId,
        email: updatedProfile.email,
        name: updatedProfile.name,
        avatar: updatedProfile.avatar,
        role: role,
        department: updatedProfile.department,
        position: updatedProfile.position,
        phone: updatedProfile.phone,
        isActive: updatedProfile.status === 'active',
        permissions: getDefaultPermissionsForRole(role),
        createdAt: updatedProfile.created_at,
        updatedAt: updatedProfile.updated_at,
        createdBy: 'system',
      }

    } catch (error) {
      console.error('Create user error:', error)
      throw error
    }
  },

  async updateUser(id: string, updates: Partial<BranchUser>): Promise<BranchUser> {
    try {
      const updateData: any = {}
      if (updates.role) updateData.role = updates.role
      if (updates.department) updateData.department = updates.department
      if (updates.position) updateData.position = updates.position
      if (updates.phone) updateData.phone = updates.phone
      if (updates.isActive !== undefined) updateData.status = updates.isActive ? 'active' : 'inactive'
      if (updates.name) updateData.name = updates.name

      const { data: updatedProfile, error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error

      const role = updatedProfile.role as BranchRole

      return {
        id: updatedProfile.id,
        facilityId: updates.facilityId || '',
        email: updatedProfile.email,
        name: updatedProfile.name,
        avatar: updatedProfile.avatar,
        role: role,
        department: updatedProfile.department,
        position: updatedProfile.position,
        phone: updatedProfile.phone,
        isActive: updatedProfile.status === 'active',
        permissions: getDefaultPermissionsForRole(role),
        createdAt: updatedProfile.created_at,
        updatedAt: updatedProfile.updated_at,
        createdBy: 'system',
      }
    } catch (error) {
      console.error('Update user error:', error)
      throw error
    }
  },

  async deleteUser(id: string): Promise<void> {
    // Kullanıcıyı tesisten çıkar (facility_users'dan sil)
    // Ancak hangi tesisten sileceğimizi id'den bilemeyiz (id user_id).
    // Bu metodun facilityId parametresi alması daha doğru olurdu ama mevcut imza id alıyor.
    // Bu durumda, kullanıcının seçili olduğu tesisten silinmesi gerekir ama service state tutmaz.
    // Çözüm: deleteUser metodunu çağıran yer facilityId'yi biliyorsa, oradan facility_users tablosundan silme işlemi yapılmalı.
    // Ancak burada sadece id var.
    // Belki de tüm tesislerden silinmeli? Hayır.
    // Geçici çözüm: facility_users tablosundan user_id = id olan tüm kayıtları silmek çok agresif olabilir.
    // Ancak "Branch User Management" sayfasındaysak, muhtemelen o şubeden silmek istiyoruz.
    // UI tarafında bu metod çağrılırken genellikle bir context vardır.

    // Şimdilik: Bu metodun facilityId parametresi alacak şekilde güncellenmesi gerekir.
    // Ancak imzayı değiştirmeden, facility_users tablosundan user_id = id olan kaydı silmeyi deneyelim.
    // Eğer kullanıcı birden fazla tesise kayıtlıysa sorun olabilir.

    // Güvenli yol: Sadece pasife çekelim.
    try {
      await supabase
        .from('profiles')
        .update({ status: 'inactive' })
        .eq('id', id)
    } catch (error) {
      console.error('Delete user error:', error)
      throw error
    }
  },

  async getRoles(facilityId: string): Promise<BranchRoleDefinition[]> {
    // Roller şimdilik statik
    return systemRoles.map((role, index) => ({
      id: `role-${index}`,
      name: role,
      description: `${role} rolü için varsayılan izinler`,
      permissions: getDefaultPermissionsForRole(role),
      isSystemRole: true,
      facilityId,
      createdAt: new Date().toISOString(),
      createdBy: 'system',
    }))
  },

  async createRole(facilityId: string, roleData: Omit<BranchRoleDefinition, 'id' | 'facilityId' | 'createdAt' | 'createdBy' | 'isSystemRole'>): Promise<BranchRoleDefinition> {
    // Custom rol oluşturma henüz desteklenmiyor
    throw new Error('Custom role creation not supported yet')
  },

  async updateRole(id: string, updates: Partial<BranchRoleDefinition>): Promise<BranchRoleDefinition> {
    throw new Error('Role update not supported yet')
  },

  async deleteRole(id: string): Promise<void> {
    throw new Error('Role deletion not supported yet')
  },

  async getUserHierarchy(facilityId: string): Promise<BranchUserHierarchy[]> {
    const users = await this.getUsers(facilityId)
    const userMap = new Map<string, BranchUserHierarchy>()

    // Tüm kullanıcıları map'e ekle
    users.forEach(user => {
      userMap.set(user.id, {
        userId: user.id,
        userName: user.name,
        role: user.role,
        reportsTo: user.reportsTo,
        subordinates: [],
        level: 0,
      })
    })

    // Hiyerarşiyi oluştur
    const roots: BranchUserHierarchy[] = []
    userMap.forEach((hierarchy, userId) => {
      if (hierarchy.reportsTo) {
        const manager = userMap.get(hierarchy.reportsTo)
        if (manager) {
          manager.subordinates.push(hierarchy)
          // Level hesapla
          hierarchy.level = manager.level + 1
        } else {
          roots.push(hierarchy)
        }
      } else {
        roots.push(hierarchy)
      }
    })

    return roots
  },
}
